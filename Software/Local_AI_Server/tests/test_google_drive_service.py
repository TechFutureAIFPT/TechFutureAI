from __future__ import annotations

from urllib.parse import parse_qs, urlparse
from pathlib import Path

import pytest
from cryptography.fernet import Fernet
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db import database
from app.services import google_drive_service as drive


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    settings = get_settings()
    settings.db_path = tmp_path / "drive-test.db"
    monkeypatch.setattr(database, "get_settings", lambda: settings)
    database.init_database()
    return TestClient(__import__("app.main", fromlist=["app"]).app, base_url="http://localhost:8088")


def test_drive_oauth_state_is_pkce_bound_and_one_time(client, monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "google_oauth_client_id", "client-id")
    monkeypatch.setattr(settings, "google_oauth_client_secret", "client-secret")
    monkeypatch.setattr(settings, "google_drive_token_encryption_key", Fernet.generate_key().decode())
    monkeypatch.setattr(settings, "google_drive_allowed_origins", ["http://localhost:3000"])
    user = {"uid": "local-recruiter-001", "email": "recruiter@local.supporthr.vn"}
    oauth = drive.create_oauth_url(user, "http://localhost:3000/google-drive/callback")
    query = parse_qs(urlparse(oauth["authUrl"]).query)
    assert query["code_challenge_method"] == ["S256"]
    assert query["code_challenge"]
    assert oauth["state"] == query["state"][0]

    calls = []
    def provider(method, url, **kwargs):
        calls.append((method, url))
        if url == drive.TOKEN_URL:
            assert kwargs["data"]["code_verifier"]
            return {"access_token": "access-secret", "refresh_token": "refresh-secret", "expires_in": 3600, "scope": "openid email https://www.googleapis.com/auth/drive.readonly"}
        return {"email": "drive@example.test", "email_verified": True, "name": "Drive User", "sub": "drive-user"}
    monkeypatch.setattr(drive, "_request_json", provider)
    status = drive.exchange_code(user, "oauth-code", oauth["state"], oauth["redirectUri"])
    assert status["connected"] is True
    assert status["email"] == "drive@example.test"
    assert "access-secret" not in str(status)
    assert len(calls) == 2

    with database.get_db() as conn:
        saved = conn.execute("SELECT accessTokenEncrypted,refreshTokenEncrypted FROM googleDriveConnections WHERE uid=?", (user["uid"],)).fetchone()
    assert "access-secret" not in saved[0]
    assert "refresh-secret" not in saved[1]
    with pytest.raises(Exception):
        drive.exchange_code(user, "oauth-code", oauth["state"], oauth["redirectUri"])


def test_drive_status_and_disconnect_use_sqlite(client):
    user = {"uid": "local-recruiter-001"}
    assert drive.get_connection_status(user) == {"connected": False, "scopes": []}
    assert drive.disconnect(user) is False
