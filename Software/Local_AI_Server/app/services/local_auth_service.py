from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from typing import Any
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from app.config import get_settings
from app.db.database import get_db
from app.db.repositories.user_repository import UserRepository

SESSION_COOKIE = "aimatch_local_session"
OAUTH_COOKIE = "aimatch_local_oauth"
TOKEN_URL = "https://oauth2.googleapis.com/token"


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode("utf-8")).hexdigest()


def _public(claims: dict[str, Any]) -> dict[str, Any]:
    return {
        "uid": claims["uid"],
        "email": claims.get("email"),
        "displayName": claims.get("name", ""),
        "photoURL": claims.get("picture", ""),
        "emailVerified": bool(claims.get("email_verified")),
        "provider": claims.get("provider", "password"),
        "authTime": claims.get("auth_time", 0),
    }


def _create_session(claims: dict[str, Any]) -> dict[str, Any]:
    token = secrets.token_urlsafe(48)
    now = int(time.time())
    normalized = {**claims, "auth_time": now}
    expires = now + 8 * 60 * 60
    with get_db() as conn:
        conn.execute(
            "INSERT INTO local_auth_sessions(token_hash,uid,claims_json,expires_at,created_at) VALUES(?,?,?,?,?)",
            (_digest(token), str(normalized["uid"]), json.dumps(normalized, ensure_ascii=False), expires, now),
        )
        conn.execute(
            "INSERT INTO loginHistory(id,uid,email,deviceInfo,loginAt) VALUES(?,?,?,?,?)",
            (secrets.token_hex(16), str(normalized["uid"]), normalized.get("email", ""), f"local/{normalized.get('provider', 'password')}", now * 1000),
        )
    return {"user": _public(normalized), "accessToken": token, "expiresAt": expires}


def _password_hash(password: str, salt: str) -> str:
    return hashlib.scrypt(password.encode("utf-8"), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


def register(email: str, password: str, display_name: str = "") -> dict[str, Any]:
    normalized_email = email.strip().casefold()
    if len(password) < 10 or len(password) > 1024:
        raise HTTPException(422, "Mật khẩu cần từ 10 đến 1024 ký tự.")
    salt = secrets.token_hex(16)
    uid = f"local:{secrets.token_hex(16)}"
    with get_db() as conn:
        if conn.execute("SELECT 1 FROM local_auth_credentials WHERE email=?", (normalized_email,)).fetchone():
            raise HTTPException(409, "Không thể tạo tài khoản với địa chỉ email này.")
        conn.execute(
            "INSERT INTO local_auth_credentials(email,uid,password_hash,display_name,created_at) VALUES(?,?,?,?,?)",
            (normalized_email, uid, f"scrypt${salt}${_password_hash(password, salt)}", display_name.strip(), int(time.time())),
        )
    UserRepository.get_or_create_user(uid, normalized_email, display_name.strip(), "recruiter")
    return _create_session({"uid": uid, "email": normalized_email, "name": display_name.strip(), "picture": "", "email_verified": False, "provider": "password"})


def login(email: str, password: str) -> dict[str, Any]:
    normalized_email = email.strip().casefold()
    with get_db() as conn:
        row = conn.execute(
            "SELECT uid,password_hash,display_name FROM local_auth_credentials WHERE email=?",
            (normalized_email,),
        ).fetchone()
    encoded = str(row[1]) if row else f"scrypt${'00' * 16}${'00' * 64}"
    _, salt, expected = encoded.split("$", 2)
    actual = _password_hash(password, salt)
    if row is None or not hmac.compare_digest(actual, expected):
        raise HTTPException(401, "Email hoặc mật khẩu không đúng.")
    claims = {"uid": row[0], "email": normalized_email, "name": row[2], "picture": "", "email_verified": False, "provider": "password"}
    return _create_session(claims)


def verify_session(token: str) -> dict[str, Any]:
    if not token or len(token) > 512:
        raise ValueError("Invalid local session")
    with get_db() as conn:
        row = conn.execute(
            "SELECT claims_json,expires_at FROM local_auth_sessions WHERE token_hash=?",
            (_digest(token),),
        ).fetchone()
        if row is not None and int(row[1]) <= time.time():
            conn.execute("DELETE FROM local_auth_sessions WHERE token_hash=?", (_digest(token),))
            row = None
    if row is None:
        raise ValueError("Local session expired or revoked")
    return json.loads(row[0])


def revoke_session(token: str) -> None:
    if token:
        with get_db() as conn:
            conn.execute("DELETE FROM local_auth_sessions WHERE token_hash=?", (_digest(token),))


def oauth_start(origin: str) -> dict[str, str]:
    settings = get_settings()
    normalized_origin = origin.strip().rstrip("/")
    if normalized_origin not in settings.google_drive_allowed_origins:
        raise HTTPException(400, "Origin đăng nhập không được cho phép.")
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(503, "Cần cấu hình Google OAuth client ID/secret cho đăng nhập local.")
    if not settings.local_auth_redirect_uri:
        raise HTTPException(503, "Cần cấu hình LOCAL_AUTH_REDIRECT_URI.")
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(48)
    nonce = secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    now = int(time.time())
    with get_db() as conn:
        conn.execute("DELETE FROM local_auth_oauth_states WHERE expires_at<=?", (now,))
        conn.execute(
            "INSERT INTO local_auth_oauth_states(state_hash,origin,redirect_uri,code_verifier,nonce,expires_at,created_at) VALUES(?,?,?,?,?,?,?)",
            (_digest(state), normalized_origin, settings.local_auth_redirect_uri, verifier, nonce, now + 600, now),
        )
    query = urlencode({
        "client_id": settings.google_oauth_client_id,
        "redirect_uri": settings.local_auth_redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "state": state,
        "nonce": nonce,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
        "prompt": "select_account",
    })
    return {"state": state, "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?" + query}


def _verify_google_token(token: str, audience: str) -> dict[str, Any]:
    from google.auth.transport.requests import Request as GoogleRequest
    from google.oauth2 import id_token
    return id_token.verify_oauth2_token(token, GoogleRequest(), audience)


def oauth_finish(code: str, state: str, cookie_state: str) -> tuple[dict[str, Any], str]:
    if not state or not cookie_state or not hmac.compare_digest(state, cookie_state):
        raise HTTPException(400, "OAuth state không khớp phiên trình duyệt.")
    with get_db() as conn:
        row = conn.execute(
            "SELECT origin,redirect_uri,code_verifier,nonce,expires_at FROM local_auth_oauth_states WHERE state_hash=?",
            (_digest(state),),
        ).fetchone()
        conn.execute("DELETE FROM local_auth_oauth_states WHERE state_hash=?", (_digest(state),))
    if row is None or int(row[4]) <= time.time():
        raise HTTPException(400, "OAuth state đã hết hạn hoặc đã sử dụng.")
    settings = get_settings()
    try:
        response = httpx.post(TOKEN_URL, data={
            "client_id": settings.google_oauth_client_id,
            "client_secret": settings.google_oauth_client_secret,
            "code": code,
            "grant_type": "authorization_code",
            "redirect_uri": row[1],
            "code_verifier": row[2],
        }, timeout=30)
        response.raise_for_status()
        claims = _verify_google_token(response.json()["id_token"], settings.google_oauth_client_id)
        if claims.get("nonce") != row[3] or claims.get("email_verified") is not True or not claims.get("sub"):
            raise ValueError("Google identity is not verified")
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(401, "Google chưa xác nhận được phiên đăng nhập.") from error

    subject = str(claims["sub"])
    email = str(claims["email"]).strip().casefold()
    now = int(time.time())
    with get_db() as conn:
        identity = conn.execute("SELECT uid FROM local_google_identities WHERE subject=?", (subject,)).fetchone()
        uid = str(identity[0]) if identity else f"google:{subject}"
        if not identity:
            conn.execute(
                "INSERT INTO local_google_identities(subject,uid,email,created_at) VALUES(?,?,?,?)",
                (subject, uid, email, now),
            )
    UserRepository.get_or_create_user(uid, email, str(claims.get("name") or ""), "recruiter")
    session = _create_session({
        "uid": uid, "email": email, "name": str(claims.get("name") or ""),
        "picture": str(claims.get("picture") or ""), "email_verified": True, "provider": "google.com",
    })
    return session, str(row[0])
