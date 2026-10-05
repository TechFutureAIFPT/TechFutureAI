"""
SupportHR Remote Classifier HTTP Client
---------------------------------------
Standardized, high-performance HTTP client for communicating with remote
ML classifier services (hosted on Colab, Kaggle, Docker, or standalone VMs).
Uses httpx with connection pooling, timeout controls, and structured error handling.
"""

from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger("classifier_client")

# Shared persistent sync and async clients for connection pooling
_sync_client: httpx.Client | None = None
_async_client: httpx.AsyncClient | None = None


def _get_sync_client(timeout_seconds: float) -> httpx.Client:
    global _sync_client
    if _sync_client is None or _sync_client.is_closed:
        _sync_client = httpx.Client(
            timeout=httpx.Timeout(timeout_seconds, connect=min(3.0, timeout_seconds)),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
            follow_redirects=True,
        )
    return _sync_client


def _get_async_client(timeout_seconds: float) -> httpx.AsyncClient:
    global _async_client
    if _async_client is None or _async_client.is_closed:
        _async_client = httpx.AsyncClient(
            timeout=httpx.Timeout(timeout_seconds, connect=min(3.0, timeout_seconds)),
            limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
            follow_redirects=True,
        )
    return _async_client


def _round_score(value: Any) -> float | None:
    if not isinstance(value, (int, float)):
        return None
    return round(float(value), 4)


def derived_remote_status_url(classify_url: str) -> str:
    """Derive status URL from classify URL according to SupportHR conventions."""
    if "classify-industry" in classify_url:
        return classify_url.replace("classify-industry", "classifier-status")
    return classify_url.rstrip("/") + "/status"


def _format_classify_response(result: dict[str, Any]) -> dict[str, Any]:
    top_predictions = []
    for item in list(result.get("top_predictions") or []):
        if not isinstance(item, dict):
            continue
        top_predictions.append(
            {
                "label": str(item.get("label") or ""),
                "score": _round_score(item.get("score")),
            }
        )

    return {
        "predicted_label": str(result.get("predicted_label") or result.get("label") or "unknown"),
        "confidence": _round_score(result.get("confidence")),
        "top_predictions": top_predictions,
        "model_source": str(result.get("model_source") or "remote://classifier"),
    }


def _format_status_response(result: dict[str, Any]) -> dict[str, Any]:
    labels = [str(label) for label in list(result.get("labels") or [])]
    return {
        "ready": bool(result.get("ready")),
        "model_source": str(result.get("model_source") or "remote://classifier"),
        "label_count": int(result.get("label_count") or len(labels)),
        "labels": labels,
        "error": result.get("error"),
    }


def _handle_http_error(error: httpx.HTTPStatusError) -> None:
    code = error.response.status_code
    detail = str(error)
    try:
        data = error.response.json()
        if isinstance(data, dict):
            detail = str(data.get("detail") or data.get("message") or data.get("error") or detail)
    except Exception:
        pass

    if code in {404, 503}:
        raise FileNotFoundError(detail) from error
    raise RuntimeError(detail) from error


def classify_cv_remote(cleaned_text: str, top_k: int) -> dict[str, Any]:
    """Synchronous remote classification call."""
    settings = get_settings()
    url = settings.local_classifier_remote_classify_url
    if not url:
        raise FileNotFoundError("Remote classifier URL is not configured.")

    payload = {"cv_text": cleaned_text, "top_k": top_k}
    client = _get_sync_client(settings.local_classifier_remote_timeout_seconds)

    try:
        response = client.post(url, json=payload)
        response.raise_for_status()
        return _format_classify_response(response.json())
    except httpx.HTTPStatusError as err:
        _handle_http_error(err)
        raise
    except httpx.RequestError as err:
        raise RuntimeError(f"Network error calling remote classifier: {err}") from err


async def classify_cv_remote_async(cleaned_text: str, top_k: int) -> dict[str, Any]:
    """Asynchronous remote classification call."""
    settings = get_settings()
    url = settings.local_classifier_remote_classify_url
    if not url:
        raise FileNotFoundError("Remote classifier URL is not configured.")

    payload = {"cv_text": cleaned_text, "top_k": top_k}
    client = _get_async_client(settings.local_classifier_remote_timeout_seconds)

    try:
        response = await client.post(url, json=payload)
        response.raise_for_status()
        return _format_classify_response(response.json())
    except httpx.HTTPStatusError as err:
        _handle_http_error(err)
        raise
    except httpx.RequestError as err:
        raise RuntimeError(f"Network error calling remote classifier: {err}") from err


def get_remote_status() -> dict[str, Any]:
    """Synchronous remote status check."""
    settings = get_settings()
    classify_url = settings.local_classifier_remote_classify_url
    status_url = settings.local_classifier_remote_status_url or derived_remote_status_url(classify_url)
    if not status_url:
        raise FileNotFoundError("Remote classifier status URL is not configured.")

    client = _get_sync_client(settings.local_classifier_remote_timeout_seconds)
    try:
        response = client.get(status_url)
        response.raise_for_status()
        return _format_status_response(response.json())
    except httpx.HTTPStatusError as err:
        _handle_http_error(err)
        raise
    except httpx.RequestError as err:
        raise RuntimeError(f"Network error checking remote classifier status: {err}") from err


async def get_remote_status_async() -> dict[str, Any]:
    """Asynchronous remote status check."""
    settings = get_settings()
    classify_url = settings.local_classifier_remote_classify_url
    status_url = settings.local_classifier_remote_status_url or derived_remote_status_url(classify_url)
    if not status_url:
        raise FileNotFoundError("Remote classifier status URL is not configured.")

    client = _get_async_client(settings.local_classifier_remote_timeout_seconds)
    try:
        response = await client.get(status_url)
        response.raise_for_status()
        return _format_status_response(response.json())
    except httpx.HTTPStatusError as err:
        _handle_http_error(err)
        raise
    except httpx.RequestError as err:
        raise RuntimeError(f"Network error checking remote classifier status: {err}") from err
