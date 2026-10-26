import json
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
import uuid

from app.db.database import get_db


class JobRepository:
    @staticmethod
    def create_job(payload: Dict[str, Any], job_id: Optional[str] = None, uid: str = "local-recruiter-001") -> str:
        new_id = job_id or str(uuid.uuid4())
        payload_str = json.dumps(payload, ensure_ascii=False)
        now = datetime.now(timezone.utc).isoformat()

        with get_db() as conn:
            # 1. Local fast-path table
            conn.execute(
                """
                INSERT INTO analysis_jobs (job_id, status, progress, message, payload_json, created_at, updated_at)
                VALUES (?, 'queued', 0.0, 'Job queued in local database', ?, ?, ?)
                """,
                (new_id, payload_str, now, now),
            )
            # Keep the legacy business-table projection in the same SQLite transaction.
            conn.execute(
                """
                INSERT OR REPLACE INTO analysisJobs (jobId, uid, status, progress, message, requestPayload, createdAt, updatedAt, source_payload)
                VALUES (?, ?, 'queued', 0.0, 'Job queued in local database', ?, ?, ?, ?)
                """,
                (new_id, uid, payload_str, now, now, payload_str),
            )
        return new_id

    @staticmethod
    def get_job(job_id: str) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            cursor = conn.execute(
                "SELECT * FROM analysis_jobs WHERE job_id = ?",
                (job_id,),
            )
            row = cursor.fetchone()
            if not row:
                return None

            result = None
            if row["result_json"]:
                try:
                    result = json.loads(row["result_json"])
                except Exception:
                    result = None

            return {
                "job_id": row["job_id"],
                "status": row["status"],
                "progress": float(row["progress"] or 0.0),
                "message": row["message"] or "",
                "result": result,
                "error": row["error_text"],
                "created_at": row["created_at"],
                "updated_at": row["updated_at"],
            }

    @staticmethod
    def update_progress(job_id: str, progress: float, message: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with get_db() as conn:
            conn.execute(
                """
                UPDATE analysis_jobs
                SET progress = ?, message = ?, updated_at = ?
                WHERE job_id = ?
                """,
                (progress, message, now, job_id),
            )
            conn.execute(
                """
                UPDATE analysisJobs
                SET progress = ?, message = ?, updatedAt = ?
                WHERE jobId = ?
                """,
                (progress, message, now, job_id),
            )

    @staticmethod
    def mark_completed(job_id: str, result: Dict[str, Any]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        result_str = json.dumps(result, ensure_ascii=False)
        with get_db() as conn:
            conn.execute(
                """
                UPDATE analysis_jobs
                SET status = 'completed', progress = 1.0, message = 'Analysis completed',
                    result_json = ?, updated_at = ?
                WHERE job_id = ?
                """,
                (result_str, now, job_id),
            )
            conn.execute(
                """
                UPDATE analysisJobs
                SET status = 'completed', progress = 1.0, message = 'Analysis completed',
                    result = ?, updatedAt = ?
                WHERE jobId = ?
                """,
                (result_str, now, job_id),
            )

    @staticmethod
    def mark_failed(job_id: str, error: str) -> None:
        now = datetime.now(timezone.utc).isoformat()
        with get_db() as conn:
            conn.execute(
                """
                UPDATE analysis_jobs
                SET status = 'failed', error_text = ?, updated_at = ?
                WHERE job_id = ?
                """,
                (error, now, job_id),
            )
            conn.execute(
                """
                UPDATE analysisJobs
                SET status = 'failed', error = ?, updatedAt = ?
                WHERE jobId = ?
                """,
                (error, now, job_id),
            )

    @staticmethod
    def claim_next_queued_job() -> Optional[Dict[str, Any]]:
        """Atomically claim the next queued job for processing."""
        now = datetime.now(timezone.utc).isoformat()
        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT job_id, payload_json
                FROM analysis_jobs
                WHERE status = 'queued'
                ORDER BY created_at ASC
                LIMIT 1
                """
            )
            row = cursor.fetchone()
            if not row:
                return None

            job_id = row["job_id"]
            payload = json.loads(row["payload_json"])

            conn.execute(
                """
                UPDATE analysis_jobs
                SET status = 'processing', progress = 0.05, message = 'Processing started', updated_at = ?
                WHERE job_id = ? AND status = 'queued'
                """,
                (now, job_id),
            )
            conn.execute(
                """
                UPDATE analysisJobs
                SET status = 'processing', progress = 0.05, message = 'Processing started', updatedAt = ?
                WHERE jobId = ? AND status = 'queued'
                """,
                (now, job_id),
            )
            return {"job_id": job_id, "payload": payload}
