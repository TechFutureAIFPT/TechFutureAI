"""
Script kiểm tra toàn diện môi trường Local AI & PostgreSQL + pgvector:
1. Kiểm tra Ollama và Model nomic-embed-text (GPU RTX 4050)
2. Kiểm tra kết nối PostgreSQL và Extension vector
3. Thử nghiệm trích xuất vector và tìm kiếm tương đồng (Cosine Similarity <->)
"""

import asyncio
import sys

# Configure UTF-8 encoding for Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.services.local_embedding_service import get_local_embedding_service
from app.core.database import async_engine, Base
from sqlalchemy import text


async def main() -> None:
    print("=" * 60)
    print(" BẮT ĐẦU KIỂM TRA MÔI TRƯỜNG LOCAL AI & PGVECTOR")
    print("=" * 60)

    # 1. Kiểm tra Local Embedding với Ollama
    print("\n[1/3] Kiểm tra Local Embedding Service (Ollama nomic-embed-text)...")
    try:
        svc = get_local_embedding_service()
        sample_text = "Senior Python Backend Engineer có kinh nghiệm thiết kế kiến trúc FastAPI, PostgreSQL và hệ thống AI RAG."
        vec = svc.embed_text(sample_text)
        if vec and len(vec) == 768:
            print(f" -> Thành công! Kích thước Vector: {len(vec)} chiều.")
            print(f" -> Mẫu vector (5 giá trị đầu): {[round(x, 4) for x in vec[:5]]}")
        else:
            print(f" -> Thất bại: Không nhận được vector hợp lệ (độ dài: {len(vec)}).")
            return
    except Exception as exc:
        print(f" -> Lỗi khi gọi Ollama: {exc}")
        return

    # 2. Kiểm tra kết nối PostgreSQL + pgvector
    print("\n[2/3] Kiểm tra kết nối PostgreSQL và extension pgvector...")
    try:
        async with async_engine.connect() as conn:
            # Check version
            res_ver = await conn.execute(text("SELECT version();"))
            db_version = res_ver.scalar()
            print(f" -> Kết nối thành công tới PostgreSQL!\n    Phiên bản: {db_version}")

            # Check pgvector extension
            res_ext = await conn.execute(
                text("SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';")
            )
            row = res_ext.fetchone()
            if row:
                print(f" -> Extension 'vector' đã kích hoạt: v{row[1]}")
            else:
                print(" -> Kích hoạt extension vector...")
                await conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
                print(" -> Đã kích hoạt extension vector thành công!")

            # 3. Test vector distance calculation trực tiếp trên SQL
            print("\n[3/3] Kiểm tra phép toán Cosine Distance (<=>) trên pgvector...")
            test_query = text(
                """
                SELECT 1.0 - ('[1, 0, 0]'::vector(3) <=> '[0.9, 0.1, 0]'::vector(3)) AS similarity;
                """
            )
            res_sim = await conn.execute(test_query)
            sim_val = res_sim.scalar()
            print(f" -> Cosine similarity tính toán trên PostgreSQL: {sim_val:.4f}")

        print("\n" + "=" * 60)
        print(" TẤT CẢ CÁC BƯỚC ĐÃ SẴN SÀNG HOÀN HẢO!")
        print("=" * 60)

    except Exception as exc:
        print("\n" + "!" * 60)
        print(" [CHÚ Ý] Chưa kết nối được vào PostgreSQL Server.")
        print(f" Chi tiết: {exc}")
        print("\n Hướng dẫn khởi chạy Container PostgreSQL 16 + pgvector:")
        print(" 1. Mở Docker Desktop trên máy.")
        print(" 2. Chạy lệnh sau trong thư mục 'D:\\cv match\\Software\\Backend\\Main':")
        print("    docker compose -f docker-compose.postgres.yml up -d")
        print(" 3. Sau khi container 'supporthr-postgres' chạy, chạy lại script này:")
        print("    python scripts/test_pgvector_setup.py")
        print("!" * 60)


if __name__ == "__main__":
    asyncio.run(main())
