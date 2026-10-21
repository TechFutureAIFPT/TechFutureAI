import hashlib
import json
import re
import unicodedata
from typing import Any, Optional


def normalize_display_text(text: str) -> str:
    """Normalize whitespace and standard characters."""
    if not text:
        return ""
    text = unicodedata.normalize("NFC", str(text))
    text = re.sub(r"[\r\n\t]+", " ", text)
    text = re.sub(r"\s+", " ", text)
    return text.strip()


def remove_vietnamese_accents(text: str) -> str:
    """Convert Vietnamese accented text to plain ASCII text."""
    if not text:
        return ""
    normalized = unicodedata.normalize("NFD", str(text))
    without_accents = "".join(char for char in normalized if unicodedata.category(char) != "Mn")
    without_accents = without_accents.replace("đ", "d").replace("Đ", "D")
    return re.sub(r"[^a-zA-Z0-9\s]+", " ", without_accents).strip()


def compute_hash(data: str) -> str:
    """Compute standard SHA-256 hash for caching."""
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


def compute_cache_key(jd_text: str, cv_text: str, weights_str: str = "") -> str:
    """Deterministic cache key combining JD, CV, and scoring weights."""
    # JSON boundaries prevent collisions when documents themselves contain '|'.
    combined = json.dumps(
        ["cv-cache-v2", jd_text.strip(), cv_text.strip(), weights_str.strip()],
        ensure_ascii=False, separators=(",", ":"),
    )
    return compute_hash(combined)


def extract_json_object(raw_text: str) -> Any:
    """
    Robust JSON extraction from LLM response.
    Handles markdown code blocks (```json ... ```), trailing commas, and partial wrappers.
    """
    if not raw_text or not raw_text.strip():
        raise ValueError("Empty response received from LLM")

    cleaned = raw_text.strip()

    # Remove markdown code fences
    fence_pattern = r"^```(?:json)?\s*([\s\S]*?)\s*```$"
    match = re.search(fence_pattern, cleaned, re.MULTILINE)
    if match:
        cleaned = match.group(1).strip()

    # Search for boundary
    start_bracket = cleaned.find("[")
    start_brace = cleaned.find("{")

    start_idx = -1
    if start_bracket != -1 and start_brace != -1:
        start_idx = min(start_bracket, start_brace)
    elif start_bracket != -1:
        start_idx = start_bracket
    elif start_brace != -1:
        start_idx = start_brace

    end_idx = max(cleaned.rfind("]"), cleaned.rfind("}"))

    if start_idx != -1 and end_idx != -1 and end_idx >= start_idx:
        cleaned = cleaned[start_idx : end_idx + 1]

    # Fix trailing commas
    cleaned = re.sub(r",\s*([\]}])", r"\1", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError as error:
        # Fallback repair attempts
        repaired = re.sub(r"[\x00-\x1f\x7f-\x9f]", " ", cleaned)
        try:
            return json.loads(repaired)
        except Exception:
            raise ValueError(f"Failed to parse JSON from LLM response: {error} | Raw: {raw_text[:200]}...")


def clean_filename(filename: str) -> str:
    """Sanitize filename for safe storage."""
    base = re.sub(r'[\\/*?:"<>|]', "", filename or "unnamed_file")
    return re.sub(r"\s+", "_", base).strip()
