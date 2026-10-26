from __future__ import annotations

import hashlib
import time
from typing import Any

from app.repositories.firestore import account_repository as repo
from app.schemas.account import AuthenticatedUser


COLLECTIONS = {
    "candidates": "workspaceCandidates",
    "jobs": "workspaceJobs",
}
METADATA_COLLECTION = "workspaceMetadata"


def _document_id(uid: str, record_id: str) -> str:
    return hashlib.sha256(f"{uid}:{record_id}".encode("utf-8")).hexdigest()


def is_initialized(user: AuthenticatedUser) -> bool:
    reference = repo.db().collection(METADATA_COLLECTION).document(_document_id(user.uid, "initialized"))
    return bool((reference.get().to_dict() or {}).get("initialized"))


def mark_initialized(user: AuthenticatedUser) -> None:
    reference = repo.db().collection(METADATA_COLLECTION).document(_document_id(user.uid, "initialized"))
    reference.set({"uid": user.uid, "initialized": True, "updatedAt": int(time.time() * 1000)})


def list_records(user: AuthenticatedUser, kind: str) -> list[dict[str, Any]]:
    collection_name = COLLECTIONS[kind]
    documents = (
        repo.db()
        .collection(collection_name)
        .where("uid", "==", user.uid)
        .stream()
    )
    records: list[dict[str, Any]] = []
    for document in documents:
        payload = document.to_dict() or {}
        payload.pop("uid", None)
        records.append(payload)
    return sorted(records, key=lambda item: int(item.get("updatedAt") or 0), reverse=True)


def save_record(user: AuthenticatedUser, kind: str, record: dict[str, Any]) -> dict[str, Any]:
    collection_name = COLLECTIONS[kind]
    record_id = str(record["id"])
    document_id = _document_id(user.uid, record_id)
    reference = repo.db().collection(collection_name).document(document_id)
    existing = reference.get().to_dict() or {}
    if existing and existing.get("uid") != user.uid:
        raise PermissionError("Workspace record ownership check failed.")

    now = int(time.time() * 1000)
    saved = {
        **record,
        "uid": user.uid,
        "createdAt": int(existing.get("createdAt") or now),
        "updatedAt": now,
    }
    reference.set(saved)
    saved.pop("uid", None)
    return saved


def delete_record(user: AuthenticatedUser, kind: str, record_id: str) -> bool:
    collection_name = COLLECTIONS[kind]
    reference = repo.db().collection(collection_name).document(_document_id(user.uid, record_id))
    existing = reference.get().to_dict() or {}
    if not existing or existing.get("uid") != user.uid:
        return False
    reference.delete()
    return True
