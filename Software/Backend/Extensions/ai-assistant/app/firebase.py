from __future__ import annotations

import json
from functools import lru_cache
from typing import Any

import firebase_admin
from firebase_admin import auth as firebase_auth
from firebase_admin import credentials, firestore

from app.config import get_settings


def _service_account_payload() -> dict[str, Any] | None:
    settings = get_settings()
    raw = settings.firebase_service_account_json
    if raw:
        if raw.startswith("{"):
            return json.loads(raw)
        with open(raw, "r", encoding="utf-8") as handle:
            return json.load(handle)

    if settings.firebase_project_id and settings.firebase_client_email and settings.firebase_private_key:
        return {
            "type": "service_account",
            "project_id": settings.firebase_project_id,
            "client_email": settings.firebase_client_email,
            "private_key": settings.firebase_private_key.replace("\\n", "\n"),
            "token_uri": "https://oauth2.googleapis.com/token",
        }
    return None


@lru_cache
def get_firebase_app() -> Any:
    if firebase_admin._apps:
        return firebase_admin.get_app()

    payload = _service_account_payload()
    if not payload:
        raise RuntimeError(
            "Thiếu cấu hình Firebase service account "
            "(đặt FIREBASE_SERVICE_ACCOUNT_JSON hoặc FIREBASE_PROJECT_ID/FIREBASE_CLIENT_EMAIL/FIREBASE_PRIVATE_KEY)."
        )
    credential = credentials.Certificate(payload)
    return firebase_admin.initialize_app(credential, options={"projectId": payload["project_id"]})


def get_firestore_client() -> Any:
    return firestore.client(get_firebase_app())


def verify_firebase_token(id_token: str) -> dict[str, Any]:
    return firebase_auth.verify_id_token(id_token, app=get_firebase_app(), check_revoked=True)


def firestore_ready() -> bool:
    try:
        get_firestore_client().collection("assistantSessions").limit(1).get()
        return True
    except Exception:
        return False
