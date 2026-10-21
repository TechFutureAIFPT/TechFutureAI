"""Redact credential values in the local database inspection API."""

from __future__ import annotations

import json
from typing import Any

SECRET_KEYS = {
    "accesstoken",
    "refreshtoken",
    "accesstokenencrypted",
    "refreshtokenencrypted",
    "privatekey",
    "password",
    "clientsecret",
    "idtoken",
    "apikey",
    "authorization",
    "secret",
    "secretkey",
    "passwordhash",
    "serviceaccountjson",
    "firebaseprivatekey",
    "codeverifier",
    "tokenhash",
}


def redact_database_value(value: Any, key: str = "") -> Any:
    if key.replace("_", "").casefold() in SECRET_KEYS:
        return "[REDACTED]"
    if isinstance(value, dict):
        return {
            name: redact_database_value(inner, str(name))
            for name, inner in value.items()
        }
    if isinstance(value, list):
        return [redact_database_value(item) for item in value]
    if isinstance(value, str) and value.lstrip().startswith(("{", "[")):
        try:
            parsed = json.loads(value)
            return json.dumps(redact_database_value(parsed), ensure_ascii=False)
        except (ValueError, TypeError):
            return value
    return value
