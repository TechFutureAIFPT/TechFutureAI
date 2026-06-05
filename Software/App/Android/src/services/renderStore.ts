import { mapHistoryToInbox } from "./candidateMapper";
import { getAuthToken } from "./auth";
import { apiDelete, apiGet, apiPatch, apiPost, apiPostForm, apiPut, pickArray, pickObject } from "./renderClient";
import type {
  AuthUser,
  CandidateInbox,
  CandidateView,
  CandidateScoreRow,
  FilterHistorySession,
  HistoryEntry,
  JDTemplateInput,
  JDStandardizeResponse,
  JDSupplementalFields,
  JDTargetPlatform,
  QuickCvScoreItem,
  QuickCvScoreResponse,
  QuickCvTextEntry,
  RawCandidate,
  UserJDTemplate
} from "../types";

export interface RenderUserProfile {
  uid: string;
  email: string;
  displayName?: string;
  avatar?: string;
  createdAt?: unknown;
  updatedAt?: unknown;
}

export interface RenderChatbotMessage {
  id: string;
  author: "user" | "bot";
  content: string;
  timestamp: number;
  suggestedCandidateIds?: string[];
}

export interface RenderChatbotSession {
  id: string;
  jobPosition: string;
  sessionTitle: string;
  totalCandidates: number;
  messageCount: number;
  messages: RenderChatbotMessage[];
  updatedAt?: unknown;
  lastMessageAt?: number;
}

interface RenderFetchOptions {
  includeManual?: boolean;
  timeoutMs?: number;
}

export interface RenderMobileInboxResponse extends CandidateInbox {
  stats?: {
    candidateCount?: number;
    historyCount?: number;
    latestTimestamp?: number | null;
  };
  revision?: string;
  generatedAt?: number;
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function toMillis(value: unknown): number {
  if (typeof value === "number") return value;
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const record = asRecord(value);
  if (typeof record.seconds === "number") return record.seconds * 1000;
  if (typeof record.toMillis === "function") {
    try {
      return Number((record.toMillis as () => number)());
    } catch {
      return 0;
    }
  }
  return 0;
}

function scoreNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value.replace(/[^\d.]/g, ""));
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
}

function normalizeTopCandidate(raw: unknown) {
  const candidate = asRecord(raw);
  return {
    id: String(candidate.id || ""),
    name: String(candidate.name || candidate.candidateName || ""),
    avatarUrl: String(
      candidate.avatarUrl ||
        candidate.avatar ||
        candidate.photoUrl ||
        candidate.photoURL ||
        candidate.imageUrl ||
        candidate.imageURL ||
        candidate.profileImageUrl ||
        candidate.profilePhotoUrl ||
        candidate.picture ||
        ""
    ),
    score: scoreNumber(candidate.score || candidate.totalScore),
    jdFit: scoreNumber(candidate.jdFit),
    grade: String(candidate.grade || "C")
  };
}

function normalizeHistoryEntry(raw: unknown): HistoryEntry {
  const entry = asRecord(raw);
  const analysisData = asRecord(entry.analysisData);
  const job = asRecord(analysisData.job);
  const payload = asRecord(entry.fullPayload);
  const analysisCandidates = Array.isArray(analysisData.candidates)
    ? (analysisData.candidates as RawCandidate[])
    : [];
  const candidates = Array.isArray(payload.candidates)
    ? (payload.candidates as RawCandidate[])
    : analysisCandidates;

  return {
    id: String(entry.id || ""),
    timestamp:
      toMillis(entry.timestamp) ||
      scoreNumber(entry.timestamp) ||
      toMillis(entry.createdAt) ||
      toMillis(entry.updatedAt) ||
      Date.now(),
    jobPosition: String(entry.jobPosition || payload.jobPosition || job.position || ""),
    locationRequirement: String(entry.locationRequirement || job.locationRequirement || ""),
    totalCandidates: Number(entry.totalCandidates || candidates.length || 0),
    userEmail: String(entry.userEmail || entry.email || ""),
    fullPayload: {
      ...payload,
      jdText: String(payload.jdText || analysisData.jdText || entry.jdTextSnippet || ""),
      jobPosition: String(payload.jobPosition || entry.jobPosition || job.position || ""),
      hardFilters: asRecord(payload.hardFilters || analysisData.hardFilters),
      candidates
    },
    candidates: Array.isArray(entry.candidates) ? (entry.candidates as RawCandidate[]) : undefined,
    analysisData,
    topCandidates: Array.isArray(entry.topCandidates) ? entry.topCandidates.map(normalizeTopCandidate) : undefined
  };
}

function normalizeTemplate(raw: unknown, origin: UserJDTemplate["origin"] = "saved"): UserJDTemplate {
  const template = asRecord(raw);
  return {
    id: String(template.id || ""),
    uid: String(template.uid || ""),
    name: String(template.name || ""),
    category: String(template.category || ""),
    jobPosition: String(template.jobPosition || ""),
    jdText: String(template.jdText || ""),
    hardFilters: asRecord(template.hardFilters),
    createdAt: template.createdAt || Date.now(),
    updatedAt: template.updatedAt || Date.now(),
    origin
  };
}

function normalizeProfile(raw: unknown): RenderUserProfile | null {
  const profile = pickObject<Record<string, unknown>>(raw, ["profile", "user", "data"]);
  if (!profile || !profile.uid) return null;
  return {
    uid: String(profile.uid || ""),
    email: String(profile.email || ""),
    displayName: profile.displayName ? String(profile.displayName) : undefined,
    avatar: profile.avatar ? String(profile.avatar) : undefined,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt
  };
}

function normalizeChatbotMessage(raw: unknown): RenderChatbotMessage {
  const message = asRecord(raw);
  const author = message.author === "user" ? "user" : "bot";
  const suggestedCandidateIds = Array.isArray(message.suggestedCandidateIds)
    ? message.suggestedCandidateIds.map(String)
    : [];

  return {
    id: String(message.id || `message-${Date.now()}`),
    author,
    content: String(message.content || ""),
    timestamp: scoreNumber(message.timestamp) || Date.now(),
    suggestedCandidateIds
  };
}

function normalizeChatbotSession(raw: unknown): RenderChatbotSession {
  const session = asRecord(raw);
  const messages = Array.isArray(session.messages) ? session.messages.map(normalizeChatbotMessage) : [];

  return {
    id: String(session.id || ""),
    jobPosition: String(session.jobPosition || ""),
    sessionTitle: String(session.sessionTitle || session.jobPosition || "Tư vấn ứng viên"),
    totalCandidates: Number(session.totalCandidates || 0),
    messageCount: Number(session.messageCount || messages.length || 0),
    messages,
    updatedAt: session.updatedAt,
    lastMessageAt: scoreNumber(session.lastMessageAt)
  };
}

function detailArray(record: Record<string, unknown>): Array<Record<string, unknown>> {
  const details = record["Chi tiết"] || record["Chi tiáº¿t"] || record["Chi tiet"] || record.details;
  return Array.isArray(details) ? details.map(asRecord) : [];
}

function mapComponentScores(candidate: RawCandidate): CandidateScoreRow["componentScores"] {
  const analysis = asRecord(candidate.analysis);
  const details = detailArray(analysis);
  return details
    .map((detail) => ({
      label: String(detail["Tiêu chí"] || detail["TiÃªu chÃ­"] || detail.criterion || detail.name || "").trim(),
      score: String(detail["Điểm"] || detail["Äiá»ƒm"] || detail.score || "").trim()
    }))
    .filter((item) => item.label || item.score)
    .slice(0, 4);
}

function getCandidateAvatarUrl(candidate: RawCandidate): string {
  return String(
    candidate.avatarUrl ||
      candidate.avatar ||
      candidate.photoUrl ||
      candidate.photoURL ||
      candidate.imageUrl ||
      candidate.imageURL ||
      candidate.profileImageUrl ||
      candidate.profilePhotoUrl ||
      candidate.picture ||
      ""
  ).trim();
}

function extractCandidates(entry: HistoryEntry): RawCandidate[] {
  if (Array.isArray(entry.fullPayload?.candidates) && entry.fullPayload.candidates.length > 0) {
    return entry.fullPayload.candidates;
  }
  if (Array.isArray(entry.candidates)) return entry.candidates;
  if (Array.isArray(entry.topCandidates)) {
    return entry.topCandidates.map((item) => ({
      id: item.id,
      candidateName: item.name,
      avatarUrl: item.avatarUrl,
      grade: item.grade,
      jdFit: item.jdFit,
      status: "SUCCESS",
      analysis: {
        "Tổng điểm": item.score || 0,
        "Tá»•ng Ä‘iá»ƒm": item.score || 0,
        "Hạng": item.grade || "C",
        "Háº¡ng": item.grade || "C"
      }
    }));
  }
  return [];
}

function scopedSessionCandidateId(candidate: RawCandidate, entryId: string, index: number): string {
  const rawId = String(candidate.id || `${entryId}-${index}`).trim();
  return `${entryId || "history"}-${index}-${rawId}`.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
}

export function historyEntriesToFilterSessions(history: HistoryEntry[]): FilterHistorySession[] {
  return history
    .map((entry) => {
      const candidates = extractCandidates(entry)
        .filter((candidate) => !candidate.status || candidate.status === "SUCCESS")
        .map((candidate, index) => {
          const analysis = asRecord(candidate.analysis);
          const totalScore = scoreNumber(
            analysis["Tổng điểm"] || analysis["Tá»•ng Ä‘iá»ƒm"] || analysis.total_score || analysis.score || candidate.totalScore
          );
          const rank = String(analysis["Hạng"] || analysis["Háº¡ng"] || analysis.rank || candidate.grade || "C");

          return {
            id: scopedSessionCandidateId(candidate, entry.id, index),
            candidateName: String(candidate.candidateName || candidate.name || `Ứng viên ${index + 1}`),
            avatarUrl: getCandidateAvatarUrl(candidate),
            totalScore,
            rank,
            componentScores: mapComponentScores(candidate)
          };
        })
        .sort((left, right) => right.totalScore - left.totalScore)
        .slice(0, 6);

      return {
        id: entry.id,
        timestamp: entry.timestamp,
        jobPosition: entry.jobPosition || "Phiên lọc CV",
        totalCandidates: entry.totalCandidates || candidates.length,
        candidates
      };
    })
    .filter((entry) => entry.candidates.length > 0)
    .sort((left, right) => right.timestamp - left.timestamp);
}

export async function fetchRenderUserProfile(authToken: string): Promise<RenderUserProfile | null> {
  const response = await apiGet<unknown>("/api/account/profile", { authToken });
  return normalizeProfile(response);
}

export async function upsertRenderUserProfile(authToken: string, user: AuthUser): Promise<RenderUserProfile | null> {
  const response = await apiPut<unknown>(
    "/api/account/profile",
    {
      email: user.email,
      displayName: user.displayName || user.email.split("@")[0] || "",
      avatar: user.photoUrl || "",
      provider: "firebase-auth"
    },
    { authToken }
  );
  return normalizeProfile(response);
}

export async function fetchRenderHistoryEntries(
  authToken: string,
  limitCount = 50,
  userEmail?: string,
  options: RenderFetchOptions = {}
): Promise<HistoryEntry[]> {
  const query = new URLSearchParams({ limit_count: String(limitCount) });
  if (userEmail) query.set("user_email", userEmail);

  const manualQuery = new URLSearchParams();
  if (userEmail) manualQuery.set("user_email", userEmail);

  const [recentResult, manualResult] = await Promise.allSettled([
    apiGet<unknown>(`/api/account/history?${query.toString()}`, {
      authToken,
      timeoutMs: options.timeoutMs
    }),
    options.includeManual === false
      ? Promise.resolve(null)
      : apiGet<unknown>(`/api/account/history/manual${manualQuery.toString() ? `?${manualQuery.toString()}` : ""}`, {
          authToken,
          timeoutMs: options.timeoutMs
        })
  ]);

  if (recentResult.status === "rejected") {
    throw recentResult.reason;
  }

  const recentResponse = recentResult.value;
  const manualResponse = manualResult.status === "fulfilled" ? manualResult.value : null;

  const recent = pickArray<unknown>(recentResponse, ["items", "history", "entries", "data"]).map(normalizeHistoryEntry);
  const manual = pickArray<unknown>(manualResponse, ["items", "history", "entries", "data"]).map((entry) => {
    const normalized = normalizeHistoryEntry(entry);
    return { ...normalized, id: `manual-${normalized.id}` };
  });

  return [...manual, ...recent].sort((left, right) => right.timestamp - left.timestamp).slice(0, limitCount);
}

export async function fetchRenderCandidateInbox(
  authToken: string,
  limitCount = 30,
  userEmail?: string,
  options: RenderFetchOptions = {}
): Promise<CandidateInbox> {
  const entries = await fetchRenderHistoryEntries(authToken, limitCount, userEmail, options);
  return mapHistoryToInbox(entries);
}

export async function fetchRenderMobileInbox(
  authToken: string,
  historyLimit = 12,
  candidateLimit = 60,
  userEmail?: string,
  options: RenderFetchOptions = {}
): Promise<RenderMobileInboxResponse> {
  const query = new URLSearchParams({
    history_limit: String(historyLimit),
    candidate_limit: String(candidateLimit)
  });
  if (userEmail) query.set("user_email", userEmail);

  const response = await apiGet<unknown>(`/api/account/mobile-inbox?${query.toString()}`, {
    authToken,
    timeoutMs: options.timeoutMs
  });
  const record = asRecord(response);

  return {
    candidates: pickArray<CandidateView>(response, ["candidates", "items"]),
    history: pickArray<unknown>(response, ["history", "entries", "data"]).map(normalizeHistoryEntry),
    stats: asRecord(record.stats) as RenderMobileInboxResponse["stats"],
    revision: typeof record.revision === "string" ? record.revision : undefined,
    generatedAt: scoreNumber(record.generatedAt)
  };
}

export async function fetchRenderJDTemplates(
  authToken: string,
  seedIfEmpty = true,
  options: RenderFetchOptions = {}
): Promise<UserJDTemplate[]> {
  const load = async () => {
    const response = await apiGet<unknown>("/api/account/jd-templates", { authToken, timeoutMs: options.timeoutMs });
    return pickArray<unknown>(response, ["items", "templates", "entries", "data"])
      .map((item) => normalizeTemplate(item, "saved"))
      .sort((left, right) => toMillis(right.updatedAt) - toMillis(left.updatedAt));
  };

  let templates = await load();
  if (seedIfEmpty && templates.length === 0) {
    await apiPost<unknown>("/api/account/jd-templates/seed-defaults", undefined, { authToken, timeoutMs: options.timeoutMs });
    templates = await load();
  }
  return templates;
}

export async function createRenderJDTemplate(authToken: string, input: JDTemplateInput): Promise<UserJDTemplate> {
  const response = await apiPost<unknown>("/api/account/jd-templates", input, { authToken });
  return normalizeTemplate(response, "saved");
}

export async function updateRenderJDTemplate(
  authToken: string,
  templateId: string,
  input: Partial<JDTemplateInput>
): Promise<boolean> {
  await apiPatch<unknown>(`/api/account/jd-templates/${encodeURIComponent(templateId)}`, input, { authToken });
  return true;
}

export async function deleteRenderJDTemplate(authToken: string, templateId: string): Promise<boolean> {
  await apiDelete<unknown>(`/api/account/jd-templates/${encodeURIComponent(templateId)}`, { authToken });
  return true;
}

export async function fetchRenderChatbotSessions(
  authToken: string,
  limitCount = 20
): Promise<RenderChatbotSession[]> {
  const response = await apiGet<unknown>(`/api/account/chatbot/sessions?limit_count=${limitCount}`, {
    authToken,
    timeoutMs: 6000
  });

  return pickArray<unknown>(response, ["items", "sessions", "data"])
    .map(normalizeChatbotSession)
    .filter((session) => session.id);
}

export async function createRenderChatbotSession(
  authToken: string,
  jobPosition: string,
  totalCandidates: number
): Promise<string> {
  const response = await apiPost<unknown>(
    "/api/account/chatbot/sessions",
    { jobPosition, totalCandidates },
    { authToken, timeoutMs: 6000 }
  );
  const record = asRecord(response);
  return String(record.id || "");
}

export async function addRenderChatbotMessages(
  authToken: string,
  sessionId: string,
  messages: RenderChatbotMessage[]
): Promise<boolean> {
  if (!sessionId || messages.length === 0) return false;

  await apiPost<unknown>(
    `/api/account/chatbot/sessions/${encodeURIComponent(sessionId)}/messages`,
    { messages },
    { authToken, timeoutMs: 6000 }
  );
  return true;
}

function normalizeQuickCvScoreItem(raw: unknown): QuickCvScoreItem {
  const item = asRecord(raw);
  return {
    file_name: String(item.file_name || item.fileName || ""),
    candidate_name: String(item.candidate_name || item.candidateName || ""),
    target_role: String(item.target_role || item.targetRole || ""),
    score: scoreNumber(item.score),
    rank: String(item.rank || "C"),
    summary: String(item.summary || ""),
    strengths: Array.isArray(item.strengths) ? item.strengths.map(String) : [],
    weaknesses: Array.isArray(item.weaknesses) ? item.weaknesses.map(String) : [],
    improvements: Array.isArray(item.improvements) ? item.improvements.map(String) : [],
    matched_keywords: Array.isArray(item.matched_keywords) ? item.matched_keywords.map(String) : [],
    missing_keywords: Array.isArray(item.missing_keywords) ? item.missing_keywords.map(String) : [],
    warnings: Array.isArray(item.warnings) ? item.warnings.map(String) : [],
    extracted_text: typeof item.extracted_text === "string" ? item.extracted_text : null
  };
}

export async function scoreRenderQuickCvText(
  cvEntries: QuickCvTextEntry[],
  jdText?: string,
  includeExtractedText = false
): Promise<QuickCvScoreResponse> {
  const authToken = await getAuthToken();
  const response = await apiPost<unknown>(
    "/api/cv/quick-score-text",
    {
      cv_entries: cvEntries,
      jd_text: jdText || undefined,
      include_extracted_text: includeExtractedText
    },
    { authToken, timeoutMs: 180000 }
  );
  const record = asRecord(response);
  const items = pickArray<unknown>(response, ["items", "data"]).map(normalizeQuickCvScoreItem);

  return {
    items,
    model: String(record.model || ""),
    usage_note: String(record.usage_note || "")
  };
}

export async function scoreRenderQuickCvForm(formData: FormData): Promise<QuickCvScoreResponse> {
  const authToken = await getAuthToken();
  const response = await apiPostForm<unknown>("/api/cv/quick-score", formData, { authToken, timeoutMs: 180000 });
  const record = asRecord(response);
  const items = pickArray<unknown>(response, ["items", "data"]).map(normalizeQuickCvScoreItem);

  return {
    items,
    model: String(record.model || ""),
    usage_note: String(record.usage_note || "")
  };
}

function normalizeJDStandardizeResponse(raw: unknown): JDStandardizeResponse {
  const record = asRecord(raw);
  const normalizedJD = asRecord(record.normalizedJD);
  const platform = asRecord(record.platform);
  const normalizeList = (value: unknown) => (Array.isArray(value) ? value.map(String).filter(Boolean) : []);
  const normalizeObjects = <T>(value: unknown, mapper: (item: Record<string, unknown>) => T) =>
    Array.isArray(value) ? value.map((item) => mapper(asRecord(item))) : [];

  return {
    score: scoreNumber(record.score),
    missingSections: normalizeObjects(record.missingSections, (item) => ({
      key: String(item.key || ""),
      label: String(item.label || ""),
      reason: String(item.reason || ""),
      priority: item.priority === "high" || item.priority === "low" ? item.priority : "medium"
    })),
    weakPoints: normalizeObjects(record.weakPoints, (item) => ({
      label: String(item.label || ""),
      detail: String(item.detail || "")
    })),
    suggestions: normalizeObjects(record.suggestions, (item) => ({
      label: String(item.label || ""),
      detail: String(item.detail || "")
    })),
    normalizedJD: {
      title: String(normalizedJD.title || ""),
      overview: String(normalizedJD.overview || ""),
      responsibilities: normalizeList(normalizedJD.responsibilities),
      requirements: normalizeList(normalizedJD.requirements),
      benefits: normalizeList(normalizedJD.benefits),
      workingTime: String(normalizedJD.workingTime || ""),
      location: String(normalizedJD.location || ""),
      salary: String(normalizedJD.salary || ""),
      applicationInfo: String(normalizedJD.applicationInfo || ""),
      keywords: normalizeList(normalizedJD.keywords)
    },
    platform: {
      name: String(platform.name || "Nền tảng tuyển dụng"),
      url: String(platform.url || record.platformUrl || "")
    },
    platformUrl: String(record.platformUrl || platform.url || ""),
    generatedAt: String(record.generatedAt || ""),
    source: record.source === "ai" ? "ai" : "fallback"
  };
}

export async function standardizeRenderJDText(
  jdText: string,
  targetPlatform: JDTargetPlatform,
  supplementalFields?: Partial<JDSupplementalFields>
): Promise<JDStandardizeResponse> {
  const authToken = await getAuthToken();
  const response = await apiPost<unknown>(
    "/api/mobile/jd/standardize",
    {
      jdText,
      targetPlatform,
      supplementalFields
    },
    { authToken, timeoutMs: 90000 }
  );
  return normalizeJDStandardizeResponse(response);
}

export async function standardizeRenderJDFile(formData: FormData): Promise<JDStandardizeResponse> {
  const authToken = await getAuthToken();
  const response = await apiPostForm<unknown>("/api/mobile/jd/standardize-file", formData, { authToken, timeoutMs: 120000 });
  return normalizeJDStandardizeResponse(response);
}

export function extractRecentUsedJDTemplates(entries: HistoryEntry[]): UserJDTemplate[] {
  const deduped = new Map<string, UserJDTemplate>();

  for (const entry of entries) {
    const jdText = entry.fullPayload?.jdText?.trim();
    if (!jdText) continue;

    const jobPosition = (entry.fullPayload?.jobPosition || entry.jobPosition || "JD đã dùng").trim();
    const hardFilters = asRecord(entry.fullPayload?.hardFilters);
    const category =
      typeof hardFilters.industry === "string" && hardFilters.industry.trim()
        ? hardFilters.industry.trim()
        : "Đã dùng gần đây";
    const key = `${jobPosition.toLowerCase()}::${jdText.toLowerCase()}`;
    if (deduped.has(key)) continue;

    deduped.set(key, {
      id: `history-template-${entry.id}`,
      uid: "",
      name: jobPosition,
      category,
      jobPosition,
      jdText,
      hardFilters,
      createdAt: entry.timestamp,
      updatedAt: entry.timestamp,
      origin: "history"
    });
  }

  return [...deduped.values()].sort((left, right) => toMillis(right.updatedAt) - toMillis(left.updatedAt));
}

export function mergeSavedAndHistoryTemplates(
  savedTemplates: UserJDTemplate[],
  historyTemplates: UserJDTemplate[]
): UserJDTemplate[] {
  const savedKeys = new Set(
    savedTemplates.map((template) => `${template.jobPosition.trim().toLowerCase()}::${template.jdText.trim().toLowerCase()}`)
  );
  return [
    ...savedTemplates,
    ...historyTemplates.filter(
      (template) => !savedKeys.has(`${template.jobPosition.trim().toLowerCase()}::${template.jdText.trim().toLowerCase()}`)
    )
  ];
}
