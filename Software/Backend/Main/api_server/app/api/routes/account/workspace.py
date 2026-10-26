from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.deps import get_current_user
from app.schemas.account import (
    AuthenticatedUser,
    WorkspaceCandidateRecord,
    WorkspaceJobRecord,
    WorkspaceRecordResponse,
    WorkspaceRecordsResponse,
)
from app.services.account import workspace_service


router = APIRouter()


def _response(data: Any) -> dict[str, Any]:
    return {"success": True, "data": data, "error": None}


@router.get("/workspace/initialized", response_model=WorkspaceRecordResponse)
def get_workspace_initialization(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    return _response({"initialized": workspace_service.is_initialized(current_user)})


@router.post("/workspace/initialized", response_model=WorkspaceRecordResponse)
def initialize_workspace(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    workspace_service.mark_initialized(current_user)
    return _response({"initialized": True})


@router.get("/workspace/candidates", response_model=WorkspaceRecordsResponse)
def list_workspace_candidates(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    return _response(workspace_service.list_records(current_user, "candidates"))


@router.put("/workspace/candidates/{candidate_id}", response_model=WorkspaceRecordResponse)
def save_workspace_candidate(
    candidate_id: str,
    payload: WorkspaceCandidateRecord,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    if payload.id != candidate_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Candidate id must match the resource path.")
    try:
        saved = workspace_service.save_record(current_user, "candidates", payload.model_dump())
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unable to save this candidate.") from error
    return _response(saved)


@router.delete("/workspace/candidates/{candidate_id}", response_model=WorkspaceRecordResponse)
def delete_workspace_candidate(
    candidate_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    if not workspace_service.delete_record(current_user, "candidates", candidate_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Candidate not found.")
    return _response({"id": candidate_id, "deleted": True})


@router.get("/workspace/jobs", response_model=WorkspaceRecordsResponse)
def list_workspace_jobs(
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    return _response(workspace_service.list_records(current_user, "jobs"))


@router.put("/workspace/jobs/{job_id}", response_model=WorkspaceRecordResponse)
def save_workspace_job(
    job_id: str,
    payload: WorkspaceJobRecord,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    if payload.id != job_id:
        raise HTTPException(status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, detail="Job id must match the resource path.")
    try:
        saved = workspace_service.save_record(current_user, "jobs", payload.model_dump())
    except PermissionError as error:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Unable to save this job.") from error
    return _response(saved)


@router.delete("/workspace/jobs/{job_id}", response_model=WorkspaceRecordResponse)
def delete_workspace_job(
    job_id: str,
    current_user: AuthenticatedUser = Depends(get_current_user),
) -> dict[str, Any]:
    if not workspace_service.delete_record(current_user, "jobs", job_id):
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Job not found.")
    return _response({"id": job_id, "deleted": True})
