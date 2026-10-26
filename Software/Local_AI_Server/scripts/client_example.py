"""
Ví dụ cách gửi yêu cầu HTTP tới SupportHR Local AI & Database Server
"""

import json
import urllib.request

SERVER_URL = "http://127.0.0.1:8088"


def test_health():
    print("[*] Kiểm tra sức khỏe máy chủ...")
    req = urllib.request.Request(f"{SERVER_URL}/health")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"[✓] Trạng thái: {data.get('status')}")
        print(f"    - LLM: {data.get('local_ai', {}).get('target_llm')}")
        print(f"    - Database: {data.get('database', {}).get('type')}")


def test_jd_extract():
    print("\n[*] Thử nghiệm bóc tách vị trí từ JD...")
    payload = {
        "jd_text": "Tuyển dụng Chuyên viên Phân tích Dữ liệu (Data Analyst). Yêu cầu SQL, Power BI, Python..."
    }
    req = urllib.request.Request(
        f"{SERVER_URL}/api/jd/position",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"[✓] Vị trí trích xuất: {data.get('job_position')}")


def test_database_stats():
    print("\n[*] Lấy thống kê cơ sở dữ liệu SQLite cục bộ...")
    req = urllib.request.Request(f"{SERVER_URL}/api/database/stats")
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode("utf-8"))
        print(f"[✓] File DB: {data.get('db_file_path')}")
        print(f"    - Bảng dữ liệu: {data.get('tables')}")
        print(f"    - Số lượng Vector nhúng: {data.get('vector_count')}")


if __name__ == "__main__":
    try:
        test_health()
        test_jd_extract()
        test_database_stats()
    except Exception as err:
        print(f"[!] Không thể kết nối tới server ({err}). Đảm bảo server đang chạy tại {SERVER_URL}.")
