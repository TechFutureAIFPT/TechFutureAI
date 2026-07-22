import { create } from "zustand";

import { getAuthToken, loginWithEmail, loginWithGoogle, loginWithGoogleIdToken, logout, registerWithEmail, resetPasswordEmail } from "../services/auth";
import { fetchFirestoreCandidateInbox, saveFirestoreDecisionFeedback } from "../services/firebaseStore";
import type { DesktopSession } from "../services/firebaseStore";
import { localCacheKeys, readLocalCacheEnvelope, removeLocalCache, writeLocalCache } from "../services/localDataCache";
import { readLoginHistory, recordLoginSession } from "../services/loginHistory";
import { fetchRenderCandidateInbox, fetchRenderMobileInbox, scoreRenderQuickCvForm, scoreRenderQuickCvText } from "../services/renderStore";
import type {
  AuthUser,
  CandidateInbox,
  CandidateView,
  DetailedScore,
  HistoryEntry,
  LoginHistoryEntry,
  QuickCvScoreItem,
  QuickCvTextEntry
} from "../types";
import type { DecisionAction } from "../theme/tokens";

interface RecruiterState {
  authUser: AuthUser | null;
  authReady: boolean;
  candidates: CandidateView[];
  history: HistoryEntry[];
  loginHistory: LoginHistoryEntry[];
  query: string;
  rankFilter: "all" | "A" | "B" | "C";
  loading: boolean;
  inboxRefreshing: boolean;
  inboxFromCache: boolean;
  inboxRevision: string | null;
  lastInboxSyncAt: number | null;
  quickCvLoading: boolean;
  quickCvResults: QuickCvScoreItem[];
  submitting: boolean;
  error: string | null;
  lastDecision: string | null;
  liveSession: DesktopSession | null;
  setLiveSession: (session: DesktopSession | null) => void;
  setAuthUser: (user: AuthUser | null) => void;
  setAuthReady: (ready: boolean) => void;
  loadLoginHistory: () => Promise<void>;
  setQuery: (query: string) => void;
  setRankFilter: (rank: RecruiterState["rankFilter"]) => void;
  loadInbox: (force?: boolean) => Promise<void>;
  scoreQuickCvForm: (formData: FormData) => Promise<QuickCvScoreItem[]>;
  scoreQuickCvText: (cvEntries: QuickCvTextEntry[], jdText?: string) => Promise<QuickCvScoreItem[]>;
  login: (email: string, password: string) => Promise<void>;
  loginGoogle: () => Promise<void>;
  loginGoogleToken: (idToken: string) => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  logout: () => Promise<void>;
  submitDecision: (candidate: CandidateView, action: DecisionAction, notes: string) => Promise<void>;
  getCandidate: (id: string) => CandidateView | undefined;
}

const INBOX_CACHE_TTL_MS = 5 * 60 * 1000;
const AUTH_TOKEN_TIMEOUT_MS = 2500;
const RENDER_WARM_INBOX_TIMEOUT_MS = 12000;
const RENDER_COLD_INBOX_TIMEOUT_MS = 90000;
const FIRESTORE_INBOX_TIMEOUT_MS = 5500;
const RENDER_WARM_LEGACY_TIMEOUT_MS = 15000;
const RENDER_COLD_LEGACY_TIMEOUT_MS = 90000;
let inFlightInboxLoad: { key: string; promise: Promise<void> } | null = null;

function hasInboxData(inbox: CandidateInbox | null | undefined): inbox is CandidateInbox {
  return Boolean(inbox && (inbox.candidates.length > 0 || inbox.history.length > 0));
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "";
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<T>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    if (timeout) clearTimeout(timeout);
  });
}

async function fetchFastInbox(
  authToken: string | null,
  userEmail: string | undefined,
  renderTimeoutMs: number,
  cacheMeta?: { etag?: string | null; cachedInbox?: CandidateInbox | null }
): Promise<CandidateInbox> {
  const mobilePromise = authToken
    ? fetchRenderMobileInbox(authToken, 12, 60, userEmail, {
        timeoutMs: renderTimeoutMs,
        ifNoneMatch: cacheMeta?.etag ?? null,
        cachedValue: cacheMeta?.cachedInbox ?? null
      })
    : Promise.reject(new Error("No Render token."));
  const firestorePromise = withTimeout(
    fetchFirestoreCandidateInbox(30),
    FIRESTORE_INBOX_TIMEOUT_MS,
    "Nguồn Supabase trực tiếp phản hồi quá lâu."
  );

  const [mobileResult, firestoreResult] = await Promise.allSettled([mobilePromise, firestorePromise]);
  let mobileInbox = mobileResult.status === "fulfilled" ? mobileResult.value : null;
  const firestoreInbox = firestoreResult.status === "fulfilled" ? firestoreResult.value : null;

  if (hasInboxData(mobileInbox)) return mobileInbox;
  if (hasInboxData(firestoreInbox)) return firestoreInbox;

  if (authToken) {
    try {
      const legacyInbox = await fetchRenderCandidateInbox(authToken, 12, userEmail, {
        includeManual: false,
        timeoutMs: renderTimeoutMs >= RENDER_COLD_INBOX_TIMEOUT_MS ? RENDER_COLD_LEGACY_TIMEOUT_MS : RENDER_WARM_LEGACY_TIMEOUT_MS
      });
      if (hasInboxData(legacyInbox)) return legacyInbox;
      mobileInbox = mobileInbox ?? legacyInbox;
    } catch (legacyError) {
      if (!mobileInbox && !firestoreInbox) {
        throw new Error(
          errorMessage(legacyError) ||
            errorMessage(mobileResult.status === "rejected" ? mobileResult.reason : null) ||
            errorMessage(firestoreResult.status === "rejected" ? firestoreResult.reason : null) ||
            "Không thể tải inbox ứng viên."
        );
      }
    }
  }

  if (mobileInbox) return mobileInbox;
  if (firestoreInbox) return firestoreInbox;

  throw new Error(
    errorMessage(mobileResult.status === "rejected" ? mobileResult.reason : null) ||
      errorMessage(firestoreResult.status === "rejected" ? firestoreResult.reason : null) ||
      "Không thể tải inbox ứng viên."
  );
}

function compactRecordText(value: unknown, maxLength = 900): unknown {
  return typeof value === "string" && value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function compactOptionalText(value: unknown, maxLength = 900): string | undefined {
  if (typeof value !== "string") return undefined;
  return value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;
}

function compactRawCandidate<T extends Record<string, unknown> | undefined>(raw: T): T {
  if (!raw) return raw;

  const compacted: Record<string, unknown> = {};
  Object.entries(raw).forEach(([key, value]) => {
    if (key === "_cvText" || key === "extracted_text" || key === "extractedText") return;
    compacted[key] = compactRecordText(value);
  });
  return compacted as T;
}

function compactHistoryForCache(entry: HistoryEntry): HistoryEntry {
  return {
    ...entry,
    analysisData: undefined,
    candidates: entry.candidates?.slice(0, 6).map((candidate) => compactRawCandidate(candidate)),
    fullPayload: entry.fullPayload
      ? {
          ...entry.fullPayload,
          candidates: entry.fullPayload.candidates?.slice(0, 6).map((candidate) => compactRawCandidate(candidate)),
          jdText: entry.fullPayload.jdText ? String(entry.fullPayload.jdText).slice(0, 6000) : entry.fullPayload.jdText
        }
      : undefined
  };
}

function compactCandidateForCache(candidate: CandidateView): CandidateView {
  return {
    ...candidate,
    details: candidate.details.slice(0, 6).map<DetailedScore>((detail) => ({
      ...detail,
      "Dẫn chứng": compactOptionalText(detail["Dẫn chứng"]),
      "Giải thích": compactOptionalText(detail["Giải thích"]),
      evidence: compactOptionalText(detail.evidence),
      explanation: compactOptionalText(detail.explanation)
    })),
    jdText: candidate.jdText ? candidate.jdText.slice(0, 6000) : candidate.jdText,
    raw: compactRawCandidate(candidate.raw)
  };
}

function compactInboxForCache(inbox: CandidateInbox): CandidateInbox {
  return {
    candidates: inbox.candidates.slice(0, 30).map(compactCandidateForCache),
    history: inbox.history.slice(0, 30).map(compactHistoryForCache),
    revision: inbox.revision,
    generatedAt: inbox.generatedAt,
    dataRevision: inbox.dataRevision
  };
}

function readInboxCacheMetadata(envelope: Awaited<ReturnType<typeof readLocalCacheEnvelope<CandidateInbox>>>): {
  etag: string | null;
  revision: string | null;
} {
  const metadata = envelope?.metadata;
  return {
    etag: typeof metadata?.etag === "string" ? metadata.etag : null,
    revision:
      typeof metadata?.dataRevision === "string"
        ? metadata.dataRevision
        : typeof envelope?.value?.dataRevision === "string"
          ? envelope.value.dataRevision
          : typeof envelope?.value?.revision === "string"
            ? envelope.value.revision
            : null
  };
}

export const useRecruiterStore = create<RecruiterState>((set, get) => ({
  authUser: null,
  authReady: false,
  candidates: [],
  history: [],
  loginHistory: [],
  query: "",
  rankFilter: "all",
  loading: false,
  inboxRefreshing: false,
  inboxFromCache: false,
  inboxRevision: null,
  lastInboxSyncAt: null,
  quickCvLoading: false,
  quickCvResults: [],
  submitting: false,
  error: null,
  lastDecision: null,
  liveSession: null,
  setLiveSession: (session) => set({ liveSession: session }),
  setAuthUser: (user) => set({ authUser: user, loginHistory: user ? get().loginHistory : [] }),
  setAuthReady: (ready) => set({ authReady: ready }),
  loadLoginHistory: async () => {
    const user = get().authUser;
    const loginHistory = await readLoginHistory(user);
    set({ loginHistory });
  },
  setQuery: (query) => set({ query }),
  setRankFilter: (rankFilter) => set({ rankFilter }),
  loadInbox: async (force = false) => {
    const userKey = get().authUser?.email || get().authUser?.uid || null;
    const cacheKey = localCacheKeys.inbox(userKey);
    const requestKey = cacheKey;
    if (inFlightInboxLoad?.key === requestKey) return inFlightInboxLoad.promise;

    const run = async () => {
      const cachedEnvelope = await readLocalCacheEnvelope<CandidateInbox>(cacheKey);
      const cachedInbox = cachedEnvelope?.value ?? null;
      const cacheMeta = readInboxCacheMetadata(cachedEnvelope);
      const hasCachedInbox = hasInboxData(cachedInbox);
      const cacheFresh = Boolean(hasCachedInbox && cachedEnvelope && Date.now() - cachedEnvelope.savedAt < INBOX_CACHE_TTL_MS);

      if (hasCachedInbox) {
        set({
          candidates: cachedInbox.candidates,
          history: cachedInbox.history,
          loading: false,
          inboxRefreshing: force || !cacheFresh,
          inboxFromCache: true,
          inboxRevision: cacheMeta.revision,
          lastInboxSyncAt: cachedEnvelope?.savedAt ?? null,
          error: null
        });
      } else {
        set({ loading: true, inboxRefreshing: false, inboxFromCache: false, inboxRevision: null, error: null });
      }

      if (cacheFresh && !force) {
        set({ loading: false, inboxRefreshing: false, inboxRevision: cacheMeta.revision });
        return;
      }

      try {
        const token = await withTimeout(
          getAuthToken(),
          AUTH_TOKEN_TIMEOUT_MS,
          "Không lấy được token đăng nhập đủ nhanh."
        );
        const inbox = await fetchFastInbox(
          token,
          get().authUser?.email,
          hasCachedInbox ? RENDER_WARM_INBOX_TIMEOUT_MS : RENDER_COLD_INBOX_TIMEOUT_MS,
          {
            etag: cacheMeta.etag,
            cachedInbox
          }
        );

        if (hasInboxData(inbox) && !inbox.notModified) {
          await writeLocalCache(cacheKey, compactInboxForCache(inbox), {
            etag: typeof inbox.responseEtag === "string" ? inbox.responseEtag : cacheMeta.etag,
            dataRevision: inbox.dataRevision || inbox.revision || cacheMeta.revision
          });
        }
        if (inbox.notModified && hasCachedInbox) {
          set({
            candidates: cachedInbox.candidates,
            history: cachedInbox.history,
            loading: false,
            inboxRefreshing: false,
            inboxFromCache: true,
            inboxRevision: inbox.dataRevision || inbox.revision || cacheMeta.revision,
            lastInboxSyncAt: Date.now(),
            error: null
          });
          return;
        }
        set({
          candidates: inbox.candidates,
          history: inbox.history,
          loading: false,
          inboxRefreshing: false,
          inboxFromCache: false,
          inboxRevision: inbox.dataRevision || inbox.revision || cacheMeta.revision,
          lastInboxSyncAt: Date.now(),
          error: null
        });
      } catch {
        if (hasCachedInbox) {
          set({
            loading: false,
            inboxRefreshing: false,
            inboxFromCache: true,
            inboxRevision: cacheMeta.revision,
            error: null
          });
          return;
        }

        try {
          const inbox = await withTimeout(
              fetchFirestoreCandidateInbox(30),
              FIRESTORE_INBOX_TIMEOUT_MS,
              "Nguồn Supabase trực tiếp phản hồi quá lâu."
            );
            if (hasInboxData(inbox)) {
              await writeLocalCache(cacheKey, compactInboxForCache(inbox), {
                etag: cacheMeta.etag,
                dataRevision: cacheMeta.revision
              });
            }
            set({
              candidates: inbox.candidates,
              history: inbox.history,
              loading: false,
              inboxRefreshing: false,
              inboxFromCache: false,
              inboxRevision: cacheMeta.revision,
              lastInboxSyncAt: Date.now(),
              error: null
            });
        } catch (fallbackError) {
          const renderMessage = errorMessage(fallbackError);
          set({
            loading: false,
            inboxRefreshing: false,
            error: renderMessage || "Không thể tải dữ liệu thật từ Supabase/backend."
          });
        }
      }
    };

    const promise = run().finally(() => {
      if (inFlightInboxLoad?.promise === promise) {
        inFlightInboxLoad = null;
      }
    });
    inFlightInboxLoad = { key: requestKey, promise };
    return promise;
  },
  scoreQuickCvText: async (cvEntries, jdText) => {
    set({ quickCvLoading: true, error: null });
    try {
      const response = await scoreRenderQuickCvText(cvEntries, jdText);
      set({ quickCvLoading: false, quickCvResults: response.items });
      return response.items;
    } catch (error) {
      set({
        quickCvLoading: false,
        error: error instanceof Error ? error.message : "Không thể chấm điểm CV nhanh."
      });
      return [];
    }
  },
  scoreQuickCvForm: async (formData) => {
    set({ quickCvLoading: true, error: null });
    try {
      const response = await scoreRenderQuickCvForm(formData);
      set({ quickCvLoading: false, quickCvResults: response.items });
      return response.items;
    } catch (error) {
      set({
        quickCvLoading: false,
        error: error instanceof Error ? error.message : "Không thể tải CV lên để chấm điểm."
      });
      return [];
    }
  },
  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await loginWithEmail(email, password);
      const loginHistory = await recordLoginSession(user, "Email");
      set({ authUser: user, loginHistory, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Đăng nhập thất bại."
      });
    }
  },
  loginGoogle: async () => {
    set({ loading: true, error: null });
    try {
      const user = await loginWithGoogle();
      const loginHistory = await recordLoginSession(user, "Google");
      set({ authUser: user, loginHistory, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Đăng nhập Google thất bại."
      });
    }
  },
  loginGoogleToken: async (idToken) => {
    set({ loading: true, error: null });
    try {
      const user = await loginWithGoogleIdToken(idToken);
      const loginHistory = await recordLoginSession(user, "Google");
      set({ authUser: user, loginHistory, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Đăng nhập Google thất bại."
      });
    }
  },
  register: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const user = await registerWithEmail(email, password);
      const loginHistory = await recordLoginSession(user, "Email");
      set({ authUser: user, loginHistory, loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Tạo tài khoản thất bại."
      });
    }
  },
  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await resetPasswordEmail(email);
      set({ loading: false });
    } catch (error) {
      set({
        loading: false,
        error: error instanceof Error ? error.message : "Không thể gửi email đặt lại mật khẩu."
      });
      throw error;
    }
  },
  logout: async () => {
    const userKey = get().authUser?.email || get().authUser?.uid || null;
    await logout();
    await removeLocalCache(localCacheKeys.inbox(userKey));
    await removeLocalCache(localCacheKeys.accountData(userKey));
    set({
      authUser: null,
      candidates: [],
      history: [],
      loginHistory: [],
      query: "",
      rankFilter: "all",
      inboxRefreshing: false,
      inboxFromCache: false,
      inboxRevision: null,
      lastInboxSyncAt: null,
      quickCvResults: [],
      lastDecision: null
    });
  },
  submitDecision: async (candidate, action, notes) => {
    set({ submitting: true, error: null, lastDecision: null });
    try {
      await saveFirestoreDecisionFeedback(candidate, action, notes);
      set((state) => ({
        submitting: false,
        lastDecision: `${candidate.candidateName} · ${action}`,
        candidates: state.candidates.map((item) =>
          item.id === candidate.id ? { ...item, decision: action } : item
        )
      }));
    } catch (error) {
      set({
        submitting: false,
        error: error instanceof Error ? error.message : "Không thể lưu quyết định."
      });
    }
  },
  getCandidate: (id) => get().candidates.find((candidate) => candidate.id === id)
}));
