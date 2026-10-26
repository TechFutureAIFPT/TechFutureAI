import json
from datetime import datetime, timezone
from typing import Any, Dict, Optional

from app.db.database import get_db


class CacheRepository:
    @staticmethod
    def get_cache(cache_key: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.execute(
                "SELECT result_json FROM analysis_cache WHERE cache_key = ?",
                (cache_key,),
            )
            row = cursor.fetchone()
            if row and row["result_json"]:
                try:
                    return json.loads(row["result_json"])
                except Exception:
                    return None
            return None

    @staticmethod
    def set_cache(
        cache_key: str,
        candidate_name: str,
        total_score: float,
        result_payload: Dict[str, Any],
        uid: str = "local-recruiter-001",
    ) -> None:
        now = datetime.now(timezone.utc).isoformat()
        res_str = json.dumps(result_payload, ensure_ascii=False)
        rank = result_payload.get("rank") or "C"

        with get_db() as conn:
            # 1. Local fast-path table
            conn.execute(
                """
                INSERT OR REPLACE INTO analysis_cache (cache_key, candidate_name, total_score, result_json, created_at)
                VALUES (?, ?, ?, ?, ?)
                """,
                (cache_key, candidate_name, total_score, res_str, now),
            )
            # Keep the legacy cache projection in the same SQLite transaction.
            conn.execute(
                """
                INSERT OR REPLACE INTO syncedAnalysisCache (cacheKey, uid, candidateName, totalScore, rank, resultJson, createdAt, updatedAt, source_payload)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (cache_key, uid, candidate_name, total_score, rank, res_str, now, now, res_str),
            )

    @staticmethod
    def count_cache() -> int:
        with get_db() as conn:
            cursor = conn.execute("SELECT COUNT(*) as cnt FROM analysis_cache")
            row = cursor.fetchone()
            return int(row["cnt"]) if row else 0
