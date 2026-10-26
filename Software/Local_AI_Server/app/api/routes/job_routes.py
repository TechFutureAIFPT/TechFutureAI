from typing import Any, Dict
from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.db.repositories.job_repository import JobRepository
from app.schemas.analysis import (
    AnalysisJobAcceptedResponse,
    AnalysisJobStatusResponse,
    CoreCvAnalysisRequest,
)

router = APIRouter(prefix="/api", tags=["jobs"])


@router.post(
    "/cv/analyze-core-async",
    response_model=AnalysisJobAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
@router.post(
    "/analysis/jobs",
    response_model=AnalysisJobAcceptedResponse,
    status_code=status.HTTP_202_ACCEPTED,
)
async def create_analysis_job(
    payload: CoreCvAnalysisRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> AnalysisJobAcceptedResponse:
    job_id = JobRepository.create_job(payload.model_dump())
    return AnalysisJobAcceptedResponse(
        job_id=job_id,
        status="queued",
        status_url=f"/api/analysis/status/{job_id}",
    )


@router.get("/analysis/status/{job_id}", response_model=AnalysisJobStatusResponse)
def get_job_status(job_id: str) -> AnalysisJobStatusResponse:
    job = JobRepository.get_job(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Analysis job not found")
    return AnalysisJobStatusResponse(**job)
