from __future__ import annotations

import base64
import hashlib
import json
import mimetypes
import secrets
import time
from pathlib import Path
from typing import Any
from urllib.parse import quote, urlencode, urlparse

import httpx
from cryptography.fernet import Fernet, InvalidToken
from fastapi import HTTPException

from app.config import get_settings
from app.db.database import get_db
from app.db.repositories.file_repository import FileRepository
from app.services.file_extractor import extract_text_from_file_bytes

AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth"
TOKEN_URL = "https://oauth2.googleapis.com/token"
USERINFO_URL = "https://openidconnect.googleapis.com/v1/userinfo"
DRIVE_URL = "https://www.googleapis.com/drive/v3"
DRIVE_SCOPES = ["openid", "email", "profile", "https://www.googleapis.com/auth/drive.readonly"]
WORKSPACE_EXPORTS = {
    "application/vnd.google-apps.document": ("application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".docx"),
    "application/vnd.google-apps.presentation": ("application/pdf", ".pdf"),
    "application/vnd.google-apps.drawing": ("image/png", ".png"),
    "application/vnd.google-apps.spreadsheet": ("text/csv", ".csv"),
}
MAX_FILE_BYTES = 15 * 1024 * 1024


class DriveError(ValueError):
    pass


def _cipher() -> Fernet:
    key = get_settings().google_drive_token_encryption_key
    if not key:
        raise HTTPException(503, "Thiếu GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY để lưu token Drive an toàn.")
    try:
        return Fernet(key.encode("ascii"))
    except Exception as error:
        raise HTTPException(503, "Khóa mã hóa token Drive không hợp lệ.") from error


def _encrypt(value: str) -> str:
    return _cipher().encrypt(value.encode("utf-8")).decode("ascii") if value else ""


def _decrypt(value: str) -> str:
    if not value:
        return ""
    try:
        return _cipher().decrypt(value.encode("ascii")).decode("utf-8")
    except (InvalidToken, UnicodeError) as error:
        raise HTTPException(401, "Không thể giải mã kết nối Google Drive. Hãy kết nối lại.") from error


def _oauth_config() -> tuple[str, str]:
    settings = get_settings()
    if not settings.google_oauth_client_id or not settings.google_oauth_client_secret:
        raise HTTPException(503, "Cần cấu hình Google OAuth client ID và secret.")
    return settings.google_oauth_client_id, settings.google_oauth_client_secret


def _redirect_uri(value: str | None) -> str:
    candidate = (value or "").strip()
    parsed = urlparse(candidate)
    origin = f"{parsed.scheme}://{parsed.netloc}" if parsed.scheme and parsed.netloc else ""
    if not candidate or origin not in get_settings().google_drive_allowed_origins:
        raise HTTPException(400, "Redirect URI Google Drive chưa được cho phép.")
    return candidate


def create_oauth_url(user: dict[str, Any], redirect_uri: str | None) -> dict[str, Any]:
    client_id, _ = _oauth_config()
    redirect = _redirect_uri(redirect_uri)
    state = secrets.token_urlsafe(32)
    verifier = secrets.token_urlsafe(48)
    challenge = base64.urlsafe_b64encode(hashlib.sha256(verifier.encode()).digest()).rstrip(b"=").decode()
    now = int(time.time() * 1000)
    with get_db() as conn:
        conn.execute("DELETE FROM googleDriveOAuthStates WHERE expiresAt <= ?", (now,))
        conn.execute(
            "INSERT INTO googleDriveOAuthStates(state,uid,redirectUri,expiresAt,createdAt,codeVerifier) VALUES(?,?,?,?,?,?)",
            (state, str(user["uid"]), redirect, now + 600_000, now, verifier),
        )
    query = urlencode({
        "client_id": client_id,
        "redirect_uri": redirect,
        "response_type": "code",
        "scope": " ".join(DRIVE_SCOPES),
        "access_type": "offline",
        "include_granted_scopes": "true",
        "prompt": "consent",
        "state": state,
        "code_challenge": challenge,
        "code_challenge_method": "S256",
    })
    return {"authUrl": f"{AUTH_URL}?{query}", "state": state, "redirectUri": redirect, "scopes": DRIVE_SCOPES}


def _consume_state(user: dict[str, Any], state: str, redirect_uri: str) -> str:
    now = int(time.time() * 1000)
    with get_db() as conn:
        row = conn.execute(
            "SELECT uid,redirectUri,expiresAt,codeVerifier FROM googleDriveOAuthStates WHERE state=?",
            (state,),
        ).fetchone()
        if row is None:
            raise HTTPException(400, "OAuth state không tồn tại hoặc đã được sử dụng.")
        conn.execute("DELETE FROM googleDriveOAuthStates WHERE state=?", (state,))
    if row[0] != str(user["uid"]) or row[1] != redirect_uri or int(row[2]) <= now:
        raise HTTPException(400, "OAuth state không hợp lệ, đã hết hạn hoặc không thuộc phiên này.")
    return str(row[3])


def _request_json(method: str, url: str, **kwargs: Any) -> dict[str, Any]:
    try:
        response = httpx.request(method, url, timeout=30, **kwargs)
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise ValueError("Unexpected Google response")
        return payload
    except (httpx.HTTPError, ValueError) as error:
        raise HTTPException(502, "Google Drive chưa xử lý được yêu cầu.") from error


def _save_connection(user: dict[str, Any], token_data: dict[str, Any], profile: dict[str, Any]) -> dict[str, Any]:
    now = int(time.time() * 1000)
    uid = str(user["uid"])
    with get_db() as conn:
        old = conn.execute(
            "SELECT refreshTokenEncrypted,createdAt FROM googleDriveConnections WHERE uid=?", (uid,)
        ).fetchone()
        refresh_token = str(token_data.get("refresh_token") or "")
        if not refresh_token and old:
            refresh_token = _decrypt(str(old[0] or ""))
        scopes = token_data.get("scope", "")
        scope_list = scopes if isinstance(scopes, list) else str(scopes).split()
        conn.execute(
            "INSERT INTO googleDriveConnections(id,uid,email,displayName,photoUrl,driveUserId,scopes,accessTokenEncrypted,refreshTokenEncrypted,expiresAt,createdAt,updatedAt) "
            "VALUES(?,?,?,?,?,?,?,?,?,?,?,?) ON CONFLICT(uid) DO UPDATE SET email=excluded.email,displayName=excluded.displayName,photoUrl=excluded.photoUrl,driveUserId=excluded.driveUserId,scopes=excluded.scopes,accessTokenEncrypted=excluded.accessTokenEncrypted,refreshTokenEncrypted=excluded.refreshTokenEncrypted,expiresAt=excluded.expiresAt,updatedAt=excluded.updatedAt",
            (uid, uid, str(profile.get("email") or ""), str(profile.get("name") or ""), str(profile.get("picture") or ""), str(profile.get("sub") or ""), json.dumps(scope_list), _encrypt(str(token_data.get("access_token") or "")), _encrypt(refresh_token), now + max(1, int(token_data.get("expires_in") or 3600)) * 1000, old[1] if old else now, now),
        )
    return get_connection_status(user)


def exchange_code(user: dict[str, Any], code: str, state: str, redirect_uri: str | None) -> dict[str, Any]:
    client_id, client_secret = _oauth_config()
    redirect = _redirect_uri(redirect_uri)
    verifier = _consume_state(user, state, redirect)
    token_data = _request_json("POST", TOKEN_URL, data={
        "code": code,
        "client_id": client_id,
        "client_secret": client_secret,
        "redirect_uri": redirect,
        "grant_type": "authorization_code",
        "code_verifier": verifier,
    })
    access_token = str(token_data.get("access_token") or "")
    if not access_token:
        raise HTTPException(502, "Google không trả về access token.")
    profile = _request_json("GET", USERINFO_URL, headers={"Authorization": f"Bearer {access_token}"})
    if profile.get("email_verified") is not True:
        raise HTTPException(403, "Tài khoản Google Drive chưa xác minh email.")
    return _save_connection(user, token_data, profile)


def get_connection_status(user: dict[str, Any]) -> dict[str, Any]:
    with get_db() as conn:
        row = conn.execute("SELECT email,displayName,photoUrl,driveUserId,scopes,expiresAt,createdAt,updatedAt FROM googleDriveConnections WHERE uid=?", (str(user["uid"]),)).fetchone()
    if not row:
        return {"connected": False, "scopes": []}
    return {"connected": True, "email": row[0], "displayName": row[1], "photoUrl": row[2], "driveUserId": row[3], "scopes": json.loads(row[4] or "[]"), "expiresAt": row[5], "connectedAt": row[6], "updatedAt": row[7]}


def disconnect(user: dict[str, Any]) -> bool:
    with get_db() as conn:
        cursor = conn.execute("DELETE FROM googleDriveConnections WHERE uid=?", (str(user["uid"]),))
        return cursor.rowcount > 0


def _connection(user: dict[str, Any]) -> dict[str, Any]:
    with get_db() as conn:
        row = conn.execute("SELECT accessTokenEncrypted,refreshTokenEncrypted,expiresAt FROM googleDriveConnections WHERE uid=?", (str(user["uid"]),)).fetchone()
    if not row:
        raise HTTPException(400, "Tài khoản chưa kết nối Google Drive.")
    access_token, refresh_token, expires_at = _decrypt(row[0]), _decrypt(row[1]), int(row[2] or 0)
    if access_token and expires_at > int(time.time() * 1000) + 60_000:
        return {"access_token": access_token}
    if not refresh_token:
        raise HTTPException(401, "Kết nối Google Drive đã hết hạn. Hãy kết nối lại.")
    client_id, client_secret = _oauth_config()
    token_data = _request_json("POST", TOKEN_URL, data={"client_id": client_id, "client_secret": client_secret, "refresh_token": refresh_token, "grant_type": "refresh_token"})
    token_data["refresh_token"] = refresh_token
    profile = {"email": get_connection_status(user).get("email"), "name": get_connection_status(user).get("displayName"), "sub": get_connection_status(user).get("driveUserId")}
    _save_connection(user, token_data, profile)
    return {"access_token": str(token_data.get("access_token") or "")}


def list_files(user: dict[str, Any], *, search: str | None = None, folder_id: str | None = None, mime_types: str | None = None, page_size: int = 30, page_token: str | None = None) -> dict[str, Any]:
    token = _connection(user)["access_token"]
    terms = ["trashed = false"]
    escape = lambda value: value.replace("\\", "\\\\").replace("'", "\\'")
    if folder_id:
        terms.append(f"'{escape(folder_id)}' in parents")
    if search:
        terms.append(f"name contains '{escape(search[:200])}'")
    mime_values = sorted({item.strip() for item in (mime_types or "").split(",") if item.strip()})
    if mime_values:
        accepted = ["application/vnd.google-apps.folder", *mime_values]
        terms.append("(" + " or ".join(f"mimeType = '{escape(item)}'" for item in accepted) + ")")
    query = urlencode({"pageSize": min(max(int(page_size), 1), 100), "pageToken": page_token or "", "spaces": "drive", "supportsAllDrives": "true", "includeItemsFromAllDrives": "true", "orderBy": "folder,name_natural", "fields": "nextPageToken,files(id,name,mimeType,size,modifiedTime,iconLink,webViewLink,parents,owners(displayName,emailAddress))", "q": " and ".join(terms)})
    payload = _request_json("GET", f"{DRIVE_URL}/files?{query}", headers={"Authorization": f"Bearer {token}"})
    files = []
    for item in payload.get("files", []):
        try:
            size = int(item["size"]) if item.get("size") else None
        except (ValueError, TypeError):
            size = None
        files.append({"id": str(item.get("id") or ""), "name": str(item.get("name") or ""), "mimeType": str(item.get("mimeType") or ""), "size": size, "modifiedTime": item.get("modifiedTime"), "iconLink": item.get("iconLink"), "webViewLink": item.get("webViewLink"), "parents": item.get("parents") or [], "owners": item.get("owners") or [], "isGoogleWorkspaceFile": str(item.get("mimeType") or "").startswith("application/vnd.google-apps.")})
    return {"files": files, "nextPageToken": payload.get("nextPageToken")}


def import_file(user: dict[str, Any], payload: dict[str, Any]) -> dict[str, Any]:
    file_id = str(payload.get("fileId") or "").strip()
    if not file_id:
        raise HTTPException(422, "Thiếu fileId Google Drive.")
    if payload.get("forceOcr"):
        raise HTTPException(422, "OCR chưa được cấu hình trong Local_AI_Server; hãy dùng CV có thể trích xuất văn bản.")
    token = _connection(user)["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    fields = urlencode({"supportsAllDrives": "true", "fields": "id,name,mimeType,size"})
    metadata = _request_json("GET", f"{DRIVE_URL}/files/{quote(file_id, safe='')}?{fields}", headers=headers)
    source_mime = str(metadata.get("mimeType") or "")
    filename = str(metadata.get("name") or file_id)
    if int(metadata.get("size") or 0) > MAX_FILE_BYTES:
        raise HTTPException(413, "Tệp Drive vượt giới hạn 15 MB.")
    export = WORKSPACE_EXPORTS.get(source_mime)
    if source_mime.startswith("application/vnd.google-apps."):
        if not export:
            raise HTTPException(415, f"Chưa hỗ trợ loại tệp Google Workspace: {source_mime}")
        target_mime, extension = export
        if not filename.lower().endswith(extension):
            filename = f"{Path(filename).stem}{extension}"
        url = f"{DRIVE_URL}/files/{quote(file_id, safe='')}/export?{urlencode({'mimeType': target_mime})}"
        content_type = target_mime
    else:
        url = f"{DRIVE_URL}/files/{quote(file_id, safe='')}?alt=media&supportsAllDrives=true"
        content_type = source_mime or mimetypes.guess_type(filename)[0] or "application/octet-stream"
    try:
        response = httpx.get(url, headers=headers, timeout=60)
        response.raise_for_status()
        file_bytes = response.content
    except httpx.HTTPError as error:
        raise HTTPException(502, "Không tải được tệp từ Google Drive.") from error
    if len(file_bytes) > MAX_FILE_BYTES:
        raise HTTPException(413, "Tệp Drive vượt giới hạn 15 MB.")
    text = extract_text_from_file_bytes(file_bytes, filename, content_type)
    record_id = None
    if payload.get("persistUploadedFile", True):
        record_id = FileRepository.save_file_extraction(filename, text, content_type, len(file_bytes), str(payload.get("fileType") or "cv"), str(user["uid"]))
    return {"fileId": file_id, "fileName": filename, "mimeType": content_type, "fileSize": len(file_bytes), "extractedText": text, "extractedTextLength": len(text), "savedUploadedFileId": record_id, "driveFileId": file_id}
