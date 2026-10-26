"""Audit/backfill missing history fields using Firebase Admin; dry run by default."""

from __future__ import annotations

import argparse
import base64
import json
import sys
import uuid
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from dotenv import load_dotenv
from firebase_admin import auth

from app.integrations.firebase_admin import get_firebase_app, get_firestore_client
from app.repositories.firestore import account_repository as repo
from app.services.history_schema_service import missing_history_fields


def json_safe(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, bytes):
        return {"__type__": "bytes", "base64": base64.b64encode(value).decode("ascii")}
    if isinstance(value, dict):
        return {str(key): json_safe(inner) for key, inner in value.items()}
    if isinstance(value, (list, tuple)):
        return [json_safe(inner) for inner in value]
    if hasattr(value, "path"):
        return {"__type__": "reference", "path": value.path}
    return value


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    parser.add_argument("--expect-project", required=True)
    parser.add_argument("--directory", type=Path, default=Path(".cache/schema-audit"))
    parser.add_argument("--export-local", type=Path)
    args = parser.parse_args()
    load_dotenv(Path(__file__).resolve().parents[1] / ".env")
    db = get_firestore_client()
    if db.project != args.expect_project:
        raise ValueError(
            "Firebase project differs from --expect-project; no writes performed."
        )
    snapshots = list(db.collection("cvHistory").stream(timeout=60))
    emails = {
        str(
            (doc.to_dict() or {}).get("userEmail")
            or (doc.to_dict() or {}).get("email")
            or ""
        )
        .strip()
        .lower()
        for doc in snapshots
        if "uid" not in (doc.to_dict() or {})
    }
    owners: dict[str, str] = {}
    unresolved = Counter()
    for email in emails - {""}:
        try:
            user = auth.get_user_by_email(email, app=get_firebase_app())
            if user.email_verified and not user.disabled:
                owners[email] = user.uid
            else:
                unresolved["unverified_or_disabled_email"] += 1
        except auth.UserNotFoundError:
            unresolved["email_not_in_auth"] += 1
    changes = [
        (doc, missing_history_fields(doc.to_dict() or {}, owners)) for doc in snapshots
    ]
    changes = [(doc, patch) for doc, patch in changes if patch]
    field_counts = Counter(key for _, patch in changes for key in patch)
    unresolved_documents = [
        doc.id
        for doc in snapshots
        if "uid" not in (doc.to_dict() or {})
        and "uid" not in missing_history_fields(doc.to_dict() or {}, owners)
    ]
    args.directory.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(UTC).strftime("%Y%m%dT%H%M%SZ")
    report: dict[str, Any] = {
        "project": db.project,
        "mode": "apply" if args.apply else "dry-run",
        "historyDocuments": len(snapshots),
        "documentsToPatch": len(changes),
        "addedFields": dict(field_counts),
        "unresolvedOwnerDocumentIds": unresolved_documents,
        "unresolvedEmailReasons": dict(unresolved),
        "appliedDocuments": 0,
    }
    output = args.directory / f"firestore-history-{stamp}.json"
    if args.apply and changes:
        backup = args.directory / f"firestore-history-before-{stamp}.json"
        affected_uids = {
            str(patch.get("uid") or (doc.to_dict() or {}).get("uid") or "")
            for doc, patch in changes
        }
        states = [
            db.collection("userSyncState").document(uid).get(timeout=30)
            for uid in sorted(affected_uids)
            if uid and "@" not in uid
        ]
        backup.write_text(
            json.dumps(
                [
                    {
                        "path": doc.reference.path,
                        "updateTime": doc.update_time,
                        "before": doc.to_dict(),
                        "addedFields": list(patch),
                    }
                    for doc, patch in changes
                ]
                + [
                    {
                        "path": doc.reference.path,
                        "updateTime": doc.update_time,
                        "existed": doc.exists,
                        "before": doc.to_dict(),
                    }
                    for doc in states
                ],
                default=json_safe,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )
        report["backup"] = str(backup)
        output.write_text(
            json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
        )
        for offset in range(0, len(changes), 200):
            batch = db.batch()
            touched_owners = {}
            for doc, patch in changes[offset : offset + 200]:
                batch.update(
                    doc.reference,
                    patch,
                    option=db.write_option(last_update_time=doc.update_time),
                )
                current = doc.to_dict() or {}
                uid = patch.get("uid") or current.get("uid")
                if uid and "@" not in str(uid):
                    touched_owners[str(uid)] = str(
                        patch.get("email")
                        or current.get("email")
                        or current.get("userEmail")
                        or ""
                    )
            for uid, email in touched_owners.items():
                batch.set(
                    db.collection("userSyncState").document(uid),
                    {
                        "uid": uid,
                        "email": email,
                        "latestRevision": "history-schema:" + uuid.uuid4().hex[:16],
                        "lastSource": "history",
                        "lastUpdatedAt": int(datetime.now(UTC).timestamp() * 1000),
                    },
                    merge=True,
                )
            batch.commit(timeout=60)
            report["appliedDocuments"] += len(changes[offset : offset + 200])
            output.write_text(
                json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
            )
            print(
                json.dumps({"appliedHistoryDocuments": report["appliedDocuments"]}),
                flush=True,
            )
    if args.export_local:
        allowed = sorted(
            {
                value
                for key, value in vars(repo).items()
                if key.endswith("_COLLECTION") and isinstance(value, str)
            }
            | {repo.MANUAL_COLLECTION_ID, "vectorLibraryRecords", "assistantSessions"}
        )
        # OAuth secrets are not copied by this maintenance export.
        excluded = {"googleDriveConnections", "googleDriveOAuthStates"}
        args.export_local.parent.mkdir(parents=True, exist_ok=True)
        exported = 0
        with args.export_local.open("w", encoding="utf-8") as handle:
            for collection in allowed:
                if collection in excluded:
                    continue
                for doc in db.collection(collection).stream(timeout=60):
                    handle.write(
                        json.dumps(
                            {
                                "collection": collection,
                                "documentId": doc.id,
                                "data": json_safe(doc.to_dict() or {}),
                            },
                            ensure_ascii=False,
                        )
                        + "\n"
                    )
                    exported += 1
        report["exportedLocalDocuments"] = exported
    output.write_text(
        json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    print(json.dumps(report, ensure_ascii=False))


if __name__ == "__main__":
    main()
