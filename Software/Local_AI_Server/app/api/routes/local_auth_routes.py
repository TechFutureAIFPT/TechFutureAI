from __future__ import annotations

import json
from typing import Any

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel, Field

from app.services import local_auth_service as auth

router = APIRouter(prefix="/api/auth", tags=["local-auth"])


class Credentials(BaseModel):
    email: str = Field(min_length=3, max_length=254, pattern=r"^[^\s@]+@[^\s@]+\.[^\s@]+$")
    password: str = Field(min_length=1, max_length=1024)
    displayName: str = Field(default="", max_length=150)


class OAuthStart(BaseModel):
    origin: str = Field(min_length=8, max_length=300)


def _set_session(payload: dict[str, Any], request: Request) -> JSONResponse:
    response = JSONResponse(
        {"success": True, "data": payload, "error": None},
        headers={"Cache-Control": "no-store"},
    )
    response.set_cookie(
        auth.SESSION_COOKIE,
        payload["accessToken"],
        max_age=8 * 60 * 60,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
    )
    return response


def _request_token(request: Request) -> str:
    authorization = request.headers.get("Authorization", "")
    return authorization[7:].strip() if authorization.startswith("Bearer ") else request.cookies.get(auth.SESSION_COOKIE, "")


@router.post("/register")
def register(payload: Credentials, request: Request) -> JSONResponse:
    return _set_session(auth.register(payload.email, payload.password, payload.displayName), request)


@router.post("/login")
def login(payload: Credentials, request: Request) -> JSONResponse:
    return _set_session(auth.login(payload.email, payload.password), request)


@router.get("/session")
def session(request: Request) -> JSONResponse:
    token = _request_token(request)
    try:
        claims = auth.verify_session(token)
    except ValueError:
        raise HTTPException(401, "Phiên đăng nhập local đã hết hạn.") from None
    payload = {"user": auth._public(claims), "accessToken": token}
    return JSONResponse({"success": True, "data": payload, "error": None}, headers={"Cache-Control": "no-store"})


@router.post("/logout")
def logout(request: Request) -> JSONResponse:
    auth.revoke_session(_request_token(request))
    response = JSONResponse({"success": True, "data": {"signedOut": True}, "error": None})
    response.delete_cookie(auth.SESSION_COOKIE, path="/", httponly=True, samesite="lax")
    return response


@router.post("/google/start")
def google_start(payload: OAuthStart, request: Request) -> JSONResponse:
    origin = request.headers.get("origin", "").rstrip("/")
    if not origin or origin != payload.origin.rstrip("/"):
        raise HTTPException(403, "Origin đăng nhập không khớp với trình duyệt.")
    result = auth.oauth_start(payload.origin)
    response = JSONResponse(
        {"success": True, "data": {"authUrl": result["authUrl"]}, "error": None},
        headers={"Cache-Control": "no-store"},
    )
    response.set_cookie(
        auth.OAUTH_COOKIE,
        result["state"],
        max_age=600,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/api/auth",
    )
    return response


@router.get("/google/callback", response_class=HTMLResponse)
def google_callback(request: Request, code: str = "", state: str = "", error: str = "") -> HTMLResponse:
    if error or not code:
        raise HTTPException(400, "Đăng nhập Google đã bị hủy hoặc thiếu authorization code.")
    payload, origin = auth.oauth_finish(code, state, request.cookies.get(auth.OAUTH_COOKIE, ""))
    message = json.dumps({"type": "aimatch-local-auth", "ok": True}).replace("<", "\\u003c")
    target = json.dumps(origin).replace("<", "\\u003c")
    response = HTMLResponse(
        "<!doctype html><html lang='vi'><meta charset='utf-8'><title>AI Match</title>"
        "<p>Đăng nhập thành công. Bạn có thể đóng cửa sổ này.</p>"
        f"<script>if(window.opener)window.opener.postMessage({message},{target});window.close();</script></html>",
        headers={"Cache-Control": "no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff"},
    )
    response.set_cookie(
        auth.SESSION_COOKIE,
        payload["accessToken"],
        max_age=8 * 60 * 60,
        httponly=True,
        secure=request.url.scheme == "https",
        samesite="lax",
        path="/",
    )
    response.delete_cookie(auth.OAUTH_COOKIE, path="/api/auth")
    return response
