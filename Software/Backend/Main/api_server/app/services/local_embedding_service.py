from __future__ import annotations

import logging
import os
import re
from typing import List

import ollama

logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
EMBEDDING_MODEL = os.getenv("LOCAL_EMBEDDING_MODEL", "nomic-embed-text")
EMBEDDING_DIM = int(os.getenv("LOCAL_EMBEDDING_DIM", "768"))


def _clean_text_for_embedding(text: str) -> str:
    cleaned = re.sub(r"\s+", " ", (text or "").strip())
    # nomic-embed-text context limit is 8192 tokens (~25,000 characters)
    return cleaned[:25000]


class LocalEmbeddingService:
    def __init__(self, host: str = OLLAMA_HOST, model: str = EMBEDDING_MODEL) -> None:
        self.host = host
        self.model = model
        self.client = ollama.Client(host=self.host)

    def embed_text(self, text: str) -> List[float]:
        """Generate a 768-dimensional embedding vector using local Ollama nomic-embed-text."""
        cleaned = _clean_text_for_embedding(text)
        if not cleaned:
            return []

        try:
            response = self.client.embeddings(model=self.model, prompt=cleaned)
            vector = response.get("embedding", [])
            if len(vector) != EMBEDDING_DIM:
                logger.warning(
                    "Unexpected embedding dimension: got %d, expected %d",
                    len(vector),
                    EMBEDDING_DIM,
                )
            return [float(x) for x in vector]
        except Exception as exc:
            logger.error("Failed to generate local embedding via Ollama: %s", exc)
            return []

    def embed_batch(self, texts: List[str]) -> List[List[float]]:
        """Generate embeddings for multiple texts sequentially."""
        results: List[List[float]] = []
        for text in texts:
            results.append(self.embed_text(text))
        return results


_default_service: LocalEmbeddingService | None = None


def get_local_embedding_service() -> LocalEmbeddingService:
    global _default_service
    if _default_service is None:
        _default_service = LocalEmbeddingService()
    return _default_service
