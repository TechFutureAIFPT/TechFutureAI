"""Local Google OAuth login and SQL-backed admin sessions."""
from __future__ import annotations

import json
import os
from urllib.parse import urlsplit

import httpx
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

from app.config import get_settings
from app.services.admin_auth_service import (
    CSRF_COOKIE,
    OAUTH_COOKIE,
    SESSION_COOKIE,
    finish_google_login,
    require_admin,
    require_csrf,
    revoke_session,
    start_google_login,
)

router = APIRouter(prefix="/api/admin", tags=["admin"])


class ProviderUpdate(BaseModel):
    provider: str = Field(pattern="^(gemini|ollama)$")


class GeminiConfigUpdate(BaseModel):
    api_key: str | None = Field(default=None, max_length=512)
    model: str | None = Field(default=None, max_length=128)


def _local_core_request(method: str, path: str, payload: dict | None = None) -> dict:
    base_url = os.getenv("LOCAL_CORE_API_URL", "http://127.0.0.1:8010").rstrip("/")
    if urlsplit(base_url).hostname not in {"localhost", "127.0.0.1"}:
        raise HTTPException(503, "Local backend URL is not loopback-only.")
    token = os.getenv("LOCAL_AI_CONTROL_TOKEN", "")
    if not token:
        raise HTTPException(503, "Local AI control is not configured. Restart the local stack.")
    try:
        response = httpx.request(
            method,
            f"{base_url}/api/local-control{path}",
            json=payload,
            headers={"X-Local-AI-Control-Token": token},
            timeout=300 if path == "/provider" else 15,
        )
    except httpx.HTTPError:
        raise HTTPException(503, "Could not connect to the local backend on port 8010.") from None
    try:
        result = response.json()
    except ValueError:
        result = {}
    if not response.is_success:
        message = result.get("detail") if isinstance(result, dict) else None
        raise HTTPException(response.status_code, message if isinstance(message, str) else "Local AI control request failed.")
    return result


class OAuthStart(BaseModel):
    origin: str = Field(min_length=8, max_length=300)


@router.post("/google/start")
def google_start(payload: OAuthStart, request: Request) -> JSONResponse:
    require_csrf(request)
    auth_url, state = start_google_login(payload.origin)
    response = JSONResponse(
        {"success": True, "data": {"authUrl": auth_url}, "error": None},
        headers={"Cache-Control": "no-store"},
    )
    response.set_cookie(
        OAUTH_COOKIE,
        state,
        max_age=600,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/api/admin",
    )
    return response


@router.get("/google/callback", response_class=HTMLResponse)
def google_callback(request: Request, code: str = "", state: str = "", error: str = "") -> HTMLResponse:
    if error or not code:
        raise HTTPException(400, "Đăng nhập Google đã bị hủy hoặc thiếu authorization code.")
    token, origin = finish_google_login(code, state, request.cookies.get(OAUTH_COOKIE, ""))
    message = json.dumps({"type": "aimatch-admin-auth", "ok": True}).replace("<", "\\u003c")
    target = json.dumps(origin).replace("<", "\\u003c")
    response = HTMLResponse(
        "<!doctype html><html lang='vi'><meta charset='utf-8'><title>AI Match</title>"
        "<p>Đăng nhập thành công. Bạn có thể đóng cửa sổ này.</p>"
        f"<script>if(window.opener)window.opener.postMessage({message},{target});window.close();</script></html>",
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"},
    )
    response.set_cookie(
        SESSION_COOKIE,
        token,
        max_age=get_settings().admin_session_seconds,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="strict",
        path="/",
    )
    response.delete_cookie(OAUTH_COOKIE, path="/api/admin")
    return response


@router.get("/session")
def session(actor: dict[str, str] = Depends(require_admin)) -> dict:
    return {"success": True, "data": actor, "error": None}


@router.get("/ai-runtime")
def ai_runtime(actor: dict[str, str] = Depends(require_admin)) -> dict:
    return _local_core_request("GET", "/status")


@router.put("/ai-runtime/provider")
def set_ai_provider(
    payload: ProviderUpdate,
    request: Request,
    actor: dict[str, str] = Depends(require_admin),
) -> dict:
    require_csrf(request)
    return _local_core_request("PUT", "/provider", payload.model_dump())


@router.put("/ai-runtime/gemini")
def save_gemini_config(
    payload: GeminiConfigUpdate,
    request: Request,
    actor: dict[str, str] = Depends(require_admin),
) -> dict:
    require_csrf(request)
    return _local_core_request("PUT", "/gemini", payload.model_dump(exclude_unset=True))


@router.delete("/session")
def logout(request: Request) -> JSONResponse:
    require_csrf(request)
    revoke_session(request.cookies.get(SESSION_COOKIE, ""))
    response = JSONResponse({"success": True, "data": {"signed_out": True}, "error": None})
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, samesite="strict")
    response.delete_cookie(CSRF_COOKIE, path="/", httponly=True, samesite="strict")
    return response
