import os
import sqlite3
from contextlib import contextmanager
from pathlib import Path
from typing import Generator

from app.config import get_settings
from app.db.models import SCHEMA_DDL
from app.db.migrations import (
    apply_schema,
    backfill_source_payloads,
    backup_database,
    schema_plan,
)


def get_connection() -> sqlite3.Connection:
    """Create and configure a local SQLite connection."""
    settings = get_settings()
    db_path = settings.db_path

    # Ensure parent directory exists
    db_path.parent.mkdir(parents=True, exist_ok=True)

    conn = sqlite3.connect(
        str(db_path),
        timeout=30.0,
        detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES,
        check_same_thread=False,
    )
    conn.row_factory = sqlite3.Row

    if settings.enable_wal_mode:
        conn.execute("PRAGMA journal_mode = WAL;")
        conn.execute("PRAGMA synchronous = NORMAL;")

    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    """Context manager for thread-safe SQLite transactions."""
    conn = get_connection()
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()


def init_database() -> None:
    """Initialize database tables and indexes."""
    with get_db() as conn:
        existing = conn.execute(
            "SELECT 1 FROM sqlite_master WHERE type='table' AND name='users'"
        ).fetchone()
        if existing and schema_plan(conn):
            backup_database(conn, get_settings().db_path.parent / "backups")
        conn.executescript(SCHEMA_DDL)
        apply_schema(conn)
        backfill_source_payloads(conn)
