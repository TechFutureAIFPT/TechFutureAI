import argparse
import asyncio
import os
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

import uvicorn
from app.ai.ollama_client import get_ollama_client
from app.config import get_settings


async def check_preflight() -> bool:
    print("=" * 60)
    print("  SUPPORT HR - LOCAL AI & DATABASE SERVER PRE-FLIGHT CHECK")
    print("=" * 60)
    settings = get_settings()
    client = get_ollama_client()

    print(f"[*] Checking Ollama connection at {settings.ollama_base_url}...")
    health = await client.check_health()
    if not health.get("ollama_online"):
        print("[!] CẢNH BÁO: Không thể kết nối tới Ollama daemon tại http://localhost:11434!")
        print("    Vui lòng đảm bảo Ollama đã được khởi động bằng lệnh: 'ollama serve'")
        return False

    print(f"[✓] Ollama đang chạy! Tìm thấy {health.get('models_count')} mô hình.")

    if health.get("llm_ready"):
        print(f"[✓] Mô hình LLM chính đã sẵn sàng: {settings.local_llm_model}")
    else:
        print(f"[!] Cảnh báo: Mô hình {settings.local_llm_model} chưa tải. Các mô hình hiện có: {health.get('available_models')}")

    if health.get("cv_model_ready"):
        print(f"[✓] Mô hình chấm CV chuyên biệt đã sẵn sàng: {settings.local_cv_model}")
    else:
        print(f"[!] Cảnh báo: Mô hình chấm CV {settings.local_cv_model} chưa tải.")

    if health.get("embedding_ready"):
        print(f"[✓] Mô hình Embedding đã sẵn sàng: {settings.local_embedding_model} (768-dim)")
    else:
        print(f"[!] Cảnh báo: Mô hình {settings.local_embedding_model} chưa tải.")

    print(f"[✓] Cơ sở dữ liệu SQLite cục bộ: {settings.db_path}")
    print("=" * 60)
    return True


def main() -> None:
    settings = get_settings()
    parser = argparse.ArgumentParser(description="Run SupportHR Local AI & Database Server")
    parser.add_argument("--host", default=settings.host, help="Host address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=settings.port, help=f"Port number (default: {settings.port})")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    args = parser.parse_args()

    # Run pre-flight check
    is_ok = asyncio.run(check_preflight())
    if not is_ok:
        print("[!] Tiếp tục khởi động server (AI có thể suy giảm tính năng nếu Ollama chưa bật)...")

    print(f"\n🚀 Đang khởi chạy Local Server tại http://{args.host}:{args.port}")
    print(f"   - Tài liệu OpenAPI Swagger: http://{args.host}:{args.port}/docs")
    print(f"   - Kiểm tra sức khỏe: http://{args.host}:{args.port}/health")
    print(f"   - Nhấn Ctrl+C để dừng server.\n")

    uvicorn.run(
        "app.main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info",
    )


if __name__ == "__main__":
    main()
