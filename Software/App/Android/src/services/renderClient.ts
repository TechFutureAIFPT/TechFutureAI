const DEFAULT_RENDER_API_URL = "https://backendsupporthr.onrender.com";

export const RENDER_API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || DEFAULT_RENDER_API_URL;

type ApiMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

interface RequestOptions extends Omit<RequestInit, "body" | "method"> {
  authToken?: string | null;
  jsonBody?: unknown;
  timeoutMs?: number;
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

async function request<T>(method: ApiMethod, path: string, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 120000);

  try {
    const headers = new Headers(options.headers);
    if (options.authToken) headers.set("Authorization", `Bearer ${options.authToken}`);

    let body: BodyInit | null = null;
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
    const payload = await parsePayload(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, "Không thể kết nối Render API."));
    }

    return payload as T;
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

export function apiGet<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>("GET", path, options);
}

export function apiPost<T>(path: string, jsonBody?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("POST", path, { ...options, jsonBody });
}

export async function apiPostForm<T>(path: string, formData: FormData, options: RequestOptions = {}): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? 180000);

  try {
    const headers = new Headers(options.headers);
    if (options.authToken) headers.set("Authorization", `Bearer ${options.authToken}`);

    const response = await fetch(buildUrl(path), {
      ...options,
      body: formData,
      headers,
      method: "POST",
      signal: controller.signal
    });
    const payload = await parsePayload(response);

    if (!response.ok) {
      throw new Error(extractErrorMessage(payload, "Không thể kết nối Render API."));
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("Render API phản hồi quá lâu. Vui lòng thử lại.");
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export function apiPut<T>(path: string, jsonBody?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("PUT", path, { ...options, jsonBody });
}

export function apiPatch<T>(path: string, jsonBody?: unknown, options?: RequestOptions): Promise<T> {
  return request<T>("PATCH", path, { ...options, jsonBody });
}

export function apiDelete<T>(path: string, options?: RequestOptions): Promise<T> {
  return request<T>("DELETE", path, options);
}
