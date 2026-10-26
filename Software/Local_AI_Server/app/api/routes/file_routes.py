from typing import Any, Dict
from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from pydantic import BaseModel

from app.api.deps import get_current_user
from app.db.repositories.file_repository import FileRepository
from app.services.file_extractor import extract_text_from_file_bytes

router = APIRouter(prefix="/api/files", tags=["files"])


class ExtractedTextResponse(BaseModel):
    text: str
    saved_record_id: str


@router.post("/extract-text", response_model=ExtractedTextResponse)
async def extract_text(
    file: UploadFile = File(...),
    force_ocr: bool = Form(False),
    document_type: str = Form("cv"),
    user: Dict[str, Any] = Depends(get_current_user),
) -> ExtractedTextResponse:
    try:
        file_bytes = await file.read()
        filename = file.filename or "uploaded_document"
        content_type = file.content_type or ""

        extracted_text = extract_text_from_file_bytes(
            file_bytes=file_bytes,
            filename=filename,
            content_type=content_type,
        )

        saved_id = FileRepository.save_file_extraction(
            filename=filename,
            extracted_text=extracted_text,
            content_type=content_type,
            file_size=len(file_bytes),
            document_type=document_type,
            user_id=user.get("uid"),
        )

        return ExtractedTextResponse(text=extracted_text, saved_record_id=saved_id)
    except Exception as err:
        raise HTTPException(status_code=400, detail=f"Lỗi đọc file: {err}")
