from __future__ import annotations

from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.config import get_settings
from app.db import database
from app.main import app
from app.services import local_auth_service as auth


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    settings = get_settings()
    settings.db_path = tmp_path / "auth-test.db"
    monkeypatch.setattr(database, "get_settings", lambda: settings)
    database.init_database()
    return TestClient(app, base_url="http://localhost:8088")


def test_sql_register_login_session_and_logout(client: TestClient) -> None:
    registered = client.post("/api/auth/register", json={
        "email": "Recruiter@Example.test", "password": "secure-passphrase-123", "displayName": "Recruiter",
    })
    assert registered.status_code == 200
    user = registered.json()["data"]["user"]
    assert user["email"] == "recruiter@example.test"
    assert user["provider"] == "password"
    assert registered.cookies.get(auth.SESSION_COOKIE)

    session = client.get("/api/auth/session")
    assert session.status_code == 200
    assert session.json()["data"]["user"]["uid"] == user["uid"]
    assert client.post("/api/auth/login", json={"email": "RECRUITER@example.test", "password": "secure-passphrase-123"}).status_code == 200
    assert client.post("/api/auth/login", json={"email": "recruiter@example.test", "password": "wrong-password"}).status_code == 401

    token = client.cookies.get(auth.SESSION_COOKIE)
    signed_out = client.post("/api/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert signed_out.status_code == 200
    client.cookies.delete(auth.SESSION_COOKIE)
    assert client.get("/api/auth/session").status_code == 401


def test_google_login_origin_is_validated_and_requires_oauth_configuration(client: TestClient, monkeypatch: pytest.MonkeyPatch) -> None:
    settings = get_settings()
    monkeypatch.setattr(settings, "google_drive_allowed_origins", ["http://localhost:3000"])
    monkeypatch.setattr(settings, "google_oauth_client_id", "")
    monkeypatch.setattr(settings, "google_oauth_client_secret", "")
    denied = client.post("/api/auth/google/start", json={"origin": "https://attacker.invalid"}, headers={"Origin": "https://attacker.invalid"})
    assert denied.status_code == 400
    response = client.post("/api/auth/google/start", json={"origin": "http://localhost:3000"}, headers={"Origin": "http://localhost:3000"})
    assert response.status_code == 503


def test_credentials_and_sessions_are_stored_in_sqlite(client: TestClient) -> None:
    assert client.post("/api/auth/register", json={"email": "a@example.test", "password": "short"}).status_code == 422
    response = client.post("/api/auth/register", json={"email": "a@example.test", "password": "long-enough-password"})
    assert response.status_code == 200
    with database.get_db() as conn:
        credential = conn.execute("SELECT password_hash FROM local_auth_credentials WHERE email=?", ("a@example.test",)).fetchone()
        session_count = conn.execute("SELECT COUNT(*) FROM local_auth_sessions").fetchone()[0]
    assert credential is not None and "long-enough-password" not in credential[0]
    assert session_count == 1
