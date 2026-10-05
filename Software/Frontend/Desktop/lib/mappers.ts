import {
  type StructuredCandidateOutput,
  type RankGrade,
  type JobStatus,
} from "./types/cvmatch";

function pick<T = unknown>(source: unknown, ...keys: string[]): T | undefined {
  if (!source || typeof source !== "object") return undefined;
  const record = source as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (value !== undefined && value !== null && value !== "") return value as T;
  }
  return undefined;
}

function asArray<T = unknown>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function asText(value: unknown, fallback = ""): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

function asNumberOrNull(value: unknown): number | null {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

export function normalizeGrade(grade: unknown): RankGrade {
  const upper = asText(grade).toUpperCase().trim();
  if (upper === "A" || upper === "B" || upper === "C") return upper;
  return "C";
}

export function mapJobStatus(payload: unknown) {
  const rawStatus = asText(pick(payload, "status"), "queued") as JobStatus;
  const status: JobStatus = ["queued", "processing", "completed", "failed"].includes(rawStatus)
    ? rawStatus
    : "processing";
  const progress = Number(pick(payload, "progress")) || 0;

  return {
    jobId: asText(pick(payload, "job_id", "jobId")),
    status,
    isTerminal: status === "completed" || status === "failed",
    progress: Math.max(0, Math.min(100, progress <= 1 ? progress * 100 : progress)),
    message: asText(pick(payload, "message")),
    hasError: Boolean(pick(payload, "error")),
    createdAt: pick(payload, "created_at", "createdAt") ?? null,
    updatedAt: pick(payload, "updated_at", "updatedAt") ?? null,
    result: pick<Record<string, unknown>>(payload, "result") ?? null,
  };
}

export function mapCandidate(raw: unknown, index = 0): StructuredCandidateOutput {
  if (!raw || typeof raw !== "object") {
    return {
      candidateName: `Ứng viên #${index + 1}`,
      phone: "",
      email: "",
      fileName: `cv-${index + 1}.pdf`,
      jobTitle: "",
      industry: "",
      department: "",
      experienceLevel: "",
      hardFilterFailureReason: "",
      softFilterWarnings: [],
      detectedLocation: "",
      hrSummary: {
        tong_diem_phu_hop: 0,
        nhan_xet_tong_quan: "",
        canh_bao_red_flag: [],
        kinh_nghiem: { so_nam_yeu_cau: "", so_nam_thuc_te: "", ket_luan: "" },
        danh_gia_ky_nang: [],
      },
      analysis: {
        total_score: 0,
        rank: "C",
        details: [],
        strengths: [],
        weaknesses: [],
        interview_questions: [],
      },
    };
  }

  const analysis = (pick<Record<string, unknown>>(raw, "analysis") || {}) as Record<string, unknown>;
  const hrSummary = (pick<Record<string, unknown>>(raw, "hrSummary", "hr_summary") || {}) as Record<string, unknown>;

  const totalScore = asNumberOrNull(pick(analysis, "Tong diem", "total_score", "totalScore")) || 0;
  const grade = normalizeGrade(pick(analysis, "Hang", "rank"));
  const hardFailure = asText(pick(raw, "hardFilterFailureReason", "hard_filter_failure_reason"));

  return {
    candidateName: asText(pick(raw, "candidateName", "candidate_name"), "Chưa xác định tên"),
    email: asText(pick(raw, "email")),
    phone: asText(pick(raw, "phone")),
    fileName: asText(pick(raw, "fileName", "file_name"), `cv-${index + 1}.pdf`),
    jobTitle: asText(pick(raw, "jobTitle", "job_title")),
    industry: asText(pick(raw, "industry")),
    department: asText(pick(raw, "department")),
    experienceLevel: asText(pick(raw, "experienceLevel", "experience_level")),
    hardFilterFailureReason: hardFailure,
    softFilterWarnings: asArray<string>(pick(raw, "softFilterWarnings", "soft_filter_warnings")),
    detectedLocation: asText(pick(raw, "detectedLocation", "detected_location")),
    hrSummary: {
      tong_diem_phu_hop: Number(pick(hrSummary, "tong_diem_phu_hop", "tongDiemPhuHop")) || totalScore,
      nhan_xet_tong_quan: asText(pick(hrSummary, "nhan_xet_tong_quan", "nhanXetTongQuan")),
      canh_bao_red_flag: asArray<string>(pick(hrSummary, "canh_bao_red_flag", "canhBaoRedFlag")),
      kinh_nghiem: {
        so_nam_yeu_cau: asText(pick(hrSummary.kinh_nghiem || hrSummary.kinhNghiem, "so_nam_yeu_cau")),
        so_nam_thuc_te: asText(pick(hrSummary.kinh_nghiem || hrSummary.kinhNghiem, "so_nam_thuc_te")),
        ket_luan: asText(pick(hrSummary.kinh_nghiem || hrSummary.kinhNghiem, "ket_luan")),
      },
      danh_gia_ky_nang: asArray<Record<string, unknown>>(pick(hrSummary, "danh_gia_ky_nang", "danhGiaKyNang")).map((s) => ({
        ten_ky_nang: asText(pick(s, "ten_ky_nang", "tenKyNang")),
        muc_do_dap_ung: asText(pick(s, "muc_do_dap_ung", "mucDoDapUng")),
        bang_chung_tu_cv: asText(pick(s, "bang_chung_tu_cv", "bangChungTuCv")),
      })),
    },
    analysis: {
      total_score: totalScore,
      rank: grade,
      details: asArray<Record<string, unknown>>(pick(analysis, "Chi tiet", "details")).map((d) => ({
        criterion: asText(pick(d, "Tieu chi", "criterion")),
        score: asText(pick(d, "Diem", "score")),
        formula: asText(pick(d, "Cong thuc", "formula")),
        evidence: asText(pick(d, "Dan chung", "evidence")),
        explanation: asText(pick(d, "Giai thich", "explanation")),
      })),
      strengths: asArray<string>(pick(analysis, "Diem manh CV", "strengths")),
      weaknesses: asArray<string>(pick(analysis, "Diem yeu CV", "weaknesses")),
      interview_questions: asArray<string>(pick(analysis, "Cau hoi phong van", "interview_questions", "interviewQuestions")),
      review_basis: asText(pick(analysis, "Can cu tham dinh", "review_basis")),
      self_review: asText(pick(analysis, "Tu tham dinh", "self_review")),
    },
  };
}

export function mapAnalysisResult(result: unknown) {
  if (!result || typeof result !== "object") {
    return { candidates: [], pipeline: null, savedHistoryId: null };
  }
  const rawCandList = asArray(pick(result, "candidates"));
  return {
    candidates: rawCandList.map(mapCandidate),
    pipeline: pick<Record<string, unknown>>(result, "pipeline") || null,
    savedHistoryId: pick<string>(result, "saved_history_id", "savedHistoryId") ?? null,
  };
}
