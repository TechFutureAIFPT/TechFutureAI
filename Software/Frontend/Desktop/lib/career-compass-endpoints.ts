/**
 * Career Compass API Client & Endpoint Bindings
 * Backend: Software/Backend/Extensions/careercompass-api (Port 8001 / Vercel)
 * Phục vụ: Cố vấn định hướng nghề nghiệp, Trắc nghiệm Holland RIASEC, Lộ trình học tập & tuyển sinh
 */

import { apiFetch } from "./api-client";
import { APP_CONFIG } from "./config";

export interface CareerChatMessage {
  sender: "user" | "assistant";
  content: string;
}

export interface CareerChatRequest {
  message: string;
  conversation_id?: string;
  user_id?: string;
  conversation_history?: CareerChatMessage[];
  student_profile_context?: Record<string, any>;
  use_deep_research?: boolean;
}

export interface CitationItem {
  title: string;
  url?: string;
  snippet?: string;
  source_type?: string;
}

export interface CareerAdvisorData {
  reply: string;
  reasoning_content?: string;
  citations?: CitationItem[];
  suggested_followups?: string[];
  recommended_actions?: string[];
  conversation_id?: string;
}

export interface SurveyQuestionItem {
  id: string;
  code: string;
  text: string;
  category: string;
}

export interface SurveyQuestionsPayload {
  holland_riasec: SurveyQuestionItem[];
  scct_self_efficacy?: SurveyQuestionItem[];
  gardner_multi_intelligence?: SurveyQuestionItem[];
  disc_personality?: SurveyQuestionItem[];
  total_questions: number;
}

export interface SurveySubmissionPayload {
  user_id?: string;
  student_name?: string;
  riasec_answers: Record<string, number>;
  scct_answers?: Record<string, number>;
  gardner_answers?: Record<string, number>;
  disc_answers?: Record<string, number>;
}

export interface RiasecScores {
  R: number; // Kỹ thuật (Realistic)
  I: number; // Nghiên cứu (Investigative)
  A: number; // Nghệ thuật (Artistic)
  S: number; // Xã hội (Social)
  E: number; // Quản lý (Enterprising)
  C: number; // Nghiệp vụ (Conventional)
}

export interface CareerProfileResult {
  student_name?: string;
  riasec_scores: RiasecScores;
  holland_code?: string;
  primary_traits?: string[];
  recommended_majors?: string[];
  recommended_careers?: string[];
  strengths_analysis?: string;
  guidance_summary?: string;
}

export interface RoadmapMilestone {
  month: string;
  title: string;
  description: string;
  action_items: string[];
  category: "academic" | "admission" | "career" | "exam";
}

const baseUrl = APP_CONFIG.careerCompassApiBaseUrl;

export const careerCompassApi = {
  /** Gửi câu hỏi tới Cố vấn Hướng nghiệp AI (DeepSeek Reasoner + RAG Tuyển sinh) */
  sendMessage: (payload: CareerChatRequest, signal?: AbortSignal) =>
    apiFetch<{ success: boolean; data: CareerAdvisorData }>("/api/v1/chat/message", {
      method: "POST",
      body: payload,
      baseUrl,
      timeoutMs: 60000,
      signal,
    }),

  /** Lấy danh sách câu hỏi trắc nghiệm tâm lý & định hướng nghề nghiệp (Holland RIASEC) */
  getSurveyQuestions: (signal?: AbortSignal) =>
    apiFetch<{ success: boolean; data: SurveyQuestionsPayload }>("/api/v1/surveys/questions", {
      method: "GET",
      baseUrl,
      timeoutMs: 30000,
      signal,
    }),

  /** Nộp kết quả khảo sát và nhận Hồ sơ Hướng nghiệp cá nhân hóa */
  submitSurvey: (submission: SurveySubmissionPayload, signal?: AbortSignal) =>
    apiFetch<{ success: boolean; data: CareerProfileResult; message?: string }>("/api/v1/surveys/submit", {
      method: "POST",
      body: submission,
      baseUrl,
      timeoutMs: 45000,
      signal,
    }),

  /** Lấy lộ trình hướng nghiệp và tuyển sinh lớp 12 */
  getRoadmap: (signal?: AbortSignal) =>
    apiFetch<{ success: boolean; data: RoadmapMilestone[] }>("/api/v1/roadmap", {
      method: "GET",
      baseUrl,
      timeoutMs: 30000,
      signal,
    }),

  /** Kiểm tra trạng thái máy chủ Career Compass API */
  healthCheck: (signal?: AbortSignal) =>
    apiFetch<{ status: string }>("/health", {
      method: "GET",
      baseUrl,
      timeoutMs: 10000,
      signal,
    }),
};
