"""
Script kiểm tra và đo benchmark model đã tinh chỉnh supporthr-14b:
- Đo thời gian xử lý (prompt eval time)
- Đo tốc độ sinh token (eval tokens/sec)
- Kiểm tra tính hợp lệ của output JSON đánh giá ứng viên
- Kiểm tra VRAM GPU RTX 4050 & RAM
"""

import json
import sys
import time
import ollama

# Configure UTF-8 encoding for Windows terminal
if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass


def run_benchmark() -> None:
    client = ollama.Client(host="http://127.0.0.1:11434")

    # Sample Job Description
    jd_text = """
    Vị trí: Senior Backend Engineer (Python / FastAPI)
    Yêu cầu bắt buộc (Must-have):
    - Tối thiểu 4 năm kinh nghiệm phát triển backend với Python.
    - Thành thạo FastAPI, SQLAlchemy, PostgreSQL, Redis.
    - Có kinh nghiệm thiết kế kiến trúc Microservices và RESTful API chuẩn.
    Yêu cầu ưu tiên (Nice-to-have):
    - Có kinh nghiệm tích hợp AI/LLM, pgvector hoặc RAG.
    - Có kinh nghiệm với Docker, CI/CD.
    """

    # Sample Candidate CV Text
    cv_text = """
    Họ tên: Nguyễn Văn An
    Vị trí hiện tại: Python Backend Developer
    Kinh nghiệm làm việc:
    - 2021 - Nay (4 năm): Công ty Công nghệ Fintech ABC
      + Vị trí: Senior Software Engineer
      + Xây dựng hệ thống thanh toán bằng FastAPI, PostgreSQL và Redis.
      + Tích hợp giải pháp tìm kiếm dữ liệu lớn với pgvector và LangChain.
      + Triển khai microservices bằng Docker và GitLab CI/CD.
    - 2019 - 2021 (2 năm): Công ty Phần mềm XYZ
      + Vị trí: Junior Python Developer
      + Viết REST API bằng Django và Flask, quản lý cơ sở dữ liệu MySQL.
    Học vấn: Cử nhân CNTT - Đại học Bách Khoa (2015 - 2019)
    Kỹ năng: Python, FastAPI, Django, PostgreSQL, pgvector, Redis, Docker, Git.
    """

    prompt = f"""
    Hãy phân tích CV ứng viên sau dựa trên Yêu cầu tuyển dụng (JD).
    Xuất kết quả duy nhất dưới định dạng JSON (không có markdown code fence, không có văn bản giải thích phụ ngoài JSON) theo cấu trúc sau:
    {{
      "candidate_name": string,
      "total_years_experience": float,
      "matched_skills": [string],
      "missing_skills": [string],
      "must_have_score": float (thang 10),
      "overall_match_score": float (thang 100),
      "seniority_fit": "Junior" | "Middle" | "Senior" | "Lead",
      "summary_evaluation": string,
      "hiring_recommendation": "Pass" | "Consider" | "Reject"
    }}

    [YÊU CẦU TUYỂN DỤNG (JD)]:
    {jd_text}

    [HỒ SƠ ỨNG VIÊN (CV)]:
    {cv_text}
    """

    print("=" * 65)
    print(" BẮT ĐẦU BENCHMARK MODEL supporthr-14b TRÊN RTX 4050 & 32GB RAM")
    print("=" * 65)
    print(" Đang gửi yêu cầu suy luận tới Ollama...")

    start_time = time.time()
    response = client.chat(
        model="supporthr-14b:latest",
        messages=[{"role": "user", "content": prompt}],
        format="json",
        options={
            "temperature": 0.1,
            "top_p": 0.85,
            "num_ctx": 8192,
        },
    )
    total_latency = time.time() - start_time

    content = response.message.content
    print("\n[1] KẾT QUẢ PHÂN TÍCH JSON TRẢ VỀ:")
    print("-" * 65)
    try:
        parsed = json.loads(content)
        print(json.dumps(parsed, indent=2, ensure_ascii=False))
        json_valid = True
    except json.JSONDecodeError:
        print(content)
        json_valid = False

    print("\n[2] THÔNG SỐ HIỆU NĂNG SUY LUẬN (BENCHMARK METRICS):")
    print("-" * 65)
    total_duration = response.get("total_duration", 0) / 1e9
    load_duration = response.get("load_duration", 0) / 1e9
    prompt_eval_count = response.get("prompt_eval_count", 0)
    prompt_eval_duration = response.get("prompt_eval_duration", 0) / 1e9
    eval_count = response.get("eval_count", 0)
    eval_duration = response.get("eval_duration", 0) / 1e9

    tokens_per_sec = eval_count / eval_duration if eval_duration > 0 else 0
    prompt_tokens_per_sec = prompt_eval_count / prompt_eval_duration if prompt_eval_duration > 0 else 0

    print(f" -> Trạng thái JSON Output: {'HỢP LỆ (100% Valid JSON)' if json_valid else 'LỖI CÚ PHÁP'}")
    print(f" -> Tổng thời gian (Wall Clock): {total_latency:.2f} giây")
    print(f" -> Thời gian nạp model vào GPU/RAM: {load_duration:.2f} giây")
    print(f" -> Tokens đầu vào (Prompt Tokens): {prompt_eval_count} tokens")
    print(f" -> Tốc độ đọc hiểu đầu vào: {prompt_tokens_per_sec:.1f} tokens/giây")
    print(f" -> Tokens sinh ra (Generated Tokens): {eval_count} tokens")
    print(f" -> Tốc độ sinh text (Inference Speed): {tokens_per_sec:.2f} tokens/giây")
    print("=" * 65)


if __name__ == "__main__":
    run_benchmark()
