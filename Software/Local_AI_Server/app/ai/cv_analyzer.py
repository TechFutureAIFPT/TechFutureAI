from __future__ import annotations

import asyncio
import copy
import json
import time
from typing import Any, Dict, List, Optional

from app.config import get_settings
from app.db.repositories.cache_repository import CacheRepository
from app.db.repositories.history_repository import HistoryRepository
from app.db.vector_store import VectorStore
from app.services.cv_analysis_service import (
    analyze_cv_entries_async,
)
from app.utils.scoring_math import (
    calculate_letter_rank,
    compute_radar_dimensions,
    normalize_weights,
)
from app.utils.text_utils import compute_cache_key, normalize_display_text


PIPELINE_VERSION = "local-cv-analysis-v9"


DEFAULT_CRITERIA_WEIGHTS: Dict[str, Dict[str, Any]] = {
    "technical_skills": {
        "name": "Kỹ năng chuyên môn",
        "weight": 35,
        "children": [
            {"name": "Công nghệ cốt lõi & Framework", "weight": 20, "description": "Mức độ thành thạo công nghệ bắt buộc"},
            {"name": "Kiến trúc hệ thống & Cơ sở dữ liệu", "weight": 15, "description": "Thiết kế CSDL, API, microservices"},
        ],
    },
    "experience": {
        "name": "Kinh nghiệm thực tế",
        "weight": 30,
        "children": [
            {"name": "Số năm kinh nghiệm & Cấp độ", "weight": 15, "description": "Phù hợp với yêu cầu tối thiểu"},
            {"name": "Quy mô dự án & Trách nhiệm", "weight": 15, "description": "Dự án thực tế, độ phức tạp"},
        ],
    },
    "education": {
        "name": "Học vấn & Bằng cấp",
        "weight": 15,
        "description": "Đúng chuyên ngành CNTT/Kỹ thuật hoặc chứng chỉ uy tín",
    },
    "projects": {
        "name": "Thành tựu & Dự án tiêu biểu",
        "weight": 10,
        "description": "Đóng góp đo lường được, chỉ số KPI cụ thể",
    },
    "soft_skills": {
        "name": "Kỹ năng mềm & Gắn bó",
        "weight": 10,
        "description": "Làm việc nhóm, giao tiếp, quỹ đạo ổn định nghề nghiệp",
    },
}


def _prepare_weights_structure(raw_weights: Optional[Dict[str, Any]]) -> Dict[str, Any]:
    if not raw_weights:
        return DEFAULT_CRITERIA_WEIGHTS

    # Check if already structured with 'children' or 'weight'
    is_structured = any(isinstance(v, dict) and ("name" in v or "weight" in v) for v in raw_weights.values())
    if is_structured:
        return raw_weights

    # Convert flat weight dict: {"technical_skills": 35, ...}
    normalized_flat = normalize_weights(raw_weights)
    structured: Dict[str, Any] = {}
    label_map = {
        "job_fit": "Độ phù hợp JD",
        "role_skills": "Kỹ năng chuyên môn",
        "technical_skills": "Kỹ năng chuyên môn",
        "experience": "Kinh nghiệm thực tế",
        "education": "Học vấn & Bằng cấp",
        "impact": "Dự án & Tác động",
        "projects": "Dự án tiêu biểu",
        "soft_skills": "Kỹ năng mềm & Gắn bó",
    }
    for key, val in normalized_flat.items():
        name = label_map.get(key, key.replace("_", " ").title())
        structured[key] = {
            "name": name,
            "weight": float(val),
        }
    return structured


async def analyze_cv_pipeline(
    jd_text: str,
    cv_entries: List[Dict[str, Any]],
    raw_weights: Optional[Dict[str, Any]] = None,
    hard_filters: Optional[Dict[str, Any]] = None,
    user_id: Optional[str] = "local-recruiter",
) -> Dict[str, Any]:
    """
    SupportHR Core CV Analysis Pipeline running entirely on Local AI (Ollama Qwen 2.5 Coder + Nomic Embed).
    Executes Prompt v8 engine with 7-module HR evaluations, strict breakdown, and direct match matrix.
    """
    start_time = time.time()
    weights_structure = _prepare_weights_structure(raw_weights)
    filters = hard_filters or {}
    settings = get_settings()

    # Separate cached entries from entries needing local LLM analysis
    results: List[Dict[str, Any]] = []
    pending_entries: List[Dict[str, str]] = []
    cache_hits = 0
    cache_misses = 0

    # Include the actual rubric, not normalize_weights(structured_dict), which
    # discards child weights and previously made distinct rubrics share a key.
    cache_context = {
        "version": PIPELINE_VERSION,
        "userId": user_id,
        "weights": weights_structure,
        "hardFilters": filters,
        "model": settings.local_cv_model,
        "inference": {
            "temperature": 0,
            "topP": 1,
            "numCtx": settings.local_cv_num_ctx,
            "numPredict": settings.local_cv_num_predict,
            "seed": settings.local_cv_seed,
        },
    }

    def entry_cache_key(file_name: str, cv_text: str) -> str:
        context = json.dumps(
            {**cache_context, "fileName": file_name},
            ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False,
        )
        return compute_cache_key(jd_text, cv_text, context)

    for entry in cv_entries:
        file_name = str(entry.get("file_name") or entry.get("fileName") or "cv.pdf")
        cv_text = str(entry.get("text") or "").strip()
        cache_key = entry_cache_key(file_name, cv_text)

        cached = CacheRepository.get_cache(cache_key)
        if cached:
            cached = copy.deepcopy(cached)
            cached["is_cached"] = True
            results.append(cached)
            cache_hits += 1
        else:
            pending_entries.append({"file_name": file_name, "text": cv_text})
            cache_misses += 1

    # Execute Local AI Analysis for pending entries
    if pending_entries:
        analyzed_candidates = await analyze_cv_entries_async(
            jd_text=jd_text,
            weights=weights_structure,
            hard_filters=filters,
            cv_entries=pending_entries,
        )

        # Post-process, compute radar metrics, and cache candidates
        for cand in analyzed_candidates:
            cand_name = str(cand.get("candidateName") or "").strip()
            if not cand_name or cand_name.lower() in ("none", "null", "undefined", ""):
                f_name = str(cand.get("fileName") or cand.get("file_name") or "Ứng viên")
                cand_name = f_name.replace(".pdf", "").replace(".docx", "").replace("_", " ").strip().title()
                cand["candidateName"] = cand_name
            total_score = float(
                (cand.get("analysis") or {}).get("Tong diem")
                or (cand.get("hrSummary") or {}).get("tong_diem_phu_hop")
                or cand.get("totalScore")
                or 0.0
            )
            total_score = max(0.0, min(100.0, round(total_score, 1)))

            rank = str(cand.get("rank") or (cand.get("analysis") or {}).get("Hang") or calculate_letter_rank(total_score))

            # Criteria scores for Radar Chart
            crit_scores = {}
            for item in (cand.get("analysis") or {}).get("Chi tiet") or []:
                if isinstance(item, dict):
                    c_name = item.get("Tieu chi") or ""
                    try:
                        c_score = float(item.get("Diem") or 0.0)
                    except Exception:
                        c_score = 0.0
                    if c_name:
                        crit_scores[c_name] = c_score

            cand["totalScore"] = total_score
            cand["rank"] = rank
            cand["radarDimensions"] = compute_radar_dimensions(crit_scores)
            cand["is_cached"] = False

            # Cache single candidate result
            file_name = cand.get("fileName") or "cv.pdf"
            matching_entry = next((e for e in pending_entries if e["file_name"] == file_name), None)
            method = (cand.get("pipelineMetadata") or {}).get("analysisMethod")
            if matching_entry and method != "rule_based_fallback" and cand.get("status") != "FAILED":
                c_key = entry_cache_key(file_name, matching_entry["text"])
                CacheRepository.set_cache(c_key, cand_name, total_score, cand, uid=user_id or "anonymous")

            results.append(cand)

    # Sort all candidates by totalScore descending
    results.sort(key=lambda c: float(c.get("totalScore", 0.0)), reverse=True)
    duration_ms = int((time.time() - start_time) * 1000)

    pipeline_info = {
        "version": PIPELINE_VERSION,
        "aiModel": settings.local_cv_model,
        "embeddingModel": settings.local_embedding_model,
        "cacheHits": cache_hits,
        "cacheMisses": cache_misses,
        "durationMs": duration_ms,
        "candidatesProcessed": len(results),
    }

    # Save to local SQLite database (cv_history & cvHistory)
    jd_title = (jd_text.strip().split("\n")[0] if jd_text.strip() else "Chiến dịch tuyển dụng")[:80]
    saved_history_id = HistoryRepository.save_history(
        jd_title=jd_title,
        jd_text=jd_text,
        candidates=results,
        pipeline=pipeline_info,
        weights=weights_structure,
        hard_filters=filters,
        user_id=user_id,
    )

    return {
        "candidates": results,
        "pipeline": pipeline_info,
        "saved_history_id": saved_history_id,
    }


async def analyze_single_cv(
    jd_text: str,
    cv_entry: Dict[str, Any],
    weights: Dict[str, float],
    hard_filters: Dict[str, Any],
    rubric_role: str = "generic",
) -> Dict[str, Any]:
    """Convenience wrapper for single CV analysis."""
    res = await analyze_cv_pipeline(
        jd_text=jd_text,
        cv_entries=[cv_entry],
        raw_weights=weights,
        hard_filters=hard_filters,
    )
    cands = res.get("candidates") or []
    return cands[0] if cands else {}
