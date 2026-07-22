const DEFAULT_RENDER_API_URL = "https://backendsupporthr.onrender.com";

export const RENDER_API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_RENDER_API_URL;

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  authToken?: string | null;
  jsonBody?: unknown;
  timeoutMs?: number;
  allowNotModified?: boolean;
  body?: BodyInit | null;
}

export interface ApiResponseMeta<T> {
  data: T | null;
  status: number;
  notModified: boolean;
  etag: string | null;
  dataRevision: string | null;
}

function buildUrl(path: string): string {
  return path.startsWith("http") ? path : `${RENDER_API_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

function extractErrorMessage(payload: unknown, fallback: string): string {
  if (!payload || typeof payload !== "object") return fallback;
  const record = payload as Record<string, unknown>;
  if (typeof record.detail === "string") return record.detail;
  if (typeof record.message === "string") return record.message;
  if (typeof record.error === "string") return record.error;
  return fallback;
}

async function parsePayload(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function applySecurityHeaders(headers: Headers, authToken?: string | null): Promise<void> {
  if (authToken) headers.set("Authorization", `Bearer ${authToken}`);
}

function toResponseMeta<T>(response: Response, payload: unknown): ApiResponseMeta<T> {
  return {
    data: payload as T,
    status: response.status,
    notModified: response.status === 304,
    etag: response.headers.get("etag"),
    dataRevision: response.headers.get("x-data-revision")
  };
}

async function requestDetailed<T>(
  method: ApiMethod,
  path: string,
  options: RequestOptions = {}
): Promise<ApiResponseMeta<T>> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 120000);

  try {
    const headers = new Headers(options.headers);
    await applySecurityHeaders(headers, options.authToken);

    let body = options.body ?? null;
    if (options.jsonBody !== undefined) {
      headers.set("Content-Type", "application/json");
      body = JSON.stringify(options.jsonBody);
    }

    const response = await fetch(buildUrl(path), {
      ...options,
      body,
      headers,
      method,
      signal: controller.signal
    });

    if (response.status === 304 && options.allowNotModified) {
      return toResponseMeta<T>(response, null);
    }

    const payload = await parsePayload(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, "Không thể kết nối Render API."));
    }

    return toResponseMeta<T>(response, payload);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Render API phản hồi quá lâu. Vui lòng thử lại.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function pickArray<T>(payload: unknown, keys: string[]): T[] {
  if (Array.isArray(payload)) return payload as T[];
  if (!payload || typeof payload !== "object") return [];
  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) return value as T[];
  }

  if (record.data && typeof record.data === "object") {
    const data = record.data as Record<string, unknown>;
    for (const key of keys) {
      const value = data[key];
      if (Array.isArray(value)) return value as T[];
    }
  }

  return [];
}

export function pickObject<T extends Record<string, unknown>>(payload: unknown, keys: string[]): T | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) return null;
  const record = payload as Record<string, unknown>;

  for (const key of keys) {
    const value = record[key];
    if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
  }

  if (record.data && typeof record.data === "object" && !Array.isArray(record.data)) {
    const data = record.data as Record<string, unknown>;
    for (const key of keys) {
      const value = data[key];
      if (value && typeof value === "object" && !Array.isArray(value)) return value as T;
    }
  }

  return record as T;
}

export async function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await requestDetailed<T>("GET", path, options);
  return response.data as T;
}

export function apiGetWithMeta<T>(path: string, options?: RequestOptions): Promise<ApiResponseMeta<T>> {
  return requestDetailed<T>("GET", path, options);
}

export async function apiPost<T>(path: string, jsonBody?: unknown, options?: RequestOptions): Promise<T> {
  const response = await requestDetailed<T>("POST", path, { ...options, jsonBody });
  return response.data as T;
}

export async function apiPostForm<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
  const response = await requestDetailed<T>("POST", path, { ...options, body: formData });
  return response.data as T;
}

export async function apiPut<T>(path: string, jsonBody?: unknown, options?: RequestOptions): Promise<T> {
  const response = await requestDetailed<T>("PUT", path, { ...options, jsonBody });
  return response.data as T;
}

export async function apiPatch<T>(path: string, jsonBody?: unknown, options?: RequestOptions): Promise<T> {
  const response = await requestDetailed<T>("PATCH", path, { ...options, jsonBody });
  return response.data as T;
}

export async function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  const response = await requestDetailed<T>("DELETE", path, options);
  return response.data as T;
}
