"""Measure classifier fit without installing artifacts or sending CVs to a service."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path

from supporthr_ml.classifier_evaluation import evaluate_classifier
from supporthr_ml.contracts import sha256_file
from supporthr_ml.registry import ensure_use_allowed, get_source
from train_classifier import load_and_audit


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-id", required=True)
    parser.add_argument("--dataset-csv", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--text-column", default="Resume_str")
    parser.add_argument("--label-column", default="Category")
    parser.add_argument("--audit-only", action="store_true", help="Inspect aggregate dataset quality without fitting any model.")
    parser.add_argument("--inner-folds", type=int, default=3)
    parser.add_argument("--outer-folds", type=int, default=5)
    parser.add_argument("--c-values", type=float, nargs="+", default=[0.1, 0.3, 1.0, 3.0, 10.0])
    args = parser.parse_args()
    source = get_source(args.source_id)
    ensure_use_allowed(source, "classifier_training")
    revision = str(source.get("revision") or "").lower()
    actual_sha = sha256_file(args.dataset_csv)
    checksum_matches = len(revision) != 64 or actual_sha == revision
    if not checksum_matches and not args.audit_only:
        raise ValueError("Dataset checksum does not match its reviewed source registry.")
    # Match the canonical trainer's dedupe and normalization for a comparable baseline.
    frame, audit = load_and_audit(args.dataset_csv, args.text_column, args.label_column, 10)
    print(json.dumps({"stage": "audit", "rows": len(frame), "groups": audit["entityGroupCount"]}), flush=True)
    if args.audit_only:
        report = {
            "kind": "dataset-audit-only-no-training",
            "runtimeModelChanged": False,
            "trainingAllowedForThisSnapshot": checksum_matches,
            "sourceChecksumMatchesRegistry": checksum_matches,
            "expectedSha256": revision if len(revision) == 64 else None,
            "actualSha256": actual_sha,
        }
    else:
        report = evaluate_classifier(
            frame["text"].tolist(), frame["label"].tolist(), frame["entityGroupId"].tolist(),
            c_values=args.c_values, inner_folds=args.inner_folds, outer_folds=args.outer_folds,
        )
    report["datasetAudit"] = audit
    report["source"] = {"id": source["id"], "revision": source["revision"], "license": source["license"]}
    report["createdAt"] = datetime.now(timezone.utc).isoformat()
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    if args.audit_only:
        print(json.dumps({
            "output": str(args.output.resolve()), "auditOnly": True,
            "sourceChecksumMatchesRegistry": checksum_matches,
            "rows": len(frame), "runtimeModelChanged": False,
        }), flush=True)
        return 0
    print(json.dumps({
        "output": str(args.output.resolve()), "selectedC": report["selectedC"],
        "trainMacroF1": report["training"]["macroF1"],
        "holdoutMacroF1": report["holdout"]["macroF1"],
        "diagnosis": report["diagnosis"], "candidateGatePassed": report["candidateGatePassed"],
        "runtimeModelChanged": False,
    }, ensure_ascii=False), flush=True)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
