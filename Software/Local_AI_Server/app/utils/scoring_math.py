from typing import Any, Dict, List, Tuple


def calculate_letter_rank(total_score: float) -> str:
    """Map numeric score (0-100) to standard SupportHR Grade."""
    if total_score >= 85.0:
        return "A"
    elif total_score >= 70.0:
        return "B"
    elif total_score >= 50.0:
        return "C"
    return "D"


def get_rank_label(rank: str) -> str:
    """Human-readable Vietnamese label for candidate rank."""
    mapping = {
        "A": "Rất phù hợp (Top Candidate)",
        "B": "Phù hợp (Strong Match)",
        "C": "Cần cân nhắc (Potential)",
        "D": "Chưa phù hợp (Does not meet)",
    }
    return mapping.get(rank, "Đang đánh giá")


def normalize_weights(raw_weights: Dict[str, Any]) -> Dict[str, float]:
    """
    Ensure weights sum up to 100.0%.
    If weights are empty or invalid, return standard balanced SupportHR defaults:
    - job_fit: 20%
    - role_skills: 35%
    - experience: 20%
    - impact / projects: 10%
    - soft_skills: 10%
    - education: 5%
    """
    default_weights = {
        "job_fit": 20.0,
        "role_skills": 35.0,
        "experience": 20.0,
        "impact": 10.0,
        "soft_skills": 10.0,
        "education": 5.0,
    }
    if not raw_weights:
        return default_weights

    cleaned = {}
    total = 0.0
    for key, val in raw_weights.items():
        try:
            num = float(val)
            if num > 0:
                cleaned[key] = num
                total += num
        except (ValueError, TypeError):
            continue

    if total <= 0 or not cleaned:
        return default_weights

    # Scale to 100%
    return {k: round((v / total) * 100.0, 2) for k, v in cleaned.items()}


def _find_criterion_score(scores: Dict[str, float], candidate_keys: List[str], default_val: float = 70.0) -> float:
    for target in candidate_keys:
        for k, v in scores.items():
            if k.lower() == target.lower() or target.lower() in k.lower():
                try:
                    return float(v)
                except (ValueError, TypeError):
                    pass
    return default_val


def compute_radar_dimensions(criteria_scores: Dict[str, float]) -> List[Dict[str, Any]]:
    """
    Generate 5/6-axis Radar chart metrics for frontend visual matching:
    1. Chuyên môn (Technical / Role Skills)
    2. Kinh nghiệm (Experience)
    3. Học vấn (Education)
    4. Dự án & Tác động (Projects & Impact)
    5. Kỹ năng mềm (Soft Skills)
    6. Độ phù hợp JD (Job Fit)
    """
    tech_score = _find_criterion_score(criteria_scores, ["technical_skills", "role_skills", "chuyên môn", "kỹ năng"])
    exp_score = _find_criterion_score(criteria_scores, ["experience", "kinh nghiệm"])
    edu_score = _find_criterion_score(criteria_scores, ["education", "học vấn", "bằng cấp"])
    proj_score = _find_criterion_score(criteria_scores, ["projects", "impact", "dự án", "thành tựu"])
    soft_score = _find_criterion_score(criteria_scores, ["soft_skills", "kỹ năng mềm", "gắn bó"])
    fit_score = _find_criterion_score(criteria_scores, ["job_fit", "phù hợp jd", "tổng điểm"], default_val=75.0)

    axes = [
        {"dimension": "Chuyên môn", "key": "technical", "score": tech_score},
        {"dimension": "Kinh nghiệm", "key": "experience", "score": exp_score},
        {"dimension": "Dự án", "key": "projects", "score": proj_score},
        {"dimension": "Kỹ năng mềm", "key": "soft_skills", "score": soft_score},
        {"dimension": "Học vấn", "key": "education", "score": edu_score},
        {"dimension": "Phù hợp JD", "key": "job_fit", "score": fit_score},
    ]
    # Bound scores between 0 and 100
    for axis in axes:
        axis["score"] = max(0.0, min(100.0, round(float(axis["score"]), 1)))
    return axes
