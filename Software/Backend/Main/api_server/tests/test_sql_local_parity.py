from __future__ import annotations

import ast
import json
from datetime import datetime, timezone
from pathlib import Path

import httpx
import pytest
from fastapi.testclient import TestClient

from app.core.config import get_settings
from app.integrations import sqlite_documents
from app.services import sql_auth_service
from app.services.account import google_drive_service


@pytest.fixture
def sql_runtime(monkeypatch, tmp_path):
    settings = get_settings()
    for key, value in {
        "data_provider": "sqlite", "auth_provider": "sql", "ai_provider": "ollama",
        "sqlite_path": str(tmp_path / "local.db"), "firebase_appcheck_enforce": False,
        "google_oauth_client_id": "synthetic-client", "google_oauth_client_secret": "synthetic-secret",
        "google_drive_allowed_origins": ["http://localhost:3010"],
        "local_auth_redirect_uri": "http://localhost:8010/api/auth/google/callback",
        "redis_url": "", "redis_internal_url": "",
        "analysis_job_mode": "in_process",
    }.items(): monkeypatch.setattr(settings, key, value)
    # Verify the adapter against the actual existing SQL schema, not just empty SQL.
    import sqlite3
    schema_file = Path(__file__).resolve().parents[4] / "Local_AI_Server/app/db/firebase_schema.py"
    schema = next(ast.literal_eval(node.value) for node in ast.parse(schema_file.read_text(encoding="utf-8")).body if isinstance(node, ast.Assign) and any(isinstance(target, ast.Name) and target.id == "FIREBASE_COLLECTIONS_DDL" for target in node.targets))
    with sqlite3.connect(settings.sqlite_path) as conn: conn.executescript(schema)
    client = sqlite_documents.get_sqlite_client()
    from app import main
    monkeypatch.setattr(main, "settings", settings)
    monkeypatch.setattr(main, "verify_runtime_artifacts", lambda: None)
    monkeypatch.setattr(main, "apply_request_rate_limits", lambda request: None)
    with TestClient(main.api_app) as api:
        yield client, api, settings


def signup(api, email="tester@example.test"):
    response = api.post("/api/auth/register", json={"email": email, "password": "Synthetic-password-123", "displayName": "Synthetic HR"})
    assert response.status_code == 200, response.text
    return response.json()["data"]


def test_sql_account_routes_store_and_isolate_real_records(sql_runtime):
    store, api, _ = sql_runtime
    session = signup(api)
    headers = {"Authorization": "Bearer " + session["accessToken"]}
    result = api.put("/api/account/profile", json={"recruiterCompany": "Synthetic company"}, headers=headers)
    assert result.status_code == 200, result.text
    payload = store.collection("users").document(session["user"]["uid"]).get().to_dict()
    assert payload["recruiterInfo"]["company"] == "Synthetic company"
    with store.connection() as conn:
        assert conn.execute("SELECT COUNT(*) FROM users WHERE uid=?", (session["user"]["uid"],)).fetchone()[0] == 1
    other = signup(api, "other@example.test")
    response = api.get("/api/account/profile", headers={"Authorization": "Bearer " + other["accessToken"]})
    assert response.status_code == 200
    assert "Synthetic company" not in response.text
    assert api.get("/api/account/profile", headers={"Authorization": "Bearer forged"}).status_code == 401
    api.post("/api/auth/logout", headers=headers)
    assert api.get("/api/account/profile", headers=headers).status_code == 401


def test_sql_drive_exchange_refresh_and_disconnect_preserve_contract(sql_runtime, monkeypatch):
    store, api, _ = sql_runtime
    session = signup(api)
    headers = {"Authorization": "Bearer " + session["accessToken"]}
    redirect = "http://localhost:3010/google-drive/callback"
    response = api.post("/api/account/google-drive/oauth-url", json={"redirectUri": redirect}, headers=headers)
    assert response.status_code == 200, response.text
    state = response.json()["state"]

    def google(url, **kwargs):
        if url == google_drive_service.GOOGLE_TOKEN_URL:
            return {"access_token": "synthetic-private-access", "refresh_token": "synthetic-private-refresh", "expires_in": 3600, "scope": "openid email profile https://www.googleapis.com/auth/drive.readonly"}
        if url == google_drive_service.GOOGLE_USERINFO_URL:
            return {"sub": "synthetic-google-sub", "email": "tester@example.test", "name": "Synthetic HR"}
        return {"files": [], "nextPageToken": None}

    monkeypatch.setattr(google_drive_service, "_request_json", google)
    exchange = {"code": "synthetic-code", "state": state, "redirectUri": redirect}
    result = api.post("/api/account/google-drive/exchange-code", json=exchange, headers=headers)
    assert result.status_code == 200, result.text
    assert result.json()["connected"] is True
    assert "synthetic-private" not in result.text
    assert api.post("/api/account/google-drive/exchange-code", json=exchange, headers=headers).status_code == 400
    with store.connection() as conn:
        raw = conn.execute("SELECT payload FROM application_documents WHERE collection='googleDriveConnections'").fetchone()[0]
        mirror = conn.execute("SELECT source_payload FROM googleDriveConnections").fetchone()[0]
        assert "synthetic-private-access" not in raw + mirror
        typed_tokens = conn.execute("SELECT accessTokenEncrypted,refreshTokenEncrypted FROM googleDriveConnections").fetchone()
        assert store.cipher.decrypt(typed_tokens[0].encode()).decode() == "synthetic-private-access"
        assert store.cipher.decrypt(typed_tokens[1].encode()).decode() == "synthetic-private-refresh"
    assert store.collection("googleDriveConnections").document(session["user"]["uid"]).get().to_dict()["accessToken"] == "synthetic-private-access"
    assert api.get("/api/account/google-drive/files", headers=headers).status_code == 200
    assert api.delete("/api/account/google-drive/connection", headers=headers).status_code == 200
    assert api.get("/api/account/google-drive/status", headers=headers).json()["connected"] is False


def test_sql_oauth_requires_browser_state_nonce_and_verified_google_identity(sql_runtime, monkeypatch):
    store, api, settings = sql_runtime
    started = api.post("/api/auth/google/start", json={"origin": "http://localhost:3010"})
    assert started.status_code == 200, started.text
    state = api.cookies.get(sql_auth_service.OAUTH_COOKIE)
    record = store.collection("localLoginOAuthStates").document(sql_auth_service._digest(state)).get().to_dict()
    monkeypatch.setattr(sql_auth_service.httpx, "post", lambda *args, **kwargs: httpx.Response(200, json={"id_token": "synthetic-id-token"}, request=httpx.Request("POST", "https://oauth2.googleapis.com/token")))
    monkeypatch.setattr(sql_auth_service, "verify_google_id_token", lambda *args: {"sub": "synthetic-sub", "email": "verified@example.test", "email_verified": True, "nonce": record["nonce"]})
    assert api.get("/api/auth/google/callback", params={"state": "forged", "code": "x"}).status_code == 400
    result = api.get("/api/auth/google/callback", params={"state": state, "code": "synthetic-code"})
    assert result.status_code == 200, result.text
    session = api.get("/api/auth/session")
    assert session.json()["data"]["user"]["emailVerified"] is True
    assert session.json()["data"]["user"]["uid"] == "google:synthetic-sub"
    assert session.headers["cache-control"] == "no-store"
    assert api.get("/api/auth/google/callback", params={"state": state, "code": "replay"}).status_code == 400


def test_local_profile_blocks_cross_site_mutations(sql_runtime):
    _, api, _ = sql_runtime
    result = api.post("/api/auth/register", json={"email": "x@example.test", "password": "Synthetic-password-123"}, headers={"Origin": "https://attacker.invalid"})
    assert result.status_code == 403


def test_sql_merge_timestamp_and_literal_ids_are_safe(sql_runtime):
    store, _, _ = sql_runtime
    doc = store.collection("test").document("id' OR 1=1 --")
    doc.set({"uid": "owner", "nested": {"one": 1}, "timestamp": datetime.now(timezone.utc)})
    doc.set({"nested": {"two": 2}}, merge=True)
    assert doc.get().to_dict()["nested"] == {"one": 1, "two": 2}
    assert len(store.collection("test").where("uid", "==", "' OR 1=1 --").get()) == 0
    doc.delete()
    assert not doc.get().exists


def test_drive_wrong_owner_cannot_consume_state_and_refresh_is_persistent(sql_runtime, monkeypatch):
    store, api, _ = sql_runtime
    owner = signup(api)
    own_headers = {"Authorization": "Bearer " + owner["accessToken"]}
    redirect = "http://localhost:3010/google-drive/callback"
    started = api.post("/api/account/google-drive/oauth-url", json={"redirectUri": redirect}, headers=own_headers).json()
    assert "code_challenge_method=S256" in started["authUrl"]
    other = signup(api, "second@example.test")
    other_headers = {"Authorization": "Bearer " + other["accessToken"]}
    payload = {"code": "synthetic", "state": started["state"], "redirectUri": redirect}
    assert api.post("/api/account/google-drive/exchange-code", json=payload, headers=other_headers).status_code == 400
    assert store.collection("googleDriveOAuthStates").document(started["state"]).get().exists
    connection = store.collection("googleDriveConnections").document(owner["user"]["uid"])
    connection.set({"uid": owner["user"]["uid"], "accessToken": "expired", "refreshToken": "private-refresh", "expiresAt": 1})
    calls = []
    def google(url, **kwargs):
        calls.append((url, kwargs))
        if url == google_drive_service.GOOGLE_TOKEN_URL:
            assert kwargs["form_data"]["grant_type"] == "refresh_token"
            return {"access_token": "private-renewed", "expires_in": 3600}
        assert kwargs["headers"]["Authorization"] == "Bearer private-renewed"
        return {"files": []}
    monkeypatch.setattr(google_drive_service, "_request_json", google)
    assert api.get("/api/account/google-drive/files", headers=own_headers).status_code == 200
    assert connection.get().to_dict()["accessToken"] == "private-renewed"
    assert len(calls) == 2


def test_sql_shared_business_routes_and_cursor_pages(sql_runtime):
    store, api, _ = sql_runtime
    user = signup(api)
    headers = {"Authorization": "Bearer " + user["accessToken"]}
    requests = [
        ("/api/account/jd-templates", {"name": "Synthetic JD", "category": "Engineering", "jdText": "Python SQL", "jobPosition": "Engineer"}),
        ("/api/account/uploaded-files", {"fileName": "synthetic.txt", "fileType": "cv", "fileSize": 35, "mimeType": "text/plain", "ocrMethod": "plain_text", "extractedText": "Built Python services with SQL."}),
        ("/api/account/chatbot/sessions", {"jobPosition": "Engineer", "totalCandidates": 0}),
        ("/api/account/history", {"jobPosition": "Engineer", "jdText": "Python SQL", "candidates": []}),
    ]
    for path, payload in requests:
        response = api.post(path, json=payload, headers=headers)
        assert response.status_code == 200, (path, response.text)
    for path in ("jd-templates", "uploaded-files", "chatbot/sessions", "history", "sync/stats"):
        response = api.get("/api/account/" + path, headers=headers)
        assert response.status_code == 200, (path, response.text)
    for path in ("jd-templates/page", "uploaded-files/page", "history/page"):
        response = api.get("/api/account/" + path, headers=headers)
        assert response.status_code == 200, (path, response.text)
        assert response.json()["items"]
    with store.connection() as conn:
        for table in ("userJDTemplates", "uploadedFiles", "chatbotSessions", "cvHistory"):
            assert conn.execute(f'SELECT COUNT(*) FROM "{table}" WHERE uid=?', (user["user"]["uid"],)).fetchone()[0] > 0, table


def test_sql_vectors_enforce_approval_embedding_version_and_dimensions(sql_runtime):
    store, _, _ = sql_runtime
    from app.repositories.firestore.vector_repository import find_nearest_approved_exemplars
    common = {"status": "approved", "approved": True, "rubricVersion": "r1", "vectorIndexVersion": "local-v1"}
    for name, extras in {"same": {"embedding": [1.0, 0.0]}, "orthogonal": {"embedding": [0.0, 1.0]}, "wrong-version": {"embedding": [1.0, 0.0], "vectorIndexVersion": "cloud-v1"}, "unapproved": {"embedding": [1.0, 0.0], "approved": False}, "dimension": {"embedding": [1.0]}}.items():
        store.collection("testVectors").document(name).set({**common, **extras})
    result = find_nearest_approved_exemplars(collection_name="testVectors", query_vector=[1.0, 0.0], rubric_version="r1", vector_index_version="local-v1", limit=5, similarity_threshold=0.5)
    assert [row["_id"] for row in result] == ["same"]
    assert result[0]["similarity"] == 1.0


def test_drive_import_extracts_real_document_and_persists_sql(sql_runtime, monkeypatch):
    store, api, _ = sql_runtime
    user = signup(api)
    headers = {"Authorization": "Bearer " + user["accessToken"]}
    text = "Synthetic CV. Built Python API and SQL tests."
    monkeypatch.setattr(google_drive_service, "_download_file_bytes", lambda *args: (text.encode(), "synthetic-drive.txt", "text/plain", {"id": "synthetic-file", "name": "synthetic-drive.txt", "mimeType": "text/plain"}))
    result = api.post("/api/account/google-drive/import", json={"fileId": "synthetic-file"}, headers=headers)
    assert result.status_code == 200, result.text
    payload = result.json()
    assert payload["extractedText"] == text
    saved = store.collection("uploadedFiles").document(payload["savedUploadedFileId"]).get().to_dict()
    assert saved["uid"] == user["user"]["uid"] and saved["extractedText"] == text


def test_existing_exemplar_alias_migration_runs_once_without_resurrecting_deleted_data(tmp_path):
    import sqlite3
    import json
    path = tmp_path / "previous-local.db"
    with sqlite3.connect(path) as conn:
        conn.execute("CREATE TABLE application_documents(collection TEXT,document_id TEXT,uid TEXT,payload TEXT,PRIMARY KEY(collection,document_id))")
        conn.execute("INSERT INTO application_documents VALUES(?,?,?,?)", ("public.approved_exemplars", "sample", "", json.dumps({"text": "Synthetic approved example"})))
    first = sqlite_documents.SQLiteClient(str(path))
    assert first.collection("approvedExemplars").document("sample").get().exists
    assert list((tmp_path / "backups").glob("before-exemplar-alias-*.db"))
    first.collection("approvedExemplars").document("sample").delete()
    reopened = sqlite_documents.SQLiteClient(str(path))
    assert not reopened.collection("approvedExemplars").document("sample").get().exists


def test_sql_uploaded_file_vector_projection_keeps_blob_and_owner(sql_runtime, monkeypatch):
    store, api, settings = sql_runtime
    from app.services import vector_index_service
    import struct
    monkeypatch.setattr(settings, "vector_store_collection", "vectorLibraryRecords")
    monkeypatch.setattr(vector_index_service, "embed_text", lambda *args, **kwargs: [1.0, 0.0] * 384)
    user = signup(api)
    headers = {"Authorization": "Bearer " + user["accessToken"]}
    response = api.post("/api/account/uploaded-files", headers=headers, json={"fileName": "python-engineer.txt", "fileType": "cv", "fileSize": 180, "mimeType": "text/plain", "ocrMethod": "text", "extractedText": "Built Python backend API services using SQL and maintained automated tests for inventory processing. " * 3})
    assert response.status_code == 200, response.text
    file_id = response.json()["id"]
    uploaded = store.collection("uploadedFiles").document(file_id).get().to_dict()
    assert uploaded["vectorStatus"] == "ready", uploaded.get("vectorError")
    vector = store.collection("vectorLibraryRecords").document("uploaded-file-" + file_id).get().to_dict()
    assert vector["metadata"]["ownerUid"] == user["user"]["uid"]
    with store.connection() as conn:
        row = conn.execute("SELECT collectionName,embeddingBlob FROM vectorLibraryRecords WHERE id=?", ("uploaded-file-" + file_id,)).fetchone()
        assert row[0] == "it"
        assert struct.unpack("<768f", row[1])[:2] == (1.0, 0.0)


def test_sql_analysis_job_result_survives_memory_cache_and_checks_owner(sql_runtime, monkeypatch):
    import time
    store, api, _ = sql_runtime
    from app.services import analysis_job_service as jobs
    async def inference(*args, **kwargs):
        return {"candidates": [{"candidateName": "Synthetic zero", "totalScore": 0}], "pipeline": {"provider": "synthetic-local"}}
    monkeypatch.setattr(jobs, "run_smart_cv_analysis", inference)
    user = signup(api)
    headers = {"Authorization": "Bearer " + user["accessToken"]}
    created = api.post("/api/analysis/jobs", headers=headers, json={"jd_text": "Python backend", "cv_entries": [{"file_name": "synthetic.txt", "text": "Synthetic local CV"}]})
    assert created.status_code == 202, created.text
    identifier = created.json()["job_id"]
    for _ in range(50):
        result = api.get("/api/analysis/status/" + identifier, headers=headers)
        if result.json().get("status") == "completed": break
        time.sleep(0.01)
    assert result.json()["status"] == "completed", result.text
    snapshot = store.collection("analysisJobs").document(identifier).get().to_dict()
    assert snapshot["uid"] == user["user"]["uid"] and snapshot["result"]["candidates"][0]["totalScore"] == 0
    with jobs._jobs_lock:
        jobs._jobs.pop(identifier, None)
    assert api.get("/api/analysis/status/" + identifier, headers=headers).json()["status"] == "completed"
    other = signup(api, "another-job-owner@example.test")
    denied = api.get("/api/analysis/status/" + identifier, headers={"Authorization": "Bearer " + other["accessToken"]})
    assert denied.status_code in {403, 404}


def test_drive_stream_download_obeys_local_upload_budget(sql_runtime, monkeypatch):
    import io
    _, _, settings = sql_runtime
    monkeypatch.setattr(settings, "upload_file_size_limit_mb", 1)
    monkeypatch.setattr(google_drive_service.request, "urlopen", lambda *args, **kwargs: io.BytesIO(b"x" * (1024 * 1024 + 20)))
    with pytest.raises(google_drive_service.GoogleDriveValidationError, match="MB"):
        google_drive_service._request_bytes("https://www.googleapis.com/drive/v3/files/synthetic")


def test_sql_reserved_json_tags_remain_untrusted_literal_data(sql_runtime):
    store, _, _ = sql_runtime
    payload = {"ui": {"__local_secret__": "untrusted-literal"}, "source": {"__local_literal__": {"__local_datetime__": "not-a-date"}}, "createdAt": datetime.now(timezone.utc)}
    doc = store.collection("tagRegression").document("synthetic")
    doc.set(payload)
    assert doc.get().to_dict() == payload


@pytest.mark.parametrize("verified_mapping", [False, True])
def test_google_uid_link_requires_verified_subject_mapping(sql_runtime, monkeypatch, verified_mapping):
    store, api, _ = sql_runtime
    with store.connection(write=True) as conn:
        conn.execute("INSERT INTO local_legacy_google_users VALUES(?,?)", ("verified@example.test", "legacy-firebase-uid"))
        if verified_mapping:
            conn.execute("INSERT INTO local_google_identities VALUES(?,?,?)", ("stable-google-sub", "legacy-firebase-uid", "verified@example.test"))
    api.post("/api/auth/google/start", json={"origin": "http://localhost:3010"})
    state = api.cookies.get(sql_auth_service.OAUTH_COOKIE)
    record = store.collection("localLoginOAuthStates").document(sql_auth_service._digest(state)).get().to_dict()
    monkeypatch.setattr(sql_auth_service.httpx, "post", lambda *args, **kwargs: httpx.Response(200, json={"id_token": "synthetic-id"}, request=httpx.Request("POST", "https://oauth2.googleapis.com/token")))
    monkeypatch.setattr(sql_auth_service, "verify_google_id_token", lambda *args: {"sub": "stable-google-sub", "email": "verified@example.test", "email_verified": True, "nonce": record["nonce"]})
    assert api.get("/api/auth/google/callback", params={"state": state, "code": "synthetic-code"}).status_code == 200
    uid = api.get("/api/auth/session").json()["data"]["user"]["uid"]
    assert uid == ("legacy-firebase-uid" if verified_mapping else "google:stable-google-sub")


def test_legacy_oauth_columns_are_encrypted_without_losing_original_token(tmp_path):
    import sqlite3
    import json
    path = tmp_path / "legacy.db"
    original = {"uid": "owner", "accessToken": "legacy-private-access", "refreshToken": "legacy-private-refresh"}
    with sqlite3.connect(path) as conn:
        conn.execute("CREATE TABLE googleDriveConnections(uid TEXT PRIMARY KEY,accessToken TEXT,refreshToken TEXT,source_payload TEXT)")
        conn.execute("INSERT INTO googleDriveConnections VALUES(?,?,?,?)", ("owner", original["accessToken"], original["refreshToken"], json.dumps(original)))
    client = sqlite_documents.SQLiteClient(str(path))
    assert client.collection("googleDriveConnections").document("owner").get().to_dict() == original
    with client.connection() as conn:
        row = conn.execute("SELECT accessToken,refreshToken,source_payload FROM googleDriveConnections WHERE uid='owner'").fetchone()
        assert all("legacy-private" not in value for value in row)
    assert list((tmp_path / "backups").glob("before-oauth-encryption-*.db"))
