import os
import re
import time
from datetime import datetime, timezone
from typing import Any, Dict, List
from fastapi import APIRouter, Depends, HTTPException, Query

import httpx

from app.services.admin_auth_service import require_admin
from app.config import get_settings
from app.db.database import get_db
from app.db.privacy import redact_database_value
from app.db.repositories.history_repository import HistoryRepository
from app.schemas.database import DatabaseStatsResponse, HistoryItemResponse

router = APIRouter(prefix="/api/database", tags=["database"], dependencies=[Depends(require_admin)])


BUSINESS_TABLE_DESCRIPTIONS = {
    "users": "Hồ sơ người dùng và phân quyền",
    "userSettings": "Cài đặt cá nhân và tùy chọn tuyển dụng",
    "cvHistory": "Lịch sử phân tích CV và xếp hạng",
    "syncedAnalysisCache": "Bộ nhớ đệm kết quả phân tích",
    "uploadedFiles": "Tệp tải lên và văn bản đã trích xuất",
    "userJDTemplates": "Mẫu mô tả công việc đã lưu",
    "chatbotSessions": "Lịch sử hội thoại trợ lý tuyển dụng",
    "googleDriveConnections": "Kết nối Google Drive đã lưu",
    "analysisFeedback": "Phản hồi của nhà tuyển dụng",
    "approvedExemplars": "Hồ sơ mẫu đã duyệt cho tìm kiếm ngữ nghĩa",
    "analysisJobs": "Tác vụ phân tích CV chạy nền",
    "aiRequestHistory": "Nhật ký yêu cầu AI local",
    "loginHistory": "Lịch sử đăng nhập",
    "vectorLibraryRecords": "Kho vector và metadata",
}


@router.post("/checks")
def check_database_connections() -> Dict[str, Any]:
    """Run read-only SQLite and local Ollama checks; never write test data."""
    checks: List[Dict[str, Any]] = []
    started = time.perf_counter()
    try:
        with get_db() as conn:
            integrity = [str(row[0]) for row in conn.execute("PRAGMA quick_check").fetchall()]
            violations = len(conn.execute("PRAGMA foreign_key_check").fetchall())
        healthy = integrity == ["ok"] and violations == 0
        checks.append({"id": "sqlite", "name": "SQLite local", "status": "passed" if healthy else "failed", "message": "Toàn vẹn dữ liệu và khóa ngoại hợp lệ." if healthy else f"Phát hiện vấn đề toàn vẹn; {violations} lỗi khóa ngoại.", "latency_ms": round((time.perf_counter() - started) * 1000)})
    except Exception:
        checks.append({"id": "sqlite", "name": "SQLite local", "status": "failed", "message": "Không thể kiểm tra cơ sở dữ liệu local.", "latency_ms": round((time.perf_counter() - started) * 1000)})
    started = time.perf_counter()
    try:
        response = httpx.get(f"{get_settings().ollama_base_url}/api/tags", timeout=5)
        response.raise_for_status()
        models = [item.get("name", "") for item in response.json().get("models", [])]
        required = {get_settings().local_llm_model, get_settings().local_cv_model, get_settings().local_embedding_model}
        missing = sorted(model for model in required if not any(model in name for name in models))
        healthy = not missing
        message = "Các model Qwen và CV Match đã sẵn sàng." if healthy else "Chưa có model: " + ", ".join(missing)
        checks.append({"id": "ollama", "name": "Ollama local", "status": "passed" if healthy else "failed", "message": message, "latency_ms": round((time.perf_counter() - started) * 1000)})
    except Exception:
        checks.append({"id": "ollama", "name": "Ollama local", "status": "failed", "message": "Không kết nối được Ollama local.", "latency_ms": round((time.perf_counter() - started) * 1000)})
    return {"success": True, "data": {"checks": checks, "checked_at": datetime.now(timezone.utc).isoformat(), "read_only": True}, "error": None}


@router.get("/stats", response_model=DatabaseStatsResponse)
def get_database_stats() -> DatabaseStatsResponse:
    settings = get_settings()
    db_path = settings.db_path

    file_size = 0
    if db_path.exists():
        file_size = os.path.getsize(db_path)

    table_counts = {}
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        all_tables = [row[0] for row in cursor.fetchall()]
        for t in all_tables:
            try:
                cur = conn.execute(f"SELECT COUNT(*) as cnt FROM [{t}]")
                row = cur.fetchone()
                table_counts[t] = int(row["cnt"]) if row else 0
            except Exception:
                table_counts[t] = 0

    return DatabaseStatsResponse(
        database_type="SQLite (Local WAL Mode)",
        db_file_path=str(db_path),
        db_file_size_bytes=file_size,
        tables=table_counts,
        vector_count=table_counts.get("vectorLibraryRecords", 0) + table_counts.get("vector_records", 0) + table_counts.get("approvedExemplars", 0),
        cache_entries_count=table_counts.get("syncedAnalysisCache", 0) + table_counts.get("analysis_cache", 0),
        completed_jobs_count=table_counts.get("analysisJobs", 0) + table_counts.get("analysis_jobs", 0),
    )


@router.get("/history", response_model=List[HistoryItemResponse])
def list_history(
    limit: int = Query(default=50, ge=1, le=200),
    user: Dict[str, Any] = Depends(require_admin),
) -> List[HistoryItemResponse]:
    items = HistoryRepository.list_history(limit=limit)
    return [HistoryItemResponse(**item) for item in items]


@router.get("/history/{record_id}")
def get_history_detail(
    record_id: str,
    user: Dict[str, Any] = Depends(require_admin),
) -> Dict[str, Any]:
    detail = HistoryRepository.get_history_by_id(record_id)
    if not detail:
        raise HTTPException(status_code=404, detail="History record not found")
    return detail


ALL_TABLE_DESCRIPTIONS = {
    **{name: (description, "Business data") for name, description in BUSINESS_TABLE_DESCRIPTIONS.items()},
    "schema_migrations": ("Các phiên bản nâng cấp cấu trúc dữ liệu", "Local Engine & Cache"),
    "analysis_cache": ("Bộ nhớ đệm phân tích nhanh", "Local Engine & Cache"),
    "analysis_jobs": ("Hàng đợi tác vụ phân tích cục bộ", "Local Engine & Cache"),
    "candidate_chats": ("Tin nhắn trao đổi với ứng viên", "Local Engine & Cache"),
    "cv_history": ("Lịch sử chấm điểm CV tối ưu truy vấn", "Local Engine & Cache"),
    "interview_records": ("Bộ câu hỏi và đánh giá phỏng vấn", "Local Engine & Cache"),
    "system_settings": ("Cấu hình hệ thống cục bộ", "Local Engine & Cache"),
    "uploaded_files": ("Thông tin tệp tải lên cục bộ", "Local Engine & Cache"),
    "vector_records": ("Kho vector nhúng", "Local Engine & Cache"),
    "local_admin_sessions": ("Phiên quản trị có thể thu hồi", "Local Engine & Cache"),
    "local_admin_oauth_states": ("Trạng thái OAuth tạm thời", "Local Engine & Cache"),
}


@router.get("/tables")
def list_all_tables() -> Dict[str, Any]:
    """
    Returns metadata for all local application tables.
    """
    tables_list = []
    with get_db() as conn:
        cursor = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name"
        )
        table_names = [row[0] for row in cursor.fetchall()]

        for t in table_names:
            try:
                cnt_cur = conn.execute(f"SELECT COUNT(*) FROM [{t}]")
                cnt = cnt_cur.fetchone()[0]
            except Exception:
                cnt = 0

            col_cur = conn.execute(f"PRAGMA table_info([{t}])")
            cols = [
                {"name": row["name"], "type": row["type"], "pk": bool(row["pk"])}
                for row in col_cur.fetchall()
            ]

            desc, category = ALL_TABLE_DESCRIPTIONS.get(
                t, ("Bảng dữ liệu ứng dụng local", "Business data")
            )

            tables_list.append({
                "name": t,
                "category": category,
                "description": desc,
                "row_count": cnt,
                "column_count": len(cols),
                "columns": cols,
            })

    return {
        "total_tables": len(tables_list),
        "database_type": "SQLite (Local WAL Mode)",
        "tables": tables_list,
    }


@router.get("/tables/{table_name}/rows")
def get_table_rows(
    table_name: str,
    limit: int = Query(default=50, ge=1, le=200),
    offset: int = Query(default=0, ge=0),
    search: str = Query(default="", max_length=200),
) -> Dict[str, Any]:
    """
    Returns paginated rows for a specific table with optional search filter.
    Safe against SQL injection via whitelist verification.
    """
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table_name):
        raise HTTPException(status_code=404, detail="Tên bảng không hợp lệ.")
    with get_db() as conn:
        # Verify table exists
        cur = conn.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ?",
            (table_name,),
        )
        if not cur.fetchone():
            raise HTTPException(status_code=404, detail=f"Bảng '{table_name}' không tồn tại trong cơ sở dữ liệu.")

        # Get column names & types
        col_cur = conn.execute(f"PRAGMA table_info([{table_name}])")
        columns_info = [
            {"name": row["name"], "type": row["type"], "pk": bool(row["pk"])}
            for row in col_cur.fetchall()
        ]
        column_names = [c["name"] for c in columns_info]

        # Build query
        where_clauses = []
        params: List[Any] = []

        if search.strip():
            search_pattern = f"%{search.strip()}%"
            text_columns = [
                c["name"] for c in columns_info
                if any(t in c["type"].upper() for t in ["TEXT", "CHAR", "CLOB", "VARCHAR", ""])
            ]
            if text_columns:
                sub_clauses = [f"CAST([{col}] AS TEXT) LIKE ?" for col in text_columns]
                where_clauses.append(f"({' OR '.join(sub_clauses)})")
                params.extend([search_pattern] * len(text_columns))

        where_sql = f"WHERE {' AND '.join(where_clauses)}" if where_clauses else ""

        # Count total matching rows
        count_query = f"SELECT COUNT(*) FROM [{table_name}] {where_sql}"
        count_cur = conn.execute(count_query, params)
        total_matching = count_cur.fetchone()[0]

        # Query rows
        data_query = f"SELECT * FROM [{table_name}] {where_sql} LIMIT ? OFFSET ?"
        query_params = params + [limit, offset]
        data_cur = conn.execute(data_query, query_params)
        raw_rows = data_cur.fetchall()

        # Format rows: handle BLOBs & bytes gracefully
        formatted_rows = []
        for row in raw_rows:
            row_dict = {}
            for col in column_names:
                val = row[col]
                if isinstance(val, (bytes, bytearray)):
                    row_dict[col] = f"[BLOB: {len(val)} bytes]"
                else:
                    row_dict[col] = val
            formatted_rows.append(redact_database_value(row_dict))

        desc, category = ALL_TABLE_DESCRIPTIONS.get(
            table_name, ("Bảng dữ liệu hệ thống", "Local Engine & Cache")
        )

        return {
            "table_name": table_name,
            "category": category,
            "description": desc,
            "columns": columns_info,
            "total_rows": total_matching,
            "limit": limit,
            "offset": offset,
            "rows": formatted_rows,
        }


@router.get("/tables/{table_name}/schema")
def get_table_schema(table_name: str) -> Dict[str, Any]:
    """
    Returns SQL schema definition, PRAGMA columns, and indexes for a table.
    """
    if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", table_name):
        raise HTTPException(status_code=404, detail="Tên bảng không hợp lệ.")
    with get_db() as conn:
        cur = conn.execute(
            "SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?",
            (table_name,),
        )
        row = cur.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail=f"Bảng '{table_name}' không tồn tại.")

        create_sql = row["sql"]

        col_cur = conn.execute(f"PRAGMA table_info([{table_name}])")
        columns = [dict(col) for col in col_cur.fetchall()]

        idx_cur = conn.execute(f"PRAGMA index_list([{table_name}])")
        indexes = [dict(idx) for idx in idx_cur.fetchall()]

        return {
            "table_name": table_name,
            "create_sql": create_sql,
            "columns": columns,
            "indexes": indexes,
        }
