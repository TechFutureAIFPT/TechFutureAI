"""Merge this pipeline's local LoRA shard by shard without loading a full 7B model.

Only creates a candidate directory. Never replaces or publishes an Ollama model.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import shutil
from pathlib import Path


def merge(base: Path, adapter: Path, output: Path) -> dict:
    import torch
    from safetensors import safe_open
    from safetensors.torch import load_file, save_file

    config = json.loads((adapter / "adapter_config.json").read_text(encoding="utf-8"))
    if config.get("peft_type") != "LORA" or config.get("use_dora") or config.get("use_rslora") or config.get("modules_to_save") or config.get("rank_pattern") or config.get("alpha_pattern") or config.get("fan_in_fan_out"):
        raise ValueError("Only the standard q_proj/v_proj LoRA configuration from this pipeline is supported")
    tensors = load_file(adapter / "adapter_model.safetensors", device="cpu")
    updates = {}
    scale = float(config["lora_alpha"]) / int(config["r"])
    for key, value in tensors.items():
        if ".lora_A.weight" not in key:
            continue
        partner = key.replace(".lora_A.weight", ".lora_B.weight")
        target = key.removeprefix("base_model.model.").replace(".lora_A.weight", ".weight")
        if partner not in tensors or not target.endswith(("q_proj.weight", "v_proj.weight")):
            raise ValueError("Unexpected adapter tensor layout")
        updates[target] = (value, tensors[partner])
    if not updates or len(updates) * 2 != len(tensors):
        raise ValueError("Adapter contains unsupported or missing tensors")
    index = json.loads((base / "model.safetensors.index.json").read_text(encoding="utf-8"))
    if not set(updates).issubset(index["weight_map"]):
        raise ValueError("Adapter does not match this base model")
    output.mkdir(parents=True, exist_ok=False)
    merged = set()
    for shard in sorted(set(index["weight_map"].values())):
        with safe_open(base / shard, framework="pt", device="cpu") as source:
            state = {}
            for name in source.keys():
                weight = source.get_tensor(name)
                if name in updates:
                    a, b = updates[name]
                    delta = (b.float() @ a.float()) * scale
                    if delta.shape != weight.shape or not torch.isfinite(delta).all():
                        raise ValueError("Invalid adapter delta")
                    weight = (weight.float() + delta).to(weight.dtype)
                    merged.add(name)
                state[name] = weight.contiguous()
            save_file(state, output / shard, metadata={"format": "pt"})
            del state
        print(json.dumps({"stage": "merged-shard", "shard": shard}), flush=True)
    if merged != set(updates):
        raise ValueError("Some adapter tensors were not merged")
    for source in base.iterdir():
        if source.is_file() and source.suffix in {".json", ".txt", ".model"}:
            shutil.copy2(source, output / source.name)
    # This Ollama version requires Qwen2 to be converted/quantized to GGUF first.
    # Keep conversion explicit rather than writing a nonfunctional FROM directory.
    report = {"baseDirectory": str(base.resolve()), "adapterDirectory": str(adapter.resolve()), "mergedTensorCount": len(merged), "adapterSha256": hashlib.sha256((adapter / "adapter_model.safetensors").read_bytes()).hexdigest(), "automaticPromotionAllowed": False}
    (output / "merge-provenance.json").write_text(json.dumps(report, indent=2), encoding="utf-8")
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--base-model", type=Path, required=True)
    parser.add_argument("--adapter", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(merge(args.base_model, args.adapter, args.output)), flush=True)
