/**
 * CV Match Core Data Types & Schema Definitions
 * Source of Truth: Software/Web/BE/api_server/app/schemas/{analysis.py, account.py, salary.py, workflows.py}
 */

export type RankGrade = "A" | "B" | "C";
export type JobStatus = "queued" | "processing" | "completed" | "failed";
export type ExplanationQuality = "strong" | "partial" | "weak" | "missing";

export interface PointDeduction {
  reason: string;
  points_lost: number;
}

export interface KeywordAnalysis {
  keyword: string;
  status: "matched" | "missing";
  context_sentence?: string;
}

export interface SkillKeywordMetrics {
  total_required_keywords: number;
  matched_keywords_count: number;
  match_percentage: number;
  keywords_list: KeywordAnalysis[];
}

export interface AdvancedScoreBreakdown {
  max_possible_score: number;
  raw_score_earned: number;
  mathematical_formula: string;
  deductions: PointDeduction[];
  bonuses_earned: string[];
  keyword_metrics: SkillKeywordMetrics;
  verdict: ExplanationQuality;
  evidence_quality: ExplanationQuality;
  matched_signals: string[];
  missing_requirements: string[];
  evidence_highlights: string[];
  improvement_suggestion: string;
  quality_flags: string[];
}

export interface StructuredDetailScore {
  criterion: string;
  score: string | number;
  formula: string;
  evidence: string;
  explanation: string;
  advancedBreakdown?: AdvancedScoreBreakdown;
}

export interface HrSummaryExperience {
  so_nam_yeu_cau: string;
  so_nam_thuc_te: string;
  ket_luan: string;
}

export interface HrSummarySkillAssessment {
  ten_ky_nang: string;
  muc_do_dap_ung: string;
  bang_chung_tu_cv: string;
}

export interface StructuredHrSummary {
  tong_diem_phu_hop: number;
  nhan_xet_tong_quan: string;
  canh_bao_red_flag: string[];
  kinh_nghiem: HrSummaryExperience;
  danh_gia_ky_nang: HrSummarySkillAssessment[];
}

export interface StructuredCandidateAnalysis {
  total_score: number;
  rank: RankGrade;
  details: StructuredDetailScore[];
  strengths: string[];
  weaknesses: string[];
  education_validation?: Record<string, unknown>;
  review_basis?: string;
  direct_match_matrix?: Array<Record<string, unknown>>;
  strict_score_breakdown?: Record<string, unknown>;
  interview_questions?: string[];
  self_review?: string;
}

export interface StructuredCandidateOutput {
  candidateName: string;
  phone: string;
  email: string;
  fileName: string;
  jobTitle: string;
  industry: string;
  department: string;
  experienceLevel: string;
  hardFilterFailureReason: string;
  softFilterWarnings: string[];
  detectedLocation: string;
  hrSummary: StructuredHrSummary;
  analysis: StructuredCandidateAnalysis;
}

/** Standard Rubric Weight Schema */
export interface RubricWeightDefinition {
  job_fit: { name: string; weight: number };
  role_skills: {
    name: string;
    weight: number;
    children?: Array<{ key: string; name: string; weight: number; description?: string }>;
  };
  experience: { name: string; weight: number };
  impact: { name: string; weight: number };
  education: { name: string; weight: number };
  soft_skills: { name: string; weight: number };
}

export interface RubricItem {
  rubricVersion: string;
  roleKey: string;
  roleLabel: string;
  totalWeight: number;
  weights: RubricWeightDefinition;
}

/** Hard Filters Schema */
export interface HardFiltersConfig {
  min_experience_years?: number;
  required_education_level?: string;
  required_location?: string;
  mandatory_skills?: string[];
  maximum_salary?: number;
}

/** Analysis Job Payload & Status */
export interface CvTextEntry {
  file_name: string;
  text: string;
  cv_id?: string;
  file_id?: string;
  id?: string;
  size?: number;
  last_modified?: number;
}

export interface CoreCvAnalysisRequest {
  jd_text: string;
  weights: Record<string, unknown>;
  hard_filters: Record<string, unknown>;
  cv_entries: CvTextEntry[];
}

export interface AnalysisJobStatusResponse {
  job_id: string;
  status: JobStatus;
  progress: number;
  message: string;
  result?: {
    candidates: StructuredCandidateOutput[];
    pipeline?: Record<string, unknown>;
    saved_history_id?: string;
  };
  error?: string;
  created_at?: string | number | null;
  updated_at?: string | number | null;
}
