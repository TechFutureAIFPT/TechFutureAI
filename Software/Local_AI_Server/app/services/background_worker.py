import asyncio
import logging
from typing import Optional

from app.ai.cv_analyzer import analyze_cv_pipeline
from app.db.repositories.job_repository import JobRepository

logger = logging.getLogger(__name__)


class BackgroundJobWorker:
    """
    Background worker that continuously polls and executes queued analysis jobs
    from the local SQLite database.
    """

    def __init__(self, poll_interval: float = 1.0) -> None:
        self.poll_interval = poll_interval
        self._is_running = False
        self._worker_task: Optional[asyncio.Task] = None

    def start(self) -> None:
        if self._is_running:
            return
        self._is_running = True
        self._worker_task = asyncio.create_task(self._run_loop())
        logger.info("[Background Worker] Local AI analysis worker started.")

    async def stop(self) -> None:
        self._is_running = False
        if self._worker_task:
            self._worker_task.cancel()
            try:
                await self._worker_task
            except asyncio.CancelledError:
                pass
        logger.info("[Background Worker] Local AI analysis worker stopped.")

    async def _run_loop(self) -> None:
        while self._is_running:
            try:
                job_data = JobRepository.claim_next_queued_job()
                if job_data:
                    job_id = job_data["job_id"]
                    payload = job_data["payload"]
                    await self._process_job(job_id, payload)
                else:
                    await asyncio.sleep(self.poll_interval)
            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.error(f"[Background Worker] Error in worker loop: {err}")
                await asyncio.sleep(self.poll_interval)

    async def _process_job(self, job_id: str, payload: dict) -> None:
        try:
            JobRepository.update_progress(job_id, 0.15, "Đang chuẩn bị dữ liệu và mô hình cục bộ...")

            jd_text = payload.get("jd_text", "")
            cv_entries = payload.get("cv_entries", [])
            weights = payload.get("weights", {})
            hard_filters = payload.get("hard_filters", {})

            JobRepository.update_progress(
                job_id, 0.40, f"Đang phân tích {len(cv_entries)} CV qua Qwen 2.5 Coder..."
            )

            result = await analyze_cv_pipeline(
                jd_text=jd_text,
                cv_entries=cv_entries,
                raw_weights=weights,
                hard_filters=hard_filters,
            )

            JobRepository.mark_completed(job_id, result)
            logger.info(f"[Background Worker] Job {job_id} completed successfully.")
        except Exception as err:
            logger.error(f"[Background Worker] Job {job_id} failed: {err}")
            JobRepository.mark_failed(job_id, str(err))


_worker_instance: Optional[BackgroundJobWorker] = None


def get_background_worker() -> BackgroundJobWorker:
    global _worker_instance
    if _worker_instance is None:
        _worker_instance = BackgroundJobWorker()
    return _worker_instance
