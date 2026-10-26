from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class DatabaseStatsResponse(BaseModel):
    database_type: str = "SQLite (Local WAL Mode)"
    db_file_path: str
    db_file_size_bytes: int
    tables: Dict[str, int]
    vector_count: int
    cache_entries_count: int
    completed_jobs_count: int


class HistoryItemResponse(BaseModel):
    id: str
    created_at: str
    jd_title: str
    candidate_count: int
    top_candidates: List[Dict[str, Any]]
