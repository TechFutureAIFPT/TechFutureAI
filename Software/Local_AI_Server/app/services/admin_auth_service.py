"""Google OpenID Connect login with revocable local SQLite admin sessions."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import logging
import secrets
import time
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException, Request

from app.config import get_settings
from app.db.database import get_db

SESSION_COOKIE = "ai_match_admin_session"
CSRF_COOKIE = "ai_match_admin_csrf"
OAUTH_COOKIE = "ai_match_admin_oauth"
logger = logging.getLogger("ai_match.admin.audit")


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def start_google_login(origin: str) -> tuple[str, str]:
    settings = get_settings()
    normalized_origin = origin.strip().rstrip("/")
    if normalized_origin not in settings.admin_allowed_origins:
        raise HTTPException(400, "Origin đăng nhập không được cho phép.")
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(503, "Cần cấu hình Google OAuth client ID/secret cho đăng nhập local.")

    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(48)
    nonce = secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    now = int(time.time())
    with get_db() as conn:
        conn.execute(
            "INSERT INTO local_admin_oauth_states(state_hash, origin, code_verifier, nonce, expires_at, created_at) VALUES(?,?,?,?,?,?)",
            (_digest(state), normalized_origin, verifier, nonce, now + 600, now),
        )
    query = urlencode({
        "client_id": settings.google_oauth_client_id,
        "redirect_uri": settings.google_oauth_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    })
    return "https://accounts.google.com/o/oauth2/v2/auth?" + query, state


def _verify_google_token(token: str, expected_nonce: str) -> dict[str, Any]:
    settings = get_settings()
    from google.auth.transport.requests import Request as GoogleRequest
    from google.oauth2 import id_token

    claims = id_token.verify_oauth2_token(token, GoogleRequest(), settings.google_oauth_client_id)
    if claims.get("nonce") != expected_nonce:
        raise ValueError("Google OAuth nonce mismatch")
    if claims.get("email_verified") is not True:
        raise ValueError("Google email is not verified")
    if str(claims.get("email", "")).strip().casefold() != settings.admin_email:
        raise HTTPException(403, "Tài khoản này không có quyền quản trị.")
    return claims


def finish_google_login(code: str, state: str, cookie_state: str) -> tuple[str, str]:
    if not state or not cookie_state or not hmac.compare_digest(state, cookie_state):
        raise HTTPException(400, "OAuth state không khớp phiên trình duyệt.")
    now = int(time.time())
    with get_db() as conn:
        row = conn.execute(
            "SELECT origin,code_verifier,nonce,expires_at FROM local_admin_oauth_states WHERE state_hash=?",
            (_digest(state),),
        ).fetchone()
        conn.execute("DELETE FROM local_admin_oauth_states WHERE state_hash=?", (_digest(state),))
    if row is None or row[3] <= now:
        raise HTTPException(400, "OAuth state đã hết hạn hoặc đã được sử dụng.")

    settings = get_settings()
    try:
        response = httpx.post(
            "https://oauth2.googleapis.com/token",
            data={
                "client_id": settings.google_oauth_client_id,
                "client_secret": settings.google_oauth_client_secret,
                "code": code,
                "grant_type": "authorization_code",
                "redirect_uri": settings.google_oauth_redirect_uri,
                "code_verifier": row[1],
            },
            timeout=20,
        )
        response.raise_for_status()
        claims = _verify_google_token(response.json()["id_token"], row[2])
    except HTTPException:
        raise
    except Exception as error:
        logger.warning("Google admin authentication failed: %s", type(error).__name__)
        raise HTTPException(401, "Google chưa xác nhận được phiên đăng nhập.") from None

    token = secrets.token_urlsafe(48)
    expires_at = now + settings.admin_session_seconds
    session_claims = {
        "uid": str(claims.get("sub", "")),
        "email": str(claims.get("email", "")).casefold(),
        "name": str(claims.get("name", "Quản trị viên")),
        "email_verified": True,
        "auth_time": now,
    }
    if not session_claims["uid"]:
        raise HTTPException(401, "Google không trả về mã định danh tài khoản hợp lệ.")
    with get_db() as conn:
        conn.execute(
            "INSERT INTO local_admin_sessions(token_hash, claims_json, expires_at, created_at) VALUES(?,?,?,?)",
            (_digest(token), json.dumps(session_claims, ensure_ascii=False), expires_at, now),
        )
    return token, row[0]


def verify_session(token: str) -> dict[str, Any]:
    if not token or len(token) > 512:
        raise ValueError("Invalid session")
    with get_db() as conn:
        row = conn.execute(
            "SELECT claims_json,expires_at FROM local_admin_sessions WHERE token_hash=?",
            (_digest(token),),
        ).fetchone()
        if row is not None and row[1] <= time.time():
            conn.execute("DELETE FROM local_admin_sessions WHERE token_hash=?", (_digest(token),))
            row = None
    if row is None:
        raise ValueError("Session expired or revoked")
    return json.loads(row[0])


def revoke_session(token: str) -> None:
    if not token:
        return
    with get_db() as conn:
        conn.execute("DELETE FROM local_admin_sessions WHERE token_hash=?", (_digest(token),))


def authorize_claims(claims: dict[str, Any]) -> dict[str, str]:
    settings = get_settings()
    email = str(claims.get("email") or "").strip().casefold()
    uid = str(claims.get("uid") or claims.get("sub") or "")
    if not uid or email != settings.admin_email or claims.get("email_verified") is not True:
        raise HTTPException(403, "Tài khoản này không có quyền quản trị hoặc email chưa được xác minh.")
    return {"uid": uid, "email": email, "name": str(claims.get("name") or "Quản trị viên")}


def require_csrf(request: Request) -> None:
    origin = request.headers.get("origin", "").rstrip("/")
    expected = str(request.base_url).rstrip("/")
    cookie = request.cookies.get(CSRF_COOKIE, "")
    header = request.headers.get("x-csrf-token", "")
    if origin != expected or not cookie or not header or not hmac.compare_digest(cookie, header):
        raise HTTPException(403, "Phiên thao tác không hợp lệ. Vui lòng tải lại trang.")


def require_admin(request: Request) -> dict[str, str]:
    cached = getattr(request.state, "admin", None)
    if cached is not None:
        return cached
    authorization = request.headers.get("authorization", "")
    token = authorization[7:].strip() if authorization.startswith("Bearer ") else ""
    token = token or request.cookies.get(SESSION_COOKIE, "")
    if not token:
        raise HTTPException(401, "Vui lòng đăng nhập bằng tài khoản quản trị.")
    try:
        actor = authorize_claims(verify_session(token))
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(401, "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.") from None
    if request.cookies.get(SESSION_COOKIE) and request.method not in {"GET", "HEAD", "OPTIONS"}:
        require_csrf(request)
    request.state.admin = actor
    logger.info("admin_access uid=%s method=%s path=%s", actor["uid"], request.method, request.url.path)
    return actor
