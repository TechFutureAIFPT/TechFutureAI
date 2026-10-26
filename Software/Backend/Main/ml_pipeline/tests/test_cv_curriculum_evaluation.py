from __future__ import annotations

import io
import hashlib
import json
import pytest

from evaluate_cv_curriculum import generate, run, summarize


def test_raw_overrating_remains_visible_when_backend_caps_it(monkeypatch):
    monkeypatch.setattr("evaluate_cv_curriculum.prompt_tokens", lambda *args: 100)
    request = {"jd": "Use Rust and Axum in production.", "rubric": [{"id": "c0", "key": "skills", "name": "Applied Rust and Axum skills", "weight": 100, "children": []}], "hard_filters": {}, "cv": "Skills: Rust, Axum."}
    answer = {"candidate_name": "", "criteria": [{"id": "c0", "level": 4, "evidence": ["Skills: Rust, Axum."], "missing": [], "reason": "Skill names listed."}], "filters": []}
    envelope = {"done": True, "done_reason": "stop", "response": json.dumps(answer)}
    monkeypatch.setattr("urllib.request.urlopen", lambda *args, **kwargs: io.BytesIO(json.dumps(envelope).encode()))
    row = {"id": "synthetic:listing", "group": "group-1", "task": "cv_evidence", "scenario": "list", "messages": [{"content": "Return CV evidence JSON."}, {"content": json.dumps(request)}], "target": {"criteria": [{"id": "c0", "level": 1}], "filters": []}}
    result = generate("local-test-model", row)
    assert result["rawScore"] == 100
    assert result["guardedScore"] == 25
    metrics = summarize([result])["tasks"]["cv_evidence"]
    assert metrics["rawScoreMAE"] == 75
    assert metrics["guardedScoreMAE"] == 0
    assert metrics["rawSkillListOverrating"] == {"overrated": 1, "cases": 1}


def test_generation_errors_are_counted_as_failed_attempts():
    report = summarize([{"id": "bad", "task": "cv_evidence", "group": "g", "error": "Invalid schema"}])
    assert report["errors"] == 1
    assert report["tasks"]["cv_evidence"] == {"attempted": 1, "valid": 0, "independentGroups": 0}


def test_positive_challenge_cannot_pass_with_invented_quotes(monkeypatch):
    monkeypatch.setattr("evaluate_cv_curriculum.prompt_tokens", lambda *args: 100)
    request = {"jd": "Use Rust.", "rubric": [{"id": "c0", "key": "skills", "name": "Rust", "weight": 100, "children": []}], "hard_filters": {}, "cv": "Built a service using Rust."}
    answer = {"candidate_name": "", "criteria": [{"id": "c0", "level": 4, "evidence": ["Invented project which is absent."], "missing": [], "reason": "Unverifiable."}], "filters": []}
    monkeypatch.setattr("urllib.request.urlopen", lambda *args, **kwargs: io.BytesIO(json.dumps({"done": True, "response": json.dumps(answer)}).encode()))
    result = generate("fixture-model", {"id": "challenge:unverifiable", "group": "g", "task": "challenge", "messages": [{"content": "CV evidence"}, {"content": json.dumps(request)}], "target": {"levelBounds": [4, 4]}})
    assert result["levelBoundsMet"] is True
    assert result["positiveEvidenceGrounded"] is False
    assert result["passed"] is False


@pytest.mark.parametrize("newline", [b"\n", b"\r\n"])
def test_plan_byte_integrity_across_windows_and_unix_newlines(tmp_path, monkeypatch, newline):
    plan = tmp_path / "plan.jsonl"
    record = {"id": "frozen-1", "group": "g", "task": "cv_evidence"}
    plan.write_bytes(json.dumps(record).encode() + newline)
    (tmp_path / "plan-manifest.json").write_text(json.dumps({"planSha256": hashlib.sha256(plan.read_bytes()).hexdigest()}))
    monkeypatch.setattr("evaluate_cv_curriculum.generate", lambda model, row: {**record, "error": "intentional fixture"})
    result = run(plan, "fixture-model", tmp_path / "results")
    assert result["attempted"] == 1
    assert run(plan, "fixture-model", tmp_path / "results")["attempted"] == 1
    plan.write_bytes(plan.read_bytes().replace(b"frozen-1", b"tampered"))
    with pytest.raises(ValueError, match="plan changed"):
        run(plan, "fixture-model", tmp_path / "results")
