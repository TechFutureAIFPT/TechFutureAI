"""Preview/apply additive SQLite upgrades; backs up the database before mutation."""

from __future__ import annotations

import argparse
import json
import sqlite3
import sys
from collections import Counter
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.config import get_settings
from app.db.migrations import (
    apply_schema,
    backfill_source_payloads,
    backup_database,
    schema_plan,
    upsert_imported_business_record,
)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--source-export", type=Path)
    parser.add_argument(
        "--database",
        type=Path,
        help="Override the configured path, for a staging copy or explicit database.",
    )
    parser.add_argument("--backup-directory", type=Path, required=True)
    parser.add_argument("--report", type=Path, required=True)
    args = parser.parse_args()
    path = args.database or get_settings().db_path
    if not path.is_file():
        raise ValueError(
            "Configured SQLite database does not exist; no empty replacement created."
        )
    conn = sqlite3.connect(path)
    conn.execute("PRAGMA busy_timeout=30000")
    report = {
        "database": str(path),
        "mode": "apply" if args.apply else "dry-run",
        "additions": schema_plan(conn),
    }
    before_rows = dict(
        conn.execute(
            "SELECT name, 0 FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
        )
    )
    for table in before_rows:
        before_rows[table] = conn.execute(
            'SELECT COUNT(*) FROM "' + table.replace('"', '""') + '"'
        ).fetchone()[0]
    if args.apply:
        report["backup"] = str(backup_database(conn, args.backup_directory))
        try:
            conn.execute("BEGIN IMMEDIATE")
            report["addedColumns"] = apply_schema(conn)
            report["backfilledLocalRows"] = backfill_source_payloads(conn)
            status = Counter()
            if args.source_export:
                with args.source_export.open(encoding="utf-8") as handle:
                    for line in handle:
                        item = json.loads(line)
                        status[
                            upsert_imported_business_record(
                                conn,
                                item["collection"],
                                item["documentId"],
                                item["data"],
                            )
                        ] += 1
            report["importResults"] = dict(status)
            integrity = conn.execute("PRAGMA integrity_check").fetchone()[0]
            if integrity != "ok":
                raise ValueError(
                    "SQLite integrity check failed; migration rolled back."
                )
            for table, old_count in before_rows.items():
                current = conn.execute(
                    'SELECT COUNT(*) FROM "' + table.replace('"', '""') + '"'
                ).fetchone()[0]
                if current < old_count:
                    raise ValueError("A table lost rows; migration rolled back.")
            conn.commit()
            report["integrity"] = integrity
            report["rowCountsPreserved"] = True
        except BaseException:
            conn.rollback()
            raise
    conn.close()
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(
        json.dumps(
            {key: value for key, value in report.items() if key != "additions"},
            ensure_ascii=False,
        )
    )


if __name__ == "__main__":
    main()
