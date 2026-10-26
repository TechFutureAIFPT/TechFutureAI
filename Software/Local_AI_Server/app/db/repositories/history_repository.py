import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from app.db.database import get_db


class HistoryRepository:
    @staticmethod
    def save_history(
        jd_title: str,
        jd_text: str,
        candidates: List[Dict[str, Any]],
        pipeline: Dict[str, Any],
        weights: Optional[Dict[str, Any]] = None,
        hard_filters: Optional[Dict[str, Any]] = None,
        user_id: Optional[str] = "local-recruiter",
        record_id: Optional[str] = None,
    ) -> str:
        rec_id = record_id or str(uuid.uuid4())
        now = datetime.now(timezone.utc).isoformat()
        now_ms = int(datetime.now(timezone.utc).timestamp() * 1000)

        grades: Dict[str, int] = {}
        for c in candidates:
            g = c.get("rank") or "C"
            grades[g] = grades.get(g, 0) + 1
        top_candidates = candidates[:3]

        with get_db() as conn:
            # 1. Fast-path local table
            conn.execute(
                """
                INSERT INTO cv_history (
                    id, user_id, jd_title, jd_text, weights_json,
                    hard_filters_json, candidates_json, pipeline_json, created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    rec_id,
                    user_id,
                    jd_title,
                    jd_text,
                    json.dumps(weights or {}, ensure_ascii=False),
                    json.dumps(hard_filters or {}, ensure_ascii=False),
                    json.dumps(candidates, ensure_ascii=False),
                    json.dumps(pipeline, ensure_ascii=False),
                    now,
                ),
            )

            # Keep the legacy history-table projection in the same SQLite transaction.
            conn.execute(
                """
                INSERT OR REPLACE INTO cvHistory (
                    id, uid, email, jdTitle, jdText, jobPosition, locationRequirement,
                    totalCandidates, grades, topCandidates, results, fullPayload,
                    timestamp, createdAt, updatedAt, source_payload
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    rec_id,
                    user_id,
                    "local@supporthr.vn",
                    jd_title,
                    jd_text,
                    jd_title,
                    str((hard_filters or {}).get("location") or "All"),
                    len(candidates),
                    json.dumps(grades, ensure_ascii=False),
                    json.dumps(top_candidates, ensure_ascii=False),
                    json.dumps(candidates, ensure_ascii=False),
                    json.dumps({"candidates": candidates, "pipeline": pipeline}, ensure_ascii=False),
                    now_ms,
                    now,
                    now,
                    json.dumps({"candidates": candidates, "pipeline": pipeline, "weights": weights}, ensure_ascii=False),
                ),
            )
        return rec_id

    @staticmethod
    def list_history(limit: int = 50, user_id: Optional[str] = None) -> List[Dict[str, Any]]:
        with get_db() as conn:
            if user_id:
                cursor = conn.execute(
                    """
                    SELECT id, user_id, jd_title, candidates_json, created_at
                    FROM cv_history
                    WHERE user_id = ?
                    ORDER BY created_at DESC
                    LIMIT ?
                    """,
                    (user_id, limit),
                )
            else:
                cursor = conn.execute(
                    """
                    SELECT id, user_id, jd_title, candidates_json, created_at
                    FROM cv_history
                    ORDER BY created_at DESC
                    LIMIT ?
                    """,
                    (limit,),
                )

            rows = cursor.fetchall()
            items = []
            for row in rows:
                candidates = json.loads(row["candidates_json"] or "[]")
                items.append(
                    {
                        "id": row["id"],
                        "user_id": row["user_id"],
                        "jd_title": row["jd_title"] or "Tuyển dụng không tên",
                        "candidate_count": len(candidates),
                        "top_candidates": candidates[:3],
                        "created_at": row["created_at"],
                    }
                )
            return items

    @staticmethod
    def get_history_by_id(record_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.execute(
                "SELECT * FROM cv_history WHERE id = ?",
                (record_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None
            return {
                "id": row["id"],
                "user_id": row["user_id"],
                "jd_title": row["jd_title"],
                "jd_text": row["jd_text"],
                "weights": json.loads(row["weights_json"] or "{}"),
                "hard_filters": json.loads(row["hard_filters_json"] or "{}"),
                "candidates": json.loads(row["candidates_json"] or "[]"),
                "pipeline": json.loads(row["pipeline_json"] or "{}"),
                "created_at": row["created_at"],
            }
