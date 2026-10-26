"""Additive compatibility fields for historical CV documents; never invent identity."""

from __future__ import annotations

from datetime import UTC, datetime
from math import isfinite
from typing import Any

from app.core.ai_contract import rank_from_score


def history_candidates(data: dict[str, Any]) -> list[dict[str, Any]]:
    for source in (data.get("fullPayload"), data.get("analysisData"), data):
        if not isinstance(source, dict):
            continue
        for key in ("candidates", "results"):
            value = source.get(key)
            if isinstance(value, list) and value:
                return [item for item in value if isinstance(item, dict)]
    return []


def candidate_score(candidate: dict[str, Any]) -> float:
    if candidate.get("status") == "FAILED":
        return 0
    analysis = (
        candidate.get("analysis") if isinstance(candidate.get("analysis"), dict) else {}
    )
    for value in (
        analysis.get("Tổng điểm"),
        analysis.get("Tong diem"),
        candidate.get("totalScore"),
        analysis.get("score"),
    ):
        if value is not None:
            try:
                score = float(value)
                if isfinite(score):
                    return max(0, min(100, score))
            except (ValueError, TypeError):
                continue
    return 0


def candidate_rank(candidate: dict[str, Any]) -> str:
    if candidate.get("status") == "FAILED":
        return "C"
    analysis = (
        candidate.get("analysis") if isinstance(candidate.get("analysis"), dict) else {}
    )
    for value in (
        analysis.get("Hạng"),
        analysis.get("Hang"),
        candidate.get("rank"),
        candidate.get("grade"),
    ):
        if isinstance(value, str) and value in {"A", "B", "C"}:
            return str(value)
    return rank_from_score(candidate_score(candidate))


def missing_history_fields(
    data: dict[str, Any], verified_owners: dict[str, str]
) -> dict[str, Any]:
    """Only add absent fields. verified_owners must come from verified Firebase Auth emails."""
    patch: dict[str, Any] = {}
    email = str(data.get("userEmail") or data.get("email") or "").strip().lower()
    if "uid" not in data and email in verified_owners:
        patch["uid"] = verified_owners[email]
    if email:
        for key in ("email", "userEmail"):
            if key not in data:
                patch[key] = email
    full = data.get("fullPayload") if isinstance(data.get("fullPayload"), dict) else {}
    jd = (
        data.get("jdText")
        if isinstance(data.get("jdText"), str)
        else full.get("jdText")
    )
    if isinstance(jd, str) and jd:
        if "jdText" not in data:
            patch["jdText"] = jd
        if "jdTextSnippet" not in data:
            patch["jdTextSnippet"] = jd[:300]
    title = data.get("jobPosition") or data.get("jdTitle") or full.get("jobPosition")
    if isinstance(title, str) and title:
        for key in ("jobPosition", "jdTitle"):
            if key not in data:
                patch[key] = title
    candidates = history_candidates(data)
    for target, alias in (
        ("totalCandidates", "cvCount"),
        ("cvCount", "totalCandidates"),
    ):
        count = data.get(alias)
        if target not in data:
            if isinstance(count, int) and not isinstance(count, bool) and count >= 0:
                patch[target] = count
            elif candidates:
                patch[target] = len(candidates)
    stamp = data.get("timestamp")
    if "createdAt" not in data:
        if isinstance(stamp, datetime):
            patch["createdAt"] = stamp
        elif isinstance(stamp, (int, float)) and isfinite(stamp) and stamp > 0:
            try:
                patch["createdAt"] = datetime.fromtimestamp(stamp / 1000, UTC)
            except (ValueError, OSError, OverflowError):
                pass
    return patch
