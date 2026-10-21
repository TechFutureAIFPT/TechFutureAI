import re
from typing import Any, Dict

from app.ai.llm_service import prompt_json
from app.utils.text_utils import normalize_display_text


async def structure_jd(raw_text: str) -> str:
    """
    Standardize raw job description text into three standard HR sections:
    - MỤC ĐÍCH CÔNG VIỆC
    - MÔ TẢ CÔNG VIỆC
    - YÊU CẦU CÔNG VIỆC
    """
    cleaned = normalize_display_text(raw_text)[:4000]
    prompt = f"""Phân tích và chuẩn hóa bản mô tả công việc (JD) sau thành các phần rõ ràng:
JD GỐC:
{cleaned}

Hãy trả về JSON duy nhất có cấu trúc:
{{
  "MucDichCongViec": "Tóm tắt mục đích hoặc tổng quan vị trí",
  "MoTaCongViec": "Các trách nhiệm và nhiệm vụ chính của công việc",
  "YeuCauCongViec": "Kinh nghiệm, kỹ năng, bằng cấp bắt buộc và ưu tiên"
}}"""

    data = await prompt_json(prompt)
    sections = []
    if (data.get("MucDichCongViec") or "").strip():
        sections.append(f"MỤC ĐÍCH CÔNG VIỆC\n{data['MucDichCongViec'].strip()}")
    if (data.get("MoTaCongViec") or "").strip():
        sections.append(f"MÔ TẢ CÔNG VIỆC\n{data['MoTaCongViec'].strip()}")
    if (data.get("YeuCauCongViec") or "").strip():
        sections.append(f"YÊU CẦU CÔNG VIỆC\n{data['YeuCauCongViec'].strip()}")

    structured = "\n\n".join(sections).strip()
    if not structured:
        return raw_text.strip()
    return structured


async def extract_job_position(jd_text: str) -> str:
    """
    Extract exact position title from Job Description.
    """
    cleaned = normalize_display_text(jd_text)[:2000]
    prompt = f"""Trích xuất chức danh công việc / vị trí tuyển dụng chính xác từ JD sau:
JD:
{cleaned}

Trả về JSON có dạng:
{{
  "job_position": "Tên chức danh công việc ngắn gọn (ví dụ: Senior Backend Developer, QA Engineer, Nhân viên kinh doanh)"
}}"""

    data = await prompt_json(prompt)
    position = str(data.get("job_position") or "").strip()
    if not position:
        position = "Vị trí tuyển dụng"
    return position


async def extract_hard_filters(jd_text: str) -> Dict[str, Any]:
    """
    Extract mandatory screening criteria from Job Description:
    - location (Hà Nội, TP.HCM, Đà Nẵng, Remote...)
    - minExp (năm kinh nghiệm tối thiểu)
    - seniority (Junior, Mid, Senior, Lead, Manager)
    - education (Đại học, Cao đẳng, Không yêu cầu)
    - industry (IT, Marketing, Sales...)
    - language (Tiếng Anh, Tiếng Nhật, Không yêu cầu)
    """
    cleaned = normalize_display_text(jd_text)[:3000]
    prompt = f"""Trích xuất các tiêu chí sàng lọc cứng (hard filters) từ JD sau:
JD:
{cleaned}

Trả về JSON có dạng:
{{
  "location": "Địa điểm làm việc cụ thể (ví dụ: Hà Nội, TP.HCM, Đà Nẵng, hoặc Remote, Không nêu)",
  "minExp": "Số năm kinh nghiệm tối thiểu dạng số hoặc chuỗi (ví dụ: 1, 2, 3, hoặc 0 nếu không yêu cầu)",
  "seniority": "Cấp bậc vị trí (Fresher, Junior, Mid, Senior, Lead, Manager)",
  "education": "Yêu cầu bằng cấp (Đại học, Cao đẳng, Trung cấp, hoặc Không yêu cầu)",
  "industry": "Ngành nghề chính (ví dụ: Công nghệ thông tin, Bán lẻ, Tài chính)",
  "language": "Yêu cầu ngoại ngữ (ví dụ: Tiếng Anh giao tiếp, TOEIC 650, N2, hoặc Không yêu cầu)"
}}"""

    data = await prompt_json(prompt)
    return {
        "location": str(data.get("location") or "Không nêu").strip(),
        "minExp": str(data.get("minExp") or "0").strip(),
        "seniority": str(data.get("seniority") or "Không nêu").strip(),
        "education": str(data.get("education") or "Không yêu cầu").strip(),
        "industry": str(data.get("industry") or "Đa ngành").strip(),
        "language": str(data.get("language") or "Không yêu cầu").strip(),
    }
