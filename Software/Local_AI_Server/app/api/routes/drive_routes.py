from __future__ import annotations

from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Query
from pydantic import BaseModel, Field

from app.api.deps import get_current_user
from app.services import google_drive_service

router = APIRouter(prefix="/api/account", tags=["google-drive"])


class OAuthUrlRequest(BaseModel):
    redirectUri: str | None = None


class OAuthExchangeRequest(BaseModel):
    code: str = Field(min_length=1, max_length=4096)
    state: str = Field(min_length=20, max_length=200)
    redirectUri: str | None = None


class ImportRequest(BaseModel):
    fileId: str = Field(min_length=1, max_length=512)
    fileType: str = "cv"
    forceOcr: bool = False
    persistUploadedFile: bool = True


def _call(function: Any, *args: Any, **kwargs: Any) -> Any:
    try:
        return function(*args, **kwargs)
    except HTTPException:
        raise
    except Exception as error:
        raise HTTPException(502, "Không thể xử lý yêu cầu Google Drive.") from error


@router.get("/google-drive/status")
def drive_status(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return _call(google_drive_service.get_connection_status, user)


@router.post("/google-drive/oauth-url")
def drive_oauth_url(payload: OAuthUrlRequest, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return _call(google_drive_service.create_oauth_url, user, payload.redirectUri)


@router.post("/google-drive/exchange-code")
def drive_exchange(payload: OAuthExchangeRequest, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return _call(google_drive_service.exchange_code, user, payload.code, payload.state, payload.redirectUri)


@router.delete("/google-drive/connection")
def drive_disconnect(user: dict[str, Any] = Depends(get_current_user)) -> dict[str, bool]:
    return {"ok": _call(google_drive_service.disconnect, user)}


@router.get("/google-drive/files")
def drive_files(
    search: str | None = Query(default=None, max_length=200),
    folder_id: str | None = Query(default=None, max_length=512),
    mime_types: str | None = Query(default=None, max_length=1000),
    page_token: str | None = Query(default=None, max_length=4096),
    page_size: int = Query(default=30, ge=1, le=100),
    user: dict[str, Any] = Depends(get_current_user),
) -> dict[str, Any]:
    return _call(google_drive_service.list_files, user, search=search, folder_id=folder_id, mime_types=mime_types, page_size=page_size, page_token=page_token)


@router.post("/google-drive/import")
def drive_import(payload: ImportRequest, user: dict[str, Any] = Depends(get_current_user)) -> dict[str, Any]:
    return _call(google_drive_service.import_file, user, payload.model_dump())
