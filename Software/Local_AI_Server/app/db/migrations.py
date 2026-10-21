"""Additive SQLite schema upgrades and loss-preserving business record imports."""

from __future__ import annotations

import json
import math
import sqlite3
import struct
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

SPEC_PATH = Path(__file__).with_name("schema_additions.json")
SAFE_TYPES = {"TEXT", "INTEGER", "REAL", "BLOB"}


def quote_identifier(value: str) -> str:
    return '"' + value.replace('"', '""') + '"'


def schema_spec() -> dict[str, Any]:
    return json.loads(SPEC_PATH.read_text(encoding="utf-8"))


def table_columns(conn: sqlite3.Connection, table: str) -> dict[str, Any]:
    return {
        row[1]: row
        for row in conn.execute(f"PRAGMA table_info({quote_identifier(table)})")
    }


def schema_plan(conn: sqlite3.Connection) -> dict[str, Any]:
    spec = schema_spec()
    plan = {}
    for table, fields in spec["tables"].items():
        columns = table_columns(conn, table)
        if not columns and table not in spec["createTables"]:
            continue
        missing = {key: kind for key, kind in fields.items() if key not in columns}
        if missing:
            plan[table] = missing
    return plan


def apply_schema(conn: sqlite3.Connection) -> int:
    spec = schema_spec()
    added = 0
    for table, fields in schema_plan(conn).items():
        if not table_columns(conn, table):
            conn.execute(
                f"CREATE TABLE {quote_identifier(table)} (id TEXT PRIMARY KEY)"
            )
        for field, kind in fields.items():
            if kind not in SAFE_TYPES:
                raise ValueError("Unsupported SQLite column type")
            conn.execute(
                f"ALTER TABLE {quote_identifier(table)} ADD COLUMN {quote_identifier(field)} {kind}"
            )
            added += 1
    conn.execute(
        "CREATE TABLE IF NOT EXISTS schema_migrations (version TEXT PRIMARY KEY, applied_at TEXT NOT NULL)"
    )
    conn.execute(
        "INSERT OR IGNORE INTO schema_migrations VALUES (?, ?)",
        (spec["version"], datetime.now(UTC).isoformat()),
    )
    for table in spec["tables"]:
        columns = table_columns(conn, table)
        if "firestoreDocumentId" in columns:
            conn.execute(
                f"CREATE UNIQUE INDEX IF NOT EXISTS {quote_identifier('idx_' + table + '_firestore_id')} ON {quote_identifier(table)} (firestoreDocumentId)"
            )
    return added


def sql_value(value: Any, kind: str) -> Any:
    if value is None:
        return None
    if isinstance(value, (dict, list)):
        return json.dumps(value, ensure_ascii=False)
    if isinstance(value, bool):
        return int(value)
    if isinstance(value, datetime):
        return int(value.timestamp() * 1000) if "INT" in kind else value.isoformat()
    if (
        isinstance(value, str)
        and "INT" in kind
        and len(value) >= 19
        and value[4:5] == "-"
    ):
        try:
            return int(datetime.fromisoformat(value).timestamp() * 1000)
        except ValueError:
            return value
    return value


def vector_blob(value: Any) -> bytes | None:
    if not isinstance(value, list) or not value:
        return None
    try:
        numbers = [float(item) for item in value]
    except (ValueError, TypeError):
        return None
    if not all(math.isfinite(item) for item in numbers):
        return None
    try:
        return struct.pack("<" + "f" * len(numbers), *numbers)
    except (OverflowError, struct.error):
        return None


ALIASES = {
    "requestPayload": "request",
    "responsePayload": "response",
    "resultJson": "candidateData",
    "hashJd": "jdHash",
    "hashWeights": "weightsHash",
    "hashFilters": "filtersHash",
    "text": "redacted_cv_text",
    "textContent": "textSnippet",
    "collectionName": "collectionKey",
    "metadataJson": "metadata",
    "email": "userEmail",
}


def project_document(columns: dict[str, Any], data: dict[str, Any]) -> dict[str, Any]:
    result = {}
    for column, metadata in columns.items():
        if column in data:
            value = data[column]
        elif column in ALIASES and ALIASES[column] in data:
            value = data[ALIASES[column]]
        else:
            continue
        if value is None and metadata[3]:
            continue
        result[column] = sql_value(value, metadata[2])
    recruiter = data.get("recruiterInfo")
    if isinstance(recruiter, dict):
        for column, key in {
            "recruiter_title": "title",
            "recruiter_company": "company",
            "recruiter_department": "department",
            "recruiter_phone": "phone",
            "email_signature": "emailSignature",
        }.items():
            if column in columns and key in recruiter:
                result[column] = recruiter[key]
    if "embeddingBlob" in columns:
        blob = vector_blob(data.get("vector"))
        if blob is not None:
            result["embeddingBlob"] = blob
    if "source_payload" in columns:
        result["source_payload"] = json.dumps(data, ensure_ascii=False)
    return result


def backfill_source_payloads(conn: sqlite3.Connection) -> int:
    changed = 0
    for table in schema_spec()["tables"]:
        columns = table_columns(conn, table)
        primary = next((name for name, meta in columns.items() if meta[5]), None)
        if not primary or "source_payload" not in columns:
            continue
        cursor = conn.execute(
            f"SELECT * FROM {quote_identifier(table)} WHERE source_payload IS NOT NULL"
        )
        names = [item[0] for item in cursor.description]
        for raw_row in cursor.fetchall():
            row = dict(zip(names, raw_row))
            try:
                data = json.loads(row["source_payload"])
            except (ValueError, TypeError):
                continue
            if not isinstance(data, dict):
                continue
            projected = project_document(columns, data)
            patch = {
                key: value
                for key, value in projected.items()
                if key != primary
                and value is not None
                and (
                    row[key] is None
                    or (key == "embeddingBlob" and row[key] in ("", b""))
                )
            }
            if patch:
                assignment = ", ".join(f"{quote_identifier(key)} = ?" for key in patch)
                conn.execute(
                    f"UPDATE {quote_identifier(table)} SET {assignment} WHERE {quote_identifier(primary)} = ?",
                    [*patch.values(), row[primary]],
                )
                changed += 1
    return changed


def upsert_imported_business_record(
    conn: sqlite3.Connection, table: str, document_id: str, data: dict[str, Any]
) -> str:
    if table == "CLdl7JGuaOGIuijiDZeG":
        table = "manualHistory"
    if table not in schema_spec()["tables"]:
        return "outside_scope"
    columns = table_columns(conn, table)
    primary = next((name for name, meta in columns.items() if meta[5]), None)
    if not primary:
        return "missing_table"
    primary_value = (
        (data.get(primary) or document_id)
        if primary in {"uid", "jobId", "cacheKey", "state"}
        else document_id
    )
    cursor = conn.execute(
        f"SELECT * FROM {quote_identifier(table)} WHERE {quote_identifier(primary)} = ?",
        (primary_value,),
    )
    raw = cursor.fetchone()
    existing = dict(zip([item[0] for item in cursor.description], raw)) if raw else {}
    old_uid, new_uid = existing.get("uid"), data.get("uid")
    if (
        old_uid
        and new_uid
        and old_uid != new_uid
        and "@" not in str(old_uid)
        and old_uid != "system"
    ):
        raise ValueError(f"Ownership conflict in {table}; transaction was not applied.")
    record = project_document(columns, data)
    record[primary] = primary_value
    if "firestoreDocumentId" in columns:
        record["firestoreDocumentId"] = document_id
    if primary == "uid":
        record["uid"] = primary_value
    for name, meta in columns.items():
        if name not in record and meta[3]:
            if existing.get(name) is not None:
                record[name] = existing[name]
            elif meta[4] is None:
                return "missing_required_field"
    keys = list(record)
    updates = ", ".join(
        f"{quote_identifier(key)}=excluded.{quote_identifier(key)}"
        for key in keys
        if key != primary
    )
    sql = f"INSERT INTO {quote_identifier(table)} ({', '.join(map(quote_identifier, keys))}) VALUES ({', '.join('?' for _ in keys)}) ON CONFLICT ({quote_identifier(primary)}) DO UPDATE SET {updates}"
    conn.execute(sql, [record[key] for key in keys])
    return "updated" if existing else "inserted"


def backup_database(conn: sqlite3.Connection, directory: Path) -> Path:
    directory.mkdir(parents=True, exist_ok=True)
    path = directory / (
        "sqlite-before-schema-" + datetime.now(UTC).strftime("%Y%m%dT%H%M%S%fZ") + ".db"
    )
    with sqlite3.connect(path) as destination:
        conn.backup(destination)
    return path
