import sys
from pathlib import Path

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from fastapi.testclient import TestClient
from app.main import app
from app.services.salary_market_service import estimate_salary_fallback
from app.services.salary_analysis_service import analyze_salary

def test_all_algorithms():
    print("==================================================================")
    print("   TESTING PORTED ALGORITHMS ON LOCAL AI & DATABASE ENGINE        ")
    print("==================================================================")

    # 1. Test Salary Market Estimation
    print("[*] 1. Kiểm tra thuật toán ước tính lương thị trường...")
    sal_est = estimate_salary_fallback("Senior Backend Engineer", "Ho Chi Minh", 5.0)
    print(f"    - Kết quả: P25={sal_est['p25']:,} VND | Median={sal_est['median']:,} VND | P75={sal_est['p75']:,} VND")
    assert sal_est["median"] > 0
    assert sal_est["currency"] == "VND"
    print("    [✓] Thuật toán ước tính lương: PASS")

    # 2. Test Salary Analysis Service
    print("[*] 2. Kiểm tra phân tích mức lương và mẹo đàm phán...")
    sal_ana = analyze_salary("Backend Developer", location="Hanoi", years_of_experience=3.0, current_salary=18000000)
    print(f"    - Nhận định: {sal_ana['summary']}")
    print(f"    - Khuyến nghị: {sal_ana['recommendation']}")
    assert len(sal_ana["negotiationTips"]) >= 2
    print("    [✓] Dịch vụ phân tích lương: PASS")

    # 3. Test TestClient HTTP Endpoints
    client = TestClient(app)

    print("[*] 3. Kiểm tra endpoint API /api/salary/analyze qua FastAPI TestClient...")
    res_sal = client.post("/api/salary/analyze", json={
        "job_title": "Frontend React Engineer",
        "location": "Ho Chi Minh",
        "years_of_experience": 4.0,
        "current_salary": 25000000
    })
    assert res_sal.status_code == 200, f"Error {res_sal.status_code}: {res_sal.text}"
    print(f"    - API Response Summary: {res_sal.json().get('summary')}")
    print("    [✓] Endpoint /api/salary/analyze: PASS")

    print("[*] 4. Kiểm tra endpoint API /api/salary/market...")
    res_mkt = client.get("/api/salary/market?job_title=DevOps%20Engineer&location=Hanoi&years_of_experience=3")
    assert res_mkt.status_code == 200
    print(f"    - Market Source: {res_mkt.json().get('source')}")
    print("    [✓] Endpoint /api/salary/market: PASS")

    print("[*] 5. Kiểm tra phân loại ngành nghề /api/cv/classifier-status...")
    res_cls = client.get("/api/cv/classifier-status")
    assert res_cls.status_code == 200
    assert res_cls.json().get("ready") is True
    print("    [✓] Endpoint /api/cv/classifier-status: PASS")

    print("[*] 6. Kiểm tra cấu trúc JD /api/jd/hard-filters...")
    test_jd = """
    Tuyển dụng Senior Python FastAPI Developer tại Hà Nội.
    Yêu cầu:
    - Tối thiểu 4 năm kinh nghiệm phát triển backend Python.
    - Thành thạo FastAPI, PostgreSQL, Redis, Docker, Microservices.
    - Tốt nghiệp Đại học chuyên ngành CNTT hoặc tương đương.
    - Tiếng Anh giao tiếp tốt (IELTS 6.0+).
    """
    res_hf = client.post("/api/jd/hard-filters", json={"jd_text": test_jd})
    assert res_hf.status_code == 200
    filters = res_hf.json().get("filters", {})
    print(f"    - Trích xuất filters: {filters}")
    print("    [✓] Endpoint /api/jd/hard-filters: PASS")

    print("[*] 7. Kiểm tra phân tích CV với Full Pipeline (Core Analysis)...")
    test_cv = """
    Nguyễn Văn Nam - Senior Backend Developer
    Email: nam.nguyen@example.com - SĐT: 0912345678
    Địa chỉ: Cầu Giấy, Hà Nội

    TÓM TẮT:
    Hơn 5 năm kinh nghiệm lập trình Backend với Python, FastAPI, Django, PostgreSQL, Redis và Docker.
    Đã xây dựng hệ thống xử lý 5 triệu request/ngày, tối ưu truy vấn SQL giảm 40% độ trễ.

    KINH NGHIỆM:
    - Senior Backend Engineer tại TechCorp (2021 - Nay): Thiết kế microservices với FastAPI, PostgreSQL, Kafka, Redis.
    - Python Developer tại DataSys (2019 - 2021): Xây dựng RESTful API với Django và Flask.

    HỌC VẤN:
    - Đại học Bách Khoa Hà Nội - Kỹ sư Công nghệ thông tin (2014 - 2019).
    """
    res_cv = client.post("/api/cv/analyze", json={
        "jd_text": test_jd,
        "cv_entries": [{"file_name": "NguyenVanNam_CV.pdf", "text": test_cv}],
        "weights": {"technical_skills": 40, "experience": 30, "education": 15, "projects": 15},
        "hard_filters": {"location": "Hà Nội", "minExp": "4", "education": "Đại học"}
    })
    assert res_cv.status_code == 200, f"Error {res_cv.status_code}: {res_cv.text}"
    cv_data = res_cv.json()
    candidates = cv_data.get("candidates", [])
    assert len(candidates) >= 1
    c0 = candidates[0]
    print(f"    - Ứng viên: {c0.get('candidateName')}")
    print(f"    - Tổng điểm: {c0.get('totalScore')} | Xếp hạng: {c0.get('rank')}")
    print(f"    - Nhận xét HR: {c0.get('hrSummary', {}).get('nhan_xet_tong_quan')}")
    print("    [✓] Pipeline Phân Tích CV Toàn Diện: PASS 100%")

    print("\n==================================================================")
    print("   [TẤT CẢ 7 HẠNG MỤC THUẬT TOÁN ĐÃ CHẠY THÀNH CÔNG HOÀN TOÀN!]   ")
    print("==================================================================")

if __name__ == "__main__":
    test_all_algorithms()
