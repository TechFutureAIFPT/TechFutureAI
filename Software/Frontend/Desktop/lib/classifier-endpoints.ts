/**
 * Classifier Service API Client & Endpoint Bindings
 * Backend: Software/Backend/Extensions/classifier-service (Port 5000 / Render)
 * Phục vụ: Phân loại ngành nghề CV độc lập (24 nhóm ngành) bằng mô hình ML LinearSVC
 */

import { apiFetch } from "./api-client";
import { APP_CONFIG } from "./config";

export interface PredictionItem {
  label: string;
  score: number;
}

export interface ClassifyCvResponse {
  predictions: PredictionItem[];
  top_label: string;
  top_score: number;
  model_source?: string;
}

export interface ClassifierStatusResponse {
  status: string;
  ready: boolean;
  model_source?: string;
  label_count?: number;
  labels?: string[];
  error?: string | null;
}

const baseUrl = APP_CONFIG.classifierApiBaseUrl;

export const classifierApi = {
  /** Phân loại ngành nghề cho văn bản CV trích xuất */
  classify: (cvText: string, topK = 3, signal?: AbortSignal) =>
    apiFetch<ClassifyCvResponse>("/classify", {
      method: "POST",
      body: { cv_text: cvText, top_k: topK },
      baseUrl,
      timeoutMs: 30000,
      signal,
    }),

  /** Lấy danh sách 24 ngành nghề được mô hình hỗ trợ */
  getLabels: (signal?: AbortSignal) =>
    apiFetch<string[]>("/labels", {
      method: "GET",
      baseUrl,
      timeoutMs: 15000,
      signal,
    }),

  /** Kiểm tra trạng thái sẵn sàng của mô hình phân loại */
  getStatus: (signal?: AbortSignal) =>
    apiFetch<ClassifierStatusResponse>("/health", {
      method: "GET",
      baseUrl,
      timeoutMs: 10000,
      signal,
    }),
};
