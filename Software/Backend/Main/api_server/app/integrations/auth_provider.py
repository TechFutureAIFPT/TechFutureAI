from __future__ import annotations

from typing import Any

from app.integrations.firebase_admin import verify_firebase_token


def verify_access_token(token: str) -> dict[str, Any]:
    from app.core.config import get_settings
    if get_settings().auth_provider == "sql":
        from app.services.sql_auth_service import verify_session
        return verify_session(token)
    return verify_firebase_token(token)
