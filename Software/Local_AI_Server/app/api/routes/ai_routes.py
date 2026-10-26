from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query

from app.ai.classifier_service import classify_cv_industry
from app.ai.cv_analyzer import analyze_cv_pipeline
from app.api.deps import get_current_user
from app.config import get_settings
from app.schemas.analysis import (
    CandidateChatRequest,
    CandidateChatResponse,
    CoreCvAnalysisRequest,
    CoreCvAnalysisResponse,
    CvIndustryClassificationRequest,
    CvIndustryClassificationResponse,
    CvProfileRefineRequest,
    CvProfileRefineResponse,
    QuickCvScoreRequest,
    QuickCvScoreResponse,
)
from app.schemas.interview import (
    InterviewQuestionsRequest,
    InterviewQuestionsResponse,
)
from app.schemas.jd import (
    JdHardFiltersRequest,
    JdHardFiltersResponse,
    JdPositionRequest,
    JdPositionResponse,
    JdStructureRequest,
    JdStructureResponse,
)
from app.schemas.mobile_jd import (
    JDStandardizeRequest,
    JDStandardizeResponse,
)
from app.schemas.salary import (
    SalaryAnalysisRequest,
    SalaryAnalysisResponse,
)
from app.services.candidate_chat_service import reply_to_candidate_chat
from app.services.candidate_refinement_service import refine_cv_profile
from app.services.mobile_jd.standardizer_service import standardize_jd_text
from app.services.cv_match_service import LocalCVError
from app.services.rubric_service import build_default_rubric, list_rubrics
from app.services.salary_analysis_service import analyze_salary
from app.services.salary_market_service import (
    estimate_salary_fallback,
    fetch_market_salary,
    get_experience_level,
    normalize_location,
)
from app.services.workflow_service import (
    extract_hard_filters as wf_extract_hard_filters,
    extract_job_position as wf_extract_job_position,
    generate_interview_questions as wf_generate_interview_questions,
    structure_jd as wf_structure_jd,
)

router = APIRouter(prefix="/api", tags=["ai"])


# ==========================================
# 1. RUBRICS
# ==========================================

@router.get("/rubrics")
def get_scoring_rubrics() -> Dict[str, Any]:
    return {"rubricVersion": "v2", "items": list_rubrics(version="v2")}


@router.get("/rubrics/{role_key}")
def get_scoring_rubric(role_key: str) -> Dict[str, Any]:
    rubric = build_default_rubric(role_key, version="v2")
    if rubric["roleKey"] == "generic" and role_key != "generic":
        raise HTTPException(status_code=404, detail="Rubric role not found")
    return rubric


# ==========================================
# 2. JOB DESCRIPTION (JD)
# ==========================================

@router.post("/jd/structure", response_model=JdStructureResponse)
async def api_jd_structure(
    payload: JdStructureRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> JdStructureResponse:
    structured = wf_structure_jd(payload.raw_text)
    return JdStructureResponse(structured_text=structured)


@router.post("/jd/position", response_model=JdPositionResponse)
async def api_jd_position(
    payload: JdPositionRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> JdPositionResponse:
    position = wf_extract_job_position(payload.jd_text)
    return JdPositionResponse(job_position=position)


@router.post("/jd/hard-filters", response_model=JdHardFiltersResponse)
async def api_jd_hard_filters(
    payload: JdHardFiltersRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> JdHardFiltersResponse:
    filters = wf_extract_hard_filters(payload.jd_text)
    return JdHardFiltersResponse(filters=filters)


@router.post("/mobile-jd/standardize", response_model=JDStandardizeResponse)
async def api_mobile_jd_standardize(
    payload: JDStandardizeRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> JDStandardizeResponse:
    res = standardize_jd_text(
        jd_text=payload.jd_text,
        target_platform=payload.target_platform,
    )
    return JDStandardizeResponse(**res)


# ==========================================
# 3. CV ANALYSIS CORE & PIPELINE
# ==========================================

@router.post("/cv/analyze", response_model=CoreCvAnalysisResponse)
@router.post("/cv/analyze-core", response_model=CoreCvAnalysisResponse)
async def api_cv_analyze_core(
    payload: CoreCvAnalysisRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> CoreCvAnalysisResponse:
    try:
        result = await analyze_cv_pipeline(
            jd_text=payload.jd_text,
            cv_entries=[entry.model_dump() for entry in payload.cv_entries],
            raw_weights=payload.weights,
            hard_filters=payload.hard_filters,
            user_id=user.get("uid"),
        )
        return CoreCvAnalysisResponse(
            candidates=result.get("candidates") or [],
            pipeline=result.get("pipeline") or {},
            saved_history_id=result.get("saved_history_id"),
        )
    except LocalCVError as err:
        raise HTTPException(status_code=err.status_code, detail=str(err)) from err
    except Exception as err:
        raise HTTPException(status_code=500, detail=f"Lỗi phân tích CV: {err}")


@router.post("/cv/quick-score", response_model=QuickCvScoreResponse)
@router.post("/cv/quick-score-text", response_model=QuickCvScoreResponse)
async def api_cv_quick_score(
    payload: QuickCvScoreRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> QuickCvScoreResponse:
    raw_entries = [{"file_name": e.file_name, "text": e.text} for e in payload.cv_entries]
    try:
        jd_text = payload.jd_text or (
            "Đánh giá tổng quan hồ sơ cho mục tiêu tuyển dụng: năng lực, kinh nghiệm, "
            "học vấn, dự án và kỹ năng thể hiện bằng dẫn chứng trực tiếp trong CV."
        )
        result = await analyze_cv_pipeline(
            jd_text=jd_text,
            cv_entries=raw_entries,
            user_id=user.get("uid"),
        )
        quick_items = []
        for candidate in result.get("candidates", []):
            analysis = candidate.get("analysis") or {}
            details = analysis.get("Chi tiet") or []
            breakdowns = [item.get("advancedBreakdown") or {} for item in details if isinstance(item, dict)]
            evidence = [
                quote
                for item in details
                for quote in str(item.get("Dan chung") or "").split(" | ")
                if quote and not quote.startswith("Không tìm thấy")
            ]
            missing = [
                requirement
                for item in breakdowns
                for requirement in item.get("missing_requirements", [])
            ]
            warnings = list(candidate.get("softFilterWarnings") or [])
            if payload.jd_text is None:
                warnings.append("Đánh giá tổng quan chưa đối chiếu với một mô tả công việc cụ thể.")
            quick_items.append({
                "file_name": candidate.get("fileName", "cv.pdf"),
                "candidate_name": candidate.get("candidateName", ""),
                "target_role": "",
                "score": round(float(candidate.get("totalScore", 0))),
                "rank": candidate.get("rank", "C"),
                "summary": (candidate.get("hrSummary") or {}).get("nhan_xet_tong_quan", ""),
                "strengths": analysis.get("Diem manh CV", []),
                "weaknesses": analysis.get("Diem yeu CV", []),
                "improvements": list(dict.fromkeys(missing))[:5],
                "matched_keywords": list(dict.fromkeys(evidence))[:10],
                "missing_keywords": list(dict.fromkeys(missing))[:10],
                "warnings": warnings,
                "extracted_text": next((entry["text"] for entry in raw_entries if entry["file_name"] == candidate.get("fileName")), None) if payload.include_extracted_text else None,
            })
        return QuickCvScoreResponse(
            items=quick_items,
            model=get_settings().local_cv_model,
            saved_score_id=result.get("saved_history_id"),
        )
    except LocalCVError as error:
        raise HTTPException(status_code=error.status_code, detail=str(error)) from error
    except Exception as error:
        raise HTTPException(status_code=503, detail="Không thể chấm CV bằng model local.") from error


@router.get("/cv/classifier-status")
def api_cv_classifier_status() -> Dict[str, Any]:
    return {
        "ready": True,
        "model_source": "local://ollama-qwen2.5-coder",
        "label_count": 24,
        "labels": ["IT", "SALES", "MARKETING", "HR", "FINANCE", "DATA", "DESIGN"],
        "error": None,
    }


@router.post("/cv/classify-industry", response_model=CvIndustryClassificationResponse)
async def api_cv_classify_industry(
    payload: CvIndustryClassificationRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> CvIndustryClassificationResponse:
    res = await classify_cv_industry(payload.cv_text, top_k=payload.top_k)
    return CvIndustryClassificationResponse(
        predicted_industry=res["predicted_industry"],
        confidence_score=res["confidence_score"],
        top_industries=res["top_industries"],
    )


@router.post("/cv/refine-profile", response_model=CvProfileRefineResponse)
async def api_cv_refine_profile(
    payload: CvProfileRefineRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> CvProfileRefineResponse:
    try:
        refined = refine_cv_profile(
            cv_text=payload.cv_text,
            current_education=payload.current_education,
            current_name=payload.current_name,
        )
        return CvProfileRefineResponse(
            candidate_name=refined.get("refined_name") or payload.current_name,
            education_level=refined.get("standardized_education") or payload.current_education,
        )
    except Exception:
        name = payload.current_name if payload.current_name != "Candidate" else "Ứng viên"
        return CvProfileRefineResponse(
            candidate_name=name,
            education_level=payload.current_education,
        )


# ==========================================
# 4. CANDIDATE COPILOT CHAT
# ==========================================

@router.post("/candidate/chat", response_model=CandidateChatResponse)
@router.post("/cv/candidate-chat", response_model=CandidateChatResponse)
async def api_cv_candidate_chat(
    payload: CandidateChatRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> CandidateChatResponse:
    res = reply_to_candidate_chat(
        candidate_snapshot=payload.candidate_snapshot,
        message=payload.message,
        job_position=payload.job_position,
        recruiter_context=payload.recruiter_context,
    )
    return CandidateChatResponse(
        reply=res.get("responseText") or res.get("reply", ""),
        suggestions=res.get("citedCriteria") or res.get("suggestions", []),
    )


# ==========================================
# 5. SALARY & MARKET BENCHMARK
# ==========================================

@router.post("/salary/analyze", response_model=SalaryAnalysisResponse)
async def api_salary_analyze(
    payload: SalaryAnalysisRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> SalaryAnalysisResponse:
    res = analyze_salary(
        job_title=payload.job_title,
        location=payload.location,
        years_of_experience=payload.years_of_experience,
        current_salary=payload.current_salary,
    )
    return SalaryAnalysisResponse(**res)


@router.get("/salary/market")
def api_salary_market(
    job_title: str = Query(..., min_length=1),
    location: Optional[str] = Query(None),
    years_of_experience: Optional[float] = Query(None),
) -> Dict[str, Any]:
    norm_loc = normalize_location(location)
    exp_info = get_experience_level(years_of_experience)

    data = fetch_market_salary(job_title, norm_loc, exp_info["years"])
    if data:
        return {"source": "rapidapi", "marketSalary": data}

    fallback = estimate_salary_fallback(job_title, norm_loc, years_of_experience)
    return {"source": "local_estimate", "marketSalary": fallback}


# ==========================================
# 6. INTERVIEW QUESTIONS
# ==========================================

@router.post("/interview/questions", response_model=InterviewQuestionsResponse)
async def api_interview_questions(
    payload: InterviewQuestionsRequest,
    user: Dict[str, Any] = Depends(get_current_user),
) -> InterviewQuestionsResponse:
    q_sets = wf_generate_interview_questions(
        question_type=payload.question_type,
        analysis_data=payload.analysis_data,
        candidate=payload.candidate_data,
        candidates=[payload.candidate_data] if payload.candidate_data else [],
    )
    return InterviewQuestionsResponse(question_sets=q_sets)


@router.post("/interview/comparative")
async def api_interview_comparative(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    q_sets = wf_generate_interview_questions(
        question_type="comparative",
        analysis_data=payload.get("analysis_data", {}),
        candidates=payload.get("candidates", []),
    )
    return {"question_sets": q_sets}


@router.post("/interview/general")
async def api_interview_general(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    q_sets = wf_generate_interview_questions(
        question_type="general",
        analysis_data=payload.get("analysis_data", {}),
    )
    return {"question_sets": q_sets}


@router.post("/interview/specific")
async def api_interview_specific(
    payload: Dict[str, Any],
    user: Dict[str, Any] = Depends(get_current_user),
) -> Dict[str, Any]:
    q_sets = wf_generate_interview_questions(
        question_type="specific",
        analysis_data=payload.get("analysis_data", {}),
        candidate=payload.get("candidate", {}),
    )
    return {"question_sets": q_sets}
