from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app import deep_research, reply, service
from app.auth import AuthenticatedUser, get_current_user
from app.schemas import (
    AssistantReplyRequest,
    AssistantReplyResponse,
    AssistantSessionCreateRequest,
    DeepResearchRequest,
    DeepResearchResponse,
)

router = APIRouter(prefix="/api/assistant", tags=["assistant"])


@router.post("/deep-research", response_model=DeepResearchResponse)
async def deep_research_route(
    payload: DeepResearchRequest,
    _current_user: AuthenticatedUser = Depends(get_current_user),
):
    result = await deep_research.run_deep_research(payload.question)
    return DeepResearchResponse(question=payload.question, **result)


@router.post("/sessions")
def create_session(payload: AssistantSessionCreateRequest, current_user: AuthenticatedUser = Depends(get_current_user)):
    return {"id": service.create_session(current_user, payload.title)}


@router.post("/sessions/{session_id}/reply", response_model=AssistantReplyResponse)
def reply_session(
    session_id: str,
    payload: AssistantReplyRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return reply.reply_to_session(current_user, session_id, payload.message)


@router.get("/sessions")
def list_sessions(
    limit_count: int = Query(default=20, ge=1, le=200),
    current_user: AuthenticatedUser = Depends(get_current_user),
):
    return service.get_user_sessions(current_user, limit_count=limit_count)


@router.get("/sessions/{session_id}")
def get_session(session_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    result = service.get_session(current_user, session_id)
    if result is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Không tìm thấy phiên trò chuyện.")
    return result


@router.delete("/sessions/{session_id}")
def delete_session(session_id: str, current_user: AuthenticatedUser = Depends(get_current_user)):
    return {"ok": service.delete_session(current_user, session_id)}
