from __future__ import annotations

from typing import Iterable

from google import genai

from app.config import get_settings

# Google occasionally returns 503 "high demand" for a specific model alias while
# other models on the same key work fine — fall back instead of failing the
# whole reply. Mirrors Software/backend/cv-match-api's gemini_service._fallback_models().
_FALLBACK_MODELS = ("gemini-2.5-flash", "gemini-2.0-flash")


def _candidate_models(primary: str) -> Iterable[str]:
    seen: set[str] = set()
    for model in (primary, *_FALLBACK_MODELS):
        normalized = (model or "").strip()
        if normalized and normalized not in seen:
            seen.add(normalized)
            yield normalized


def generate_content(prompt: str, *, temperature: float = 0.4) -> str:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise RuntimeError("GEMINI_API_KEY chưa được cấu hình.")

    client = genai.Client(api_key=settings.gemini_api_key)
    last_error: Exception | None = None

    for model in _candidate_models(settings.gemini_model):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config={"temperature": temperature},
            )
            return response.text or ""
        except Exception as error:  # pragma: no cover - network/provider path
            last_error = error

    raise last_error or RuntimeError("Tất cả model Gemini đều thất bại.")
