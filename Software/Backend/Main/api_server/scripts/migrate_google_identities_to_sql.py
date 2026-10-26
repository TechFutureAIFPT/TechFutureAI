"""One-time verified Firebase Auth -> SQL Google subject mapping.

Reads Firebase Auth provider identities, never trusts Firestore profile emails.
Default previews counts. --apply backs up SQL and preserves existing user UIDs.
No password, OAuth token or service-account key is exported.
"""
from __future__ import annotations

import argparse
import json
import secrets
import sqlite3
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from run_local import configure_local
configure_local()
from app.core.config import get_settings
from app.integrations.firebase_admin import get_firebase_app


def migrate(apply: bool) -> dict:
    from firebase_admin import auth
    path = Path(get_settings().sqlite_path).resolve()
    with sqlite3.connect(f"file:{path.as_posix()}?mode=ro", uri=True) as conn:
        candidates = conn.execute("SELECT uid,email FROM users WHERE uid NOT LIKE 'local:%' AND uid NOT LIKE 'google:%' AND email IS NOT NULL").fetchall()
    expected = {uid: email.casefold() for uid, email in candidates}
    verified = []
    app = get_firebase_app() if candidates else None
    for offset in range(0, len(candidates), 100):
        records = auth.get_users([auth.UidIdentifier(uid) for uid, _ in candidates[offset:offset + 100]], app=app)
        for user in records.users:
            if user.disabled or not user.email_verified or str(user.email or "").casefold() != expected.get(user.uid):
                continue
            providers = [provider for provider in user.provider_data if provider.provider_id == "google.com" and provider.uid]
            if len(providers) == 1:
                verified.append((providers[0].uid, user.uid, str(user.email).casefold()))
    inserted, conflicts = 0, 0
    if apply and verified:
        from app.integrations.sqlite_documents import get_sqlite_client
        client = get_sqlite_client()
        backups = path.parent / "backups"
        backups.mkdir(exist_ok=True)
        with client.connection() as conn, sqlite3.connect(backups / f"before-google-identity-map-{datetime.now(timezone.utc):%Y%m%dT%H%M%S}-{secrets.token_hex(3)}.db") as backup:
            conn.backup(backup)
        with client.connection(write=True) as conn:
            for subject, uid, email in verified:
                existing = conn.execute("SELECT subject,uid FROM local_google_identities WHERE subject=? OR uid=?", (subject, uid)).fetchall()
                if existing and existing != [(subject, uid)]:
                    conflicts += 1
                    continue
                if not existing:
                    conn.execute("INSERT INTO local_google_identities VALUES(?,?,?)", (subject, uid, email))
                    inserted += 1
    return {"mode": "apply" if apply else "preview", "legacyCandidates": len(candidates), "verifiedGoogleIdentities": len(verified), "inserted": inserted, "conflictsSkipped": conflicts, "firebaseWrites": 0, "tokensExported": 0}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--apply", action="store_true")
    args = parser.parse_args()
    print(json.dumps(migrate(args.apply)), flush=True)
