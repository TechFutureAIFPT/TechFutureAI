from __future__ import annotations

import json

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

from app.core.config import get_settings
from app.services import sql_auth_service as auth

router = APIRouter(prefix="/api/auth", tags=["Local SQL authentication"])


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=1, max_length=1024)
    displayName: str = Field(default="", max_length=150)


class OAuthStart(BaseModel):
    origin: str = Field(max_length=300)


def require_local() -> None:
    if get_settings().auth_provider != "sql":
        raise HTTPException(404, "Local authentication is not enabled")


def session_response(payload: dict, request: Request) -> JSONResponse:
    response = JSONResponse({"success": True, "data": payload, "error": None}, headers={"Cache-Control": "no-store"})
    response.set_cookie(auth.SESSION_COOKIE, payload["accessToken"], max_age=get_settings().local_session_seconds, httponly=True, secure=request.url.scheme == "https", samesite="lax", path="/")
    return response


@router.post("/register")
def register(payload: Credentials, request: Request):
    require_local()
    return session_response(auth.register(payload.email, payload.password, payload.displayName), request)


@router.post("/login")
def login(payload: Credentials, request: Request):
    require_local()
    return session_response(auth.login(payload.email, payload.password), request)


@router.get("/session")
def session(request: Request):
    require_local()
    token = request.headers.get("Authorization", "").removeprefix("Bearer ") or request.cookies.get(auth.SESSION_COOKIE, "")
    try:
        claims = auth.verify_session(token)
    except ValueError:
        raise HTTPException(401, "Phiên đăng nhập đã hết hạn.") from None
    return JSONResponse({"success": True, "data": {"user": auth._public(claims), "accessToken": token}, "error": None}, headers={"Cache-Control": "no-store"})


@router.post("/logout")
def logout(request: Request):
    require_local()
    token = request.headers.get("Authorization", "").removeprefix("Bearer ") or request.cookies.get(auth.SESSION_COOKIE, "")
    auth.revoke_session(token)
    response = JSONResponse({"success": True, "data": {"signedOut": True}, "error": None})
    response.delete_cookie(auth.SESSION_COOKIE, path="/")
    return response


@router.post("/google/start")
def google_start(payload: OAuthStart, request: Request):
    require_local()
    result = auth.oauth_start(payload.origin)
    response = JSONResponse({"success": True, "data": {"authUrl": result["authUrl"]}, "error": None}, headers={"Cache-Control": "no-store"})
    response.set_cookie(auth.OAUTH_COOKIE, result["state"], max_age=600, httponly=True, secure=request.url.scheme == "https", samesite="lax", path="/api/auth")
    return response


@router.get("/google/callback")
def google_callback(request: Request, code: str = "", state: str = "", error: str = ""):
    require_local()
    if error or not code:
        raise HTTPException(400, "Đăng nhập Google đã bị hủy hoặc thiếu authorization code.")
    payload, origin = auth.oauth_finish(code, state, request.cookies.get(auth.OAUTH_COOKIE, ""))
    # Only the allowlisted parent receives the success event. Tokens stay out of URLs.
    message = json.dumps({"type": "aimatch-local-auth", "ok": True}).replace("<", "\\u003c")
    target = json.dumps(origin).replace("<", "\\u003c")
    response = HTMLResponse(f'<!doctype html><html lang="vi"><meta charset="utf-8"><title>AI Match</title><p>Đăng nhập thành công. Bạn có thể đóng cửa sổ này.</p><script>if(window.opener)window.opener.postMessage({message},{target});window.close();</script></html>', headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"})
    response.set_cookie(auth.SESSION_COOKIE, payload["accessToken"], max_age=get_settings().local_session_seconds, httponly=True, secure=request.url.scheme == "https", samesite="lax", path="/")
    response.delete_cookie(auth.OAUTH_COOKIE, path="/api/auth")
    return response
