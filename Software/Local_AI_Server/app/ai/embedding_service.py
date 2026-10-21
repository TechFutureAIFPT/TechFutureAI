from typing import List
from app.ai.ollama_client import get_ollama_client
from app.utils.text_utils import normalize_display_text


async def embed_text(text: str) -> List[float]:
    """
    Generate 768-dimensional embedding vector for input text using nomic-embed-text.
    """
    client = get_ollama_client()
    cleaned = normalize_display_text(text)
    if not cleaned:
        cleaned = " "
    return await client.get_embedding(cleaned)


async def embed_batch(texts: List[str]) -> List[List[float]]:
    """
    Generate embeddings for multiple texts sequentially or bounded concurrency.
    """
    results = []
    for text in texts:
        vec = await embed_text(text)
        results.append(vec)
    return results
