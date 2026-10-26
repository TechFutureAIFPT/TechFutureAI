from __future__ import annotations

import json
import pytest

import diagnose_classifier as cli


def test_unregistered_snapshot_cannot_enter_training(monkeypatch, tmp_path):
    snapshot = tmp_path / "resume.csv"
    snapshot.write_text("unreviewed snapshot", encoding="utf-8")
    monkeypatch.setattr("sys.argv", [
        "diagnose_classifier", "--source-id", "test", "--dataset-csv", str(snapshot),
        "--output", str(tmp_path / "report.json"),
    ])
    monkeypatch.setattr(cli, "get_source", lambda key: {
        "id": "test", "status": "approved", "revision": "a" * 64,
        "intendedUses": ["classifier_training"], "license": "CC0-1.0",
    })
    monkeypatch.setattr(cli, "load_and_audit", lambda *args: pytest.fail("must not load training data"))
    with pytest.raises(ValueError, match="checksum"):
        cli.main()


def test_mismatched_snapshot_audit_cannot_fit_model(monkeypatch, tmp_path):
    snapshot = tmp_path / "resume.csv"
    snapshot.write_text("unreviewed snapshot", encoding="utf-8")
    output = tmp_path / "audit.json"
    monkeypatch.setattr("sys.argv", [
        "diagnose_classifier", "--source-id", "test", "--dataset-csv", str(snapshot),
        "--output", str(output), "--audit-only",
    ])
    monkeypatch.setattr(cli, "get_source", lambda key: {
        "id": "test", "status": "approved", "revision": "a" * 64,
        "intendedUses": ["classifier_training"], "license": "CC0-1.0",
    })
    monkeypatch.setattr(cli, "load_and_audit", lambda *args: ([1, 2], {"entityGroupCount": 2}))
    monkeypatch.setattr(cli, "evaluate_classifier", lambda *args, **kwargs: pytest.fail("audit must not train"))
    assert cli.main() == 0
    report = json.loads(output.read_text(encoding="utf-8"))
    assert report["trainingAllowedForThisSnapshot"] is False
    assert report["sourceChecksumMatchesRegistry"] is False
    assert report["runtimeModelChanged"] is False
