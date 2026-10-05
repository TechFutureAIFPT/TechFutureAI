import type { DecisionAction } from "./theme/tokens";

export interface DetailedScore {
  "Tiêu chí"?: string;
  "Điểm"?: string;
  "Công thức"?: string;
  "Dẫn chứng"?: string;
  "Giải thích"?: string;
  criterion?: string;
  score?: string;
  evidence?: string;
  explanation?: string;
  advancedBreakdown?: {
    matched_signals?: string[];
    missing_requirements?: string[];
    evidence_highlights?: string[];
    improvement_suggestion?: string;
  };
  [key: string]: unknown;
}

export interface RawCandidate {
  id?: string;
  candidateName?: string;
  fileName?: string;
  phone?: string;
  email?: string;
  jobTitle?: string;
  industry?: string;
  department?: string;
  experienceLevel?: string;
  hardFilterFailureReason?: string;
  softFilterWarnings?: string[];
  detectedLocation?: string;
  analysis?: Record<string, unknown>;
  status?: "SUCCESS" | "FAILED" | string;
  error?: string;
  totalScore?: number;
  grade?: string;
  jdFit?: number;
  _cvText?: string;
  [key: string]: unknown;
}

export interface HistoryEntry {
  id: string;
  timestamp: number;
  jobPosition: string;
  locationRequirement: string;
  totalCandidates: number;
  userEmail?: string;
  fullPayload?: {
    jdText?: string;
    jobPosition?: string;
    hardFilters?: Record<string, unknown>;
    candidates?: RawCandidate[];
  };
  candidates?: RawCandidate[];
  analysisData?: Record<string, unknown>;
  topCandidates?: Array<{
    id?: string;
    name?: string;
    avatarUrl?: string;
    score?: number;
    jdFit?: number;
    grade?: string;
  }>;
  [key: string]: unknown;
}

export interface CandidateView {
  id: string;
  sourceHistoryId?: string;
  syncHistoryId?: string;
  sessionId?: string;
  candidateName: string;
  avatarUrl?: string;
  fileName: string;
  jobTitle: string;
  industry: string;
  experienceLevel: string;
  detectedLocation: string;
  score: number;
  rank: "A" | "B" | "C" | string;
  strengths: string[];
  weaknesses: string[];
  interviewQuestions: string[];
  details: DetailedScore[];
  warnings: string[];
  hardFilterFailureReason?: string;
  hardFilters: Record<string, unknown>;
  jdText?: string;
  jobPosition?: string;
  decision?: DecisionAction;
  raw: RawCandidate;
}

export interface CandidateInbox {
  candidates: CandidateView[];
  history: HistoryEntry[];
  revision?: string;
  generatedAt?: number;
  dataRevision?: string;
  notModified?: boolean;
  responseEtag?: string | null;
}

export interface QuestionSet {
  category: string;
  questions: string[];
}

export interface SalaryHint {
  rangeLabel: string;
  recommendation: string;
  source: string;
}

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string | null;
  photoUrl?: string | null;
  userRole?: string | null;
}

export interface LoginHistoryEntry {
  id: string;
  signedInAt: number;
  provider: "Email" | "Google" | "Firebase";
  deviceLabel: string;
  platformLabel: string;
  appSurface: string;
  lastActiveAt?: number;
  durationSeconds?: number;
  isActive?: boolean;
}

export interface CandidateScoreRow {
  id: string;
  candidateName: string;
  avatarUrl?: string;
  totalScore: number;
  rank: string;
  componentScores: Array<{
    label: string;
    score: string;
  }>;
}

export interface FilterHistorySession {
  id: string;
  timestamp: number;
  jobPosition: string;
  totalCandidates: number;
  candidates: CandidateScoreRow[];
}

export interface UserJDTemplate {
  id: string;
  uid: string;
  name: string;
  category: string;
  jobPosition: string;
  jdText: string;
  hardFilters: Record<string, unknown>;
  createdAt: unknown;
  updatedAt: unknown;
  origin?: "saved" | "history";
}

export type JDTemplateInput = Pick<UserJDTemplate, "name" | "category" | "jobPosition" | "jdText" | "hardFilters">;

export interface QuickCvTextEntry {
  file_name: string;
  text: string;
}

export interface QuickCvScoreItem {
  file_name: string;
  candidate_name: string;
  target_role: string;
  score: number;
  rank: "A" | "B" | "C" | string;
  summary: string;
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  matched_keywords: string[];
  missing_keywords: string[];
  warnings: string[];
  extracted_text?: string | null;
  rubric_scores?: Array<{ name: string; score: number; comment: string }>;
  before_after_suggestions?: Array<{ section: string; before: string; after: string; reason: string }>;
  rewritten_cv?: any;
}

export interface QuickCvScoreResponse {
  items: QuickCvScoreItem[];
  model: string;
  usage_note: string;
}

export type JDTargetPlatform = "generic" | "topcv" | "vietnamworks" | "linkedin" | "parse_jd";

export interface JDMissingSection {
  key: string;
  label: string;
  reason: string;
  priority: "high" | "medium" | "low";
}

export interface JDWeakPoint {
  label: string;
  detail: string;
}

export interface JDSuggestion {
  label: string;
  detail: string;
}

export interface NormalizedJD {
  title: string;
  overview: string;
  responsibilities: string[];
  requirements: string[];
  benefits: string[];
  workingTime: string;
  location: string;
  salary: string;
  applicationInfo: string;
  keywords: string[];
}

export interface JDStandardizeResponse {
  score: number;
  missingSections: JDMissingSection[];
  weakPoints: JDWeakPoint[];
  suggestions: JDSuggestion[];
  normalizedJD: NormalizedJD;
  platform: {
    name: string;
    url: string;
  };
  platformUrl: string;
  generatedAt: string;
  source: "ai" | "fallback";
}

export interface JDSupplementalFields {
  companyName: string;
  salary: string;
  location: string;
  workingTime: string;
  benefits: string;
  applicationInfo: string;
  notes: string;
}
