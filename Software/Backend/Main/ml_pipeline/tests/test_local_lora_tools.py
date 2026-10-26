from __future__ import annotations

import json
from pathlib import Path

import pytest

import prepare_cv_local_sft as prep


def test_sft_rejects_unpinned_source(tmp_path):
    source = tmp_path / "input.csv"
    source.write_text("Resume_str,Category\nSynthetic,IT\n", encoding="utf-8")
    with pytest.raises(ValueError, match="pinned"):
        prep.prepare(source, tmp_path / "out")


def test_sft_variants_stay_in_source_group_and_evidence_is_literal(tmp_path, monkeypatch):
    import pandas as pd
    source = tmp_path / "input.csv"
    pd.DataFrame({"Resume_str": [f"Record {index}: Implemented Python services for inventory project number {index}." for index in range(120)], "Category": ["IT"] * 120}).to_csv(source, index=False)
    digest = prep.sha256_file
    monkeypatch.setattr(prep, "sha256_file", lambda path: prep.SOURCE_SHA if Path(path) == source else digest(path))
    monkeypatch.setattr(prep, "assign_near_duplicate_groups", lambda rows: ({row["documentId"]: row["documentId"] for row in rows}, 0))
    output = tmp_path / "prepared"
    manifest = prep.prepare(source, output, max_groups=120)
    groups = {}
    for split in ("train", "validation", "test"):
        records = [json.loads(line) for line in (output / f"{split}.jsonl").read_text(encoding="utf-8").splitlines()]
        groups[split] = {record["entityGroupId"] for record in records}
        assert records
        for record in records:
            supplied = json.loads(record["messages"][1]["content"])["cv"]
            target = json.loads(record["messages"][2]["content"])
            assert all(quote in supplied for criterion in target["criteria"] for quote in criterion["evidence"])
            assert record["humanReviewed"] is False
    assert not (groups["train"] & groups["validation"] or groups["train"] & groups["test"] or groups["validation"] & groups["test"])
    assert manifest["scoringGroundTruth"] is False
    assert manifest["automaticPromotionAllowed"] is False


def test_sharded_merge_applies_only_expected_lora_delta(tmp_path):
    torch = pytest.importorskip("torch")
    from safetensors.torch import save_file, load_file
    from export_cv_local_lora import merge
    base, adapter, output = (tmp_path / name for name in ("base", "adapter", "merged"))
    base.mkdir()
    adapter.mkdir()
    target = "model.layers.0.self_attn.q_proj.weight"
    save_file({target: torch.ones(3, 4), "model.embed_tokens.weight": torch.zeros(4, 4)}, base / "model-00001-of-00001.safetensors")
    (base / "model.safetensors.index.json").write_text(json.dumps({"weight_map": {target: "model-00001-of-00001.safetensors", "model.embed_tokens.weight": "model-00001-of-00001.safetensors"}}))
    (adapter / "adapter_config.json").write_text(json.dumps({"peft_type": "LORA", "r": 2, "lora_alpha": 4}))
    prefix = "base_model.model.model.layers.0.self_attn.q_proj"
    save_file({prefix + ".lora_A.weight": torch.ones(2, 4), prefix + ".lora_B.weight": torch.ones(3, 2)}, adapter / "adapter_model.safetensors")
    report = merge(base, adapter, output)
    result = load_file(output / "model-00001-of-00001.safetensors")
    assert torch.all(result[target] == 5)
    assert torch.all(result["model.embed_tokens.weight"] == 0)
    assert report["automaticPromotionAllowed"] is False
