from typing import Any, Dict, Optional
from pydantic import BaseModel, Field


class JdStructureRequest(BaseModel):
    raw_text: str = Field(..., description="Raw unstructured Job Description text")


class JdStructureResponse(BaseModel):
    structured_text: str = Field(..., description="Standardized, clearly formatted JD text")
    saved_record_id: Optional[str] = None


class JdPositionRequest(BaseModel):
    jd_text: str = Field(..., description="Job Description text")


class JdPositionResponse(BaseModel):
    job_position: str = Field(..., description="Extracted target job title or role")
    saved_record_id: Optional[str] = None


class JdHardFiltersRequest(BaseModel):
    jd_text: str = Field(..., description="Job Description text")


class JdHardFiltersResponse(BaseModel):
    filters: Dict[str, Any] = Field(..., description="Extracted mandatory screening criteria")
    saved_record_id: Optional[str] = None
