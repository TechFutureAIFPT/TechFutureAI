import logging
from typing import Any, Dict, Optional

from app.ai.ollama_client import get_ollama_client
from app.utils.text_utils import extract_json_object

logger = logging.getLogger(__name__)


async def prompt_text(
    prompt: str,
    system_prompt: Optional[str] = None,
    temperature: float = 0.1,
) -> str:
    """Prompt local LLM for standard text response."""
    client = get_ollama_client()
    return await client.generate_completion(
        prompt=prompt,
        system_prompt=system_prompt,
        json_mode=False,
        temperature=temperature,
    )


async def prompt_json(
    prompt: str,
    system_prompt: Optional[str] = None,
    max_retries: int = 2,
    temperature: float = 0.05,
) -> Any:
    """
    Prompt local Qwen 2.5 Coder model to return guaranteed structured JSON.
    Automatically applies json mode and robust JSON repair parsing.
    """
    client = get_ollama_client()
    system = system_prompt or "Bạn là trợ lý AI chuyên nghiệp của Support HR. Bạn CHỈ trả về dữ liệu định dạng JSON hợp lệ, không thêm bất kỳ văn bản giải thích nào khác."

    last_error: Optional[Exception] = None
    for attempt in range(max_retries + 1):
        try:
            curr_prompt = prompt
            if attempt > 0:
                curr_prompt += "\n\nLƯU Ý: Lần trước định dạng JSON bị lỗi. Hãy đảm bảo trả về cú pháp JSON thuần túy 100% không bọc markdown."

            raw_response = await client.generate_completion(
                prompt=curr_prompt,
                system_prompt=system,
                json_mode=True,
                temperature=temperature,
            )
            parsed = extract_json_object(raw_response)
            return parsed
        except Exception as err:
            last_error = err
            logger.warning(f"[Local LLM] JSON parse retry {attempt + 1}/{max_retries + 1} failed: {err}")

    raise RuntimeError(f"Local LLM failed to produce valid JSON after {max_retries + 1} attempts: {last_error}")
