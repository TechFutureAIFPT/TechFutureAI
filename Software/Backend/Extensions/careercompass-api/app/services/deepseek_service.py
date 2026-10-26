import httpx
from typing import Any, Dict, List, Optional

from app.core.config import settings
from app.schemas.chat import ChatMessage, CitationItem, ChatResponse
from app.services.data_retrieval_client import retrieval_client
from app.services.deep_research_service import deep_research_service
from app.services.graph_service import graph_service


SYSTEM_PROMPT = """Bạn là Cố vấn Hướng nghiệp của CareerCompass.

Quy tắc:
- Tư vấn cá nhân dựa trên kết quả RIASEC đã có trong hồ sơ; không tự suy ra điểm thi, tổ hợp, học bạ hay thông tin cá nhân còn thiếu.
- Chỉ nêu điểm chuẩn khi ngữ cảnh tra cứu có số liệu và nguồn trực tuyến cụ thể. Ghi rõ năm và phương thức xét tuyển; không gọi dự báo là điểm chuẩn.
- Không tự dự báo điểm chuẩn, nêu xác suất/bảo đảm trúng tuyển, hoặc bịa quy định, số liệu, nguồn trích dẫn.
- Nếu nguồn trực tuyến không có dữ liệu đủ tin cậy, hãy nói rõ chưa xác minh được và hỏi tên trường/ngành/năm cần tra cứu.
- Trả lời tiếng Việt tự nhiên, gọn, có tiêu đề/danh sách khi hữu ích. Không xuất JSON thô, không lặp các mã và dữ liệu không liên quan.
"""


class DeepSeekService:
    def __init__(self):
        self.api_key = settings.DEEPSEEK_API_KEY
        self.base_url = settings.DEEPSEEK_BASE_URL.rstrip("/")
        self.model = settings.DEEPSEEK_MODEL
        self.google_key = settings.GOOGLE_API_KEY

    async def get_advisory_response(
        self,
        user_message: str,
        history: List[ChatMessage],
        student_profile: Optional[Dict[str, Any]] = None,
        use_deep_research: bool = True,
    ) -> ChatResponse:
        profile = student_profile or {}
        holland = profile.get("holland", {})
        holland_code = holland.get("holland_code", "")
        riasec_scores = holland.get("riasec_scores", {})

        graph_paths = graph_service.query_multihop_advisory_paths(
            holland_code=holland_code,
            target_block=profile.get("academic", {}).get("target_block", ""),
        )
        graph_context = "\n".join(
            f"- {path.get('major_name')} (mã {path.get('major_code')}), nghề liên quan: "
            f"{', '.join(path.get('leading_careers', [])) or 'chưa có dữ liệu'}. "
            "Đây chỉ là gợi ý ngành từ đồ thị nội bộ, không phải căn cứ điểm chuẩn."
            for path in graph_paths[:3]
        )

        admission_context, citations = await retrieval_client.get_admission_knowledge_for_query(user_message)
        research_context = admission_context
        if use_deep_research:
            live_context, live_citations = await deep_research_service.search_admission_knowledge(user_message)
            if live_context:
                research_context = "\n\n".join(part for part in (admission_context, live_context) if part)
            citations.extend(live_citations)

        query_lower = user_message.lower()
        admission_score_question = any(term in query_lower for term in (
            "điểm chuẩn", "điểm đầu vào", "điểm trúng tuyển", "điểm xét tuyển", "điểm tuyển sinh",
            "điểm vào trường", "điểm vào đại học", "điểm ngành", "điểm năm",
        ))
        if admission_score_question and not citations:
            return self._generate_grounded_fallback_response(
                holland_code=holland_code,
                graph_paths=graph_paths,
                research_context=research_context,
                citations=citations,
            )

        profile_context = (
            f"Mã RIASEC: {holland_code}; điểm 6 nhóm: {riasec_scores}. "
            "Chưa cung cấp điểm thi, tổ hợp xét tuyển hoặc học bạ."
        )
        system_prompt = (
            f"{SYSTEM_PROMPT}\n\n[HỒ SƠ RIASEC ĐÃ HOÀN THÀNH]\n{profile_context}\n\n"
            f"[GỢI Ý NGÀNH TỪ ĐỒ THỊ NỘI BỘ]\n{graph_context or 'Chưa có gợi ý ngành phù hợp trong đồ thị.'}\n\n"
            f"[KẾT QUẢ TRA CỨU TRỰC TUYẾN]\n{research_context or 'Chưa có kết quả tra cứu trực tuyến được xác minh.'}"
        )

        if self.api_key and self.api_key.strip():
            try:
                payload = [{"role": "system", "content": system_prompt}]
                payload.extend({"role": item.role, "content": item.content} for item in history[-6:])
                payload.append({"role": "user", "content": user_message})
                async with httpx.AsyncClient(timeout=35.0) as client:
                    response = await client.post(
                        f"{self.base_url}/chat/completions",
                        headers={"Authorization": f"Bearer {self.api_key}"},
                        json={"model": self.model, "messages": payload, "temperature": 0.3, "max_tokens": 1000},
                    )
                response.raise_for_status()
                reply = response.json()["choices"][0]["message"]["content"]
                return ChatResponse(
                    reply=reply,
                    thought_process="Đã đối chiếu câu trả lời với kết quả RIASEC và nguồn tra cứu được cung cấp.",
                    citations=citations,
                    recommended_followups=[
                        "Tôi muốn tìm điểm chuẩn của một trường cụ thể.",
                        "Nhóm nghề nào liên quan tới kết quả RIASEC của tôi?",
                        "Tôi nên so sánh ngành học theo tiêu chí nào?",
                    ],
                )
            except Exception:
                pass

        return self._generate_grounded_fallback_response(
            holland_code=holland_code,
            graph_paths=graph_paths,
            research_context=research_context,
            citations=citations,
        )

    @staticmethod
    def _generate_grounded_fallback_response(
        holland_code: str,
        graph_paths: List[Dict[str, Any]],
        research_context: str,
        citations: List[CitationItem],
    ) -> ChatResponse:
        if graph_paths:
            path = graph_paths[0]
            reply = (
                f"Kết quả khảo sát của bạn là **{holland_code}**. Bạn có thể tìm hiểu thêm ngành "
                f"**{path.get('major_name', 'chưa xác định')}**; một số nghề liên quan: "
                f"{', '.join(path.get('leading_careers', [])) or 'chưa có dữ liệu cụ thể'}.\n\n"
                "Đây là gợi ý khám phá, không phải kết luận chắc chắn về mức độ phù hợp. "
            )
        else:
            reply = f"Kết quả khảo sát của bạn là **{holland_code}**. Hiện tôi chưa có gợi ý ngành phù hợp trong dữ liệu nội bộ. "

        if research_context:
            reply += (
                "\n\n**Dữ liệu tham khảo từ API:** các điểm bên dưới do nguồn thứ ba trả về, "
                "chưa được xác nhận trực tiếp với trường và không phải điểm chuẩn cho năm chưa công bố.\n"
                + research_context[:1800]
            )
        else:
            reply += (
                "Tôi chưa tra được nguồn tuyển sinh trực tuyến đã xác minh cho câu hỏi này, "
                "nên chưa thể nêu điểm chuẩn. Hãy cung cấp tên trường/ngành và năm tuyển sinh để tra cứu."
            )

        return ChatResponse(
            reply=reply,
            thought_process="Dùng kết quả khảo sát RIASEC; không suy đoán điểm thi hoặc điểm chuẩn.",
            citations=citations,
            recommended_followups=[
                "Bạn muốn tra cứu điểm chuẩn năm nào và trường nào?",
                "Tôi muốn tìm hiểu thêm ngành được gợi ý.",
                "Nhóm nghề nào liên quan tới mã RIASEC của tôi?",
            ],
        )


deepseek_service = DeepSeekService()
