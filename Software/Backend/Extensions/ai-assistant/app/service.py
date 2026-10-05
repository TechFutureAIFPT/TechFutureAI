from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from firebase_admin import firestore as firebase_firestore

from app.auth import AuthenticatedUser
from app.firebase import get_firestore_client

MAX_SESSIONS_PER_USER = 100
MAX_MESSAGES_PER_SESSION = 200
DEFAULT_TITLE = "Cuộc trò chuyện mới"
COLLECTION = "assistantSessions"


def _sessions():
    return get_firestore_client().collection(COLLECTION)


def _to_millis(value: Any) -> int:
    if isinstance(value, datetime):
        return int(value.timestamp() * 1000)
    if isinstance(value, (int, float)):
        return int(value)
    return 0


def _serialize(value: Any) -> Any:
    if isinstance(value, dict):
        return {key: _serialize(item) for key, item in value.items()}
    if isinstance(value, list):
        return [_serialize(item) for item in value]
    if isinstance(value, datetime):
        return _to_millis(value)
    return value


def _user_sessions_query(uid: str, limit_count: int):
    try:
        return list(
            _sessions()
            .where("uid", "==", uid)
            .order_by("updatedAt", direction="DESCENDING")
            .limit(limit_count)
            .stream()
        )
    except Exception:
        docs = list(_sessions().where("uid", "==", uid).stream())
        docs.sort(key=lambda doc: _to_millis(doc.to_dict().get("updatedAt")), reverse=True)
        return docs[:limit_count]


def _cleanup_sessions(uid: str, keep_count: int = MAX_SESSIONS_PER_USER) -> None:
    docs = _user_sessions_query(uid, keep_count + 30)
    for doc in docs[keep_count:]:
        doc.reference.delete()


def get_owned_session_snapshot(user: AuthenticatedUser, session_id: str):
    snapshot = _sessions().document(session_id).get()
    if not snapshot.exists:
        return None
    data = snapshot.to_dict() or {}
    if data.get("uid") != user.uid:
        return None
    return snapshot


def create_session(user: AuthenticatedUser, title: str = "") -> str:
    doc_ref = _sessions().document()
    doc_ref.set(
        {
            "uid": user.uid,
            "email": user.email,
            "title": title.strip() or DEFAULT_TITLE,
            "messages": [],
            "messageCount": 0,
            "createdAt": firebase_firestore.SERVER_TIMESTAMP,
            "updatedAt": firebase_firestore.SERVER_TIMESTAMP,
            "lastMessageAt": int(datetime.now(timezone.utc).timestamp() * 1000),
        }
    )
    _cleanup_sessions(user.uid)
    return doc_ref.id


def build_messages_patch(snapshot: Any, messages: list[dict[str, object]]) -> dict[str, Any]:
    data = snapshot.to_dict() or {}
    current_messages = list(data.get("messages") or [])
    current_messages.extend(messages)
    if len(current_messages) > MAX_MESSAGES_PER_SESSION:
        current_messages = current_messages[-MAX_MESSAGES_PER_SESSION:]

    last_message_at = (
        current_messages[-1]["timestamp"] if current_messages else int(datetime.now(timezone.utc).timestamp() * 1000)
    )
    return {
        "messages": current_messages,
        "messageCount": len(current_messages),
        "lastMessageAt": last_message_at,
    }


def apply_session_patch(snapshot: Any, patch: dict[str, Any]) -> None:
    payload = dict(patch)
    payload["updatedAt"] = firebase_firestore.SERVER_TIMESTAMP
    snapshot.reference.set(payload, merge=True)


def get_user_sessions(user: AuthenticatedUser, limit_count: int = 20) -> list[dict[str, object]]:
    docs = _user_sessions_query(user.uid, limit_count)
    return [{"id": doc.id, **_serialize(doc.to_dict())} for doc in docs]


def get_session(user: AuthenticatedUser, session_id: str) -> dict[str, object] | None:
    snapshot = get_owned_session_snapshot(user, session_id)
    if snapshot is None:
        return None
    return {"id": snapshot.id, **_serialize(snapshot.to_dict() or {})}


def delete_session(user: AuthenticatedUser, session_id: str) -> bool:
    snapshot = get_owned_session_snapshot(user, session_id)
    if snapshot is None:
        return False
    snapshot.reference.delete()
    return True
