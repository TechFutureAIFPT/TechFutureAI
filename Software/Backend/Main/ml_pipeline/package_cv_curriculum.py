"""Package one completed local experiment; never changes serving defaults."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
from pathlib import Path
import shutil
import subprocess
import sys
import urllib.request

from prepare_cv_local_sft import system_prompt

ROOT = Path(__file__).resolve().parent


def execute(command: list[str], log: Path, cwd: Path = ROOT) -> None:
    print(json.dumps({"stage": log.stem, "log": str(log)}), flush=True)
    with log.open("w", encoding="utf-8") as handle:
        env = {**os.environ, "HF_HUB_OFFLINE": "1", "TRANSFORMERS_OFFLINE": "1", "HF_HUB_DISABLE_TELEMETRY": "1", "WANDB_DISABLED": "true"}
        subprocess.run(command, cwd=cwd, stdout=handle, stderr=subprocess.STDOUT, check=True, env=env)


def package(run: Path, report_dir: Path) -> dict:
    training = json.loads((run / "training-report.json").read_text())
    if not training["gradientObserved"] or training["groupLeakageCount"] != 0:
        raise ValueError("Training did not pass integrity checks")
    actual = hashlib.sha256((run / "best-adapter/adapter_model.safetensors").read_bytes()).hexdigest()
    if actual != training["adapterSha256"]:
        raise ValueError("Adapter differs from completed experiment")
    report_dir.mkdir(parents=True, exist_ok=True)
    python = ROOT.parent / ".cache/cv-qlora-venv/Scripts/python.exe"
    base = ROOT.parent / ".cache/qwen2.5-coder-7b-instruct-hf"
    merged = ROOT / "artifacts/cv-match-7b-local-sft-v2-merged"
    fp16 = ROOT / "artifacts/cv-match-local-sft-v2-f16.gguf"
    gguf = ROOT / "artifacts/cv-match-local-sft-v2-Q4_K_M.gguf"
    if merged.exists() or fp16.exists() or gguf.exists():
        raise ValueError("Use fresh packaging paths; existing artifacts are not overwritten")
    execute([str(python), str(ROOT / "export_cv_local_lora.py"), "--base-model", str(base), "--adapter", str(run / "best-adapter"), "--output", str(merged)], report_dir / "merge.log")
    execute([str(python), str(ROOT.parent / ".cache/llama-cpp-b11669/convert_hf_to_gguf.py"), str(merged), "--outfile", str(fp16), "--outtype", "f16"], report_dir / "convert.log")
    execute([str(ROOT.parent / ".cache/llama-b11669-bin/llama-quantize.exe"), str(fp16), str(gguf), "Q4_K_M", "8"], report_dir / "quantize.log")
    modelfile = merged / "Modelfile"
    modelfile.write_text('FROM ../cv-match-local-sft-v2-Q4_K_M.gguf\nSYSTEM """' + system_prompt() + '"""\nPARAMETER temperature 0\nPARAMETER num_ctx 8192\nPARAMETER repeat_penalty 1.05\n', encoding="utf-8")
    ollama = shutil.which("ollama")
    if not ollama: raise RuntimeError("Local Ollama CLI unavailable")
    execute([ollama, "create", "cv-match:7b-local-sft-v2", "-f", str(modelfile)], report_dir / "ollama-create.log")
    with urllib.request.urlopen("http://127.0.0.1:11434/api/tags", timeout=10) as response:
        tags = json.load(response)
    before = json.loads((report_dir / "model-digests-before.json").read_text())
    after = {model["name"]: model["digest"] for model in tags["models"]}
    unchanged = all(after.get(name) == value for name, value in before.items())
    if not unchanged: raise RuntimeError("Existing model digest changed")
    h = hashlib.sha256()
    with gguf.open("rb") as handle:
        for chunk in iter(lambda: handle.read(8 * 1024 * 1024), b""): h.update(chunk)
    record = {"model": "cv-match:7b-local-sft-v2", "digest": after["cv-match:7b-local-sft-v2"], "gguf": str(gguf), "ggufSha256": h.hexdigest(), "ggufBytes": gguf.stat().st_size, "adapterSha256": actual, "previousModelsUnchanged": unchanged, "modelDigestsAfter": after, "automaticPromotionAllowed": False}
    (report_dir / "packaging-report.json").write_text(json.dumps(record, indent=2) + "\n", encoding="utf-8")
    for name in ("training-report.json", "learning-curve.json", "run-config.json", "checkpoint.json"):
        shutil.copy2(run / name, report_dir / name)
    return record


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--run", type=Path, required=True)
    parser.add_argument("--report-dir", type=Path, required=True)
    args = parser.parse_args()
    print(json.dumps(package(args.run.resolve(), args.report_dir.resolve()), indent=2), flush=True)
