from __future__ import annotations

import asyncio
import json
import re
from typing import Any

from app import gemini, tavily

MAX_SUBQUERIES = 4
MAX_RESULTS_PER_QUERY = 5
MAX_SOURCES_IN_REPORT = 12

_PLANNER_PROMPT = """Bạn là trợ lý lập kế hoạch nghiên cứu. Người dùng muốn tìm hiểu sâu về một ngành nghề/lĩnh vực nghề nghiệp.

Câu hỏi của người dùng: "{question}"

Hãy đề xuất tối đa {max_queries} truy vấn tìm kiếm web (search query) ngắn gọn, cụ thể, bao phủ các khía cạnh khác nhau
liên quan trực tiếp tới câu hỏi (ví dụ: nhu cầu tuyển dụng, mức lương, kỹ năng cần có, xu hướng ngành, triển vọng nghề
nghiệp — CHỈ chọn khía cạnh thực sự liên quan tới câu hỏi, không liệt kê máy móc đủ mọi khía cạnh).
Viết truy vấn bằng ngôn ngữ có khả năng tìm ra kết quả tốt nhất (tiếng Anh cho chủ đề toàn cầu, tiếng Việt cho chủ đề
đặc thù Việt Nam). Chỉ trả về JSON hợp lệ, không markdown, không giải thích:
{{"queries": ["...", "..."]}}
"""

_SYNTHESIS_PROMPT = """Bạn là chuyên gia phân tích thị trường việc làm, đang viết báo cáo nghiên cứu cho người dùng.

Câu hỏi gốc của người dùng: "{question}"

Dưới đây là các đoạn trích từ nguồn web đã tìm kiếm được (đánh số để trích dẫn):
{sources_block}

Yêu cầu bắt buộc:
1. CHỈ dùng thông tin có trong các nguồn trên. TUYỆT ĐỐI không tự bịa số liệu, tên công ty, hay xu hướng không có trong nguồn.
2. Mỗi nhận định quan trọng phải kèm trích dẫn dạng [1], [2] tương ứng số nguồn phía trên. Có thể trích nhiều nguồn cho 1 ý: [1][3].
3. Nếu các nguồn không đủ để trả lời một phần của câu hỏi, hãy nói rõ phần đó thiếu dữ liệu thay vì suy đoán.
4. Viết bằng tiếng Việt, có cấu trúc rõ ràng bằng heading markdown (##) và bullet point, khoảng 300-600 từ.
5. Kết thúc bằng một đoạn "Tóm tắt nhanh" 2-3 câu.

Viết báo cáo:
"""


def _extract_json(text: str) -> dict[str, Any]:
    cleaned = text.strip()
    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start != -1 and end != -1 and end > start:
        cleaned = cleaned[start : end + 1]
    return json.loads(cleaned)


async def _plan_queries(question: str) -> list[str]:
    prompt = _PLANNER_PROMPT.format(question=question, max_queries=MAX_SUBQUERIES)
    try:
        raw = await asyncio.to_thread(
            gemini.generate_content, prompt, temperature=0.3
        )
        parsed = _extract_json(raw)
        queries = [str(item).strip() for item in parsed.get("queries") or [] if str(item).strip()]
        if queries:
            return queries[:MAX_SUBQUERIES]
    except Exception:
        pass
    return [question]


def _dedupe_results(all_results: list[tavily.TavilySearchResult]) -> list[tavily.TavilySearchResult]:
    seen: set[str] = set()
    deduped: list[tavily.TavilySearchResult] = []
    for result in sorted(all_results, key=lambda item: item.score, reverse=True):
        if result.url in seen:
            continue
        seen.add(result.url)
        deduped.append(result)
    return deduped[:MAX_SOURCES_IN_REPORT]


def _build_sources_block(sources: list[tavily.TavilySearchResult]) -> str:
    lines = []
    for index, source in enumerate(sources, start=1):
        snippet = re.sub(r"\s+", " ", source.content).strip()[:900]
        lines.append(f"[{index}] {source.title} ({source.url})\n{snippet}")
    return "\n\n".join(lines)


async def run_deep_research(question: str) -> dict[str, Any]:
    normalized_question = (question or "").strip()
    if not normalized_question:
        raise ValueError("Câu hỏi nghiên cứu không được để trống.")

    queries = await _plan_queries(normalized_question)

    search_results: list[tavily.TavilySearchResult] = []
    for query in queries:
        try:
            results = await tavily.search(query, max_results=MAX_RESULTS_PER_QUERY)
            search_results.extend(results)
        except Exception:
            continue

    sources = _dedupe_results(search_results)

    if not sources:
        return {
            "report": (
                "Không tìm được nguồn web đáng tin cậy cho câu hỏi này ngay lúc này. "
                "Bạn thử diễn đạt câu hỏi cụ thể hơn hoặc thử lại sau."
            ),
            "sources": [],
            "queries": queries,
        }

    sources_block = _build_sources_block(sources)
    prompt = _SYNTHESIS_PROMPT.format(question=normalized_question, sources_block=sources_block)

    try:
        report = await asyncio.to_thread(gemini.generate_content, prompt, temperature=0.25)
        report = report.strip()
    except Exception:
        report = (
            "Đã tìm được các nguồn liên quan bên dưới nhưng chưa tổng hợp được báo cáo do lỗi tạm thời. "
            "Bạn có thể xem trực tiếp các nguồn tham khảo."
        )

    return {
        "report": report,
        "sources": [source.to_dict() for source in sources],
        "queries": queries,
    }
