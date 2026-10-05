from __future__ import annotations

import os
from functools import lru_cache

from dotenv import load_dotenv

load_dotenv()


class Settings:
    def __init__(self) -> None:
        self.gemini_api_key = os.getenv("GEMINI_API_KEY", "").strip()
        self.gemini_model = os.getenv("GEMINI_MODEL", "gemini-flash-latest").strip()

        self.tavily_api_key = os.getenv("TAVILY_API_KEY", "").strip()

        self.firebase_service_account_json = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON", "").strip()
        self.firebase_project_id = os.getenv("FIREBASE_PROJECT_ID", "").strip()
        self.firebase_client_email = os.getenv("FIREBASE_CLIENT_EMAIL", "").strip()
        self.firebase_private_key = os.getenv("FIREBASE_PRIVATE_KEY", "").strip()

        self.allowed_origins = [
            origin.strip()
            for origin in os.getenv("ALLOWED_ORIGINS", "").split(",")
            if origin.strip()
        ]
        self.port = int(os.getenv("PORT", "8080"))


@lru_cache
def get_settings() -> Settings:
    return Settings()
