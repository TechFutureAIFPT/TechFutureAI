import json
from typing import Any, Dict, List, Optional

from app.ai.llm_service import prompt_json
from app.utils.text_utils import normalize_display_text


async def reply_to_candidate_chat(
    candidate_snapshot: Dict[str, Any],
    message: str,
    job_position: Optional[str] = None,
    recruiter_context: Optional[str] = None,
) -> Dict[str, Any]:
    """
    AI Recruiter Assistant responding to queries about a specific candidate.
    """
    c_name = candidate_snapshot.get("candidateName") or "Ứng viên"
    score = candidate_snapshot.get("totalScore") or 0.0
    rank = candidate_snapshot.get("rank") or "C"
    hr_summary = candidate_snapshot.get("hrSummary") or {}
    red_flags = hr_summary.get("canh_bao_red_flag") or []

    prompt = f"""Bạn là Trợ lý AI Tuyển dụng thông minh của Support HR.
Nhà tuyển dụng đang đặt câu hỏi về hồ sơ ứng viên sau:

HỒ SƠ ỨNG VIÊN:
- Tên: {c_name}
- Vị trí ứng tuyển: {job_position or 'Chuyên viên'}
- Tổng điểm phù hợp: {score}/100 (Hạng {rank})
- Cảnh báo rủi ro (Red flags): {', '.join(red_flags) if red_flags else 'Không có rủi ro lớn'}
- Nhận xét tổng quan: {hr_summary.get('nhan_xet_tong_quan', '')}
- Bối cảnh thêm từ nhà tuyển dụng: {recruiter_context or 'Không'}

CÂU HỎI CỦA NHÀ TUYỂN DỤNG:
"{message}"

YÊU CẦU:
1. Trả lời trực diện, khách quan, dựa trên dữ liệu đánh giá thực tế của ứng viên.
2. Đưa ra lời khuyên thực tế cho nhà tuyển dụng (nên nhận, phỏng vấn thêm điểm gì, hay từ chối).
3. Đề xuất 2-3 câu hỏi gợi ý tiếp theo mà nhà tuyển dụng có thể quan tâm.

Trả về JSON có dạng:
{{
  "reply": "Nội dung phản hồi chi tiết, văn phong chuyên nghiệp của HR",
  "suggestions": [
    "Gợi ý câu hỏi 1?",
    "Gợi ý câu hỏi 2?",
    "Gợi ý câu hỏi 3?"
  ]
}}"""

    try:
        data = await prompt_json(prompt)
        return {
            "reply": str(data.get("reply") or f"Ứng viên {c_name} đạt {score}/100 điểm. Anh/chị nên xem xét phỏng vấn kỹ về kinh nghiệm thực tế."),
            "suggestions": data.get("suggestions") or [
                "Ứng viên này có điểm mạnh nổi bật nào so với các ứng viên khác?",
                "Có rủi ro gì về mức độ gắn kết lâu dài không?",
                "Cần chuẩn bị câu hỏi kỹ thuật gì trong vòng phỏng vấn tới?",
            ],
        }
    except Exception as err:
        return {
            "reply": f"Hồ sơ {c_name} có điểm tổng thể là {score}/100. Dựa trên dữ liệu phân tích, ứng viên cơ bản đáp ứng các yêu cầu cốt lõi nhưng cần xác minh thêm kinh nghiệm thực tế.",
            "suggestions": [
                "So sánh ứng viên này với các hồ sơ khác",
                "Xem câu hỏi phỏng vấn gợi ý",
            ],
        }
