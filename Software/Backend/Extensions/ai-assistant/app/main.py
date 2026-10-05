from __future__ import annotations

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.firebase import firestore_ready
from app.routes import router as assistant_router

DEFAULT_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://www.aimatching.com.vn",
    "https://aimatching.com.vn",
    "https://www.supporthr-tf.com.vn",
    "https://supporthr-tf.com.vn",
]

# Bao trùm localhost + các domain preview/deploy phổ biến (Vercel, Netlify,
# Cloudflare Pages, Railway, Render) + production domains.
ORIGIN_REGEX = (
    r"^(https?://(localhost|127\.0\.0\.1)(:\d+)?"
    r"|https://.*\.vercel\.app"
    r"|https://.*\.netlify\.app"
    r"|https://.*\.pages\.dev"
    r"|https://.*\.railway\.app"
    r"|https://.*\.up\.railway\.app"
    r"|https://.*\.onrender\.com"
    r"|https://.*\.koyeb\.app"
    r"|https://(www\.)?aimatching\.com\.vn"
    r"|https://(www\.)?supporthr-tf\.com\.vn)$"
)

app = FastAPI(title="SupportHR AI Assistant Service")

settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=DEFAULT_ORIGINS + settings.allowed_origins,
    allow_origin_regex=ORIGIN_REGEX,
    allow_credentials=False,
    allow_methods=["GET", "POST", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Request-Id"],
)

app.include_router(assistant_router)


@app.get("/health")
def health():
    return {
        "status": "ok",
        "firestore": firestore_ready(),
        "gemini_configured": bool(settings.gemini_api_key),
    }
