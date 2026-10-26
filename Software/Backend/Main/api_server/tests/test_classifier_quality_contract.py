from __future__ import annotations

from types import SimpleNamespace
from unittest.mock import Mock

import pytest

from app.services import local_classifier_service as service


@pytest.mark.parametrize("margin,expected", [(3.0, "IT"), (-3.0, "HR")])
def test_binary_margin_scores_both_labels_and_keeps_direction(margin, expected):
    model = SimpleNamespace(classes_=["HR", "IT"], decision_function=lambda values: [margin])
    ranked = service._rank_predictions(model, "synthetic cv", 2)
    assert ranked[0]["label"] == expected
    assert len(ranked) == 2
    assert sum(item["score"] for item in ranked) == pytest.approx(1, abs=0.0002)


def test_invalid_artifact_is_not_cached_after_label_validation_fails(monkeypatch):
    monkeypatch.setattr(service, "_model_cache", None)
    monkeypatch.setattr(service, "_model_manifest", None)
    monkeypatch.setattr(service, "_model_error", None)
    monkeypatch.setattr(service, "MODEL_PATH", SimpleNamespace(is_file=lambda: True))
    monkeypatch.setattr(service, "_load_and_validate_manifest", lambda: {"labels": ["EXPECTED"]})
    loader = Mock(return_value=SimpleNamespace(classes_=["WRONG"]))
    monkeypatch.setattr(service.joblib, "load", loader)
    for _ in range(2):
        with pytest.raises(RuntimeError, match="labels do not match"):
            service._load_model()
    assert service._model_cache is None
    assert loader.call_count == 2
