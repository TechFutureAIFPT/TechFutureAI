"""Offline, group-disjoint diagnostics. This module never exports a runtime model."""

from __future__ import annotations

import math
from collections import Counter
from typing import Any, Sequence

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import accuracy_score, classification_report, f1_score
from sklearn.model_selection import StratifiedGroupKFold
from sklearn.pipeline import Pipeline
from sklearn.svm import LinearSVC


def build_reference_pipeline(c: float, random_state: int = 42) -> Pipeline:
    """Match the canonical trainer's feature settings; vary regularization only."""
    return Pipeline([
        ("tfidf", TfidfVectorizer(
            max_features=20000, min_df=2, ngram_range=(1, 2),
            stop_words="english", sublinear_tf=True,
        )),
        ("classifier", LinearSVC(
            C=c, class_weight="balanced", random_state=random_state,
        )),
    ])


def checked_group_splits(
    labels: np.ndarray, groups: np.ndarray, folds: int, seed: int,
) -> list[tuple[np.ndarray, np.ndarray]]:
    """Reject leakage, empty folds, and missing classes rather than inflate F1."""
    if folds < 2:
        raise ValueError("At least two folds are required.")
    expected = set(labels)
    if len(expected) < 2:
        raise ValueError("At least two classes are required.")
    for label in expected:
        count = len(set(groups[labels == label]))
        if count < folds:
            raise ValueError(f"Class {label} has {count} independent groups; need {folds}.")
    splitter = StratifiedGroupKFold(n_splits=folds, shuffle=True, random_state=seed)
    splits = list(splitter.split(np.zeros(len(labels)), labels, groups))
    for train, validation in splits:
        if not len(train) or not len(validation):
            raise ValueError("The grouped split contains an empty partition.")
        if set(groups[train]) & set(groups[validation]):
            raise ValueError("Entity groups overlap across partitions.")
        if set(labels[train]) != expected or set(labels[validation]) != expected:
            raise ValueError("A grouped fold is missing a class; collect more independent groups.")
    return splits


def choose_regularization(rows: list[dict[str, Any]], folds: int) -> dict[str, Any]:
    """One-standard-error rule: prefer smaller C within validation uncertainty."""
    if not rows or folds < 2:
        raise ValueError("Regularization selection requires validation folds.")
    best = max(rows, key=lambda row: row["validationMacroF1Mean"])
    cutoff = best["validationMacroF1Mean"] - best["validationMacroF1Std"] / math.sqrt(folds)
    return min(
        (row for row in rows if row["validationMacroF1Mean"] >= cutoff),
        key=lambda row: row["C"],
    )


def describe_fit(train_f1: float, validation_f1: float, target: float, gap_limit: float) -> dict[str, Any]:
    """Diagnostic heuristics are signals, not proof of a unique failure cause."""
    gap = train_f1 - validation_f1
    signals = []
    if gap > gap_limit:
        signals.append("high_variance_or_distribution_shift")
    if train_f1 < target and validation_f1 < target:
        signals.append("high_bias_or_label_feature_problem")
    if not signals:
        signals.append("no_large_fit_gap_detected")
    return {
        "signals": signals, "trainValidationGap": round(gap, 6),
        "heuristicOnly": True,
        "warning": "Low validation F1 alone does not prove underfitting; inspect labels, groups and domain shift.",
    }


def _summary(values: list[float]) -> tuple[float, float]:
    return float(np.mean(values)), float(np.std(values, ddof=1))


def _metrics(labels: np.ndarray, predicted: np.ndarray, classes: list[str]) -> dict[str, Any]:
    return {
        "accuracy": round(float(accuracy_score(labels, predicted)), 6),
        "macroF1": round(float(f1_score(
            labels, predicted, labels=classes, average="macro", zero_division=0,
        )), 6),
        "perClass": classification_report(
            labels, predicted, labels=classes, output_dict=True, zero_division=0,
        ),
    }


def evaluate_classifier(
    texts: Sequence[str], labels: Sequence[str], groups: Sequence[str], *,
    c_values: Sequence[float] = (0.1, 0.3, 1.0, 3.0, 10.0),
    outer_folds: int = 5, inner_folds: int = 3, seed: int = 42,
    learning_fractions: Sequence[float] = (0.5, 0.75, 1.0),
    min_macro_f1: float = 0.70, max_fit_gap: float = 0.15,
) -> dict[str, Any]:
    if not (len(texts) == len(labels) == len(groups)) or not len(texts):
        raise ValueError("Texts, labels and entity groups must have equal, nonzero lengths.")
    if any(not isinstance(value, str) or not value.strip() for values in (texts, labels, groups) for value in values):
        raise ValueError("Texts, labels and entity groups must be nonempty strings.")
    if not c_values or any(not math.isfinite(c) or c <= 0 for c in c_values):
        raise ValueError("C values must be positive finite numbers.")
    if not learning_fractions or any(not math.isfinite(f) or not 0 < f <= 1 for f in learning_fractions):
        raise ValueError("Learning fractions must lie in (0, 1].")
    if not 0 < min_macro_f1 <= 1 or not 0 < max_fit_gap < 1:
        raise ValueError("Invalid diagnostic thresholds.")
    x, y, entity = np.array(texts), np.array(labels), np.array(groups)
    classes = sorted(set(y.tolist()))
    # The first outer fold is fixed in advance, never chosen by its performance.
    development, test = checked_group_splits(y, entity, outer_folds, seed)[0]
    dx, dy, dg = x[development], y[development], entity[development]
    splits = checked_group_splits(dy, dg, inner_folds, seed + 1)
    grid = []
    for c in sorted(set(c_values)):
        train_scores, valid_scores = [], []
        for train, valid in splits:
            model = build_reference_pipeline(c, seed)
            model.fit(dx[train], dy[train])
            train_scores.append(_metrics(dy[train], model.predict(dx[train]), classes)["macroF1"])
            valid_scores.append(_metrics(dy[valid], model.predict(dx[valid]), classes)["macroF1"])
        train_mean, train_std = _summary(train_scores)
        valid_mean, valid_std = _summary(valid_scores)
        grid.append({
            "C": c, "trainMacroF1Mean": train_mean, "trainMacroF1Std": train_std,
            "validationMacroF1Mean": valid_mean, "validationMacroF1Std": valid_std,
            "validationFoldScores": valid_scores,
        })
    selected = choose_regularization(grid, inner_folds)
    curves = []
    for fraction in sorted(set(learning_fractions)):
        train_scores, valid_scores, row_counts, group_counts = [], [], [], []
        for fold, (train, valid) in enumerate(splits):
            ordered = np.array(sorted(set(dg[train])))
            rng = np.random.default_rng(seed + fold)
            rng.shuffle(ordered)
            selected_groups = set(ordered[:max(1, math.ceil(len(ordered) * fraction))])
            subset = np.array([index for index in train if dg[index] in selected_groups])
            if set(dy[subset]) != set(classes):
                raise ValueError("A learning-curve subset lacks classes; increase its fraction or add groups.")
            model = build_reference_pipeline(selected["C"], seed)
            model.fit(dx[subset], dy[subset])
            train_scores.append(_metrics(dy[subset], model.predict(dx[subset]), classes)["macroF1"])
            valid_scores.append(_metrics(dy[valid], model.predict(dx[valid]), classes)["macroF1"])
            row_counts.append(len(subset))
            group_counts.append(len(selected_groups))
        curves.append({
            "fraction": fraction, "trainRowsByFold": row_counts, "trainGroupsByFold": group_counts,
            "trainMacroF1Mean": _summary(train_scores)[0],
            "validationMacroF1Mean": _summary(valid_scores)[0],
            "validationMacroF1Std": _summary(valid_scores)[1],
        })
    # Evaluate the outer holdout once, after all model selection is finished.
    final = build_reference_pipeline(selected["C"], seed)
    final.fit(dx, dy)
    train_metrics = _metrics(dy, final.predict(dx), classes)
    test_metrics = _metrics(y[test], final.predict(x[test]), classes)
    dummy_label = Counter(dy).most_common(1)[0][0]
    dummy = _metrics(y[test], np.full(len(test), dummy_label), classes)
    return {
        "schemaVersion": "cv-match-fit-diagnostics-v1",
        "kind": "offline-reference-classifier-not-production-accuracy",
        "split": {
            "strategy": "fixed-outer-StratifiedGroupKFold+inner-grouped-CV",
            "outerFolds": outer_folds, "innerFolds": inner_folds, "seed": seed,
            "developmentRows": len(development), "testRows": len(test),
            "developmentGroups": len(set(dg)), "testGroups": len(set(entity[test])),
            "groupLeakageCount": len(set(dg) & set(entity[test])),
            "testUsedForSelection": False,
        },
        "regularizationGrid": grid, "selectedC": selected["C"],
        "selectionRule": "smallest-C-within-one-standard-error-of-best-inner-CV",
        "learningCurve": curves,
        "training": train_metrics, "holdout": test_metrics, "dummyBaseline": dummy,
        "diagnosis": describe_fit(
            selected["trainMacroF1Mean"], selected["validationMacroF1Mean"], min_macro_f1, max_fit_gap,
        ),
        "thresholds": {"minMacroF1": min_macro_f1, "maxFitGap": max_fit_gap},
        "candidateGatePassed": bool(
            test_metrics["macroF1"] >= min_macro_f1
            and selected["trainMacroF1Mean"] - selected["validationMacroF1Mean"] <= max_fit_gap
        ),
        "runtimeModelChanged": False,
        "limitations": [
            "Entity groups detect near-duplicate text, not all revisions of the same person or employer.",
            "The source is not a labeled CV-JD scoring or Vietnamese deployment benchmark.",
            "The holdout becomes development evidence if repeatedly consulted; reserve a new locked release set.",
            "Thresholds are diagnostic defaults, not approved hiring decision thresholds.",
        ],
    }
