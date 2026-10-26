from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, List

from pgvector.sqlalchemy import Vector
from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Numeric,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship

from app.core.database import Base


def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(String(64), primary_key=True)
    title = Column(String(255), nullable=False)
    department = Column(String(100), nullable=True)
    required_skills = Column(JSONB, default=list)
    raw_content = Column(Text, nullable=True)
    embedding = Column(Vector(768), nullable=True)
    created_at = Column(DateTime(timezone=True), default=_utc_now)
    updated_at = Column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    match_results = relationship("MatchResult", back_populates="job", cascade="all, delete-orphan")


class Candidate(Base):
    __tablename__ = "candidates"

    id = Column(String(64), primary_key=True)
    full_name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=True)
    phone = Column(String(50), nullable=True)
    file_path = Column(String(500), nullable=True)
    parsed_text = Column(Text, nullable=True)
    extracted_skills = Column(JSONB, default=list)
    experience_years = Column(Numeric(4, 1), default=0.0)
    education = Column(JSONB, default=list)
    created_at = Column(DateTime(timezone=True), default=_utc_now)
    updated_at = Column(DateTime(timezone=True), default=_utc_now, onupdate=_utc_now)

    embeddings = relationship("CandidateEmbedding", back_populates="candidate", cascade="all, delete-orphan")
    match_results = relationship("MatchResult", back_populates="candidate", cascade="all, delete-orphan")


class CandidateEmbedding(Base):
    __tablename__ = "candidate_embeddings"

    id = Column(String(64), primary_key=True)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    chunk_type = Column(String(50), default="full")
    chunk_text = Column(Text, nullable=True)
    embedding = Column(Vector(768), nullable=False)
    model_name = Column(String(100), default="nomic-embed-text")
    created_at = Column(DateTime(timezone=True), default=_utc_now)

    candidate = relationship("Candidate", back_populates="embeddings")


class MatchResult(Base):
    __tablename__ = "match_results"

    id = Column(String(64), primary_key=True)
    candidate_id = Column(String(64), ForeignKey("candidates.id", ondelete="CASCADE"), nullable=False)
    job_id = Column(String(64), ForeignKey("job_descriptions.id", ondelete="CASCADE"), nullable=False)
    similarity_score = Column(Numeric(5, 4), nullable=False)
    rule_score = Column(Numeric(5, 2), default=0.0)
    final_score = Column(Numeric(5, 2), nullable=False)
    analysis_summary = Column(JSONB, default=dict)
    evaluated_at = Column(DateTime(timezone=True), default=_utc_now)

    candidate = relationship("Candidate", back_populates="match_results")
    job = relationship("JobDescription", back_populates="match_results")
