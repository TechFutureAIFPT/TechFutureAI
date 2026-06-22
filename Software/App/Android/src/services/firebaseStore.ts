import {
  addDoc,
  collection,
  doc,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  updateDoc,
  where
} from "firebase/firestore";

import { auth, firebaseApp } from "./auth";
import { mapHistoryToInbox } from "./candidateMapper";
import type {
  CandidateInbox,
  CandidateScoreRow,
  CandidateView,
  FilterHistorySession,
  HistoryEntry,
  JDTemplateInput,
  RawCandidate,
  UserJDTemplate
} from "../types";
import type { DecisionAction } from "../theme/tokens";

// Copy collection id ở đây nếu cần đổi theo database Firebase của bạn.
export const FIRESTORE_COLLECTIONS = {
  users: "users",
  cvHistory: "cvHistory",
  syncedAnalysisHistory: "syncedAnalysisHistory",
  userJDTemplates: "userJDTemplates",
  manualHistory: "CLdl7JGuaOGIuijiDZeG",
  analysisFeedback: "analysisFeedback"
} as const;

const db = firebaseApp ? getFirestore(firebaseApp) : null;

function requireUser() {
  const user = auth?.currentUser;
  if (!db || !user) {
    throw new Error("Bạn cần đăng nhập Firebase để đọc dữ liệu Firestore.");
  }
  return user;
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

function candidateAnalysis(candidate: RawCandidate): Record<string, unknown> {
  return asRecord(candidate.analysis);
}

function getDetails(analysis: Record<string, unknown>): Array<Record<string, unknown>> {
  const details = analysis["Chi tiết"] || analysis["Chi tiáº¿t"] || analysis["Chi tiet"] || analysis.details;
  return Array.isArray(details) ? details.map(asRecord) : [];
}

function getCandidateName(candidate: RawCandidate, index: number): string {
  return String(candidate.candidateName || candidate.name || `Ứng viên ${index + 1}`);
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

function getCandidateScore(candidate: RawCandidate): number {
  const analysis = candidateAnalysis(candidate);
  return scoreNumber(
    analysis["Tổng điểm"] ||
      analysis["Tá»•ng Ä‘iá»ƒm"] ||
      analysis["Tong diem"] ||
      analysis.total_score ||
      analysis.score ||
      candidate.totalScore
  );
}

function getCandidateRank(candidate: RawCandidate): string {
  const analysis = candidateAnalysis(candidate);
  return String(analysis["Hạng"] || analysis["Háº¡ng"] || analysis.Hang || analysis.rank || candidate.grade || "C");
}

function mapComponentScores(candidate: RawCandidate): CandidateScoreRow["componentScores"] {
  const directJdFit = scoreNumber(candidate.jdFit);
  const details = getDetails(candidateAnalysis(candidate));
  const mapped = details
    .map((detail) => ({
      label: String(detail["Tiêu chí"] || detail["TiÃªu chÃ­"] || detail.criterion || detail.name || "").trim(),
      score: String(detail["Điểm"] || detail["Äiá»ƒm"] || detail.score || "").trim()
    }))
    .filter((item) => item.label || item.score)
    .slice(0, 4);

  if (mapped.length > 0) return mapped;
  if (directJdFit > 0) return [{ label: "Độ khớp JD", score: String(directJdFit) }];
  return [];
}

function extractCandidates(entry: HistoryEntry): RawCandidate[] {
  const payload = asRecord(entry.fullPayload);
  const analysisData = asRecord(entry.analysisData);
  if (Array.isArray(payload.candidates)) return payload.candidates as RawCandidate[];
  if (Array.isArray(analysisData.candidates)) return analysisData.candidates as RawCandidate[];
  if (Array.isArray(entry.candidates)) return entry.candidates;
  if (Array.isArray(entry.topCandidates)) {
    return entry.topCandidates.map((item) => ({
      id: item.id,
      candidateName: item.name,
      avatarUrl: item.avatarUrl,
      grade: item.grade,
      jdFit: item.jdFit,
      analysis: {
        "Tổng điểm": item.score || 0,
        "Hạng": item.grade || "C"
      }
    }));
  }
  return [];
}

function scopedSessionCandidateId(candidate: RawCandidate, entryId: string, index: number): string {
  const rawId = String(candidate.id || `${entryId}-${index}`).trim();
  return `${entryId || "history"}-${index}-${rawId}`.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
}

function normalizeHistoryEntry(raw: unknown, id: string): HistoryEntry {
  const data = asRecord(raw);
  const analysisData = asRecord(data.analysisData);
  const job = asRecord(analysisData.job);
  const fullPayload = asRecord(data.fullPayload);
  const analysisCandidates = Array.isArray(analysisData.candidates)
    ? (analysisData.candidates as RawCandidate[])
    : [];
  const payloadCandidates = Array.isArray(fullPayload.candidates)
    ? (fullPayload.candidates as RawCandidate[])
    : analysisCandidates;
  const timestamp =
    toMillis(data.timestamp) ||
    scoreNumber(data.timestamp) ||
    toMillis(data.createdAt) ||
    toMillis(data.updatedAt) ||
    Date.now();

  return {
    id,
    timestamp,
    jobPosition: String(data.jobPosition || job.position || ""),
    locationRequirement: String(data.locationRequirement || job.locationRequirement || ""),
    totalCandidates: Number(data.totalCandidates || payloadCandidates.length),
    userEmail: String(data.userEmail || data.email || ""),
    fullPayload: {
      ...fullPayload,
      jdText: String(fullPayload.jdText || analysisData.jdText || ""),
      jobPosition: String(fullPayload.jobPosition || data.jobPosition || job.position || ""),
      hardFilters: asRecord(fullPayload.hardFilters || analysisData.hardFilters),
      candidates: payloadCandidates
    },
    candidates: Array.isArray(data.candidates) ? (data.candidates as RawCandidate[]) : undefined,
    topCandidates: Array.isArray(data.topCandidates) ? (data.topCandidates as HistoryEntry["topCandidates"]) : undefined,
    analysisData
  };
}

function firstDefined(record: Record<string, unknown>, keys: string[]): unknown {
  for (const key of keys) {
    if (record[key] !== undefined && record[key] !== null) return record[key];
  }
  return undefined;
}

function normalizeManualHistoryEntry(raw: unknown, id: string): HistoryEntry {
  const data = asRecord(raw);
  const cvList = firstDefined(data, [
    "Danh sách CV",
    "Danh sÃ¡ch CV",
    "Danh sÃƒÂ¡ch CV",
    "cvList",
    "candidates"
  ]);
  const candidates = Array.isArray(cvList)
    ? cvList.map((item, index) => {
        const candidate = asRecord(item);
        const name = String(candidate.name || candidate.candidateName || `Ứng viên ${index + 1}`);
        const totalScore = scoreNumber(candidate.totalScore || candidate.score);
        const grade = String(candidate.grade || "C");

        return {
          id: scopedSessionCandidateId(candidate as RawCandidate, id, index),
          candidateName: name,
          avatarUrl: getCandidateAvatarUrl(candidate as RawCandidate),
          fileName: String(candidate.fileName || ""),
          grade,
          jdFit: scoreNumber(candidate.jdFit),
          totalScore,
          status: "SUCCESS",
          analysis: {
            "Tổng điểm": totalScore,
            "Tá»•ng Ä‘iá»ƒm": totalScore,
            "Hạng": grade,
            "Háº¡ng": grade
          }
        } satisfies RawCandidate;
      })
    : [];
  const jdText = String(
    firstDefined(data, ["JD mẫu", "JD máº«u", "JD mÃ¡ÂºÂ«u", "jdText", "jdTextSnippet"]) || ""
  );
  const jobPosition = String(
    firstDefined(data, [
      "Vị trí Lọc JD",
      "Vá»‹ trÃ­ Lá»c JD",
      "VÃ¡Â»â€¹ trÃƒÂ­ LÃ¡Â»ï¿½c JD",
      "jobPosition"
    ]) || ""
  );
  const locationRequirement = String(
    firstDefined(data, [
      "Yêu cầu địa điểm",
      "YÃªu cáº§u Ä‘á»‹a Ä‘iá»ƒm",
      "YÃƒÂªu cÃ¡ÂºÂ§u Ã„â€˜Ã¡Â»â€¹a Ã„â€˜iÃ¡Â»Æ’m",
      "locationRequirement"
    ]) || ""
  );
  const timestamp =
    toMillis(data.updatedAt) ||
    scoreNumber(data.updatedAt) ||
    toMillis(data.createdAt) ||
    toMillis(firstDefined(data, ["Thời gian lưu", "Thá»i gian lÆ°u", "savedAt"])) ||
    Date.now();

  return {
    id,
    timestamp,
    jobPosition,
    locationRequirement,
    totalCandidates: candidates.length,
    userEmail: String(data.email || data.userEmail || ""),
    fullPayload: {
      jdText,
      jobPosition,
      hardFilters: asRecord(data.hardFilters),
      candidates
    },
    candidates
  };
}

async function fetchManualHistoryEntries(userUid: string): Promise<HistoryEntry[]> {
  try {
    const manualSnapshot = await getDocs(
      query(collection(db!, FIRESTORE_COLLECTIONS.manualHistory), where("uid", "==", userUid))
    );
    return manualSnapshot.docs.map((item) => normalizeManualHistoryEntry(item.data(), item.id));
  } catch (error) {
    console.warn("Không thể đọc collection lịch sử thủ công trên mobile.", error);
    return [];
  }
}

function normalizeFilterHistory(history: HistoryEntry[]): FilterHistorySession[] {
  return history
    .map((entry) => {
      const candidates = extractCandidates(entry)
        .filter((candidate) => !candidate.status || candidate.status === "SUCCESS")
        .map((candidate, index) => ({
          id: scopedSessionCandidateId(candidate, entry.id, index),
          candidateName: getCandidateName(candidate, index),
          avatarUrl: getCandidateAvatarUrl(candidate),
          totalScore: getCandidateScore(candidate),
          rank: getCandidateRank(candidate),
          componentScores: mapComponentScores(candidate)
        }))
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

function normalizeTemplate(raw: unknown, id: string): UserJDTemplate {
  const data = asRecord(raw);
  return {
    id,
    uid: String(data.uid || ""),
    name: String(data.name || ""),
    category: String(data.category || ""),
    jobPosition: String(data.jobPosition || ""),
    jdText: String(data.jdText || ""),
    hardFilters: asRecord(data.hardFilters),
    createdAt: data.createdAt || Date.now(),
    updatedAt: data.updatedAt || Date.now()
  };
}

export async function fetchFirestoreFilterHistory(limitCount = 12): Promise<FilterHistorySession[]> {
  const user = requireUser();
  const cvSnapshot = await getDocs(
    query(collection(db!, FIRESTORE_COLLECTIONS.cvHistory), where("uid", "==", user.uid))
  );
  const syncSnapshot = await getDocs(
    query(collection(db!, FIRESTORE_COLLECTIONS.syncedAnalysisHistory), where("uid", "==", user.uid))
  );
  const manualEntries = await fetchManualHistoryEntries(user.uid);

  const entries = [
    ...cvSnapshot.docs.map((item) => normalizeHistoryEntry(item.data(), item.id)),
    ...syncSnapshot.docs.map((item) => normalizeHistoryEntry(item.data(), item.id)),
    ...manualEntries
  ].sort((left, right) => right.timestamp - left.timestamp);

  return normalizeFilterHistory(entries).slice(0, limitCount);
}

export async function fetchFirestoreCandidateInbox(limitCount = 30): Promise<CandidateInbox> {
  const user = requireUser();
  const cvSnapshot = await getDocs(
    query(collection(db!, FIRESTORE_COLLECTIONS.cvHistory), where("uid", "==", user.uid))
  );
  const syncSnapshot = await getDocs(
    query(collection(db!, FIRESTORE_COLLECTIONS.syncedAnalysisHistory), where("uid", "==", user.uid))
  );
  const manualEntries = await fetchManualHistoryEntries(user.uid);

  const entries = [
    ...cvSnapshot.docs.map((item) => normalizeHistoryEntry(item.data(), item.id)),
    ...syncSnapshot.docs.map((item) => normalizeHistoryEntry(item.data(), item.id)),
    ...manualEntries
  ]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, limitCount);

  return mapHistoryToInbox(entries);
}

export async function fetchFirestoreJDTemplates(): Promise<UserJDTemplate[]> {
  const user = requireUser();
  const snapshot = await getDocs(
    query(collection(db!, FIRESTORE_COLLECTIONS.userJDTemplates), where("uid", "==", user.uid))
  );
  return snapshot.docs
    .map((item) => normalizeTemplate(item.data(), item.id))
    .sort((left, right) => toMillis(right.updatedAt) - toMillis(left.updatedAt));
}

export async function createFirestoreJDTemplate(input: JDTemplateInput): Promise<UserJDTemplate> {
  const user = requireUser();
  const payload = {
    uid: user.uid,
    name: input.name,
    category: input.category,
    jobPosition: input.jobPosition,
    jdText: input.jdText,
    hardFilters: input.hardFilters || {},
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db!, FIRESTORE_COLLECTIONS.userJDTemplates), payload);
  return normalizeTemplate({ ...payload, createdAt: Date.now(), updatedAt: Date.now() }, ref.id);
}

export async function updateFirestoreJDTemplate(
  templateId: string,
  input: Partial<JDTemplateInput>
): Promise<boolean> {
  requireUser();
  await updateDoc(doc(db!, FIRESTORE_COLLECTIONS.userJDTemplates, templateId), {
    ...input,
    updatedAt: serverTimestamp()
  });
  return true;
}

export async function saveFirestoreDecisionFeedback(
  candidate: CandidateView,
  action: DecisionAction,
  notes: string
): Promise<string> {
  const user = requireUser();
  const ref = await addDoc(collection(db!, FIRESTORE_COLLECTIONS.analysisFeedback), {
    uid: user.uid,
    userEmail: user.email || "",
    displayName: user.displayName || "",
    photoUrl: user.photoURL || "",
    sessionId: candidate.sessionId || null,
    historyId: candidate.sourceHistoryId || null,
    syncHistoryId: candidate.syncHistoryId || null,
    candidateId: candidate.id,
    candidateName: candidate.candidateName,
    fileName: candidate.fileName,
    jobPosition: candidate.jobPosition || candidate.jobTitle,
    action,
    aiScore: candidate.score,
    finalScore: candidate.score,
    isReusableGuidance: false,
    severity: "low",
    rank: candidate.rank,
    reason: `Quyết định nhanh từ ứng dụng: ${action}`,
    notes: notes.trim(),
    metadata: {
      source: "support-hr-mobile-v2",
      storage: "firestore-direct",
      decisionMode: "one-touch",
      voiceNote: notes.trim().length > 0
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  });
  return ref.id;
}
