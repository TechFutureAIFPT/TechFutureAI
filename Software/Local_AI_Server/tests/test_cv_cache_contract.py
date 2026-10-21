from __future__ import annotations

import asyncio
import copy
from unittest.mock import Mock

import pytest

from app.ai import cv_analyzer as analyzer
from app.config import get_settings
from app.utils.text_utils import compute_cache_key


@pytest.fixture
def isolated_pipeline(monkeypatch):
    records = {}
    calls = []

    async def infer(**kwargs):
        calls.append(kwargs)
        return [{
            "fileName": entry["file_name"], "candidateName": "Synthetic candidate",
            "totalScore": 80, "rank": "A", "status": "SUCCESS",
            "pipelineMetadata": {"analysisMethod": "llm"},
        } for entry in kwargs["cv_entries"]]

    def save(key, name, score, payload, uid):
        records[key] = copy.deepcopy(payload)

    monkeypatch.setattr(analyzer, "analyze_cv_entries_async", infer)
    monkeypatch.setattr(analyzer.CacheRepository, "get_cache", lambda key: records.get(key))
    monkeypatch.setattr(analyzer.CacheRepository, "set_cache", save)
    monkeypatch.setattr(analyzer.HistoryRepository, "save_history", Mock(return_value="synthetic-history"))
    return records, calls


def run(weights=None, filters=None, user="test-owner", file_name="a.pdf"):
    return asyncio.run(analyzer.analyze_cv_pipeline(
        "Backend Python", [{"file_name": file_name, "text": "Built Python APIs"}],
        raw_weights=weights, hard_filters=filters, user_id=user,
    ))


def test_same_request_hits_cache_and_filter_change_reanalyzes(isolated_pipeline):
    _, calls = isolated_pipeline
    run(filters={"minExp": 1})
    assert run(filters={"minExp": 1})["pipeline"]["cacheHits"] == 1
    assert run(filters={"minExp": 5})["pipeline"]["cacheMisses"] == 1
    assert len(calls) == 2


def test_nested_rubric_changes_do_not_reuse_prior_scores(isolated_pipeline):
    _, calls = isolated_pipeline
    first = {"skills": {"name": "Skills", "children": [
        {"name": "Python", "weight": 70}, {"name": "SQL", "weight": 30},
    ]}}
    second = copy.deepcopy(first)
    second["skills"]["children"][0]["weight"] = 30
    second["skills"]["children"][1]["weight"] = 70
    run(weights=first)
    assert run(weights=second)["pipeline"]["cacheMisses"] == 1
    assert len(calls) == 2


def test_model_and_user_and_source_file_change_invalidate_cache(monkeypatch, isolated_pipeline):
    _, calls = isolated_pipeline
    run()
    run(user="another-owner")
    run(file_name="b.pdf")
    monkeypatch.setattr(get_settings(), "local_cv_model", "candidate-model:7b")
    result = run()
    assert len(calls) == 4
    assert result["pipeline"]["aiModel"] == "candidate-model:7b"


def test_model_failure_is_not_cached_as_success(monkeypatch, isolated_pipeline):
    records, _ = isolated_pipeline

    async def unavailable(**kwargs):
        raise RuntimeError("synthetic model outage")

    monkeypatch.setattr(analyzer, "analyze_cv_entries_async", unavailable)
    with pytest.raises(RuntimeError, match="synthetic model outage"):
        run()
    assert not records
    with pytest.raises(RuntimeError, match="synthetic model outage"):
        run()


def test_cache_document_boundaries_are_unambiguous():
    assert compute_cache_key("a|b", "c") != compute_cache_key("a", "b|c")
