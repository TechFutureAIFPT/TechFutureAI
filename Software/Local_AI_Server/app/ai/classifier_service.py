import re
from typing import Any, Dict, List

from app.ai.llm_service import prompt_json
from app.utils.text_utils import normalize_display_text, remove_vietnamese_accents


STANDARD_INDUSTRIES = [
    "Công nghệ thông tin / IT",
    "Kinh doanh / Bán hàng (Sales)",
    "Marketing / Truyền thông",
    "Nhân sự (HR)",
    "Tài chính / Ngân hàng",
    "Kế toán / Kiểm toán",
    "Thiết kế đồ họa / UI-UX",
    "Khoa học dữ liệu / AI / Data",
    "Quản trị dự án / Vận hành",
    "Chăm sóc khách hàng",
    "Logistics / Xuất nhập khẩu",
    "Giáo dục / Đào tạo",
    "Y tế / Dược phẩm",
    "Bất động sản",
    "Kỹ thuật cơ khí / Điện tử",
    "Dịch thuật / Ngôn ngữ",
    "Luật / Pháp chế",
    "Du lịch / Khách sạn",
    "Bảo hiểm",
    "Sản xuất / Chế tạo",
    "Bán lẻ / F&B",
    "Thương mại điện tử",
    "Xây dựng / Kiến trúc",
    "Ngành nghề khác",
]


async def classify_cv_industry(cv_text: str, top_k: int = 3) -> Dict[str, Any]:
    """
    Classify candidate CV into standard industries using local LLM semantic analysis.
    """
    cleaned = normalize_display_text(cv_text)[:3000]

    prompt = f"""Bạn là mô hình phân loại ngành nghề CV của Support HR.
Hãy đọc nội dung CV sau và xác định ngành nghề chuyên môn phù hợp nhất trong danh sách các ngành chuẩn:
{', '.join(STANDARD_INDUSTRIES[:15])}...

NỘI DUNG CV:
{cleaned}

Trả về JSON có dạng:
{{
  "predicted_industry": "Tên ngành nghề phù hợp nhất",
  "confidence_score": 0.85,
  "top_industries": [
    {{"industry": "Ngành 1", "score": 0.85}},
    {{"industry": "Ngành 2", "score": 0.10}},
    {{"industry": "Ngành 3", "score": 0.05}}
  ]
}}"""

    try:
        data = await prompt_json(prompt)
        pred = str(data.get("predicted_industry") or "Công nghệ thông tin / IT").strip()
        conf = float(data.get("confidence_score") or 0.85)
        top_list = data.get("top_industries") or [{"industry": pred, "score": conf}]
        return {
            "predicted_industry": pred,
            "confidence_score": min(1.0, max(0.1, conf)),
            "top_industries": top_list[:top_k],
        }
    except Exception:
        # Fallback heuristic
        ascii_text = remove_vietnamese_accents(cleaned).lower()
        if any(w in ascii_text for w in ("developer", "software", "engineer", "python", "java", "lap trinh", "cntt", "react", "backend")):
            primary = "Công nghệ thông tin / IT"
        elif any(w in ascii_text for w in ("sales", "kinh doanh", "ban hang", "doanh so", "chot deal")):
            primary = "Kinh doanh / Bán hàng (Sales)"
        elif any(w in ascii_text for w in ("marketing", "quang cao", "content", "seo", "fanpage", "truyen thong")):
            primary = "Marketing / Truyền thông"
        elif any(w in ascii_text for w in ("nhan su", "recruitment", "hr", "tuyen dung", "c b", "cham cong")):
            primary = "Nhân sự (HR)"
        else:
            primary = "Công nghệ thông tin / IT"

        return {
            "predicted_industry": primary,
            "confidence_score": 0.75,
            "top_industries": [{"industry": primary, "score": 0.75}],
        }
