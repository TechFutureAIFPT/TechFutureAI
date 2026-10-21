from typing import Any, Dict, List, Optional
from app.ai.llm_service import prompt_json
from app.utils.text_utils import normalize_display_text


async def generate_interview_questions(
    analysis_data: Optional[Dict[str, Any]] = None,
    analysis_stats: Optional[Dict[str, Any]] = None,
    question_type: str = "general",
    candidate_data: Optional[Dict[str, Any]] = None,
    jd_text: Optional[str] = None,
) -> List[Dict[str, Any]]:
    """
    Generate professional recruiter interview question sets:
    - general: văn hóa doanh nghiệp, động lực làm việc, giao tiếp
    - specific: kiểm tra chuyên sâu kỹ thuật và các lỗ hổng/red flags phát hiện trong CV
    - comparative: so sánh điểm mạnh/yếu giữa các ứng viên
    """
    c_name = "Ứng viên"
    red_flags = []
    missing_skills = []
    score = 75.0

    if candidate_data:
        c_name = candidate_data.get("candidateName") or candidate_data.get("name") or "Ứng viên"
        hr_sum = candidate_data.get("hrSummary") or {}
        red_flags = hr_sum.get("canh_bao_red_flag") or []
        score = candidate_data.get("totalScore") or 75.0

    prompt = f"""Bạn là Giám đốc Tuyển dụng cấp cao của Support HR.
Hãy xây dựng bộ câu hỏi phỏng vấn ứng viên theo loại: [{question_type.upper()}].

THÔNG TIN ỨNG VIÊN:
- Tên: {c_name}
- Điểm đánh giá: {score}/100
- Cảnh báo rủi ro / Lỗ hổng: {', '.join(red_flags) if red_flags else 'Không phát hiện red flag lớn'}
{f'- Bối cảnh JD: {normalize_display_text(jd_text)[:1500]}' if jd_text else ''}

YÊU CẦU:
1. Tạo 4 đến 6 câu hỏi sắc bén, thực chiến, có thể kiểm chứng được năng lực thật.
2. Với mỗi câu hỏi, nêu rõ mục đích phỏng vấn (Tại sao hỏi) và tiêu chuẩn đánh giá câu trả lời tốt (Gợi ý câu trả lời kỳ vọng).

Trả về JSON có cấu trúc:
{{
  "question_sets": [
    {{
      "category": "Chuyên môn thực chiến / Kỹ năng giải quyết vấn đề / Văn hóa & Động lực",
      "question": "Nội dung câu hỏi phỏng vấn trực tiếp",
      "purpose": "Mục đích câu hỏi nhằm kiểm tra điều gì",
      "expected_answer": "Tiêu chí câu trả lời đạt yêu cầu"
    }}
  ]
}}"""

    try:
        data = await prompt_json(prompt)
        q_sets = data.get("question_sets") or []
        if q_sets:
            return q_sets
    except Exception:
        pass

    # Standard fallback questions
    return [
        {
            "category": "Năng lực chuyên môn",
            "question": f"Anh/chị hãy chia sẻ một dự án phức tạp nhất gần đây và giải pháp anh/chị đã trực tiếp triển khai?",
            "purpose": "Đánh giá chiều sâu kỹ thuật và vai trò thực tế.",
            "expected_answer": "Trình bày rõ bối cảnh, thách thức, công nghệ sử dụng và kết quả đo lường được.",
        },
        {
            "category": "Xử lý tình huống",
            "question": "Khi đối mặt với deadline gấp hoặc yêu cầu thay đổi đột xuất, anh/chị ưu tiên và xử lý như thế nào?",
            "purpose": "Kiểm tra kỹ năng quản lý thời gian và khả năng chịu áp lực.",
            "expected_answer": "Có phương pháp phân cấp độ ưu tiên, chủ động giao tiếp với các bên liên quan.",
        },
        {
            "category": "Động lực & Định hướng",
            "question": "Điều gì ở vị trí này thu hút anh/chị nhất, và định hướng phát triển nghề nghiệp trong 2 năm tới là gì?",
            "purpose": "Đánh giá mức độ gắn kết và độ phù hợp văn hóa.",
            "expected_answer": "Hiểu rõ về công ty và thể hiện mong muốn gắn bó lâu dài.",
        },
    ]
