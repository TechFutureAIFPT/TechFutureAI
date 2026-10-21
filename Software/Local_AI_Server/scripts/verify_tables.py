import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

from app.db.database import get_connection, init_database

init_database()

conn = get_connection()
cursor = conn.execute("SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")
tables = [row[0] for row in cursor.fetchall()]

print(f"Tổng số bảng đã tạo trong Local SQLite Database: {len(tables)} bảng")
print("-" * 50)
for index, table_name in enumerate(tables, start=1):
    count_cur = conn.execute(f"SELECT COUNT(*) FROM [{table_name}]")
    row_count = count_cur.fetchone()[0]
    print(f"[{index:02d}] {table_name:<28} (Số bản ghi: {row_count})")
print("-" * 50)
