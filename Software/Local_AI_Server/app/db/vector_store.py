import json
import uuid
from typing import Any, Dict, List, Optional
import numpy as np

from app.db.database import get_db


class VectorStore:
    """
    Local Vector Store utilizing SQLite and NumPy for 768-dimensional vector operations.
    Supports cosine similarity nearest neighbor search for RAG and exemplar retrieval.
    """

    @staticmethod
    def _vector_to_blob(vector: List[float]) -> bytes:
        arr = np.array(vector, dtype=np.float32)
        return arr.tobytes()

    @staticmethod
    def _blob_to_vector(blob: bytes) -> np.ndarray:
        return np.frombuffer(blob, dtype=np.float32)

    @classmethod
    def insert(
        cls,
        collection_name: str,
        text_content: str,
        embedding: List[float],
        doc_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
    ) -> str:
        record_id = doc_id or str(uuid.uuid4())
        blob = cls._vector_to_blob(embedding)
        meta_json = json.dumps(metadata or {}, ensure_ascii=False)

        with get_db() as conn:
            conn.execute(
                """
                INSERT OR REPLACE INTO vector_records (id, collection_name, doc_id, text_content, embedding_blob, metadata_json)
                VALUES (?, ?, ?, ?, ?, ?)
                """,
                (record_id, collection_name, record_id, text_content, blob, meta_json),
            )
        return record_id

    @classmethod
    def search(
        cls,
        collection_name: str,
        query_embedding: List[float],
        top_k: int = 5,
        min_similarity: float = 0.5,
    ) -> List[Dict[str, Any]]:
        """
        Perform cosine similarity search over records in the specified collection.
        """
        query_vec = np.array(query_embedding, dtype=np.float32)
        norm_q = np.linalg.norm(query_vec)
        if norm_q == 0:
            return []

        with get_db() as conn:
            cursor = conn.execute(
                """
                SELECT id, doc_id, text_content, embedding_blob, metadata_json
                FROM vector_records
                WHERE collection_name = ?
                """,
                (collection_name,),
            )
            rows = cursor.fetchall()

        if not rows:
            return []

        results = []
        for row in rows:
            stored_vec = cls._blob_to_vector(row["embedding_blob"])
            norm_s = np.linalg.norm(stored_vec)
            if norm_s == 0:
                continue

            similarity = float(np.dot(query_vec, stored_vec) / (norm_q * norm_s))
            if similarity >= min_similarity:
                results.append(
                    {
                        "id": row["id"],
                        "doc_id": row["doc_id"],
                        "text": row["text_content"],
                        "metadata": json.loads(row["metadata_json"] or "{}"),
                        "similarity": round(similarity, 4),
                    }
                )

        results.sort(key=lambda item: item["similarity"], reverse=True)
        return results[:top_k]

    @classmethod
    def count(cls, collection_name: Optional[str] = None) -> int:
        with get_db() as conn:
            if collection_name:
                cursor = conn.execute(
                    "SELECT COUNT(*) as cnt FROM vector_records WHERE collection_name = ?",
                    (collection_name,),
                )
            else:
                cursor = conn.execute("SELECT COUNT(*) as cnt FROM vector_records")
            row = cursor.fetchone()
            return int(row["cnt"]) if row else 0
