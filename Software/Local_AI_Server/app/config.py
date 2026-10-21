import os
from functools import lru_cache
from pathlib import Path
from typing import List
from dotenv import load_dotenv

# Load environment file
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")


class Settings:
    def __init__(self) -> None:
        self.host: str = os.getenv("HOST", "127.0.0.1")
        self.port: int = int(os.getenv("PORT", "8088"))

        # Ollama Local AI Configuration
        self.ollama_base_url: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434").rstrip("/")
        self.local_llm_model: str = os.getenv("LOCAL_LLM_MODEL", "qwen2.5-coder:7b")
        self.local_llm_fallback_model: str = os.getenv("LOCAL_LLM_FALLBACK_MODEL", "qwen2.5-coder:7b")
        self.local_embedding_model: str = os.getenv("LOCAL_EMBEDDING_MODEL", "nomic-embed-text:latest")
        self.local_embedding_dimension: int = int(os.getenv("LOCAL_EMBEDDING_DIMENSION", "768"))

        # General AI tasks use Qwen; CV scoring uses a separate Ollama model profile.
        self.local_llm_temperature: float = float(os.getenv("LOCAL_LLM_TEMPERATURE", "0.1"))
        self.local_llm_top_p: float = float(os.getenv("LOCAL_LLM_TOP_P", "0.85"))
        self.local_llm_num_ctx: int = int(os.getenv("LOCAL_LLM_NUM_CTX", "8192"))
        self.local_llm_num_predict: int = int(os.getenv("LOCAL_LLM_NUM_PREDICT", "2048"))
        self.local_llm_repeat_penalty: float = float(os.getenv("LOCAL_LLM_REPEAT_PENALTY", "1.15"))

        # CV-only Ollama profile. General AI tasks continue to use local_llm_model.
        self.local_cv_model: str = os.getenv("LOCAL_CV_MODEL", "cv-match:7b").strip()
        self.local_cv_num_ctx: int = int(os.getenv("LOCAL_CV_NUM_CTX", "8192"))
        self.local_cv_num_predict: int = int(os.getenv("LOCAL_CV_NUM_PREDICT", "2048"))
        self.local_cv_timeout: float = float(os.getenv("LOCAL_CV_TIMEOUT", "240"))
        self.local_cv_keep_alive: str = os.getenv("LOCAL_CV_KEEP_ALIVE", "10m").strip()
        self.local_cv_seed: int = int(os.getenv("LOCAL_CV_SEED", "42"))
        self.local_cv_tokenizer_path: str = os.getenv("LOCAL_CV_TOKENIZER_PATH", "").strip()
        self.local_cv_tokenizer_model: str = os.getenv("LOCAL_CV_TOKENIZER_MODEL", "cv-match:7b").strip()
        self.rag_similarity_threshold: float = float(os.getenv("RAG_SIMILARITY_THRESHOLD", "0.55"))
        self.vector_index_version: str = "nomic-embed-text-768-v1"
        self.graph_rag_enabled: bool = False
        self.graph_rag_shadow_mode: bool = True
        self.rapidapi_key: str = os.getenv("RAPIDAPI_KEY", "")

        # Local Database Configuration
        db_path_rel = os.getenv("SQLITE_DB_PATH", "data/supporthr_local.db")
        self.db_path: Path = BASE_DIR / db_path_rel
        self.enable_wal_mode: bool = os.getenv("ENABLE_WAL_MODE", "true").lower() in ("1", "true", "yes")

        # Concurrency & Worker
        self.max_concurrent_jobs: int = int(os.getenv("MAX_CONCURRENT_JOBS", "2"))
        self.job_lease_seconds: int = int(os.getenv("JOB_LEASE_SECONDS", "3600"))

        # CORS
        raw_origins = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8088")
        self.cors_origins: List[str] = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

        # Local admin access uses a verified Google identity and revocable SQLite sessions.
        self.admin_email = os.getenv("ADMIN_EMAIL", "hoanphuc135@gmail.com").strip().casefold()
        self.admin_session_seconds = 8 * 60 * 60
        self.google_oauth_client_id = os.getenv("GOOGLE_OAUTH_CLIENT_ID", "").strip()
        self.google_oauth_client_secret = os.getenv("GOOGLE_OAUTH_CLIENT_SECRET", "").strip()
        self.google_oauth_redirect_uri = os.getenv(
            "GOOGLE_OAUTH_REDIRECT_URI",
            f"http://localhost:{self.port}/api/admin/google/callback",
        ).strip()
        self.google_drive_token_encryption_key = os.getenv("GOOGLE_DRIVE_TOKEN_ENCRYPTION_KEY", "").strip()
        raw_drive_origins = os.getenv(
            "GOOGLE_DRIVE_ALLOWED_ORIGINS",
            "http://localhost:3000,http://127.0.0.1:3000,http://localhost:8088,http://127.0.0.1:8088",
        )
        self.google_drive_allowed_origins: List[str] = [origin.strip().rstrip("/") for origin in raw_drive_origins.split(",") if origin.strip()]
        raw_admin_origins = os.getenv(
            "ADMIN_ALLOWED_ORIGINS",
            f"http://localhost:{self.port},http://127.0.0.1:{self.port},http://localhost:3010,http://127.0.0.1:3010",
        )
        self.admin_allowed_origins: List[str] = [origin.strip().rstrip("/") for origin in raw_admin_origins.split(",") if origin.strip()]


@lru_cache()
def get_settings() -> Settings:
    return Settings()
