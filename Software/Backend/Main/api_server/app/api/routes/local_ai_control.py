from __future__ import annotations

import hmac
import ipaddress
import os
import re
import subprocess
import time
from pathlib import Path
from typing import Literal
from urllib.parse import urlsplit

import httpx
from dotenv import set_key
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field

from app.core.ai_contract import DEFAULT_EMBEDDING_MODEL, DEFAULT_VECTOR_INDEX_VERSION
from app.core.config import get_settings
from app.services.local_classifier_service import get_classifier_status


router = APIRouter(prefix="/api/local-control", tags=["local AI administration"])
LOCAL_VECTOR_INDEX_VERSION = "nomic-embed-text-768-local-v2"
GEMINI_MODEL_PATTERN = re.compile(r"^[a-zA-Z0-9._/-]{1,128}$")
RUNTIME_ENV_PATH = Path(__file__).resolve().parents[2] / ".env.local-runtime"


class ProviderUpdate(BaseModel):
    provider: Literal["gemini", "ollama"]


class GeminiConfigUpdate(BaseModel):
    api_key: str | None = Field(default=None, max_length=512)
    model: str | None = Field(default=None, max_length=128)


def _require_local_admin(request: Request) -> None:
    if os.getenv("LOCAL_AI_CONTROL_ENABLED", "").strip().lower() not in {"1", "true", "yes", "on"}:
        raise HTTPException(status_code=404, detail="Local AI control is disabled.")
    if get_settings().auth_provider != "sql":
        raise HTTPException(status_code=404, detail="Local AI control is available only in local mode.")
    client_host = request.client.host if request.client else ""
    try:
        if not ipaddress.ip_address(client_host).is_loopback:
            raise HTTPException(status_code=404, detail="Not found.")
    except ValueError:
        raise HTTPException(status_code=404, detail="Not found.") from None
    host = urlsplit(f"//{request.headers.get('host', '')}").hostname
    if host not in {"localhost", "127.0.0.1"}:
        raise HTTPException(status_code=404, detail="Not found.")
    expected = os.getenv("LOCAL_AI_CONTROL_TOKEN", "")
    supplied = request.headers.get("x-local-ai-control-token", "")
    if not expected or not supplied or not hmac.compare_digest(expected, supplied):
        raise HTTPException(status_code=403, detail="Local admin authorization is required.")


def _persist_runtime_values(values: dict[str, str]) -> None:
    RUNTIME_ENV_PATH.parent.mkdir(parents=True, exist_ok=True)
    for key, value in values.items():
        written, _, _ = set_key(str(RUNTIME_ENV_PATH), key, value, quote_mode="always")
        if not written:
            raise HTTPException(status_code=500, detail="Could not persist local AI settings.")
        os.environ[key] = value


def _ollama_json(path: str, *, timeout: float = 3.0) -> dict:
    settings = get_settings()
    try:
        response = httpx.get(f"{settings.ollama_base_url}{path}", timeout=timeout)
        response.raise_for_status()
        payload = response.json()
        return payload if isinstance(payload, dict) else {}
    except (httpx.HTTPError, ValueError):
        return {}


def _model_names() -> tuple[set[str], set[str]]:
    tags_payload = _ollama_json("/api/tags")
    running_payload = _ollama_json("/api/ps")
    tags = tags_payload.get("models") if isinstance(tags_payload.get("models"), list) else []
    running = running_payload.get("models") if isinstance(running_payload.get("models"), list) else []
    return (
        {str(item.get("name") or item.get("model") or "") for item in tags if isinstance(item, dict)},
        {str(item.get("name") or item.get("model") or "") for item in running if isinstance(item, dict)},
    )


def _has_model(names: set[str], model: str) -> bool:
    return model in names or (":" not in model and f"{model}:latest" in names)


def _runtime_status() -> dict:
    settings = get_settings()
    available_models, running_models = _model_names()
    classifier = get_classifier_status()
    return {
        "provider": settings.cv_analysis_provider,
        "gemini": {
            "configured": bool(settings.gemini_api_keys),
            "model": settings.gemini_cv_analysis_model,
            "generalModel": settings.gemini_default_model,
            "embeddingModel": settings.gemini_embedding_model,
            "active": settings.cv_analysis_provider == "gemini",
        },
        "ollama": {
            "available": bool(available_models),
            "cvModel": settings.local_cv_model,
            "cvModelAvailable": _has_model(available_models, settings.local_cv_model),
            "cvModelLoaded": _has_model(running_models, settings.local_cv_model),
            "generalModel": settings.local_llm_model,
            "generalModelAvailable": _has_model(available_models, settings.local_llm_model),
            "embeddingModel": settings.local_embedding_model,
            "embeddingModelAvailable": _has_model(available_models, settings.local_embedding_model),
            "active": settings.cv_analysis_provider == "ollama",
        },
        "classifier": {
            "ready": bool(classifier.get("ready")),
            "version": classifier.get("model_version", "unknown"),
            "labels": int(classifier.get("label_count", 0)),
        },
        "data": {"provider": settings.data_provider},
    }


def _start_ollama_if_needed() -> None:
    if _model_names()[0]:
        return
    try:
        subprocess.run(
            ["docker", "start", "supporthr-local-ollama"],
            check=False,
            capture_output=True,
            timeout=30,
            text=True,
        )
    except (OSError, subprocess.TimeoutExpired):
        raise HTTPException(status_code=503, detail="Local Ollama is unavailable and could not be started.") from None
    deadline = time.monotonic() + 30
    while time.monotonic() < deadline:
        if _model_names()[0]:
            return
        time.sleep(1)
    raise HTTPException(status_code=503, detail="Local Ollama did not become ready. Check Docker Desktop.")


def _warm_local_cv_model() -> None:
    settings = get_settings()
    _start_ollama_if_needed()
    available_models, _ = _model_names()
    if not _has_model(available_models, settings.local_cv_model):
        raise HTTPException(status_code=503, detail=f"Local CV model '{settings.local_cv_model}' is not installed.")
    try:
        response = httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={
                "model": settings.local_cv_model,
                "prompt": "Reply with OK.",
                "stream": False,
                "keep_alive": settings.local_cv_keep_alive,
                "options": {"num_predict": 1, "temperature": 0, "num_ctx": settings.local_cv_num_ctx},
            },
            timeout=settings.local_cv_timeout,
        )
        response.raise_for_status()
        if not str(response.json().get("response") or "").strip():
            raise ValueError("empty local model response")
    except (httpx.HTTPError, ValueError):
        raise HTTPException(status_code=503, detail="Local CV model could not be loaded. Check Ollama logs.") from None


def _verify_gemini() -> None:
    settings = get_settings()
    keys = settings.gemini_api_keys
    if not keys:
        raise HTTPException(status_code=409, detail="Save a Gemini API key before switching to Gemini.")
    try:
        from google import genai

        last_error: Exception | None = None
        for key in keys:
            try:
                response = genai.Client(api_key=key).models.generate_content(
                    model=settings.gemini_cv_analysis_model,
                    contents="Reply with OK.",
                )
                if str(response.text or "").strip():
                    return
            except Exception as error:  # Provider messages may contain request details; do not return or log them.
                last_error = error
        if last_error is not None:
            raise HTTPException(status_code=502, detail="Gemini did not accept the saved key or model.") from None
        raise HTTPException(status_code=502, detail="Gemini returned an empty response.")
    except ImportError:
        raise HTTPException(status_code=503, detail="Google GenAI SDK is not installed.") from None


def _set_active_provider(provider: Literal["gemini", "ollama"]) -> None:
    settings = get_settings()
    vector_index = DEFAULT_VECTOR_INDEX_VERSION if provider == "gemini" else LOCAL_VECTOR_INDEX_VERSION
    _persist_runtime_values(
        {
            "LOCAL_AI_DEFAULT_PROVIDER": provider,
            "AI_PROVIDER": provider,
            "CV_ANALYSIS_PROVIDER": provider,
            "VECTOR_INDEX_VERSION": vector_index,
        }
    )
    settings.ai_provider = provider
    settings.cv_analysis_provider = provider
    settings.vector_index_version = vector_index
    if provider == "gemini":
        settings.gemini_embedding_model = os.getenv("GEMINI_EMBEDDING_MODEL", DEFAULT_EMBEDDING_MODEL)


def _unload_local_cv_model() -> None:
    settings = get_settings()
    try:
        httpx.post(
            f"{settings.ollama_base_url}/api/generate",
            json={"model": settings.local_cv_model, "prompt": "", "stream": False, "keep_alive": 0},
            timeout=5,
        )
    except httpx.HTTPError:
        return


@router.get("/status")
def get_status(request: Request) -> dict:
    _require_local_admin(request)
    return {"success": True, "data": _runtime_status(), "error": None}


@router.put("/provider")
def set_provider(payload: ProviderUpdate, request: Request) -> dict:
    _require_local_admin(request)
    previous = get_settings().cv_analysis_provider
    if payload.provider == "ollama":
        _warm_local_cv_model()
    else:
        _verify_gemini()
    _set_active_provider(payload.provider)
    if payload.provider == "gemini" and previous == "ollama":
        _unload_local_cv_model()
    return {"success": True, "data": _runtime_status(), "error": None}


@router.put("/gemini")
def save_gemini_config(payload: GeminiConfigUpdate, request: Request) -> dict:
    _require_local_admin(request)
    updates: dict[str, str] = {}
    if payload.api_key is not None:
        api_key = payload.api_key.strip()
        if not api_key or any(character.isspace() for character in api_key):
            raise HTTPException(status_code=422, detail="Enter a valid Gemini API key without spaces.")
        updates["GEMINI_API_KEY_1"] = api_key
    if payload.model is not None:
        model = payload.model.strip()
        if not GEMINI_MODEL_PATTERN.fullmatch(model):
            raise HTTPException(status_code=422, detail="Gemini model name contains unsupported characters.")
        updates.update(
            {
                "GEMINI_MODEL": model,
                "GEMINI_CV_ANALYSIS_MODEL": model,
                "QUICK_CV_GEMINI_MODEL": model,
            }
        )
    if not updates:
        raise HTTPException(status_code=422, detail="Enter a Gemini key or model name to save.")
    _persist_runtime_values(updates)
    settings = get_settings()
    if payload.model is not None:
        settings.gemini_default_model = updates["GEMINI_MODEL"]
        settings.gemini_cv_analysis_model = updates["GEMINI_CV_ANALYSIS_MODEL"]
        settings.quick_cv_gemini_model = updates["QUICK_CV_GEMINI_MODEL"]
    return {"success": True, "data": _runtime_status(), "error": None}
