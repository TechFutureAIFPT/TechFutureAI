import asyncio
import sys
from pathlib import Path

# Add project root to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.ai.embedding_service import embed_text
from app.db.database import init_database
from app.db.vector_store import VectorStore


EXEMPLARS = [
    {
        "id": "exemplar-backend-senior",
        "text": "Senior Backend Developer với 5 năm kinh nghiệm chuyên sâu về Python, FastAPI, kiến trúc Microservices, Redis Streams và tối ưu PostgreSQL. Thiết kế hệ thống chịu tải 50,000 req/s, CI/CD Docker & Kubernetes.",
        "metadata": {"role": "backend_developer", "seniority": "Senior", "domain": "IT", "standard_score": 92.0},
    },
    {
        "id": "exemplar-qa-automation",
        "text": "QA Lead với 4 năm kinh nghiệm kiểm thử tự động Automation Testing (Selenium, Playwright, PyTest), xây dựng CI test pipeline, kiểm thử tải JMeter, đảm bảo độ bao phủ test coverage trên 85%.",
        "metadata": {"role": "qa_engineer", "seniority": "Lead", "domain": "IT", "standard_score": 88.0},
    },
    {
        "id": "exemplar-data-scientist",
        "text": "Data Scientist / AI Engineer với 3 năm kinh nghiệm huấn luyện LLM, Fine-tuning, RAG, PyTorch, Scikit-learn, LangChain, xây dựng mô hình Vector Search và phân loại văn bản tiếng Việt.",
        "metadata": {"role": "data_scientist", "seniority": "Middle", "domain": "AI", "standard_score": 90.0},
    },
    {
        "id": "exemplar-sales-b2b",
        "text": "Chuyên viên Kinh doanh B2B SaaS với 4 năm kinh nghiệm phát triển khách hàng doanh nghiệp, đạt 140% KPI doanh số năm 2024, kỹ năng đàm phán hợp đồng lớn và quản lý phễu CRM.",
        "metadata": {"role": "sales_executive", "seniority": "Senior", "domain": "Sales", "standard_score": 86.0},
    },
]


async def seed() -> None:
    print("[*] Khởi tạo cơ sở dữ liệu SQLite...")
    init_database()

    print(f"[*] Đang nhúng vector (embedding) cho {len(EXEMPLARS)} mẫu tham chiếu RAG...")
    for item in EXEMPLARS:
        print(f"    - Đang xử lý: {item['id']}...")
        vec = await embed_text(item["text"])
        VectorStore.insert(
            collection_name="approvedExemplars",
            text_content=item["text"],
            embedding=vec,
            doc_id=item["id"],
            metadata=item["metadata"],
        )

    count = VectorStore.count("approvedExemplars")
    print(f"[✓] Đã seed thành công! Tổng số vector mẫu trong cơ sở dữ liệu: {count}")


if __name__ == "__main__":
    asyncio.run(seed())
