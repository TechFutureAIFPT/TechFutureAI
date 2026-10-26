from __future__ import annotations

import json
import logging
import os
import re
from typing import Any, Dict, Optional

import ollama

logger = logging.getLogger(__name__)

OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://127.0.0.1:11434")
DEFAULT_LOCAL_MODEL = os.getenv("LOCAL_LLM_MODEL", "supporthr-14b:latest")


class LocalLLMService:
    def __init__(self, host: str = OLLAMA_HOST, default_model: str = DEFAULT_LOCAL_MODEL) -> None:
        self.host = host
        self.default_model = default_model
        self.client = ollama.Client(host=self.host)

    def analyze_candidate(
        self,
        cv_text: str,
        jd_text: str,
        model: Optional[str] = None,
        timeout: int = 120,
    ) -> Dict[str, Any]:
        """
        Phân tích và chấm điểm ứng viên bằng model 14B đã tinh chỉnh.
        Bảo đảm 100% dữ liệu xử lý nội bộ, không gửi ra ngoài Internet.
        """
        target_model = model or self.default_model

        prompt = f"""Hãy phân tích hồ sơ ứng viên (CV) sau đây dựa trên Yêu cầu tuyển dụng (JD).

[YÊU CẦU TUYỂN DỤNG (JD)]:
{jd_text.strip()}

[HỒ SƠ ỨNG VIÊN (CV)]:
{cv_text.strip()}

Yêu cầu xuất kết quả DUY NHẤT dưới dạng JSON hợp lệ (Valid JSON Object), tuân thủ đúng cấu trúc sau:
{{
  "candidate_name": "Tên ứng viên",
  "total_years_experience": 0.0,
  "matched_skills": ["kỹ năng 1", "kỹ năng 2"],
  "missing_skills": ["kỹ năng còn thiếu"],
  "must_have_score": 0.0,
  "overall_match_score": 0.0,
  "seniority_fit": "Intern" | "Junior" | "Middle" | "Senior" | "Lead",
  "strengths": ["điểm mạnh 1", "điểm mạnh 2"],
  "weaknesses": ["điểm yếu hoặc khoảng trống kỹ năng"],
  "red_flags": ["dấu hiệu khai khống hoặc mâu thuẫn thời gian nếu có"],
  "summary_evaluation": "Nhận xét khách quan và chi tiết về mức độ phù hợp",
  "hiring_recommendation": "Pass" | "Consider" | "Reject"
}}
"""

        try:
            response = self.client.chat(
                model=target_model,
                messages=[{"role": "user", "content": prompt}],
                format="json",
                options={
                    "temperature": 0.1,
                    "top_p": 0.85,
                    "top_k": 30,
                    "num_ctx": 4096,
                },
            )
            raw_content = response.message.content or "{}"
            # Extract JSON block if surrounded by markdown
            json_match = re.search(r"\{.*\}", raw_content, re.DOTALL)
            clean_json_str = json_match.group(0) if json_match else raw_content

            parsed_data = json.loads(clean_json_str)
            return {
                "success": True,
                "data": parsed_data,
                "model": target_model,
                "eval_duration_sec": round(response.get("eval_duration", 0) / 1e9, 2),
                "tokens_generated": response.get("eval_count", 0),
            }
        except Exception as exc:
            logger.error("Local LLM analysis failed: %s", exc)
            return {
                "success": False,
                "error": str(exc),
                "model": target_model,
            }


_default_llm_service: LocalLLMService | None = None


def get_local_llm_service() -> LocalLLMService:
    global _default_llm_service
    if _default_llm_service is None:
        _default_llm_service = LocalLLMService()
    return _default_llm_service
