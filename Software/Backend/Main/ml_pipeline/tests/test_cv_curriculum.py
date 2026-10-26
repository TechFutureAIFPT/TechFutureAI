from __future__ import annotations

import json

import pytest

from prepare_cv_curriculum import ROLES, STATES, cv_example, spans


def test_every_curriculum_quote_is_grounded_and_filter_is_explicit():
    for role in range(len(ROLES)):
        for state in STATES:
            row = cv_example(role, state, "train")
            request = json.loads(row["messages"][1]["content"])
            answer = json.loads(row["messages"][2]["content"])
            assert {c["id"] for c in request["rubric"]} == {c["id"] for c in answer["criteria"]}
            assert {f["key"] for f in answer["filters"]} == set(request["hard_filters"])
            assert all(q in request["cv"] for item in answer["criteria"] + answer["filters"] for q in item["evidence"])
            assert row["humanReviewed"] is False
            if state in {"list", "injection", "unrelated_action"}:
                assert answer["criteria"][0]["level"] == 1
            if state in {"negation", "title", "absent"}:
                assert answer["criteria"][0]["level"] == 0


def test_unknown_is_not_a_failed_hard_filter():
    def status(state):
        return json.loads(cv_example(0, state, "test")["messages"][-1]["content"])["filters"][0]["status"]
    assert status("hard_met") == "met"
    assert status("hard_failed") == "not_met"
    assert status("hard_unknown") == "unknown"


def test_bio_boundaries_and_invalid_labels():
    assert spans(["Use", "Python", "and", "SQL"], ["O", "B", "O", "B"]) == ["Python", "SQL"]
    with pytest.raises(ValueError, match="BIO"):
        spans(["Python"], [])
    with pytest.raises(ValueError, match="BIO"):
        spans(["Python"], ["SKILL"])
