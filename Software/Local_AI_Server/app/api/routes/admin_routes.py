"""Local Google OAuth login and SQL-backed admin sessions."""
from __future__ import annotations

import json

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


@router.delete("/session")
def logout(request: Request) -> JSONResponse:
    require_csrf(request)
    revoke_session(request.cookies.get(SESSION_COOKIE, ""))
    response = JSONResponse({"success": True, "data": {"signed_out": True}, "error": None})
    response.delete_cookie(SESSION_COOKIE, path="/", httponly=True, samesite="strict")
    response.delete_cookie(CSRF_COOKIE, path="/", httponly=True, samesite="strict")
    return response
