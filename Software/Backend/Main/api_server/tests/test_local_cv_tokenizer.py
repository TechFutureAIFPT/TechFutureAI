from __future__ import annotations

from types import SimpleNamespace

from app.services import local_cv_tokenizer as counter


def test_missing_tokenizer_uses_conservative_budget(tmp_path):
    settings = SimpleNamespace(
        local_cv_model="cv-match:7b",
        local_cv_tokenizer_model="cv-match:7b",
        local_cv_tokenizer_path=str(tmp_path / "missing.json"),
    )
    assert (
        counter.input_token_bound("S", "Tiếng Việt", settings)
        == len("STiếng Việt".encode()) + 256
    )


def test_wrong_model_never_uses_qwen_tokenizer(monkeypatch, tmp_path):
    path = tmp_path / "tokenizer.json"
    path.touch()
    settings = SimpleNamespace(
        local_cv_model="other:latest",
        local_cv_tokenizer_model="cv-match:7b",
        local_cv_tokenizer_path=str(path),
    )
    monkeypatch.setattr(
        counter,
        "_load_tokenizer",
        lambda _: (_ for _ in ()).throw(AssertionError("wrong tokenizer")),
    )
    assert counter.input_token_bound("S", "CV", settings) == 259


def test_matching_tokenizer_counts_chat_template_and_reserves_space(
    monkeypatch, tmp_path
):
    path = tmp_path / "tokenizer.json"
    path.touch()
    settings = SimpleNamespace(
        local_cv_model="cv-match:7b",
        local_cv_tokenizer_model="cv-match:7b",
        local_cv_tokenizer_path=str(path),
    )
    calls = []

    def encode(text):
        calls.append(text)
        return SimpleNamespace(ids=list(range(10)))

    monkeypatch.setattr(
        counter, "_load_tokenizer", lambda _: SimpleNamespace(encode=encode)
    )
    assert counter.input_token_bound("SYSTEM", "CV", settings) == 266
    assert calls == [
        "<|im_start|>system\nSYSTEM<|im_end|>\n<|im_start|>user\nCV<|im_end|>\n<|im_start|>assistant\n"
    ]
