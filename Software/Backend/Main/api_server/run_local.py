"""Run the production business API with SQL + local Ollama providers."""
from __future__ import annotations

import argparse
import json
import os
from pathlib import Path

from dotenv import load_dotenv


def configure_local() -> dict:
    root = Path(__file__).resolve().parent
    load_dotenv(root / ".env.local-runtime", override=True)
    oauth_file = os.getenv("GOOGLE_OAUTH_CLIENT_FILE", "").strip()
    if oauth_file:
        payload = json.loads(Path(oauth_file).expanduser().read_text(encoding="utf-8"))
        client = payload.get("web")
        if not isinstance(client, dict):
            raise ValueError("Google sign-in requires an OAuth Web application client JSON file")
        for field, variable in (("client_id", "GOOGLE_OAUTH_CLIENT_ID"), ("client_secret", "GOOGLE_OAUTH_CLIENT_SECRET")):
            if not client.get(field): raise ValueError(f"OAuth client file lacks {field}")
            os.environ[variable] = client[field]
    # Select providers in this process only. The deployed cloud .env is untouched.
    provider = os.getenv("LOCAL_AI_DEFAULT_PROVIDER", "ollama").strip().lower()
    if provider not in {"gemini", "ollama"}:
        provider = "ollama"
    os.environ.update({"DATA_PROVIDER": "sqlite", "AUTH_PROVIDER": "sql", "AI_PROVIDER": provider, "CV_ANALYSIS_PROVIDER": provider, "LOCAL_AI_CONTROL_ENABLED": "true", "FIREBASE_APPCHECK_ENFORCE": "0", "ANALYSIS_JOB_MODE": "in_process", "REDIS_URL": "", "REDIS_INTERNAL_URL": ""})
    os.environ.setdefault("SQLITE_DB_PATH", str(root.parents[2] / "Local_AI_Server/data/supporthr_local.db"))
    os.environ.setdefault("LOCAL_LLM_MODEL", "qwen2.5-coder:7b")
    os.environ.setdefault("LOCAL_CV_MODEL", "cv-match:7b-local-sft-v2")
    tokenizer = root.parent / ".cache/qwen2.5-coder-7b-instruct-hf/tokenizer.json"
    if tokenizer.is_file():
        os.environ.setdefault("LOCAL_CV_TOKENIZER_PATH", str(tokenizer))
        os.environ.setdefault("LOCAL_CV_TOKENIZER_MODEL", os.environ["LOCAL_CV_MODEL"])
    os.environ.setdefault("LOCAL_EMBEDDING_MODEL", "nomic-embed-text:latest")
    if provider == "ollama":
        os.environ["VECTOR_INDEX_VERSION"] = "nomic-embed-text-768-local-v2"
    else:
        os.environ.setdefault("GEMINI_EMBEDDING_MODEL", "gemini-embedding-2")
        os.environ.setdefault("VECTOR_INDEX_VERSION", "gemini-embedding-2-768-v1")
    os.environ.setdefault("FRONTEND_ORIGIN", "http://localhost:3010")
    os.environ.setdefault("LOCAL_AUTH_REDIRECT_URI", "http://localhost:8010/api/auth/google/callback")
    os.environ.setdefault("GOOGLE_DRIVE_ALLOWED_ORIGINS", "http://localhost:3010,http://localhost:3000,http://localhost:8088,http://127.0.0.1:3010,http://127.0.0.1:8088")
    return {"dataProvider": "sqlite", "authProvider": "sql", "aiProvider": provider, "database": os.environ["SQLITE_DB_PATH"], "googleOAuthConfigured": bool(os.getenv("GOOGLE_OAUTH_CLIENT_ID") and os.getenv("GOOGLE_OAUTH_CLIENT_SECRET"))}


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8010)
    args = parser.parse_args()
    print(json.dumps(configure_local()), flush=True)
    import uvicorn
    # Structured request audits already record the path. Suppress Uvicorn's raw
    # query-string logs so Google authorization codes never enter access logs.
    uvicorn.run("app.main:app", host="127.0.0.1", port=args.port, workers=1, access_log=False)
