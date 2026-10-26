from app.services.ollama_service import _embedding_prompt


def test_nomic_prefixes_are_not_gemini_embedding_instructions():
    assert _embedding_prompt("Python\nSQL", "retrieval_query") == "search_query: Python SQL"
    assert _embedding_prompt("Python SQL", "retrieval_document") == "search_document: Python SQL"
    assert _embedding_prompt("Python SQL", "semantic_similarity") == "clustering: Python SQL"
