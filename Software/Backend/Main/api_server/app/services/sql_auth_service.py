"""Local SQL identities and revocable sessions; Google login uses OpenID Connect."""
from __future__ import annotations

import base64
import hashlib
import hmac
import json
import secrets
import time
from urllib.parse import urlencode

import httpx
from fastapi import HTTPException

from app.core.config import get_settings
from app.integrations.sqlite_documents import get_sqlite_client

SESSION_COOKIE = "aimatch_local_session"
OAUTH_COOKIE = "aimatch_local_oauth"


def _digest(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def _public(claims: dict) -> dict:
    return {
        "uid": claims["uid"], "email": claims.get("email", ""),
        "displayName": claims.get("name", ""), "photoURL": claims.get("picture", ""),
        "emailVerified": bool(claims.get("email_verified")), "provider": claims.get("provider", "password"),
        "authTime": claims.get("auth_time", 0),
    }


def new_session(claims: dict) -> dict:
    token = secrets.token_urlsafe(48)
    now = int(time.time())
    claims = {**claims, "auth_time": now}
    expires = now + get_settings().local_session_seconds
    with get_sqlite_client().connection(write=True) as conn:
        conn.execute("INSERT INTO local_auth_sessions VALUES(?,?,?,?,?)", (_digest(token), claims["uid"], json.dumps(claims), expires, now))
    get_sqlite_client().collection("loginHistory").document().set({
        "uid": claims["uid"], "email": claims.get("email", ""), "provider": claims.get("provider"),
        "createdAt": now * 1000, "success": True,
    })
    return {"user": _public(claims), "accessToken": token, "expiresAt": expires}


def verify_session(token: str) -> dict:
    if not token or len(token) > 512:
        raise ValueError("Invalid session")
    with get_sqlite_client().connection() as conn:
        row = conn.execute("SELECT claims,expires_at FROM local_auth_sessions WHERE token_hash=?", (_digest(token),)).fetchone()
    if row is None or row[1] <= time.time():
        raise ValueError("Session expired or revoked")
    return json.loads(row[0])


def revoke_session(token: str) -> None:
    with get_sqlite_client().connection(write=True) as conn:
        conn.execute("DELETE FROM local_auth_sessions WHERE token_hash=?", (_digest(token),))


def _password(password: str, salt: str) -> str:
    return hashlib.scrypt(password.encode(), salt=bytes.fromhex(salt), n=16384, r=8, p=1).hex()


def register(email: str, password: str, name: str) -> dict:
    email = email.strip().casefold()
    if len(password) < 10 or len(password) > 1024:
        raise HTTPException(422, "Mật khẩu cần từ 10 đến 1024 ký tự.")
    salt = secrets.token_hex(16)
    uid = "local:" + secrets.token_hex(16)
    client = get_sqlite_client()
    with client.connection(write=True) as conn:
        if conn.execute("SELECT 1 FROM local_auth_credentials WHERE email=?", (email,)).fetchone():
            raise HTTPException(409, "Không thể tạo tài khoản với địa chỉ email này.")
        conn.execute("INSERT INTO local_auth_credentials VALUES(?,?,?,?,?)", (email, uid, f"scrypt${salt}${_password(password, salt)}", name.strip(), int(time.time())))
    claims = {"uid": uid, "email": email, "name": name.strip(), "picture": "", "email_verified": False, "provider": "password"}
    client.collection("users").document(uid).set({"uid": uid, "email": email, "displayName": name.strip(), "provider": "password", "userRole": "recruiter"}, merge=True)
    return new_session(claims)


def login(email: str, password: str) -> dict:
    with get_sqlite_client().connection() as conn:
        row = conn.execute("SELECT uid,password_hash,display_name FROM local_auth_credentials WHERE email=?", (email.strip().casefold(),)).fetchone()
    # Perform scrypt even for a missing identity, without exposing which email exists.
    encoded = row[1] if row else "scrypt$" + "00" * 16 + "$" + "00" * 64
    _, salt, expected = encoded.split("$")
    actual = _password(password, salt)
    if row is None or not hmac.compare_digest(actual, expected):
        raise HTTPException(401, "Email hoặc mật khẩu không đúng.")
    return new_session({"uid": row[0], "email": email.strip().casefold(), "name": row[2], "email_verified": False, "provider": "password"})


def oauth_start(origin: str) -> dict:
    settings = get_settings()
    allowed = {value.rstrip("/") for value in settings.google_drive_allowed_origins}
    if origin.rstrip("/") not in allowed:
        raise HTTPException(400, "Origin đăng nhập không được cho phép.")
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(503, "Cần cấu hình Google OAuth client ID/secret cho đăng nhập local.")
    state, verifier, nonce = secrets.token_urlsafe(32), secrets.token_urlsafe(48), secrets.token_urlsafe(32)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    get_sqlite_client().collection("localLoginOAuthStates").document(_digest(state)).set({
        "origin": origin.rstrip("/"), "codeVerifier": verifier, "nonce": nonce,
        "redirectUri": settings.local_auth_redirect_uri, "expiresAt": int(time.time()) + 600,
    })
    query = urlencode({
        "client_id": settings.google_oauth_client_id, "redirect_uri": settings.local_auth_redirect_uri,
        "response_type": "code", "scope": "openid email profile", "state": state,
        "nonce": nonce, "code_challenge": challenge, "code_challenge_method": "S256", "prompt": "select_account",
    })
    return {"state": state, "authUrl": "https://accounts.google.com/o/oauth2/v2/auth?" + query}


def verify_google_id_token(token: str, audience: str) -> dict:
    from google.auth.transport.requests import Request
    from google.oauth2 import id_token
    return id_token.verify_oauth2_token(token, Request(), audience=audience)


def oauth_finish(code: str, state: str, cookie_state: str) -> tuple[dict, str]:
    if not state or not hmac.compare_digest(state, cookie_state):
        raise HTTPException(400, "OAuth state không khớp phiên trình duyệt.")
    client = get_sqlite_client()
    record = client.consume("localLoginOAuthStates", _digest(state))
    if not record or record["expiresAt"] <= time.time():
        raise HTTPException(400, "OAuth state đã hết hạn hoặc đã sử dụng.")
    settings = get_settings()
    try:
        response = httpx.post("https://oauth2.googleapis.com/token", data={
            "client_id": settings.google_oauth_client_id, "client_secret": settings.google_oauth_client_secret,
            "code": code, "grant_type": "authorization_code", "redirect_uri": record["redirectUri"],
            "code_verifier": record["codeVerifier"],
        }, timeout=30)
        response.raise_for_status()
        claims = verify_google_id_token(response.json()["id_token"], settings.google_oauth_client_id)
        if claims.get("nonce") != record["nonce"] or claims.get("email_verified") is not True or not claims.get("sub"):
            raise ValueError("Unverified Google identity or nonce")
    except (httpx.HTTPError, KeyError, ValueError) as error:
        raise HTTPException(401, "Google chưa xác nhận được phiên đăng nhập.") from error
    email = claims["email"].casefold()
    with client.connection(write=True) as conn:
        identity = conn.execute("SELECT uid FROM local_google_identities WHERE subject=?", (claims["sub"],)).fetchone()
        if identity:
            uid = identity[0]
        else:
            # A mutable profile email/provider is not identity proof. Legacy UIDs
            # are preserved only by the verified Firebase Auth migration tool.
            uid = "google:" + claims["sub"]
            if conn.execute("SELECT 1 FROM local_google_identities WHERE uid=?", (uid,)).fetchone():
                raise HTTPException(409, "Danh tính Google cần quản trị viên kiểm tra liên kết tài khoản.")
            conn.execute("INSERT INTO local_google_identities VALUES(?,?,?)", (claims["sub"], uid, email))
    local_claims = {"uid": uid, "email": email, "name": claims.get("name", ""), "picture": claims.get("picture", ""), "email_verified": True, "provider": "google.com"}
    client.collection("users").document(local_claims["uid"]).set({
        "uid": local_claims["uid"], "email": local_claims["email"], "displayName": local_claims["name"],
        "photoURL": local_claims["picture"], "provider": "google.com", "emailVerified": True,
    }, merge=True)
    return new_session(local_claims), record["origin"]
