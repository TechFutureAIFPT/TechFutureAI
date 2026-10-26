from typing import List, Tuple
from urllib.parse import urlparse

import httpx

from app.core.config import settings
from app.schemas.chat import CitationItem


class DeepResearchService:
    """Fetches current admission information using Gemini's Google Search grounding."""

    def __init__(self):
        self.google_api_key = settings.GOOGLE_API_KEY

    async def search_admission_knowledge(self, query: str) -> Tuple[str, List[CitationItem]]:
        if not self.google_api_key or not self.google_api_key.strip():
            return "", []

        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"gemini-2.5-flash:generateContent?key={self.google_api_key}"
        )
        prompt = (
            "Tra cứu trên web bằng Google Search để trả lời câu hỏi tuyển sinh sau. "
            "Ưu tiên trang tuyển sinh chính thức của trường và Bộ Giáo dục và Đào tạo. "
            "Nếu hỏi điểm chuẩn, ghi rõ trường, ngành, phương thức xét tuyển, tổ hợp và năm; "
            "chỉ nêu số liệu tìm thấy trên nguồn, không dự báo cho năm chưa công bố. "
            "Nếu không tìm thấy nguồn chính thức hoặc kết quả rõ ràng, hãy nói chưa xác minh được. "
            "Nêu URL nguồn cụ thể trong câu trả lời. Câu hỏi: " + query
        )
        try:
            async with httpx.AsyncClient(timeout=20.0) as client:
                response = await client.post(
                    url,
                    json={
                        "contents": [{"parts": [{"text": prompt}]}],
                        "tools": [{"google_search": {}}],
                        "generationConfig": {"temperature": 0.1, "maxOutputTokens": 1200},
                    },
                )
            response.raise_for_status()
            candidate = response.json().get("candidates", [{}])[0]
            parts = candidate.get("content", {}).get("parts", [])
            text = "\n".join(part["text"] for part in parts if isinstance(part.get("text"), str)).strip()
            metadata = candidate.get("groundingMetadata", {})
            citations: List[CitationItem] = []
            seen_urls = set()
            for chunk in metadata.get("groundingChunks", []):
                web = chunk.get("web", {})
                title = web.get("title")
                source_url = web.get("uri")
                if not title or not source_url or source_url in seen_urls:
                    continue
                seen_urls.add(source_url)
                host = urlparse(source_url).hostname or ""
                is_school_or_gov = host.endswith(".edu.vn") or host.endswith(".gov.vn")
                citations.append(CitationItem(
                    source_title=title,
                    source_url=source_url,
                    tier="Nguồn trường/Bộ GD&ĐT" if is_school_or_gov else "Nguồn tham khảo trực tuyến",
                    verified=is_school_or_gov,
                ))

            if not any(citation.verified for citation in citations):
                return "", []
            return text, citations
        except (httpx.HTTPError, ValueError, KeyError, IndexError):
            return "", []


deep_research_service = DeepResearchService()
