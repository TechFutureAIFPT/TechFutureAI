from __future__ import annotations

from typing import Any, List

import httpx

from app.core.ai_contract import embedding_prompt
from app.core.config import get_settings


def _extract_prompt_text(contents: Any) -> str:
    if isinstance(contents, str):
        return contents
    if isinstance(contents, list):
        parts = []
        for part in contents:
            if isinstance(part, str):
                parts.append(part)
            elif isinstance(part, dict) and ("text" in part or "parts" in part):
                parts.append(_extract_prompt_text(part))
            elif hasattr(part, "text"):
                parts.append(str(part.text))
            else:
                parts.append(str(part))
        return "\n".join(parts)
    if isinstance(contents, dict) and "text" in contents:
        return str(contents["text"])
    if isinstance(contents, dict) and "parts" in contents:
        return _extract_prompt_text(contents["parts"])
    return str(contents or "")


def _is_json_requested(config: Any) -> bool:
    if not isinstance(config, dict):
        return False
    if (
        config.get("response_mime_type", config.get("responseMimeType"))
        == "application/json"
    ):
        return True
    if config.get("format") == "json":
        return True
    if "response_schema" in config or "responseSchema" in config:
        return True
    return False


def _get_temperature(config: Any) -> float:
    if isinstance(config, dict):
        temp = config.get("temperature")
        if temp is not None:
            try:
                return float(temp)
            except (ValueError, TypeError):
                pass
    return 0.1


def _build_generation_payload(
    model: str, contents: Any, config: Any = None
) -> dict[str, Any]:
    settings = get_settings()
    values = config if isinstance(config, dict) else {}
    target_model = model or settings.local_llm_model
    payload: dict[str, Any] = {
        "model": target_model,
        "prompt": _extract_prompt_text(contents),
        "stream": False,
        "keep_alive": "10m",
        "options": {
            "temperature": _get_temperature(config)
            if "temperature" in values
            else settings.local_llm_temperature,
            "top_p": values.get("top_p", values.get("topP", settings.local_llm_top_p)),
            "top_k": values.get("top_k", values.get("topK", 20)),
            "num_ctx": settings.local_llm_num_ctx,
            "num_predict": values.get(
                "max_output_tokens",
                values.get("maxOutputTokens", settings.local_llm_num_predict),
            ),
            "repeat_penalty": settings.local_llm_repeat_penalty,
            "seed": 42,
        },
    }
    system = values.get("system_instruction", values.get("systemInstruction"))
    if system:
        payload["system"] = _extract_prompt_text(system)
    schema = values.get("response_schema", values.get("responseSchema"))
    if schema is not None:
        payload["format"] = (
            schema.model_json_schema()
            if hasattr(schema, "model_json_schema")
            else schema
        )
    elif _is_json_requested(config):
        payload["format"] = "json"
    return payload


def _response_text(response: httpx.Response) -> str:
    response.raise_for_status()
    data = response.json()
    if data.get("done_reason") == "length":
        raise ValueError(
            "Ollama output was truncated; no complete analysis is available."
        )
    output = data.get("response")
    if not isinstance(output, str) or not output.strip():
        raise ValueError("Ollama returned no analysis text.")
    return output


def generate_content(
    model: str,
    contents: Any,
    config: Any = None,
) -> str:
    """Generate a local Ollama response while preserving the prompt and JSON schema."""
    settings = get_settings()
    payload = _build_generation_payload(model, contents, config)
    with httpx.Client(timeout=240.0) as client:
        return _response_text(
            client.post(f"{settings.ollama_base_url}/api/generate", json=payload)
        )


async def generate_content_async(
    model: str,
    contents: Any,
    config: Any = None,
) -> str:
    """Use the same request translation and validation as the synchronous client."""
    settings = get_settings()
    payload = _build_generation_payload(model, contents, config)
    async with httpx.AsyncClient(timeout=240.0) as client:
        return _response_text(
            await client.post(f"{settings.ollama_base_url}/api/generate", json=payload)
        )


def embed_text(
    text: str,
    model: str | None = None,
    task: str = "semantic_similarity",
) -> List[float]:
    """
    Create a local embedding with the configured Ollama embedding model.
    Routes to local Ollama nomic-embed-text (768 dimensions).
    """
    settings = get_settings()
    target_model = settings.local_embedding_model

    formatted_prompt = embedding_prompt(text, task=task)
    payload = {
        "model": target_model,
        "prompt": formatted_prompt,
    }

    try:
        with httpx.Client(timeout=30.0) as client:
            resp = client.post(
                f"{settings.ollama_base_url}/api/embeddings", json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            embedding = data.get("embedding", [])
            if not embedding:
                raise ValueError("Ollama trả về vector rỗng")
            return embedding
    except Exception as err:
        raise RuntimeError(f"Lỗi tạo vector embedding cục bộ: {err}") from err


async def embed_text_async(
    text: str,
    model: str | None = None,
    task: str = "semantic_similarity",
) -> List[float]:
    """
    Create a local embedding asynchronously with the configured Ollama model.
    """
    settings = get_settings()
    target_model = settings.local_embedding_model

    formatted_prompt = embedding_prompt(text, task=task)
    payload = {
        "model": target_model,
        "prompt": formatted_prompt,
    }

    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            resp = await client.post(
                f"{settings.ollama_base_url}/api/embeddings", json=payload
            )
            resp.raise_for_status()
            data = resp.json()
            embedding = data.get("embedding", [])
            if not embedding:
                raise ValueError("Ollama trả về vector rỗng")
            return embedding
        except Exception as err:
            raise RuntimeError(
                f"Lỗi tạo vector embedding cục bộ (async): {err}"
            ) from err
