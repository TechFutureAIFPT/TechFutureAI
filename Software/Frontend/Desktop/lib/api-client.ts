import { APP_CONFIG } from "./config";
import { getCurrentIdToken } from "./firebase";

export class ApiError extends Error {
  status: number;
  kind: string;
  requestId?: string;
  fieldErrors?: Record<string, string[]> | null;
  raw?: unknown;

  constructor(message: string, options: { status?: number; kind?: string; requestId?: string; fieldErrors?: Record<string, string[]> | null; raw?: unknown } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = options.status || 0;
    this.kind = options.kind || "UNKNOWN";
    this.requestId = options.requestId;
    this.fieldErrors = options.fieldErrors || null;
    this.raw = options.raw;
  }
}

let activeBaseUrl: string | null = null;
let activeBaseUrlExpiresAt = 0;

export function getActiveBaseUrl(): string {
  const now = Date.now();
  if (activeBaseUrl && now < activeBaseUrlExpiresAt) {
    return activeBaseUrl;
  }
  return APP_CONFIG.apiBaseUrl;
}

function getCandidateBaseUrls(): string[] {
  const primary = APP_CONFIG.apiBaseUrl;
  const fallback = APP_CONFIG.apiFallbackUrl;
  const local = APP_CONFIG.localApiUrl;
  const active = getActiveBaseUrl();

  const list = [active, primary, fallback, local].filter(Boolean) as string[];
  return Array.from(new Set(list));
}

function markBaseUrlHealthy(url: string) {
  activeBaseUrl = url;
  activeBaseUrlExpiresAt = Date.now() + 5 * 60 * 1000;
}

function buildUrl(path: string, query?: Record<string, unknown>, baseUrl?: string): string {
  const base = baseUrl || getActiveBaseUrl();
  const url = new URL(path.startsWith("/") ? path : `/${path}`, base);
  if (query && typeof query === "object") {
    Object.entries(query).forEach(([k, v]) => {
      if (v === null || v === undefined || v === "") return;
      if (Array.isArray(v)) {
        v.forEach((item) => url.searchParams.append(k, String(item)));
      } else {
        url.searchParams.set(k, String(v));
      }
    });
  }
  return url.toString();
}

export interface ApiFetchOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  query?: Record<string, unknown>;
  auth?: boolean | "optional";
  signal?: AbortSignal;
  timeoutMs?: number;
  headers?: Record<string, string>;
  raw?: boolean;
  /** Đích tường minh — bỏ qua danh sách failover (dùng cho dịch vụ khác cv-match-api, vd assistant). */
  baseUrl?: string;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiFetchOptions = {}
): Promise<T> {
  if (options.baseUrl) {
    return requestOnce<T>(path, options, options.baseUrl);
  }

  const candidates = getCandidateBaseUrls();
  let lastError: unknown = null;

  for (let i = 0; i < candidates.length; i++) {
    const currentBase = candidates[i];
    try {
      const result = await requestOnce<T>(path, { ...options }, currentBase);
      markBaseUrlHealthy(currentBase);
      return result;
    } catch (err) {
      lastError = err;
      if (i < candidates.length - 1) {
        console.warn(`[Failover] Lỗi kết nối tới ${currentBase}, chuyển sang server dự phòng ${candidates[i + 1]}`);
        continue;
      }
    }
  }

  throw lastError;
}

async function requestOnce<T = unknown>(
  path: string,
  options: ApiFetchOptions,
  baseUrl: string
): Promise<T> {
  const {
    method = "GET",
    body = null,
    query,
    auth = false,
    signal,
    timeoutMs = APP_CONFIG.requestTimeoutMs,
    headers: customHeaders = {},
    raw = false,
  } = options;

  const url = buildUrl(path, query, baseUrl);
  const headers = new Headers(customHeaders);
  const requestId = `req-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  headers.set("X-Request-Id", requestId);
  headers.set("Accept", "application/json");

  let payload: BodyInit | null = null;
  const isFormData = typeof FormData !== "undefined" && body instanceof FormData;

  if (body !== null && body !== undefined) {
    if (isFormData) {
      payload = body;
    } else {
      headers.set("Content-Type", "application/json");
      payload = JSON.stringify(body);
    }
  }

  if (auth) {
    const token = await getCurrentIdToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    } else if (auth === true) {
      throw new ApiError("Vui lòng đăng nhập để tiếp tục", { status: 401, kind: "UNAUTHORIZED", requestId });
    }
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  if (signal) {
    signal.addEventListener("abort", () => controller.abort());
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: payload,
      signal: controller.signal,
      mode: "cors",
    });

    clearTimeout(timer);

    if (raw) return response as unknown as T;

    if (!response.ok) {
      const errorBody = await response.json().catch(() => null);
      throw new ApiError(
        errorBody?.detail || errorBody?.message || `Lỗi máy chủ (${response.status})`,
        {
          status: response.status,
          requestId,
          raw: errorBody,
          fieldErrors: errorBody?.errors || null,
        }
      );
    }

    if (response.status === 204) return null as unknown as T;
    return (await response.json()) as T;
  } catch (error: unknown) {
    clearTimeout(timer);
    if (error instanceof ApiError) throw error;
    const isTimeout = controller.signal.aborted;
    throw new ApiError(isTimeout ? "Yêu cầu quá thời gian chờ (Timeout)" : "Không thể kết nối đến máy chủ", {
      status: 0,
      kind: isTimeout ? "TIMEOUT" : "NETWORK",
      requestId,
      raw: error,
    });
  }
}

/* Health checks */
export async function healthLive(signal?: AbortSignal): Promise<boolean> {
  try {
    const res = await apiFetch<Response>("/health/live", { raw: true, signal, timeoutMs: 5000 });
    return res.ok;
  } catch {
    return false;
  }
}

export async function healthReady(signal?: AbortSignal): Promise<{ ready: boolean; status?: number; payload?: unknown }> {
  try {
    const res = await apiFetch<Response>("/health/ready", { raw: true, signal, timeoutMs: 8000 });
    if (res.ok) {
      const data = await res.json().catch(() => null);
      return { ready: true, payload: data };
    }
    return { ready: false, status: res.status };
  } catch (error) {
    return { ready: false, status: 0, payload: error };
  }
}

export async function probeBackend(signal?: AbortSignal): Promise<{
  state: "ok" | "degraded" | "offline";
  live: boolean;
  ready: boolean;
  endpoint: string;
}> {
  const activeUrl = getActiveBaseUrl();
  const live = await healthLive(signal);
  if (!live) return { state: "offline", live: false, ready: false, endpoint: activeUrl };
  const ready = await healthReady(signal);
  return {
    state: ready.ready ? "ok" : "degraded",
    live: true,
    ready: ready.ready,
    endpoint: activeUrl,
  };
}
