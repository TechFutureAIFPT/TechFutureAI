from __future__ import annotations

from typing import Any

import httpx

from app.config import get_settings

TAVILY_SEARCH_URL = "https://api.tavily.com/search"


class TavilySearchResult:
    __slots__ = ("title", "url", "content", "score")

    def __init__(self, title: str, url: str, content: str, score: float) -> None:
        self.title = title
        self.url = url
        self.content = content
        self.score = score

    def to_dict(self) -> dict[str, Any]:
        return {"title": self.title, "url": self.url, "content": self.content, "score": self.score}


async def search(query: str, *, max_results: int = 5) -> list[TavilySearchResult]:
    settings = get_settings()
    if not settings.tavily_api_key:
        raise RuntimeError("TAVILY_API_KEY chưa được cấu hình.")

    payload = {
        "api_key": settings.tavily_api_key,
        "query": query,
        "search_depth": "advanced",
        "max_results": max_results,
        "include_answer": False,
        "include_raw_content": False,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.post(TAVILY_SEARCH_URL, json=payload)
    response.raise_for_status()
    data = response.json()

    results: list[TavilySearchResult] = []
    for item in data.get("results") or []:
        if not isinstance(item, dict):
            continue
        title = str(item.get("title") or "").strip()
        url = str(item.get("url") or "").strip()
        content = str(item.get("content") or "").strip()
        if not url or not content:
            continue
        try:
            score = float(item.get("score") or 0)
        except (TypeError, ValueError):
            score = 0.0
        results.append(TavilySearchResult(title=title or url, url=url, content=content, score=score))

    return results
