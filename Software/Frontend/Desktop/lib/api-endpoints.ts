/**
 * Endpoint bindings — Đối chiếu trực tiếp 100% với route/schema Backend CV Match.
 * Nguồn xác minh:
 *   Software/Web/BE/api_server/app/api/routes/{ai.py,files.py,salary.py,account/*}
 *   Software/Web/BE/api_server/app/schemas/{analysis.py,workflows.py,files.py,salary.py,account.py}
 */

import { apiFetch } from "./api-client";
import {
  type CoreCvAnalysisRequest,
  type AnalysisJobStatusResponse,
  type StructuredCandidateOutput,
  type RubricItem,
} from "./types/cvmatch";

/* ============ AI / CV / JD ============ */

export const ai = {
  /** GET /api/rubrics → { rubricVersion, items: RubricItem[] } */
  listRubrics: (signal?: AbortSignal) =>
    apiFetch<{ rubricVersion: string; items: RubricItem[] }>("/api/rubrics", { signal }),

  /** GET /api/rubrics/{role_key} → RubricItem */
  getRubric: (roleKey: string, signal?: AbortSignal) =>
    apiFetch<RubricItem>(`/api/rubrics/${encodeURIComponent(roleKey)}`, { signal }),

  /** POST /api/jd/structure { raw_text } → { structured_text, savedRecordId } */
  structureJd: (rawText: string, signal?: AbortSignal) =>
    apiFetch<{ structured_text: string; savedRecordId?: string }>("/api/jd/structure", {
      method: "POST",
      body: { raw_text: rawText },
      auth: "optional",
      signal,
    }),

  /** POST /api/jd/position { jd_text } → { job_position, savedRecordId } */
  detectPosition: (jdText: string, signal?: AbortSignal) =>
    apiFetch<{ job_position: string; savedRecordId?: string }>("/api/jd/position", {
      method: "POST",
      body: { jd_text: jdText },
      auth: "optional",
      signal,
    }),

  /** POST /api/jd/hard-filters { jd_text } → { filters, savedRecordId } */
  suggestHardFilters: (jdText: string, signal?: AbortSignal) =>
    apiFetch<{ filters: Record<string, unknown>; savedRecordId?: string }>("/api/jd/hard-filters", {
      method: "POST",
      body: { jd_text: jdText },
      auth: "optional",
      signal,
    }),

  /**
   * POST /api/analysis/jobs → 202 { job_id, status, status_url }
   * body: CoreCvAnalysisRequest { jd_text, weights, hard_filters, cv_entries }
   */
  createAnalysisJob: (payload: CoreCvAnalysisRequest, signal?: AbortSignal) =>
    apiFetch<{ job_id: string; status: "queued" | "processing"; status_url: string }>(
      "/api/analysis/jobs",
      { method: "POST", body: payload, auth: "optional", signal }
    ),

  /** GET /api/analysis/status/{job_id} → AnalysisJobStatusResponse */
  analysisStatus: (jobId: string, signal?: AbortSignal) =>
    apiFetch<AnalysisJobStatusResponse>(`/api/analysis/status/${encodeURIComponent(jobId)}`, {
      auth: "optional",
      signal,
    }),

  /** POST /api/cv/quick-score-text — tối đa 3 CV theo contract */
  quickScoreText: (payload: {
    cv_entries: Array<{ file_name: string; text: string }>;
    jd_text?: string;
    include_extracted_text?: boolean;
  }, signal?: AbortSignal) =>
    apiFetch<{
      items: Array<{
        file_name: string;
        candidate_name: string;
        target_role: string;
        score: number;
        rank: "A" | "B" | "C";
        summary: string;
        strengths: string[];
        weaknesses: string[];
        improvements: string[];
        matched_keywords: string[];
        missing_keywords: string[];
        warnings: string[];
        extracted_text?: string;
      }>;
      model: string;
      usage_note?: string;
      saved_score_id?: string;
    }>("/api/cv/quick-score-text", {
      method: "POST",
      body: payload,
      auth: "optional",
      signal,
    }),

  /** POST /api/interview/questions */
  interviewQuestions: (payload: {
    job_position?: string;
    candidate_name?: string;
    cv_text?: string;
    jd_text?: string;
    question_count?: number;
  }, signal?: AbortSignal) =>
    apiFetch<{
      questions: Array<{
        id?: string;
        category: "Technical" | "Situational" | "Culture & Soft Skills" | string;
        question: string;
        expected_answer?: string;
        expectedAnswer?: string;
        evaluation_rubric?: string;
        evaluationRubric?: string;
        difficulty?: string;
      }>;
    }>("/api/interview/questions", {
      method: "POST",
      body: payload,
      auth: "optional",
      signal,
    }),

  /** POST /api/cv/refine-profile */
  refineProfile: (payload: {
    cv_text: string;
    current_education?: string;
    current_name?: string;
  }, signal?: AbortSignal) =>
    apiFetch<{
      standardized_education?: string;
      validation_note?: string;
      warnings: string[];
      refined_name?: string;
      savedRecordId?: string;
    }>("/api/cv/refine-profile", {
      method: "POST",
      body: payload,
      auth: "optional",
      signal,
    }),

  /** POST /api/cv/candidate-chat */
  candidateChat: (payload: {
    candidate_snapshot?: Record<string, unknown>;
    message: string;
    job_position?: string;
    recruiter_context?: string | null;
  }, signal?: AbortSignal) =>
    apiFetch<{
      response_text?: string;
      responseText?: string;
      cited_criteria?: string[];
      citedCriteria?: string[];
      confidence?: string;
      reply?: string;
      suggested_actions?: string[];
    }>("/api/cv/candidate-chat", {
      method: "POST",
      body: payload,
      auth: "optional",
      signal,
    }),

  /** POST /api/cv/enrich — Yêu cầu Bearer token */
  enrich: (payload: {
    jd_text: string;
    hard_filters: Record<string, unknown>;
    candidates: StructuredCandidateOutput[];
    cv_text_map: Record<string, string>;
  }, signal?: AbortSignal) =>
    apiFetch<{ candidates: StructuredCandidateOutput[]; savedRecordId?: string }>("/api/cv/enrich", {
      method: "POST",
      body: payload,
      auth: true,
      signal,
    }),

  /** GET /api/cv/classifier-status */
  classifierStatus: (signal?: AbortSignal) =>
    apiFetch<{
      ready: boolean;
      model_source: string;
      model_version: string;
      label_count: number;
      labels: string[];
    }>("/api/cv/classifier-status", { signal }),
};

/* ============ File extraction ============ */

export const files = {
  /** POST /api/files/extract-text — multipart/form-data */
  extractText: (file: File, opts: { forceOcr?: boolean; documentType?: string } = {}, signal?: AbortSignal) => {
    const form = new FormData();
    form.append("file", file);
    form.append("force_ocr", opts.forceOcr ? "true" : "false");
    if (opts.documentType) form.append("document_type", opts.documentType);

    return apiFetch<{
      extracted_text: string;
      filename: string;
      file_size: number;
      ocr_applied: boolean;
      page_count?: number;
    }>("/api/files/extract-text", {
      method: "POST",
      body: form,
      auth: "optional",
      signal,
    });
  },
};

/* ============ Salary Benchmark ============ */

export const salary = {
  /** POST /api/salary/analyze */
  analyze: (payload: {
    job_title: string;
    location?: string;
    years_of_experience?: number;
    current_salary?: number;
    jd_text?: string;
    cv_text?: string;
  }, signal?: AbortSignal) =>
    apiFetch<{
      summary?: string;
      market_salary?: { p25: number; median: number; p75: number; currency: string; period?: string };
      marketSalary?: { p25: number; median: number; p75: number; currency: string; period?: string };
      comparison?: Record<string, unknown>;
      recommendation?: string;
      negotiation_tips?: string[];
      negotiationTips?: string[];
      source?: string;
      confidence_note?: string;
      confidenceNote?: string;
      saved_record_id?: string;
      savedRecordId?: string;
    }>("/api/salary/analyze", {
      method: "POST",
      body: payload,
      auth: "optional",
      signal,
    }),
};

/* ============ Account & Settings (Yêu cầu Bearer Auth) ============ */

export const account = {
  /* --- Profile --- */
  getProfile: (signal?: AbortSignal) =>
    apiFetch<Record<string, unknown>>("/api/account/profile", { auth: true, signal }),

  updateProfile: (payload: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<Record<string, unknown>>("/api/account/profile", { method: "PUT", body: payload, auth: true, signal }),

  listProfileCvHistory: (query?: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<unknown[]>("/api/account/profile/cv-history", { query, auth: true, signal }),

  /* --- Settings --- */
  getSettings: (signal?: AbortSignal) =>
    apiFetch<Record<string, unknown>>("/api/account/settings", { auth: true, signal }),

  patchSettings: (payload: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<Record<string, unknown>>("/api/account/settings", { method: "PATCH", body: payload, auth: true, signal }),

  /* --- History --- */
  listHistory: (query?: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<unknown[]>("/api/account/history", { query, auth: true, signal }),

  saveHistory: (payload: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<Record<string, unknown>>("/api/account/history", { method: "POST", body: payload, auth: true, signal }),

  /* --- Notifications --- */
  listNotifications: (query?: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<unknown[]>("/api/account/notifications", { query, auth: true, signal }),

  markNotificationRead: (id: string, signal?: AbortSignal) =>
    apiFetch(`/api/account/notifications/${encodeURIComponent(id)}/read`, { method: "POST", auth: true, signal }),

  markAllNotificationsRead: (signal?: AbortSignal) =>
    apiFetch("/api/account/notifications/read-all", { method: "POST", auth: true, signal }),

  /* --- JD templates --- */
  listTemplates: (query?: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch<unknown[]>("/api/account/jd-templates", { query, auth: true, signal }),

  createTemplate: (payload: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch("/api/account/jd-templates", { method: "POST", body: payload, auth: true, signal }),

  updateTemplate: (id: string, payload: Record<string, unknown>, signal?: AbortSignal) =>
    apiFetch(`/api/account/jd-templates/${encodeURIComponent(id)}`, { method: "PATCH", body: payload, auth: true, signal }),

  deleteTemplate: (id: string, signal?: AbortSignal) =>
    apiFetch(`/api/account/jd-templates/${encodeURIComponent(id)}`, { method: "DELETE", auth: true, signal }),

  /* --- Chatbot --- */
  chatbotStats: (signal?: AbortSignal) =>
    apiFetch<Record<string, unknown>>("/api/account/chatbot/stats", { auth: true, signal }),

  createChatSession: (payload: { jobPosition: string; totalCandidates: number; analysisContext?: unknown }, signal?: AbortSignal) =>
    apiFetch<{ id: string }>("/api/account/chatbot/sessions", { method: "POST", body: payload, auth: true, signal }),

  replyChatSession: (id: string, payload: { message: string }, signal?: AbortSignal) =>
    apiFetch<{ reply: string; suggestedActions?: string[] }>(`/api/account/chatbot/sessions/${encodeURIComponent(id)}/reply`, {
      method: "POST",
      body: payload,
      auth: true,
      signal,
    }),

  /* --- Google Drive --- */
  driveStatus: (signal?: AbortSignal) =>
    apiFetch<{ connected: boolean; email?: string }>("/api/account/google-drive/status", { auth: true, signal }),

  /* --- Email --- */
  sendEmail: (payload: {
    to: string;
    subject: string;
    body: string;
    candidate_id?: string;
  }, signal?: AbortSignal) =>
    apiFetch<{ success: boolean; message_id?: string }>("/api/account/email/send", {
      method: "POST",
      body: payload,
      auth: true,
      signal,
    }),
};

// Aliases for compatibility
export const aiApi = ai;
export const filesApi = files;
export const salaryApi = salary;
export const accountApi = account;
