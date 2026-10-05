/**
 * Endpoint bindings — dịch vụ AI assistant độc lập (Software/backend/ai-assistant),
 * KHÁC process/deploy với cv-match-api. Đối chiếu với app/routes.py + app/schemas.py
 * của dịch vụ đó. Mọi endpoint đều yêu cầu Bearer token Firebase thật (auth: true).
 */

import { apiFetch } from "./api-client";
import { APP_CONFIG } from "./config";

export interface AssistantMessageRecord {
  id: string;
  author: "user" | "bot";
  content: string;
  timestamp: number;
}

export interface AssistantSessionSummary {
  id: string;
  title?: string;
  updatedAt?: number;
}

export interface AssistantSessionDetail extends AssistantSessionSummary {
  messages: AssistantMessageRecord[];
}

export interface AssistantReplyResponse {
  sessionId: string;
  userMessage: AssistantMessageRecord;
  assistantMessage: AssistantMessageRecord;
  responseText: string;
}

const baseUrl = APP_CONFIG.assistantApiBaseUrl;

export const assistant = {
  /** GET /api/assistant/sessions */
  listSessions: (limitCount = 30, signal?: AbortSignal) =>
    apiFetch<AssistantSessionSummary[]>("/api/assistant/sessions", {
      query: { limit_count: limitCount },
      auth: true,
      baseUrl,
      signal,
    }),

  /** GET /api/assistant/sessions/{id} */
  getSession: (id: string, signal?: AbortSignal) =>
    apiFetch<AssistantSessionDetail>(`/api/assistant/sessions/${encodeURIComponent(id)}`, {
      auth: true,
      baseUrl,
      signal,
    }),

  /** POST /api/assistant/sessions { title } → { id } */
  createSession: (title = "", signal?: AbortSignal) =>
    apiFetch<{ id: string }>("/api/assistant/sessions", {
      method: "POST",
      body: { title },
      auth: true,
      baseUrl,
      signal,
    }),

  /** POST /api/assistant/sessions/{id}/reply { message } */
  replySession: (id: string, message: string, signal?: AbortSignal) =>
    apiFetch<AssistantReplyResponse>(`/api/assistant/sessions/${encodeURIComponent(id)}/reply`, {
      method: "POST",
      body: { message },
      auth: true,
      baseUrl,
      timeoutMs: 60000,
      signal,
    }),

  /** DELETE /api/assistant/sessions/{id} */
  deleteSession: (id: string, signal?: AbortSignal) =>
    apiFetch<{ ok: boolean }>(`/api/assistant/sessions/${encodeURIComponent(id)}`, {
      method: "DELETE",
      auth: true,
      baseUrl,
      signal,
    }),
};
