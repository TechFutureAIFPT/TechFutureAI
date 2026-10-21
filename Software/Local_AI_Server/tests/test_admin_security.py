from __future__ import annotations

import json
import time
from pathlib import Path

import pytest
from fastapi.testclient import TestClient

from app.api.routes import admin_routes
from app.config import get_settings
from app.db import database
from app.db.database import init_database
from app.main import app
from app.services import admin_auth_service as auth


@pytest.fixture
def client(tmp_path: Path, monkeypatch: pytest.MonkeyPatch) -> TestClient:
    settings = get_settings()
    settings.db_path = tmp_path / "local-test.db"
    monkeypatch.setattr(database, "get_settings", lambda: settings)
    init_database()
    return TestClient(app, base_url="http://localhost:8088")


def issue_local_session(email: str = "hoanphuc135@gmail.com") -> str:
    token = "test-session-token"
    now = int(time.time())
    claims = {"uid": "google-user-1", "email": email, "email_verified": True, "name": "Test Admin"}
    with database.get_db() as conn:
        conn.execute(
            "INSERT INTO local_admin_sessions(token_hash, claims_json, expires_at, created_at) VALUES(?,?,?,?)",
            (auth._digest(token), json.dumps(claims), now + 3600, now),
        )
    return token


@pytest.mark.parametrize(
    "path",
    ["/api/database/stats", "/api/database/tables", "/api/database/history", "/api/admin/session"],
)
def test_anonymous_cannot_read_admin_data(client: TestClient, path: str) -> None:
    response = client.get(path)
    assert response.status_code == 401
    assert response.json()["success"] is False
    assert response.headers["cache-control"] == "no-store, private"


def test_dashboard_redirects_anonymous_user_and_login_is_local_google_flow(client: TestClient) -> None:
    dashboard = client.get("/dashboard", follow_redirects=False)
    assert dashboard.status_code == 303
    assert dashboard.headers["location"] == "/admin/login"
    login = client.get("/admin/login")
    assert login.status_code == 200
    assert "google-login" in login.text
    assert "firebase" not in login.text.casefold()


def test_verified_allowlisted_google_session_can_open_studio(client: TestClient) -> None:
    client.cookies.set(auth.SESSION_COOKIE, issue_local_session())
    session = client.get("/api/admin/session")
    assert session.status_code == 200
    assert session.json()["data"]["email"] == "hoanphuc135@gmail.com"
    dashboard = client.get("/dashboard")
    assert dashboard.status_code == 200
    assert "Database Studio" in dashboard.text
    assert "__ADMIN_CONFIG__" not in dashboard.text
    assert dashboard.headers["x-frame-options"] == "DENY"


def test_non_admin_email_cannot_use_a_stored_session(client: TestClient) -> None:
    client.cookies.set(auth.SESSION_COOKIE, issue_local_session("other@example.test"))
    assert client.get("/api/database/tables").status_code == 403


def test_expired_or_revoked_session_is_rejected(client: TestClient) -> None:
    token = issue_local_session()
    client.cookies.set(auth.SESSION_COOKIE, token)
    auth.revoke_session(token)
    assert client.get("/api/admin/session").status_code == 401


def test_api_rejects_cloud_sync_routes_and_does_not_expose_firebase(client: TestClient) -> None:
    assert client.post("/api/database/sync-firebase").status_code == 404
    assert client.get("/api/database/firebase-tables").status_code == 404
    assert "firebase" not in client.get("/openapi.json").text.casefold()


def test_logout_requires_origin_and_matching_csrf_token(client: TestClient) -> None:
    client.cookies.set(auth.SESSION_COOKIE, issue_local_session())
    client.cookies.set(auth.CSRF_COOKIE, "csrf-token")
    denied = client.delete(
        "/api/admin/session",
        headers={"Origin": "https://attacker.invalid", "X-CSRF-Token": "csrf-token"},
    )
    assert denied.status_code == 403
    allowed = client.delete(
        "/api/admin/session",
        headers={"Origin": "http://localhost:8088", "X-CSRF-Token": "csrf-token"},
    )
    assert allowed.status_code == 200
    assert client.get("/api/admin/session").status_code == 401


def test_oauth_start_requires_csrf_and_server_credentials(client: TestClient) -> None:
    denied = client.post("/api/admin/google/start", json={"origin": "http://localhost:8088"})
    assert denied.status_code == 403
    client.cookies.set(auth.CSRF_COOKIE, "csrf-token")
    response = client.post(
        "/api/admin/google/start",
        json={"origin": "http://localhost:8088"},
        headers={"Origin": "http://localhost:8088", "X-CSRF-Token": "csrf-token"},
    )
    assert response.status_code == 503
    assert "OAuth" in response.json()["error"]["message"]


def test_runtime_dependency_does_not_include_firebase_or_gemini() -> None:
    requirements = Path(__file__).parents[1].joinpath("requirements.txt").read_text(encoding="utf-8").casefold()
    assert "firebase-admin" not in requirements
    assert "google-generativeai" not in requirements
