from datetime import UTC, datetime
from types import SimpleNamespace

import pytest

from app.schemas.account import AuthenticatedUser
from app.services.account import profile_service
from app.services.account.history_service import _extract_candidates
from app.services.history_schema_service import (
    candidate_rank,
    candidate_score,
    missing_history_fields,
)


def test_malformed_analysis_metadata_does_not_crash():
    assert candidate_score({"analysis": "unstructured", "totalScore": 80}) == 80
    assert candidate_rank({"analysis": {"Hang": []}, "rank": "B"}) == "B"


def test_ownership_requires_verified_mapping():
    data = {"userEmail": "Owner@Example.test"}
    assert missing_history_fields(data, {}) == {"email": "owner@example.test"}
    assert (
        missing_history_fields(data, {"owner@example.test": "verified-uid"})["uid"]
        == "verified-uid"
    )


def test_existing_fields_are_never_overwritten():
    data = {
        "uid": "existing",
        "email": "",
        "userEmail": "a@example.test",
        "jdText": "",
        "jdTitle": "Existing",
        "createdAt": "unchanged",
        "totalCandidates": 0,
        "cvCount": 0,
    }
    patch = missing_history_fields(data, {"a@example.test": "different"})
    assert not set(patch) & set(data)
    assert data["uid"] == "existing"


def test_legacy_history_is_completed_from_real_data():
    stamp = datetime(2026, 1, 1, tzinfo=UTC)
    data = {
        "jobPosition": "Python developer",
        "fullPayload": {"jdText": "Cần Python", "candidates": [{"candidateName": "A"}]},
        "totalCandidates": 1,
        "timestamp": stamp,
    }
    patch = missing_history_fields(data, {})
    assert patch["jdText"] == "Cần Python"
    assert patch["jdTitle"] == "Python developer"
    assert patch["cvCount"] == 1
    assert patch["createdAt"] == stamp
    assert "uid" not in patch
    assert missing_history_fields({**data, **patch}, {}) == {}


@pytest.mark.parametrize(
    "analysis", [{"Tong diem": 92.5, "Hang": "A"}, {"Tổng điểm": 92.5, "Hạng": "A"}]
)
def test_model_score_aliases_survive_history_storage(analysis):
    candidate = {"analysis": analysis}
    assert candidate_score(candidate) == 92.5
    assert candidate_rank(candidate) == "A"


def test_zero_and_failed_scores_are_not_replaced_by_other_aliases():
    assert candidate_score({"analysis": {"Tổng điểm": 0, "Tong diem": 99}}) == 0
    assert candidate_score({"status": "FAILED", "totalScore": 99}) == 0
    assert candidate_rank({"status": "FAILED", "rank": "A"}) == "C"


def test_legacy_results_are_available_to_mobile_history_reader():
    rows = [{"candidateName": "A"}]
    assert _extract_candidates({"results": rows}) == rows


def test_new_profile_history_writes_both_client_contracts(monkeypatch):
    captured = {}
    document = SimpleNamespace(id="new-history", set=captured.update)
    monkeypatch.setattr(profile_service.repo, "cv_history", lambda: object())
    monkeypatch.setattr(
        profile_service.repo, "create_document", lambda collection: document
    )
    monkeypatch.setattr(profile_service.repo, "server_timestamp", lambda: "server-time")
    monkeypatch.setattr(
        profile_service, "cleanup_profile_cv_history", lambda *args: None
    )
    user = AuthenticatedUser(uid="auth-uid", email="owner@example.test")
    assert (
        profile_service.save_cv_history(user, "", "Python", "Developer", 1, [])
        == "new-history"
    )
    assert captured["uid"] == "auth-uid"
    assert captured["email"] == captured["userEmail"] == user.email
    assert captured["cvCount"] == captured["totalCandidates"] == 1
    assert captured["jdTextSnippet"] == "Python"
    assert captured["jobPosition"] == captured["jdTitle"] == "Developer"
