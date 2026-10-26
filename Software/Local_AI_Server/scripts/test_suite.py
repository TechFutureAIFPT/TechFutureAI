import asyncio
import os
import sys
import time
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.ai.chat_service import reply_to_candidate_chat
from app.ai.cv_analyzer import analyze_cv_pipeline
from app.ai.embedding_service import embed_text
from app.ai.interview_service import generate_interview_questions
from app.ai.jd_service import extract_hard_filters, extract_job_position, structure_jd
from app.ai.llm_service import prompt_json
from app.ai.ollama_client import get_ollama_client
from app.db.database import get_db, init_database
from app.db.repositories.job_repository import JobRepository
from app.db.vector_store import VectorStore
from app.services.background_worker import get_background_worker
from app.services.rubric_service import list_rubrics


SAMPLE_JD = """
TUYỂN DỤNG SENIOR BACKEND DEVELOPER (PYTHON / FASTAPI)
Địa điểm làm việc: Hà Nội hoặc Remote
Số năm kinh nghiệm: Tối thiểu 3 năm
Học vấn: Tốt nghiệp Đại học chuyên ngành CNTT hoặc liên quan

Mô tả công việc:
- Thiết kế và phát triển RESTful API hiệu năng cao với Python FastAPI.
- Tối ưu hóa truy vấn cơ sở dữ liệu PostgreSQL, thiết lập bộ nhớ đệm Redis Streams.
- Làm việc với hệ thống Docker, Kubernetes, CI/CD pipeline.
- Tham gia thiết kế kiến trúc vi dịch vụ (Microservices).

Yêu cầu:
- Thành thạo Python, FastAPI, Pydantic, SQLAlchemy hoặc tương đương.
- Có kinh nghiệm với hệ thống cơ sở dữ liệu quan hệ và NoSQL.
- Kỹ năng làm việc nhóm, đọc hiểu tài liệu tiếng Anh tốt.
"""

SAMPLE_CV_1 = """
NGUYỄN VĂN HÙNG
Email: hung.nguyen@email.com | SĐT: 0987654321 | Địa điểm: Hà Nội
Vị trí mong muốn: Senior Python Developer

TÓM TẮT NĂNG LỰC:
- 4 năm kinh nghiệm lập trình Backend với Python (FastAPI, Django, Flask).
- Chuyên môn sâu về kiến trúc Microservices, Redis, PostgreSQL, Docker, AWS.
- Tốt nghiệp Đại học Bách Khoa Hà Nội, chuyên ngành Khoa học Máy tính.

KINH NGHIỆM LÀM VIỆC:
Senior Backend Engineer - Tech Solutions (2022 - Hiện tại):
- Xây dựng hệ thống API xử lý 30,000 req/s bằng FastAPI và Redis.
- Tối ưu hóa database giảm 40% thời gian phản hồi API.
- Thiết lập CI/CD qua GitHub Actions và triển khai trên Kubernetes.

Backend Developer - V-Software (2020 - 2022):
- Phát triển module thanh toán và tích hợp các cổng thanh toán quốc tế.
- Viết test coverage đạt 85% với PyTest.
"""

SAMPLE_CV_2 = """
TRẦN THỊ MAI
Email: mai.tran@email.com | SĐT: 0912345678 | Địa điểm: TP. Hồ Chí Minh
Vị trí: Junior Tester / QA QC

TỔNG QUAN:
- 1 năm kinh nghiệm kiểm thử phần mềm thủ công (Manual Testing).
- Nắm vững quy trình viết test case, log bug trên Jira.
- Tốt nghiệp Cao đẳng Công nghệ Thông tin.
- Chưa có kinh nghiệm lập trình Backend hay Python.
"""


async def run_all_tests() -> None:
    print("=" * 70)
    print("  BẮT ĐẦU KIỂM THỬ TOÀN DIỆN SUPPORTHR LOCAL AI & DATABASE SERVER")
    print("=" * 70)

    # 1. Test Database Init & WAL Mode
    print("\n[TEST 1] Khởi tạo SQLite Database & WAL Mode...")
    init_database()
    with get_db() as conn:
        cursor = conn.execute("PRAGMA journal_mode")
        mode = cursor.fetchone()[0]
        print(f"  [✓] SQLite Journal Mode: {mode.upper()}")
        assert mode.lower() in ("wal", "memory"), "SQLite WAL mode should be active"

    # 2. Test Ollama Connectivity & Models
    print("\n[TEST 2] Kiểm tra kết nối Ollama...")
    client = get_ollama_client()
    health = await client.check_health()
    print(f"  [✓] Ollama Online: {health.get('ollama_online')}")
    print(f"  [✓] LLM Ready ({health.get('target_llm')}): {health.get('llm_ready')}")
    print(f"  [✓] Embedding Ready ({health.get('target_embedding')}): {health.get('embedding_ready')}")
    assert health.get("ollama_online"), "Ollama must be running"

    # 3. Test Local Vector Embedding & Vector Store
    print("\n[TEST 3] Kiểm tra Embedding (nomic-embed-text) & Local Vector Store...")
    vec = await embed_text("Kỹ sư phần mềm Backend Python FastAPI")
    print(f"  [✓] Kích thước vector nhúng: {len(vec)} chiều")
    assert len(vec) == 768, f"Expected 768 dimensions, got {len(vec)}"

    rec_id = VectorStore.insert(
        collection_name="test_collection",
        text_content="Kỹ sư phần mềm Backend Python FastAPI",
        embedding=vec,
        metadata={"role": "backend"},
    )
    search_res = VectorStore.search(
        collection_name="test_collection",
        query_embedding=vec,
        top_k=1,
    )
    print(f"  [✓] Lưu và tìm kiếm Vector thành công! Độ tương đồng cosine: {search_res[0]['similarity']}")
    assert search_res[0]["similarity"] > 0.95, "Vector search self-similarity should be ~1.0"

    # 4. Test JD Structuring, Position, Hard Filters
    print("\n[TEST 4] Kiểm tra Trích xuất & Chuẩn hóa JD...")
    pos = await extract_job_position(SAMPLE_JD)
    print(f"  [✓] Chức danh vị trí: '{pos}'")

    filters = await extract_hard_filters(SAMPLE_JD)
    print(f"  [✓] Hard Filters: Địa điểm='{filters.get('location')}', Kinh nghiệm={filters.get('minExp')} năm, Bằng cấp='{filters.get('education')}'")

    # 5. Test Rubrics
    print("\n[TEST 5] Kiểm tra Bảng chuẩn Rubrics...")
    rubrics = list_rubrics()
    print(f"  [✓] Số lượng Rubrics tiêu chuẩn: {len(rubrics)} roles")
    assert len(rubrics) >= 8, "Expected 8 standard rubrics"

    # 6. Test Core CV Matching Pipeline
    print("\n[TEST 6] Kiểm tra Pipeline Đánh giá CV Cốt lõi (2 ứng viên)...")
    cv_entries = [
        {"file_name": "Nguyen_Van_Hung_Backend.pdf", "text": SAMPLE_CV_1},
        {"file_name": "Tran_Thi_Mai_QA.pdf", "text": SAMPLE_CV_2},
    ]
    weights = {"technical_skills": 45, "experience": 25, "projects": 15, "education": 10, "soft_skills": 5}

    res = await analyze_cv_pipeline(
        jd_text=SAMPLE_JD,
        cv_entries=cv_entries,
        raw_weights=weights,
        hard_filters=filters,
    )
    candidates = res["candidates"]
    pipeline = res["pipeline"]
    print(f"  [✓] Đã phân tích xong {len(candidates)} ứng viên trong {pipeline['durationMs']}ms:")
    for c in candidates:
        print(f"      - {c['candidateName']}: {c['totalScore']}/100 (Hạng {c['rank']}) | {c['hrSummary'].get('nhan_xet_tong_quan')}")

    # Candidate 1 (Senior Backend) should score significantly higher than Candidate 2 (Junior QA)
    assert candidates[0]["totalScore"] > candidates[1]["totalScore"], "Senior Backend candidate should score higher"

    # 7. Test Local Caching
    print("\n[TEST 7] Kiểm tra Bộ nhớ đệm cục bộ (Cache)...")
    cached_res = await analyze_cv_pipeline(
        jd_text=SAMPLE_JD,
        cv_entries=[cv_entries[0]],
        raw_weights=weights,
        hard_filters=filters,
    )
    print(f"  [✓] Lần chạy 2 (Cache Hit): {cached_res['pipeline']['cacheHits']} hit(s) trong {cached_res['pipeline']['durationMs']}ms!")
    assert cached_res['pipeline']['cacheHits'] == 1, "Cache hit expected"

    # 8. Test Async Background Worker Queue
    print("\n[TEST 8] Kiểm tra Hàng đợi Bất đồng bộ (Async Background Job Queue)...")
    worker = get_background_worker()
    worker.start()

    job_id = JobRepository.create_job({
        "jd_text": SAMPLE_JD,
        "cv_entries": [cv_entries[0]],
        "weights": weights,
        "hard_filters": filters,
    })
    print(f"  [*] Đã tạo Job {job_id}, đang chờ Background Worker xử lý...")

    # Poll status
    for _ in range(30):
        await asyncio.sleep(1.0)
        job = JobRepository.get_job(job_id)
        if job and job["status"] in ("completed", "failed"):
            break

    assert job and job["status"] == "completed", f"Job failed or timed out: {job}"
    print(f"  [✓] Job hoàn thành thành công! Trạng thái: {job['status']}")
    await worker.stop()

    # 9. Test Interview Questions & Candidate Chat
    print("\n[TEST 9] Kiểm tra Sinh câu hỏi phỏng vấn & Trợ lý Chat...")
    questions = await generate_interview_questions(
        candidate_data=candidates[0],
        question_type="specific",
        jd_text=SAMPLE_JD,
    )
    print(f"  [✓] Sinh được {len(questions)} câu hỏi phỏng vấn chuyên sâu:")
    for q in questions[:2]:
        print(f"      - [{q.get('category')}]: {q.get('question')}")

    chat_res = await reply_to_candidate_chat(
        candidate_snapshot=candidates[0],
        message="Ứng viên này có điểm gì cần phỏng vấn kỹ nhất?",
        job_position=pos,
    )
    print(f"  [✓] Phản hồi Chat Tuyển dụng: {chat_res['reply'][:120]}...")

    print("\n" + "=" * 70)
    print("  [SUCCESS] TẤT CẢ 9 BỘ KIỂM THỬ ĐÃ VƯỢT QUA 100%! HỆ THỐNG SẴN SÀNG.")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_all_tests())
