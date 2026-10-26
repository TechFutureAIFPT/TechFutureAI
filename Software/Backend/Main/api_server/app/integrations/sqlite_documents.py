"""SQL persistence adapter for the existing account business layer.

Documents are stored in SQLite, not sent to Firebase. Known legacy tables receive
typed projections in the same transaction, while the canonical JSON retains every
field. OAuth secrets are encrypted at rest with a local Fernet key.
"""
from __future__ import annotations

import copy
import json
import re
import secrets
import sqlite3
import struct
from contextlib import contextmanager
from datetime import datetime, timezone
from functools import lru_cache
from pathlib import Path
from types import SimpleNamespace
from typing import Any, Iterator

from cryptography.fernet import Fernet

from app.core.config import get_settings

SECRET_FIELDS = {"accessToken", "refreshToken", "accessTokenEncrypted", "refreshTokenEncrypted", "access_token", "refresh_token", "client_secret", "codeVerifier"}
TABLE_ALIASES = {"CLdl7JGuaOGIuijiDZeG": "manualHistory"}


def _lookup(data: dict, field: str) -> Any:
    value: Any = data
    for part in field.split("."):
        if not isinstance(value, dict) or part not in value:
            return None
        value = value[part]
    return value


def _sort_key(value: Any) -> tuple:
    if isinstance(value, datetime): return (0, value.timestamp() * 1000)
    if isinstance(value, (int, float)): return (0, value)
    if isinstance(value, str):
        try: return (0, datetime.fromisoformat(value.replace("Z", "+00:00")).timestamp() * 1000)
        except ValueError: return (1, value)
    return (2, str(value))


class Snapshot:
    def __init__(self, reference: Document, payload: dict | None):
        self.reference, self.id, self.exists = reference, reference.id, payload is not None
        self._payload = payload

    def to_dict(self) -> dict | None:
        return copy.deepcopy(self._payload)


class Document:
    def __init__(self, client: SQLiteClient, collection: str, document_id: str):
        self.client, self.collection_id, self.id = client, collection, document_id
        self.path = f"{collection}/{document_id}"

    def get(self) -> Snapshot:
        with self.client.connection() as conn:
            row = conn.execute("SELECT payload FROM application_documents WHERE collection=? AND document_id=?", (self.collection_id, self.id)).fetchone()
        return Snapshot(self, self.client.decode(row[0]) if row else None)

    def set(self, payload: dict, merge: bool = False) -> None:
        with self.client.connection(write=True) as conn:
            if merge:
                row = conn.execute("SELECT payload FROM application_documents WHERE collection=? AND document_id=?", (self.collection_id, self.id)).fetchone()
                current = self.client.decode(row[0]) if row else {}
                self._merge(current, payload)
                payload = current
            encoded = self.client.encode(payload)
            conn.execute("INSERT INTO application_documents(collection,document_id,uid,payload) VALUES(?,?,?,?) ON CONFLICT(collection,document_id) DO UPDATE SET uid=excluded.uid,payload=excluded.payload", (self.collection_id, self.id, str(payload.get("uid") or ""), encoded))
            self.client.project(conn, self.collection_id, self.id, payload)

    @staticmethod
    def _merge(current: dict, updates: dict) -> None:
        for key, value in updates.items():
            if isinstance(value, dict) and isinstance(current.get(key), dict):
                Document._merge(current[key], value)
            else:
                current[key] = copy.deepcopy(value)

    def update(self, payload: dict) -> None:
        with self.client.connection(write=True) as conn:
            row = conn.execute("SELECT payload FROM application_documents WHERE collection=? AND document_id=?", (self.collection_id, self.id)).fetchone()
            if row is None:
                raise KeyError(self.path)
            current = self.client.decode(row[0])
            for key, value in payload.items():
                parent = current
                parts = key.split(".")
                for part in parts[:-1]:
                    parent = parent.setdefault(part, {})
                parent[parts[-1]] = value
            conn.execute("UPDATE application_documents SET payload=?,uid=? WHERE collection=? AND document_id=?", (self.client.encode(current), str(current.get("uid") or ""), self.collection_id, self.id))
            self.client.project(conn, self.collection_id, self.id, current)

    def delete(self) -> None:
        with self.client.connection(write=True) as conn:
            conn.execute("DELETE FROM application_documents WHERE collection=? AND document_id=?", (self.collection_id, self.id))
            self.client.project_delete(conn, self.collection_id, self.id)


class Query:
    def __init__(self, client: SQLiteClient, collection: str, filters=(), orders=(), maximum: int | None = None):
        self.client, self.collection_id = client, collection
        self.filters, self.orders, self.maximum = filters, orders, maximum

    def document(self, document_id: str | None = None) -> Document:
        return Document(self.client, self.collection_id, document_id or secrets.token_hex(16))

    def where(self, field: str | None = None, op: str | None = None, value: Any = None, *, filter: Any = None) -> Query:
        if filter is not None:
            field, op, value = filter.field_path, filter.op_string, filter.value
        if not field or op not in {"==", "!=", ">", ">=", "<", "<=", "in", "array_contains", "array-contains"}:
            raise ValueError("Unsupported SQL document filter")
        return Query(self.client, self.collection_id, (*self.filters, (field, op, value)), self.orders, self.maximum)

    def order_by(self, field: str, direction: str = "ASCENDING") -> Query:
        return Query(self.client, self.collection_id, self.filters, (*self.orders, (field, direction)), self.maximum)

    def limit(self, count: int) -> Query:
        if count < 0:
            raise ValueError("Negative query limit")
        return Query(self.client, self.collection_id, self.filters, self.orders, count)

    def stream(self) -> Iterator[Snapshot]:
        with self.client.connection() as conn:
            owner = next((value for field, op, value in self.filters if field == "uid" and op == "=="), None)
            if owner is not None:
                rows = conn.execute("SELECT document_id,payload FROM application_documents WHERE collection=? AND uid=?", (self.collection_id, owner)).fetchall()
            else:
                rows = conn.execute("SELECT document_id,payload FROM application_documents WHERE collection=?", (self.collection_id,)).fetchall()
        items = [(row[0], self.client.decode(row[1])) for row in rows]
        for field, op, expected in self.filters:
            def matches(data: dict) -> bool:
                actual = _lookup(data, field)
                if actual is None:
                    return False
                if op == "==": return actual == expected
                if op == "!=": return actual != expected
                if op == "in": return actual in expected
                if op in {"array_contains", "array-contains"}: return isinstance(actual, list) and expected in actual
                try:
                    if op == ">": return actual > expected
                    if op == ">=": return actual >= expected
                    if op == "<": return actual < expected
                    return actual <= expected
                except TypeError:
                    return False
            items = [(key, data) for key, data in items if matches(data)]
        for field, direction in reversed(self.orders):
            items = [(key, data) for key, data in items if _lookup(data, field) is not None]
            items.sort(key=lambda item: (_sort_key(_lookup(item[1], field)), item[0]), reverse=str(direction).upper().endswith("DESCENDING"))
        for key, payload in items[:self.maximum]:
            yield Snapshot(self.document(key), payload)

    def get(self) -> list[Snapshot]:
        return list(self.stream())

    def count(self) -> Any:
        return SimpleNamespace(get=lambda: [[SimpleNamespace(value=len(self.get()))]])


class SQLiteClient:
    def __init__(self, path: str):
        self.path = Path(path).expanduser().resolve()
        self.path.parent.mkdir(parents=True, exist_ok=True)
        key_path = self.path.parent / ".local-secrets" / "oauth.key"
        key_path.parent.mkdir(exist_ok=True)
        try:
            with key_path.open("xb") as handle:
                handle.write(Fernet.generate_key())
        except FileExistsError:
            pass
        self.cipher = Fernet(key_path.read_bytes())
        with self.connection() as conn:
            existing = conn.execute("SELECT 1 FROM sqlite_master WHERE name='application_documents'").fetchone()
            tables = conn.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()
            if not existing and tables:
                backup_dir = self.path.parent / "backups"
                backup_dir.mkdir(exist_ok=True)
                with sqlite3.connect(backup_dir / f"before-sql-profile-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}-{secrets.token_hex(3)}.db") as backup:
                    conn.backup(backup)
            conn.executescript("""
                CREATE TABLE IF NOT EXISTS application_documents(collection TEXT NOT NULL,document_id TEXT NOT NULL,uid TEXT NOT NULL DEFAULT '',payload TEXT NOT NULL,PRIMARY KEY(collection,document_id));
                CREATE INDEX IF NOT EXISTS application_document_owner ON application_documents(collection,uid);
                CREATE TABLE IF NOT EXISTS local_auth_sessions(token_hash TEXT PRIMARY KEY,uid TEXT NOT NULL,claims TEXT NOT NULL,expires_at INTEGER NOT NULL,created_at INTEGER NOT NULL);
                CREATE INDEX IF NOT EXISTS local_session_owner ON local_auth_sessions(uid);
                CREATE TABLE IF NOT EXISTS local_auth_credentials(email TEXT PRIMARY KEY,uid TEXT UNIQUE NOT NULL,password_hash TEXT NOT NULL,display_name TEXT NOT NULL,created_at INTEGER NOT NULL);
                CREATE TABLE IF NOT EXISTS local_legacy_google_users(email TEXT PRIMARY KEY,uid TEXT UNIQUE NOT NULL);
                CREATE TABLE IF NOT EXISTS local_google_identities(subject TEXT PRIMARY KEY,uid TEXT UNIQUE NOT NULL,email TEXT NOT NULL);
                CREATE TABLE IF NOT EXISTS local_schema_migrations(version TEXT PRIMARY KEY,applied_at TEXT NOT NULL);
            """)
            # Existing tables remain intact. Import their canonical payload once;
            # malformed rows are not converted into invented user records.
            if not existing:
                for (table,) in tables:
                    if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", table): continue
                    columns = {row[1] for row in conn.execute(f'PRAGMA table_info("{table}")')}
                    if "source_payload" not in columns: continue
                    pk = next((row[1] for row in conn.execute(f'PRAGMA table_info("{table}")') if row[5]), None)
                    if pk is None: continue
                    collection = next((name for name, target in TABLE_ALIASES.items() if target == table), table)
                    for row in conn.execute(f'SELECT "{pk}",source_payload FROM "{table}" WHERE source_payload IS NOT NULL').fetchall():
                        try: payload = json.loads(row[1])
                        except (ValueError, TypeError): continue
                        if not isinstance(payload, dict): continue
                        conn.execute("INSERT OR IGNORE INTO application_documents VALUES(?,?,?,?)", (collection, str(row[0]), str(payload.get("uid") or ""), self.encode(payload)))
                        if table == "users" and str(payload.get("provider") or "").lower() in {"google", "google.com"} and payload.get("email"):
                            conn.execute("INSERT OR IGNORE INTO local_legacy_google_users VALUES(?,?)", (str(payload["email"]).strip().casefold(), str(payload.get("uid") or row[0])))
            # Earlier local imports used the exported SQL view name for exemplars.
            # Copy it once to Main's collection name, preserving all original rows.
            migration = "canonical-approved-exemplars-v1"
            if not conn.execute("SELECT 1 FROM local_schema_migrations WHERE version=?", (migration,)).fetchone():
                aliases = conn.execute("SELECT document_id,uid,payload FROM application_documents WHERE collection=?", ("public.approved_exemplars",)).fetchall()
                if aliases:
                    backup_dir = self.path.parent / "backups"
                    backup_dir.mkdir(exist_ok=True)
                    with sqlite3.connect(backup_dir / f"before-exemplar-alias-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}-{secrets.token_hex(3)}.db") as backup:
                        conn.backup(backup)
                    conn.executemany("INSERT OR IGNORE INTO application_documents(collection,document_id,uid,payload) VALUES('approvedExemplars',?,?,?)", aliases)
                conn.execute("INSERT INTO local_schema_migrations VALUES(?,?)", (migration, datetime.now(timezone.utc).isoformat()))
            conn.commit()
            migration = "encrypted-oauth-projections-v2"
            if not conn.execute("SELECT 1 FROM local_schema_migrations WHERE version=?", (migration,)).fetchone():
                connections = conn.execute("SELECT document_id,payload FROM application_documents WHERE collection='googleDriveConnections'").fetchall() if self._table(conn, "googleDriveConnections") else []
                if connections:
                    backup_dir = self.path.parent / "backups"
                    backup_dir.mkdir(exist_ok=True)
                    with sqlite3.connect(backup_dir / f"before-oauth-encryption-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}-{secrets.token_hex(3)}.db") as backup:
                        conn.backup(backup)
                    for document_id, encoded in connections:
                        self.project(conn, "googleDriveConnections", document_id, self.decode(encoded))
                conn.execute("INSERT INTO local_schema_migrations VALUES(?,?)", (migration, datetime.now(timezone.utc).isoformat()))

    @contextmanager
    def connection(self, write: bool = False):
        conn = sqlite3.connect(self.path, timeout=30)
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=30000")
        try:
            if write: conn.execute("BEGIN IMMEDIATE")
            yield conn
            conn.commit()
        except BaseException:
            conn.rollback()
            raise
        finally:
            conn.close()

    def encode(self, payload: dict) -> str:
        def transform(value, key=""):
            if key in SECRET_FIELDS and isinstance(value, str) and value:
                return {"__local_secret__": self.cipher.encrypt(value.encode()).decode()}
            if isinstance(value, datetime): return {"__local_datetime__": value.isoformat()}
            if isinstance(value, dict):
                mapped = {k: transform(v, k) for k, v in value.items()}
                if set(mapped) in ({"__local_secret__"}, {"__local_datetime__"}, {"__local_literal__"}):
                    return {"__local_literal__": mapped}
                return mapped
            if isinstance(value, (list, tuple)): return [transform(v) for v in value]
            if value.__class__.__name__ == "Sentinel": return {"__local_datetime__": datetime.now(timezone.utc).isoformat()}
            return value
        return json.dumps(transform(payload), ensure_ascii=False, allow_nan=False)

    def decode(self, encoded: str) -> dict:
        def restore(value):
            if isinstance(value, list): return [restore(item) for item in value]
            if not isinstance(value, dict): return value
            if set(value) == {"__local_literal__"}:
                return {key: restore(item) for key, item in value["__local_literal__"].items()}
            if set(value) == {"__local_secret__"}: return self.cipher.decrypt(value["__local_secret__"].encode()).decode()
            if set(value) == {"__local_datetime__"}: return datetime.fromisoformat(value["__local_datetime__"])
            return {key: restore(item) for key, item in value.items()}
        return restore(json.loads(encoded))

    def collection(self, collection: str) -> Query:
        return Query(self, collection)

    def consume(self, collection: str, document_id: str, *, expected: dict | None = None) -> dict | None:
        with self.connection(write=True) as conn:
            row = conn.execute("SELECT payload FROM application_documents WHERE collection=? AND document_id=?", (collection, document_id)).fetchone()
            if row is None: return None
            payload = self.decode(row[0])
            if expected and any(payload.get(key) != value for key, value in expected.items()):
                return None
            conn.execute("DELETE FROM application_documents WHERE collection=? AND document_id=?", (collection, document_id))
            self.project_delete(conn, collection, document_id)
            return payload

    @staticmethod
    def _table(conn, collection):
        table = TABLE_ALIASES.get(collection, collection)
        if not re.fullmatch(r"[A-Za-z][A-Za-z0-9_]*", table): return None
        if not conn.execute("SELECT 1 FROM sqlite_master WHERE type='table' AND name=?", (table,)).fetchone(): return None
        columns = list(conn.execute(f'PRAGMA table_info("{table}")'))
        primary = next((row[1] for row in columns if row[5]), None)
        return (table, columns, primary) if primary and any(row[1] == "source_payload" for row in columns) else None

    def project(self, conn, collection, document_id, payload):
        info = self._table(conn, collection)
        if info is None: return
        table, columns, primary = info
        values = {primary: document_id, "source_payload": self.encode(payload)}
        for _, name, column_type, required, default, pk in columns:
            if pk or name == "source_payload": continue
            value = payload.get(name)
            if name == "accessTokenEncrypted" and value is None: value = payload.get("accessToken")
            if name == "refreshTokenEncrypted" and value is None: value = payload.get("refreshToken")
            if table == "vectorLibraryRecords" and value is None:
                value = {"collectionName": payload.get("collectionKey"), "docId": payload.get("sourceId"), "textContent": payload.get("textSnippet"), "metadataJson": payload.get("metadata")}.get(name)
                if name == "embeddingBlob" and isinstance(payload.get("vector"), list):
                    vector = payload["vector"]
                    value = struct.pack(f"<{len(vector)}f", *vector)
            if name == "uid" and value is None and table in {"users", "userSettings"}: value = document_id
            if name == "resultJson" and value is None: value = payload.get("candidateData", {})
            if name == "text" and value is None and table == "approvedExemplars": value = payload.get("redacted_cv_text") or payload.get("cvText")
            if value is None:
                if required and default is None: raise ValueError(f"Required SQL projection field is missing: {table}.{name}")
                else: continue
            if name in SECRET_FIELDS and value:
                value = self.cipher.encrypt(str(value).encode()).decode()
            elif isinstance(value, (dict, list)): value = json.dumps(json.loads(self.encode({"value": value}))["value"], ensure_ascii=False)
            elif isinstance(value, datetime): value = value.isoformat()
            values[name] = value
        names = list(values)
        quoted = ",".join(f'"{name}"' for name in names)
        updates = ",".join(f'"{name}"=excluded."{name}"' for name in names if name != primary)
        marks = ",".join("?" for _ in names)
        conn.execute(f'INSERT INTO "{table}"({quoted}) VALUES({marks}) ON CONFLICT("{primary}") DO UPDATE SET {updates}', [values[name] for name in names])

    def project_delete(self, conn, collection, document_id):
        info = self._table(conn, collection)
        if info is not None:
            table, _, primary = info
            conn.execute(f'DELETE FROM "{table}" WHERE "{primary}"=?', (document_id,))


@lru_cache(maxsize=4)
def _client(path: str) -> SQLiteClient:
    return SQLiteClient(path)


def get_sqlite_client() -> SQLiteClient:
    return _client(get_settings().sqlite_path)
