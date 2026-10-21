"""Offline input budgeting for the Qwen2.5 ChatML CV profile."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Any


@lru_cache(maxsize=2)
def _load_tokenizer(path: str) -> Any:
    from tokenizers import Tokenizer

    return Tokenizer.from_file(path)


def input_token_bound(system: str, prompt: str, settings: Any) -> int:
    path = Path(getattr(settings, "local_cv_tokenizer_path", ""))
    if not path.is_absolute():
        path = Path(__file__).resolve().parents[2] / path
    if path.is_file() and settings.local_cv_model == getattr(
        settings, "local_cv_tokenizer_model", ""
    ):
        tokenizer = _load_tokenizer(str(path))
        # This profile inherits Qwen's ChatML template. Reserve extra space for
        # runner/template differences; JSON Schema is passed as a decoder grammar.
        chatml = f"<|im_start|>system\n{system}<|im_end|>\n<|im_start|>user\n{prompt}<|im_end|>\n<|im_start|>assistant\n"
        return len(tokenizer.encode(chatml).ids) + 256
    # No downloads or tokenizer guessing during inference. Unknown model profiles
    # use a conservative byte bound until their matching tokenizer is configured.
    return len((system + prompt).encode("utf-8")) + 256
