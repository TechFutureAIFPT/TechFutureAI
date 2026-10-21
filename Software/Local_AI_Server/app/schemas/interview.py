from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class InterviewQuestionsRequest(BaseModel):
    analysis_data: Optional[Dict[str, Any]] = None
    analysis_stats: Optional[Dict[str, Any]] = None
    question_type: str = Field(default="general", description="general, specific, or comparative")
    candidate_data: Optional[Dict[str, Any]] = None
    jd_text: Optional[str] = None


class InterviewQuestionsResponse(BaseModel):
    question_sets: List[Dict[str, Any]] = Field(default_factory=list)
    saved_record_id: Optional[str] = None
