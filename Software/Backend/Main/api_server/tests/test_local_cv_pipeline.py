from __future__ import annotations

import asyncio
from unittest.mock import AsyncMock, Mock

import pytest
from app.core.config import get_settings
from app.services import cv_pipeline_service as pipeline
from app.services import cv_specialist_service as specialist
from fastapi import HTTPException


@pytest.fixture
def local_mode(monkeypatch):
    settings = get_settings()
    monkeypatch.setattr(settings, "cv_analysis_provider", "ollama")
    monkeypatch.setattr(
        pipeline,
        "get_classifier_status",
        Mock(side_effect=AssertionError("classifier/cloud preparation must not run")),
    )
    monkeypatch.setattr(
        pipeline,
        "_prepare_entry_context",
        AsyncMock(side_effect=AssertionError("cloud preparation must not run")),
    )
    monkeypatch.setattr(pipeline, "_sync_history_safe", AsyncMock(return_value=None))


def test_local_branch_preserves_response_and_skips_cloud(monkeypatch, local_mode):
    analyze = AsyncMock(
        return_value={
            "candidates": [{"fileName": "a.pdf", "totalScore": 75}],
            "pipeline": {"provider": "ollama", "geminiCalls": 0},
        }
    )
    monkeypatch.setattr(specialist, "analyze_local_entries", analyze)
    result = asyncio.run(
        pipeline.run_smart_cv_analysis(
            "Tuyển lập trình Python", {}, {}, [{"file_name": "a.pdf", "text": "Python"}]
        )
    )
    assert result["candidates"][0]["totalScore"] == 75
    assert result["pipeline"]["geminiCalls"] == 0
    assert analyze.await_count == 1


def test_model_failure_surfaces_without_fake_rule_based_score(monkeypatch, local_mode):
    monkeypatch.setattr(
        specialist,
        "analyze_local_entries",
        AsyncMock(side_effect=specialist.LocalCVError("Ollama unavailable")),
    )
    monkeypatch.setattr(
        pipeline,
        "build_rule_based_fallback_candidates",
        Mock(side_effect=AssertionError("no fake success")),
    )
    with pytest.raises(HTTPException) as raised:
        asyncio.run(
            pipeline.run_smart_cv_analysis(
                "Tuyển Python", {}, {}, [{"file_name": "a.pdf", "text": "Python"}]
            )
        )
    assert raised.value.status_code == 503


def test_local_entries_never_mix_candidate_contexts(monkeypatch):
    calls = []

    def analyze(jd, text, weights, filters, file_name):
        calls.append((text, file_name))
        return {"totalScore": len(text)}

    monkeypatch.setattr(specialist, "analyze_local_cv", analyze)
    result = asyncio.run(
        specialist.analyze_local_entries(
            "JD",
            {},
            {},
            [
                {"file_name": "a.pdf", "text": "AAA"},
                {"file_name": "b.pdf", "text": "BBBB"},
            ],
        )
    )
    assert calls == [("AAA", "a.pdf"), ("BBBB", "b.pdf")]
    assert result["pipeline"]["localCalls"] == 2
    assert result["candidates"][0]["totalScore"] == 4


def test_input_error_returns_422(monkeypatch, local_mode):
    monkeypatch.setattr(
        specialist,
        "analyze_local_entries",
        AsyncMock(side_effect=specialist.LocalCVInputError("Document too long")),
    )
    with pytest.raises(HTTPException) as raised:
        asyncio.run(
            pipeline.run_smart_cv_analysis(
                "Tuyển Python", {}, {}, [{"file_name": "a.pdf", "text": "Python"}]
            )
        )
    assert raised.value.status_code == 422


@pytest.mark.parametrize("jd", [None, "Tuyển Python"])
def test_quick_score_uses_local_without_cloud_keys(monkeypatch, local_mode, jd):
    from app.services import quick_cv_score_service as quick

    candidate = specialist.score_evidence(
        specialist.CVEvidence(
            candidate_name="",
            criteria=[
                specialist.EvidenceRating(
                    id="c0",
                    level=3,
                    evidence=["Đã xây dựng API bằng Python"],
                    missing=[],
                    reason="Có bằng chứng ứng dụng.",
                )
            ],
            filters=[],
        ),
        specialist.build_criteria({"skills": 100}),
        {},
        "Đã xây dựng API bằng Python",
        "a.pdf",
    )
    monkeypatch.setattr(specialist, "analyze_local_cv", Mock(return_value=candidate))
    monkeypatch.setattr(
        quick,
        "generate_content",
        Mock(side_effect=AssertionError("cloud must not run")),
    )
    result = quick.score_quick_cvs(
        [{"file_name": "a.pdf", "text": "Đã xây dựng API bằng Python"}],
        jd_text=jd,
        api_keys=[],
    )
    assert result[0].score == 75
    assert bool(result[0].warnings) == (jd is None)
