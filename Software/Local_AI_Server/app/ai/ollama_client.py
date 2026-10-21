import json
from typing import Any, Dict, List, Optional
import httpx

from app.config import get_settings


class OllamaClient:
    """
    Asynchronous client for interacting with the local Ollama instance on http://localhost:11434.
    """

    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = self.settings.ollama_base_url
        self.default_llm = self.settings.local_llm_model
        self.fallback_llm = self.settings.local_llm_fallback_model
        self.cv_model = self.settings.local_cv_model
        self.embedding_model = self.settings.local_embedding_model

    async def get_available_models(self) -> List[Dict[str, Any]]:
        """Fetch list of models available in the local Ollama daemon."""
        async with httpx.AsyncClient(timeout=10.0) as client:
            try:
                response = await client.get(f"{self.base_url}/api/tags")
                response.raise_for_status()
                data = response.json()
                return data.get("models", [])
            except Exception as e:
                return []

    async def check_health(self) -> Dict[str, Any]:
        """Check if Ollama is running and verify required models are available."""
        models = await self.get_available_models()
        model_names = [m.get("name", "") for m in models]

        has_llm = any(self.default_llm in name for name in model_names) or any(self.fallback_llm in name for name in model_names)
        has_embed = any(self.embedding_model in name for name in model_names)
        has_cv = any(self.cv_model in name for name in model_names)

        return {
            "ollama_online": len(models) > 0,
            "models_count": len(models),
            "available_models": model_names,
            "llm_ready": has_llm,
            "embedding_ready": has_embed,
            "cv_model_ready": has_cv,
            "target_llm": self.default_llm,
            "target_cv_model": self.cv_model,
            "target_embedding": self.embedding_model,
        }

    async def generate_completion(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        model: Optional[str] = None,
        json_mode: bool = False,
        temperature: float = 0.1,
    ) -> str:
        """
        Generate completion using local Qwen 2.5 Coder model.
        Supports structured JSON mode and automated model fallback.
        """
        target_model = model or self.default_llm
        payload = {
            "model": target_model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "temperature": temperature,
                "top_p": 0.9,
            },
        }
        if system_prompt:
            payload["system"] = system_prompt
        if json_mode:
            payload["format"] = "json"

        async with httpx.AsyncClient(timeout=180.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/generate", json=payload)
                response.raise_for_status()
                data = response.json()
                return data.get("response", "")
            except Exception as err:
                # If primary model failed, attempt fallback model if defined
                if target_model != self.fallback_llm:
                    try:
                        payload["model"] = self.fallback_llm
                        fallback_resp = await client.post(f"{self.base_url}/api/generate", json=payload)
                        fallback_resp.raise_for_status()
                        return fallback_resp.json().get("response", "")
                    except Exception:
                        pass
                raise RuntimeError(f"Ollama inference error with model {target_model}: {err}")

    async def get_embedding(
        self,
        text: str,
        model: Optional[str] = None,
    ) -> List[float]:
        """
        Generate 768-dimensional embedding vector using nomic-embed-text.
        """
        target_model = model or self.embedding_model
        payload = {
            "model": target_model,
            "prompt": text,
        }

        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.post(f"{self.base_url}/api/embeddings", json=payload)
                response.raise_for_status()
                data = response.json()
                embedding = data.get("embedding", [])
                if not embedding:
                    raise ValueError("Empty embedding vector returned from Ollama")
                return embedding
            except Exception as err:
                raise RuntimeError(f"Ollama embedding error with model {target_model}: {err}")


_ollama_client_instance: Optional[OllamaClient] = None


def get_ollama_client() -> OllamaClient:
    global _ollama_client_instance
    if _ollama_client_instance is None:
        _ollama_client_instance = OllamaClient()
    return _ollama_client_instance
