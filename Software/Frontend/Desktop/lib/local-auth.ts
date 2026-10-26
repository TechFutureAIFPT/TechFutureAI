import { APP_CONFIG } from "./config";

export interface AppAuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  emailVerified: boolean;
  getIdToken: (forceRefresh?: boolean) => Promise<string>;
}

type Session = { user: Omit<AppAuthUser, "getIdToken">; accessToken: string };
let current: AppAuthUser | null = null;
let token: string | null = null;
let restorePromise: Promise<AppAuthUser | null> | null = null;
const listeners = new Set<(user: AppAuthUser | null) => void>();

async function call<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(new URL(`/api/auth/${path}`, APP_CONFIG.apiBaseUrl), {
    method: body === undefined ? "GET" : "POST", credentials: "include", cache: "no-store",
    headers: { "Content-Type": "application/json", "X-Requested-With": "AI-Match-Local" },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const value = await response.json();
  if (!response.ok) throw new Error(value.detail || value.error?.message || "Không thể xác thực tài khoản local.");
  return value.data as T;
}

function accept(session: Session): AppAuthUser {
  token = session.accessToken;
  current = { ...session.user, getIdToken: async () => token || "" };
  listeners.forEach((listener) => listener(current));
  return current;
}

export async function restoreLocalAuth(): Promise<AppAuthUser | null> {
  if (typeof window === "undefined") return null;
  if (!restorePromise) restorePromise = call<Session>("session").then(accept).catch(() => {
    token = null;
    current = null;
    listeners.forEach((listener) => listener(null));
    return null;
  });
  return restorePromise;
}

export async function getLocalToken(): Promise<string | null> {
  if (!token) await restoreLocalAuth();
  return token;
}

export function observeLocalAuth(callback: (user: AppAuthUser | null) => void): () => void {
  listeners.add(callback);
  if (current) callback(current);
  else void restoreLocalAuth().then((user) => callback(user));
  return () => { listeners.delete(callback); };
}

export async function localSignIn(email: string, password: string): Promise<AppAuthUser> {
  const result = accept(await call<Session>("login", { email, password }));
  restorePromise = Promise.resolve(result);
  return result;
}

export async function localRegister(email: string, password: string, displayName = ""): Promise<AppAuthUser> {
  const result = accept(await call<Session>("register", { email, password, displayName }));
  restorePromise = Promise.resolve(result);
  return result;
}

export async function localSignOut(): Promise<void> {
  await call("logout", {});
  token = null;
  current = null;
  restorePromise = null;
  listeners.forEach((listener) => listener(null));
}

export async function localGoogleSignIn(): Promise<AppAuthUser> {
  const popup = window.open("about:blank", "aimatch-local-login", "popup,width=520,height=720");
  if (!popup) throw new Error("Trình duyệt đã chặn cửa sổ đăng nhập Google.");
  try {
    const { authUrl } = await call<{ authUrl: string }>("google/start", { origin: window.location.origin });
    popup.location.replace(authUrl);
    const apiOrigin = new URL(APP_CONFIG.apiBaseUrl).origin;
    return await new Promise<AppAuthUser>((resolve, reject) => {
      let settled = false;
      const cleanup = () => {
        window.removeEventListener("message", receive);
        window.clearInterval(closed);
        window.clearTimeout(timeout);
      };
      const finish = async () => {
        if (settled) return;
        settled = true;
        cleanup();
        try {
          restorePromise = null;
          const user = await restoreLocalAuth();
          if (!user) throw new Error("Chưa nhận được phiên Google local. Hãy mở giao diện bằng cùng hostname localhost với API.");
          resolve(user);
        } catch (error) { reject(error); }
      };
      const receive = (event: MessageEvent) => {
        if (event.origin === apiOrigin && event.source === popup && event.data?.type === "aimatch-local-auth") void finish();
      };
      const closed = window.setInterval(() => { if (popup.closed) void finish(); }, 600);
      const timeout = window.setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanup();
        popup.close();
        reject(new Error("Đăng nhập Google đã hết thời gian chờ."));
      }, 180000);
      window.addEventListener("message", receive);
    });
  } catch (error) {
    popup.close();
    throw error;
  }
}
