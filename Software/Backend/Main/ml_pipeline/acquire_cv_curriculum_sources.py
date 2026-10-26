"""Fetch pinned public data for local CV experiments; never runs source code."""
from __future__ import annotations

import hashlib
import json
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parent
OUT = ROOT / "data/raw/cv-curriculum-v2"
SKILL_REV = "33062e6bd0e03a5e01ae299ce0518f4613ef4298"
QA_REV = "1dbe6ffcf82cb06ec00f29bb0e4aeebde556addf"


def acquire() -> dict:
    OUT.mkdir(parents=True, exist_ok=True)
    sources = {}
    urls = {
        **{f"skillspan/{name}": f"https://huggingface.co/datasets/jjzha/skillspan/resolve/{SKILL_REV}/{name}"
           for name in ("train.json", "dev.json", "test.json", "README.md")},
        **{f"jobresqa/{name}": f"https://raw.githubusercontent.com/Avature/jobresqa-benchmark/{QA_REV}/{name}"
           for name in ("README.md", "LICENSE", "data/jobresqa.en.tsv")},
        "career/CareerCorpus.xlsx": "https://data.mendeley.com/public-files/datasets/wzzwn37gmd/files/8dd12325-8dd9-47ea-9b90-8cf1e84eaf2a/file_downloaded",
        "career/metadata.json": "https://data.mendeley.com/public-api/datasets/wzzwn37gmd",
    }
    previous = json.loads((OUT / "sources.json").read_text()) if (OUT / "sources.json").exists() else {}
    for name, url in urls.items():
        path = OUT / name
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            req = urllib.request.Request(url, headers={"User-Agent": "AI-Match-local-training/2"})
            with urllib.request.urlopen(req, timeout=60) as response:
                data = response.read(25_000_001)
            if len(data) > 25_000_000:
                raise ValueError("Unexpected data size")
            if name.endswith(".xlsx") and hashlib.sha256(data).hexdigest() != "97b1fa6cca1232912dd3f7bc312d71a2478249787168fd41dfbf6c1da90479d3":
                raise ValueError("CareerCorpus publisher checksum mismatch")
            path.write_bytes(data)
        digest = hashlib.sha256(path.read_bytes()).hexdigest()
        if name in previous and previous[name]["sha256"] != digest:
            raise ValueError(f"Immutable source changed: {name}")
        sources[name] = {"url": url, "sha256": digest, "bytes": path.stat().st_size}
    (OUT / "sources.json").write_text(json.dumps(sources, indent=2) + "\n", encoding="utf-8")
    return sources


if __name__ == "__main__":
    print(json.dumps(acquire(), indent=2), flush=True)
