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

def test_routes():
    client = TestClient(app)

    # 1. Test root redirect
    r_root = client.get("/", follow_redirects=False)
    print(f"GET / status: {r_root.status_code}, Location: {r_root.headers.get('location')}")
    assert r_root.status_code in (302, 307)

    # Anonymous clients must only see the sign-in page.
    r_dash = client.get("/dashboard", follow_redirects=False)
    assert r_dash.status_code == 303
    assert r_dash.headers["location"] == "/admin/login"
    r_login = client.get("/admin/login")
    assert r_login.status_code == 200
    assert "Đăng nhập quản trị" in r_login.text

    # 3. Test list tables
    r_tables = client.get("/api/database/tables")
    print(f"GET /api/database/tables status: {r_tables.status_code}")
    assert r_tables.status_code == 401

    # 4. Test table rows for 'users'
    r_rows = client.get("/api/database/tables/users/rows?limit=10")
    print(f"GET /api/database/tables/users/rows status: {r_rows.status_code}")
    assert r_rows.status_code == 401

    # 5. Test table rows for 'vector_records'
    r_vec = client.get("/api/database/tables/vector_records/rows?limit=5")
    assert r_vec.status_code == 401

    print("\n[PASS] Trang quản trị và các API dữ liệu chặn truy cập chưa đăng nhập. Các trường hợp tài khoản admin được kiểm tra trong tests/test_admin_security.py.")

if __name__ == "__main__":
    test_routes()
