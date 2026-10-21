from typing import Any, Dict
from fastapi import APIRouter, Depends
from app.services.admin_auth_service import require_admin
from pydantic import BaseModel

from app.ai.llm_service import prompt_text
from app.ai.ollama_client import get_ollama_client
from app.db.database import get_db

router = APIRouter(tags=["health"])


class TestPromptRequest(BaseModel):
    prompt: str = "Giới thiệu ngắn gọn về tính năng chấm điểm CV của bạn bằng 2 câu."


@router.get("/health")
async def health_check() -> Dict[str, Any]:
    client = get_ollama_client()
    ai_status = await client.check_health()

    db_ok = False
    try:
        with get_db() as conn:
            cursor = conn.execute("SELECT 1")
            db_ok = bool(cursor.fetchone())
    except Exception:
        db_ok = False

    return {
        "status": "ok" if (ai_status.get("ollama_online") and db_ok) else "degraded",
        "service": "SupportHR Local AI & Database Server",
        "database": {
            "type": "SQLite (WAL Mode)",
            "connected": db_ok,
        },
        "local_ai": ai_status,
    }


@router.get("/health/live")
def health_live() -> Dict[str, str]:
    return {"status": "alive"}


@router.get("/health/ready")
async def health_ready() -> Dict[str, Any]:
    client = get_ollama_client()
    ai_status = await client.check_health()
    try:
        with get_db() as conn:
            database_ready = bool(conn.execute("SELECT 1").fetchone())
    except Exception:
        database_ready = False
    is_ready = (
        database_ready
        and
        ai_status.get("ollama_online", False)
        and ai_status.get("llm_ready", False)
        and ai_status.get("cv_model_ready", False)
        and ai_status.get("embedding_ready", False)
    )
    return {
        "ready": is_ready,
        "database_ready": database_ready,
        "llm_ready": ai_status.get("llm_ready", False),
        "cv_model_ready": ai_status.get("cv_model_ready", False),
        "embedding_ready": ai_status.get("embedding_ready", False),
    }


@router.get("/api/ai/models")
async def list_local_models() -> Dict[str, Any]:
    client = get_ollama_client()
    models = await client.get_available_models()
    return {
        "models": models,
        "count": len(models),
    }


@router.post("/api/ai/test", dependencies=[Depends(require_admin)])
async def test_local_model(payload: TestPromptRequest) -> Dict[str, str]:
    reply = await prompt_text(payload.prompt)
    return {
        "prompt": payload.prompt,
        "response": reply,
    }
