"""Download tokenizer data only from the official Qwen repository; no model weights."""

from __future__ import annotations

import hashlib
import json
import sys
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.core.config import get_settings

REPOSITORY = "Qwen/Qwen2.5-Coder-7B-Instruct"
REVISION = "c03e6d358207e414f1eca0bb1891e29f1db0e242"
SHA256 = "c0382117ea329cdf097041132f6d735924b697924d6f6fc3945713e96ce87539"


def main() -> None:
    path = Path(get_settings().local_cv_tokenizer_path)
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[1] / path
    if path.is_file() and hashlib.sha256(path.read_bytes()).hexdigest() == SHA256:
        print("Matching Qwen tokenizer is already installed; no download needed.")
        return
    with httpx.Client(timeout=90, follow_redirects=True) as client:
        response = client.get(
            f"https://huggingface.co/{REPOSITORY}/resolve/{REVISION}/tokenizer.json"
        )
        response.raise_for_status()
    content = response.content
    if len(content) > 16 * 1024 * 1024:
        raise ValueError("Unexpected tokenizer size; nothing was saved.")
    if hashlib.sha256(content).hexdigest() != SHA256:
        raise ValueError("Tokenizer checksum does not match the pinned profile.")
    from tokenizers import Tokenizer

    tokenizer = Tokenizer.from_str(content.decode("utf-8"))
    if (
        tokenizer.token_to_id("<|im_start|>") != 151644
        or tokenizer.token_to_id("<|im_end|>") != 151645
    ):
        raise ValueError("Tokenizer does not match the Qwen ChatML profile.")
    path.parent.mkdir(parents=True, exist_ok=True)
    temporary = path.with_suffix(".download")
    temporary.write_bytes(content)
    temporary.replace(path)
    manifest = {
        "repository": REPOSITORY,
        "revision": REVISION,
        "sha256": hashlib.sha256(content).hexdigest(),
        "sizeBytes": len(content),
    }
    path.with_suffix(".manifest.json").write_text(
        json.dumps(manifest, indent=2) + "\n", encoding="utf-8"
    )
    print(json.dumps(manifest))


if __name__ == "__main__":
    main()
