from __future__ import annotations

import json
import sqlite3
import struct
from contextlib import contextmanager
from types import SimpleNamespace

import pytest

from app.db.migrations import (
    apply_schema,
    backfill_source_payloads,
    backup_database,
    schema_plan,
    upsert_imported_business_record,
)
from app.db.models import SCHEMA_DDL
from app.db.privacy import redact_database_value
from app.db.repositories import user_repository


@pytest.fixture
def connection():
    conn = sqlite3.connect(":memory:")
    conn.row_factory = sqlite3.Row
    conn.executescript(SCHEMA_DDL)
    yield conn
    conn.close()


def test_additive_migration_preserves_rows_and_is_idempotent(connection):
    connection.execute(
        "INSERT INTO users(id,uid,displayName) VALUES ('u','u','Tên gốc')"
    )
    assert apply_schema(connection) > 0
    assert apply_schema(connection) == 0
    assert (
        connection.execute("SELECT displayName FROM users").fetchone()[0] == "Tên gốc"
    )
    assert schema_plan(connection) == {}
    assert connection.execute("PRAGMA integrity_check").fetchone()[0] == "ok"


def test_new_fields_are_backfilled_from_existing_payload(connection):
    source = {"settings": {"ui": {"theme": "dark"}}, "version": 1}
    connection.execute(
        "INSERT INTO userSettings(id,uid,source_payload) VALUES (?,?,?)",
        ("u", "u", json.dumps(source)),
    )
    apply_schema(connection)
    assert backfill_source_payloads(connection) == 1
    row = connection.execute("SELECT settings,version FROM userSettings").fetchone()
    assert json.loads(row[0]) == source["settings"]
    assert row[1] == 1
    assert backfill_source_payloads(connection) == 0


def test_upsert_preserves_columns_not_in_cloud_document(connection):
    apply_schema(connection)
    connection.execute("ALTER TABLE users ADD COLUMN local_note TEXT")
    connection.execute(
        "INSERT INTO users(id,uid,displayName,local_note) VALUES ('u','u','old','keep')"
    )
    assert (
        upsert_imported_business_record(
            connection, "users", "u", {"uid": "u", "displayName": "new"}
        )
        == "updated"
    )
    row = connection.execute("SELECT displayName,local_note FROM users").fetchone()
    assert tuple(row) == ("new", "keep")


def test_missing_owner_is_not_replaced_with_email(connection):
    apply_schema(connection)
    assert (
        upsert_imported_business_record(
            connection, "cvHistory", "h", {"userEmail": "owner@example.test"}
        )
        == "missing_required_field"
    )
    assert connection.execute("SELECT COUNT(*) FROM cvHistory").fetchone()[0] == 0


def test_existing_legacy_row_can_be_enriched_without_inventing_owner(connection):
    apply_schema(connection)
    connection.execute(
        "INSERT INTO cvHistory(id,uid) VALUES ('h','legacy@example.test')"
    )
    upsert_imported_business_record(
        connection,
        "cvHistory",
        "h",
        {"userEmail": "legacy@example.test", "jdTitle": "Python"},
    )
    row = connection.execute("SELECT uid,jdTitle FROM cvHistory").fetchone()
    assert tuple(row) == ("legacy@example.test", "Python")


def test_import_repairs_legacy_email_uid_only_from_cloud_uid(connection):
    apply_schema(connection)
    connection.execute(
        "INSERT INTO cvHistory(id,uid) VALUES ('h','legacy@example.test')"
    )
    upsert_imported_business_record(
        connection,
        "cvHistory",
        "h",
        {"uid": "verified-uid", "userEmail": "legacy@example.test"},
    )
    assert (
        connection.execute("SELECT uid FROM cvHistory").fetchone()[0] == "verified-uid"
    )


def test_import_refuses_ownership_conflicts(connection):
    apply_schema(connection)
    connection.execute("INSERT INTO users(id,uid) VALUES ('u','original-owner')")
    with pytest.raises(ValueError, match="Ownership conflict"):
        upsert_imported_business_record(connection, "users", "u", {"uid": "other-owner"})
    assert connection.execute("SELECT uid FROM users").fetchone()[0] == "original-owner"


def test_invalid_empty_embedding_is_repaired_from_source_vector(connection):
    source = {
        "vector": [0.25, -0.5],
        "collectionKey": "backend",
        "textSnippet": "Python",
    }
    connection.execute(
        "INSERT INTO vectorLibraryRecords(id,collectionName,textContent,embeddingBlob,source_payload) VALUES (?,?,?,?,?)",
        ("v", "backend", "Python", "", json.dumps(source)),
    )
    apply_schema(connection)
    backfill_source_payloads(connection)
    blob = connection.execute(
        "SELECT embeddingBlob FROM vectorLibraryRecords"
    ).fetchone()[0]
    assert struct.unpack("<ff", blob) == (0.25, -0.5)


def test_backup_contains_original_data(connection, tmp_path):
    connection.execute("INSERT INTO users(id,uid) VALUES ('u','u')")
    connection.commit()
    backup = backup_database(connection, tmp_path)
    with sqlite3.connect(backup) as copied:
        assert copied.execute("SELECT uid FROM users").fetchone()[0] == "u"


def test_user_repository_writes_canonical_columns_and_returns_legacy_aliases(
    connection, monkeypatch
):
    @contextmanager
    def get_db():
        yield connection

    monkeypatch.setattr(user_repository, "get_db", get_db)
    row = user_repository.UserRepository.get_or_create_user(
        "u", "u@example.test", "Test User"
    )
    assert row["id"] == row["uid"] == "u"
    assert row["displayName"] == row["display_name"] == "Test User"
    assert row["userRole"] == row["user_role"] == "recruiter"


def test_credentials_are_redacted_including_raw_payload_json():
    row = {
        "accessTokenEncrypted": "secret",
        "source_payload": json.dumps(
            {
                "refreshToken": "secret",
                "metadata": {"access_token": "secret"},
                "title": "keep",
            }
        ),
    }
    redacted = redact_database_value(row)
    assert "secret" not in json.dumps(redacted)
    assert json.loads(redacted["source_payload"])["title"] == "keep"
