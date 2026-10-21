from __future__ import annotations

import asyncio
import json

import httpx
import pytest

from app.services import ollama_service as service


@pytest.mark.parametrize(
    "system_key,schema_key",
    [
        ("systemInstruction", "responseSchema"),
        ("system_instruction", "response_schema"),
    ],
)
def test_jd_system_and_schema_reach_ollama(system_key, schema_key):
    schema = {
        "type": "array",
        "items": {
            "type": "object",
            "properties": {"candidateName": {"type": "string"}},
        },
    }
    payload = service._build_generation_payload(
        "cv-match:7b",
        "CV data",
        {
            system_key: "JD: require Python",
            schema_key: schema,
            "temperature": 0.1,
            "topP": 0.7,
        },
    )
    assert payload["system"] == "JD: require Python"
    assert payload["format"] == schema
    assert "candidateName" in payload["format"]["items"]["properties"]
    assert payload["model"] == "cv-match:7b"
    assert payload["options"]["temperature"] == 0.1
    assert payload["options"]["top_p"] == 0.7


def test_json_mime_and_nested_system_parts_supported():
    payload = service._build_generation_payload(
        "cv-match:7b",
        "CV",
        {
            "responseMimeType": "application/json",
            "systemInstruction": {"parts": [{"text": "JD"}]},
            "temperature": 0,
        },
    )
    assert payload["format"] == "json"
    assert payload["system"] == "JD"
    assert payload["options"]["temperature"] == 0


def test_nested_user_parts_preserve_plain_cv_text():
    assert (
        service._extract_prompt_text([{"role": "user", "parts": [{"text": "CV data"}]}])
        == "CV data"
    )


def test_sync_and_async_share_wire_contract(monkeypatch):
    original_sync, original_async = httpx.Client, httpx.AsyncClient
    requests = []

    def respond(request):
        requests.append(json.loads(request.content))
        return httpx.Response(200, json={"response": "[]", "done": True})

    transport = httpx.MockTransport(respond)
    monkeypatch.setattr(
        service.httpx, "Client", lambda **kwargs: original_sync(transport=transport)
    )
    monkeypatch.setattr(
        service.httpx,
        "AsyncClient",
        lambda **kwargs: original_async(transport=transport),
    )
    config = {
        "systemInstruction": "JD + rubric",
        "responseMimeType": "application/json",
    }
    assert service.generate_content("cv-match:7b", "CV", config) == "[]"
    assert (
        asyncio.run(service.generate_content_async("cv-match:7b", "CV", config)) == "[]"
    )
    assert requests[0] == requests[1]


def test_truncation_is_not_treated_as_valid_analysis():
    with pytest.raises(ValueError, match="truncated"):
        service._response_text(
            httpx.Response(
                200,
                json={"response": "[", "done_reason": "length"},
                request=httpx.Request("POST", "http://localhost"),
            )
        )
