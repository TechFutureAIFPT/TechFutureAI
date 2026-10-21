from contextlib import asynccontextmanager
import json
import logging
import secrets
from pathlib import Path
from typing import AsyncGenerator
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles

TEMPLATE_DIR = Path(__file__).resolve().parent / "templates"

from app.api.routes import (
    ai_routes,
    db_routes,
    file_routes,
    health_routes,
    job_routes,
    admin_routes,
    drive_routes,
    local_auth_routes,
)
from app.config import get_settings
from app.db.database import init_database
from app.services.background_worker import get_background_worker
from app.services.admin_auth_service import CSRF_COOKIE, require_admin

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("LocalAIServer")


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    # Startup
    logger.info("==================================================")
    logger.info("   Starting SupportHR Local AI & Database Server  ")
    logger.info("==================================================")
    settings = get_settings()
    logger.info(f"Target LLM: {settings.local_llm_model}")
    logger.info(f"CV specialist model: {settings.local_cv_model}")
    logger.info(f"Target Embedding: {settings.local_embedding_model}")
    logger.info(f"SQLite DB: {settings.db_path}")

    # 1. Initialize local SQLite schema & WAL mode
    init_database()
    logger.info("[Database] Local SQLite tables and indexes initialized.")

    # 2. Start background worker for async CV jobs
    worker = get_background_worker()
    worker.start()

    yield

    # Shutdown
    logger.info("[Shutdown] Stopping background worker...")
    if worker:
        await worker.stop()
    logger.info("[Shutdown] Server stopped successfully.")


settings = get_settings()

app = FastAPI(
    title="SupportHR Local AI & Database Server",
    description="Local AI runtime powered by Ollama Qwen, CV Match, Nomic embeddings, and SQLite.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount all API routers
app.include_router(health_routes.router)
app.include_router(ai_routes.router)
app.include_router(job_routes.router)
app.include_router(file_routes.router)
app.include_router(db_routes.router)
app.include_router(admin_routes.router)
app.include_router(drive_routes.router)
app.include_router(local_auth_routes.router)
app.mount("/admin/assets", StaticFiles(directory=TEMPLATE_DIR.parent / "static"), name="admin-assets")


@app.middleware("http")
async def protect_admin_responses(request: Request, call_next):
    response = await call_next(request)
    if request.url.path.startswith(("/admin", "/dashboard", "/api/admin", "/api/database")):
        response.headers["Cache-Control"] = "no-store, private"
        response.headers["Vary"] = "Cookie, Authorization"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["Referrer-Policy"] = "same-origin"
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src 'self' https://oauth2.googleapis.com https://www.googleapis.com https://accounts.google.com; frame-src 'self'; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"
    return response


def render_admin_template(name: str, request: Request, profile: dict | None = None) -> HTMLResponse:
    csrf = request.cookies.get(CSRF_COOKIE) or secrets.token_urlsafe(32)
    config = {"csrf": csrf, "profile": profile}
    content = (TEMPLATE_DIR / name).read_text(encoding="utf-8")
    content = content.replace("__ADMIN_CONFIG__", json.dumps(config, ensure_ascii=False).replace("<", "\\u003c"))
    response = HTMLResponse(content)
    response.set_cookie(CSRF_COOKIE, csrf, httponly=True, secure=request.url.scheme == "https", samesite="strict", path="/")
    return response


@app.get("/admin/brand.svg", include_in_schema=False)
def admin_brand() -> FileResponse:
    path = Path(__file__).resolve().parents[2] / "Frontend/Desktop/public/brand/ai-match-suite/ai-match-mark.svg"
    return FileResponse(path, media_type="image/svg+xml")


@app.get("/admin/login", response_class=HTMLResponse, include_in_schema=False)
def admin_login(request: Request) -> HTMLResponse:
    return render_admin_template("admin-login.html", request)


@app.get("/", include_in_schema=False)
async def root_redirect() -> RedirectResponse:
    return RedirectResponse(url="/dashboard")


@app.get("/dashboard", response_class=HTMLResponse, include_in_schema=False)
def serve_dashboard(request: Request):
    try:
        actor = require_admin(request)
    except HTTPException as error:
        if error.status_code in {401, 403}:
            return RedirectResponse("/admin/login", status_code=303)
        raise
    return render_admin_template("admin-dashboard.html", request, actor)


@app.exception_handler(HTTPException)
async def admin_http_error(request: Request, exc: HTTPException) -> JSONResponse:
    if request.url.path.startswith(("/api/admin", "/api/database")):
        return JSONResponse(status_code=exc.status_code, content={"success": False, "data": None, "error": {"code": str(exc.status_code), "message": exc.detail}}, headers=exc.headers)
    return JSONResponse(status_code=exc.status_code, content={"detail": exc.detail}, headers=exc.headers)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception) -> JSONResponse:
    logger.error("Unhandled server error path=%s type=%s", request.url.path, type(exc).__name__)
    return JSONResponse(
        status_code=500,
        content={"detail": "Máy chủ chưa xử lý được yêu cầu. Vui lòng thử lại hoặc kiểm tra nhật ký máy chủ."},
    )
