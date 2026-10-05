from __future__ import annotations

from pydantic import BaseModel


class AssistantMessageRecord(BaseModel):
    id: str
    author: str
    content: str
    timestamp: int


class AssistantSessionCreateRequest(BaseModel):
    title: str = ""


class AssistantReplyRequest(BaseModel):
    message: str


class AssistantReplyResponse(BaseModel):
    sessionId: str
    userMessage: AssistantMessageRecord
    assistantMessage: AssistantMessageRecord
    responseText: str


class DeepResearchRequest(BaseModel):
    question: str


class DeepResearchSource(BaseModel):
    title: str
    url: str
    content: str
    score: float = 0.0


class DeepResearchResponse(BaseModel):
    question: str
    report: str
    sources: list[DeepResearchSource]
    queries: list[str]
