from fastapi import APIRouter, HTTPException
from typing import Dict, Any
from app.schemas.survey import RiasecSurveySubmission
from app.services.scoring_engine import (
    calculate_holland,
    HOLLAND_QUESTIONS,
    SCCT_QUESTIONS,
    GARDNER_QUESTIONS,
    DISC_QUESTIONS
)

router = APIRouter()

@router.get("/questions", summary="Lấy toàn bộ ngân hàng câu hỏi khảo sát đa chiều")
async def get_survey_questions() -> Dict[str, Any]:
    return {
        "success": True,
        "data": {
            "holland_riasec": HOLLAND_QUESTIONS,
            "scct_self_efficacy": SCCT_QUESTIONS,
            "gardner_multi_intelligence": GARDNER_QUESTIONS,
            "disc_personality": DISC_QUESTIONS,
            "total_questions": len(HOLLAND_QUESTIONS) + len(SCCT_QUESTIONS) + len(GARDNER_QUESTIONS) + len(DISC_QUESTIONS)
        }
    }

@router.post("/submit", response_model=Dict[str, Any], summary="Nộp bài khảo sát và tính toán Hồ sơ Hướng nghiệp cá nhân")
async def submit_survey(submission: RiasecSurveySubmission):
    try:
        question_ids = {question["id"] for question in HOLLAND_QUESTIONS}
        if set(submission.riasec_answers) != question_ids:
            raise HTTPException(status_code=422, detail="Hãy trả lời đầy đủ các câu hỏi RIASEC.")
        if any(value < 1 or value > 5 for value in submission.riasec_answers.values()):
            raise HTTPException(status_code=422, detail="Mỗi câu trả lời RIASEC phải nằm trong khoảng 1 đến 5.")

        score = calculate_holland(submission.riasec_answers)
        ordered_groups = sorted(score.scores, key=score.scores.get, reverse=True)
        profile_dict = {
            "student_name": submission.student_name,
            "riasec_scores": score.scores,
            "holland_code": score.holland_code,
            "primary_traits": [
                f"Nhóm nổi trội {index + 1}: {group} ({score.scores[group]:g} điểm)"
                for index, group in enumerate(ordered_groups[:3])
            ],
            "recommended_majors": [],
            "recommended_careers": [],
            "guidance_summary": "Kết quả này phản ánh sở thích nghề nghiệp theo câu trả lời RIASEC; hãy xem như thông tin tham khảo.",
        }
        return {
            "success": True,
            "data": profile_dict,
            "message": "Đã hoàn tất khảo sát RIASEC."
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi khi đánh giá hồ sơ khảo sát: {str(e)}")
