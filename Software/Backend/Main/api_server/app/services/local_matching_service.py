from __future__ import annotations

import uuid
from typing import Any, Dict, List, Optional

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.sql_models import Candidate, CandidateEmbedding, JobDescription, MatchResult


class LocalMatchingService:
    @staticmethod
    async def add_candidate(
        session: AsyncSession,
        full_name: str,
        email: Optional[str],
        phone: Optional[str],
        parsed_text: str,
        extracted_skills: List[str],
        experience_years: float,
        embedding_vector: List[float],
        file_path: Optional[str] = None,
        candidate_id: Optional[str] = None,
    ) -> Candidate:
        cid = candidate_id or str(uuid.uuid4())
        cand = Candidate(
            id=cid,
            full_name=full_name,
            email=email,
            phone=phone,
            file_path=file_path,
            parsed_text=parsed_text,
            extracted_skills=extracted_skills,
            experience_years=experience_years,
        )
        session.add(cand)

        if embedding_vector:
            emb = CandidateEmbedding(
                id=str(uuid.uuid4()),
                candidate_id=cid,
                chunk_type="full",
                chunk_text=parsed_text[:2000],
                embedding=embedding_vector,
                model_name="nomic-embed-text",
            )
            session.add(emb)

        await session.flush()
        return cand

    @staticmethod
    async def add_job_description(
        session: AsyncSession,
        title: str,
        department: Optional[str],
        required_skills: List[str],
        raw_content: str,
        embedding_vector: List[float],
        job_id: Optional[str] = None,
    ) -> JobDescription:
        jid = job_id or str(uuid.uuid4())
        jd = JobDescription(
            id=jid,
            title=title,
            department=department,
            required_skills=required_skills,
            raw_content=raw_content,
            embedding=embedding_vector,
        )
        session.add(jd)
        await session.flush()
        return jd

    @staticmethod
    async def search_top_candidates(
        session: AsyncSession,
        query_vector: List[float],
        top_k: int = 5,
        min_similarity: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """
        Ultra-fast ANN vector search using pgvector cosine distance operator (<=>).
        Cosine similarity = 1 - cosine_distance
        """
        # Formulate query with pgvector operator <=>
        query = text(
            """
            SELECT
                c.id AS candidate_id,
                c.full_name,
                c.email,
                c.experience_years,
                c.extracted_skills,
                (1.0 - (ce.embedding <=> :vector::vector)) AS similarity_score
            FROM candidate_embeddings ce
            JOIN candidates c ON c.id = ce.candidate_id
            WHERE (1.0 - (ce.embedding <=> :vector::vector)) >= :min_sim
            ORDER BY ce.embedding <=> :vector::vector ASC
            LIMIT :limit
            """
        )
        # Convert vector to string representation for SQL binding: '[0.1, 0.2, ...]'
        vector_str = "[" + ",".join(str(x) for x in query_vector) + "]"
        result = await session.execute(
            query,
            {"vector": vector_str, "min_sim": min_similarity, "limit": top_k},
        )
        rows = result.mappings().all()

        return [
            {
                "candidate_id": row["candidate_id"],
                "full_name": row["full_name"],
                "email": row["email"],
                "experience_years": float(row["experience_years"] or 0.0),
                "extracted_skills": row["extracted_skills"] or [],
                "similarity_score": round(float(row["similarity_score"]), 4),
            }
            for row in rows
        ]
