from __future__ import annotations

import numpy as np
import pytest

from supporthr_ml import classifier_evaluation as evaluation


def synthetic_dataset():
    texts, labels, groups = [], [], []
    for label, words in (("ENGINEERING", "python backend api"), ("ACCOUNTANT", "ledger audit taxation")):
        for group in range(18):
            for revision in range(2):
                texts.append(f"{words} experience delivery document{label}{group} revision{revision}")
                labels.append(label)
                groups.append(f"{label}-{group}")
    return texts, labels, groups


def test_grouped_selection_and_learning_curve_never_fit_outer_holdout(monkeypatch):
    texts, labels, groups = synthetic_dataset()
    development, test = evaluation.checked_group_splits(np.array(labels), np.array(groups), 3, 42)[0]
    test_texts = {texts[index] for index in test}
    fitted_texts = []
    original = evaluation.build_reference_pipeline

    def tracked_pipeline(c, random_state=42):
        model = original(c, random_state)
        fit = model.fit

        def tracked_fit(x, y):
            fitted_texts.append(set(x))
            return fit(x, y)

        model.fit = tracked_fit
        return model

    monkeypatch.setattr(evaluation, "build_reference_pipeline", tracked_pipeline)
    report = evaluation.evaluate_classifier(
        texts, labels, groups, c_values=(0.1, 1), outer_folds=3, inner_folds=2,
        learning_fractions=(0.75, 1),
    )
    assert fitted_texts
    assert all(not used & test_texts for used in fitted_texts)
    assert fitted_texts[-1] == {texts[index] for index in development}
    assert report["split"]["groupLeakageCount"] == 0
    assert report["holdout"]["macroF1"] == 1
    assert report["holdout"]["macroF1"] > report["dummyBaseline"]["macroF1"]
    assert report["runtimeModelChanged"] is False
    assert len(report["learningCurve"]) == 2


def test_insufficient_independent_groups_rejected_even_with_many_rows():
    with pytest.raises(ValueError, match="independent groups"):
        evaluation.checked_group_splits(
            np.array(["IT"] * 50 + ["HR"] * 50),
            np.array(["one-person"] * 50 + ["another-person"] * 50), 3, 42,
        )


def test_regularization_uses_validation_and_prefers_simpler_within_uncertainty():
    selected = evaluation.choose_regularization([
        {"C": 0.1, "trainMacroF1Mean": 0.8, "validationMacroF1Mean": 0.79, "validationMacroF1Std": 0.01},
        {"C": 1, "trainMacroF1Mean": 0.99, "validationMacroF1Mean": 0.80, "validationMacroF1Std": 0.04},
        {"C": 10, "trainMacroF1Mean": 1, "validationMacroF1Mean": 0.75, "validationMacroF1Std": 0.01},
    ], 3)
    assert selected["C"] == 0.1


@pytest.mark.parametrize("train,valid,signal", [
    (0.99, 0.6, "high_variance_or_distribution_shift"),
    (0.5, 0.48, "high_bias_or_label_feature_problem"),
    (0.9, 0.88, "no_large_fit_gap_detected"),
])
def test_fit_diagnosis_does_not_confuse_low_holdout_with_underfitting(train, valid, signal):
    result = evaluation.describe_fit(train, valid, 0.7, 0.15)
    assert result["signals"] == [signal]
    assert result["heuristicOnly"] is True


@pytest.mark.parametrize("c", [0, -1, float("nan"), float("inf")])
def test_invalid_regularization_rejected(c):
    with pytest.raises(ValueError, match="positive finite"):
        evaluation.evaluate_classifier(["python", "ledger"], ["IT", "HR"], ["a", "b"], c_values=[c])
