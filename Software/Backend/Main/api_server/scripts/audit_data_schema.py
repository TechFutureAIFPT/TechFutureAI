"""Read-only Firestore/SQLite structural audit. Never print business field values."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections import Counter, defaultdict
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv

from app.integrations.firebase_admin import get_firestore_client
from app.repositories.firestore import account_repository as repo

EXCLUDED_SECRET_COLUMNS = {"accessToken", "refreshToken"}


def quoted(name: str) -> str:
    return '"' + name.replace('"', '""') + '"'


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--expect-project", required=True)
    parser.add_argument("--sqlite", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    db = get_firestore_client()
    if db.project != args.expect_project:
        raise ValueError("Firebase project differs from --expect-project.")
    if not args.sqlite.is_file():
        raise ValueError("SQLite database does not exist.")
    allowed = {
        value
        for key, value in vars(repo).items()
        if key.endswith("_COLLECTION") and isinstance(value, str)
    } | {
        repo.MANUAL_COLLECTION_ID,
        "vectorLibraryRecords",
        "assistantSessions",
        "desktopSessions",
        "sessionCommands",
        "loginHistory",
        "candidateSchedules",
    }
    report: dict[str, Any] = {"project": db.project, "firestore": {}, "sqlite": {}}
    top_level = {item.id for item in db.collections()}
    report["collectionsOutsideAuditScope"] = sorted(top_level - allowed)
    for name in sorted(allowed):
        fields = defaultdict(lambda: {"present": 0, "nulls": 0, "types": Counter()})
        count = 0
        missing_uid = 0
        for doc in db.collection(name).stream(timeout=60):
            data = doc.to_dict() or {}
            count += 1
            missing_uid += int(not data.get("uid"))
            for key, value in data.items():
                fields[key]["present"] += 1
                fields[key]["nulls"] += int(value is None)
                fields[key]["types"][type(value).__name__] += 1
        report["firestore"][name] = {
            "documents": count,
            "fields": dict(fields),
            "documentsWithoutUid": missing_uid,
        }
    uri = args.sqlite.resolve().as_uri() + "?mode=ro"
    with sqlite3.connect(uri, uri=True) as conn:
        tables = [
            item[0]
            for item in conn.execute(
                "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
            )
        ]
        for name in tables:
            columns = {
                row[1]: row[2]
                for row in conn.execute(f"PRAGMA table_info({quoted(name)})")
            }
            cloud = report["firestore"].get(name, {})
            cloud_fields = set(cloud.get("fields", {}))
            missing = cloud_fields - columns.keys()
            table: dict[str, Any] = {
                "rows": conn.execute(f"SELECT COUNT(*) FROM {quoted(name)}").fetchone()[
                    0
                ],
                "columns": columns,
                "missingCloudFields": sorted(missing),
                "missingBusinessFields": sorted(missing - EXCLUDED_SECRET_COLUMNS),
            }
            if "uid" in columns:
                table["emailInUidRows"] = conn.execute(
                    f"SELECT COUNT(*) FROM {quoted(name)} WHERE instr(uid, '@') > 0"
                ).fetchone()[0]
            report["sqlite"][name] = table
        report["sqliteIntegrity"] = conn.execute("PRAGMA integrity_check").fetchone()[0]
        report["foreignKeyViolations"] = len(
            conn.execute("PRAGMA foreign_key_check").fetchall()
        )
    report["missingSqlBusinessFields"] = sum(
        len(table["missingBusinessFields"]) for table in report["sqlite"].values()
    )
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        json.dumps(
            {
                "report": str(args.report),
                "project": db.project,
                "sqliteTables": len(report["sqlite"]),
                "missingSqlBusinessFields": report["missingSqlBusinessFields"],
                "sqliteIntegrity": report["sqliteIntegrity"],
                "foreignKeyViolations": report["foreignKeyViolations"],
                "historyDocumentsWithoutUid": report["firestore"]["cvHistory"][
                    "documentsWithoutUid"
                ],
            }
        )
    )


if __name__ == "__main__":
    main()
