import type { CandidateInbox, CandidateView, DetailedScore, HistoryEntry, RawCandidate } from "../types";

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function firstString(record: Record<string, unknown>, keys: string[], fallback = ""): string {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) return value.trim();
    if (typeof value === "number") return String(value);
  }
  return fallback;
}

function candidateAvatarUrl(candidate: RawCandidate): string {
  return firstString(candidate, [
    "avatarUrl",
    "avatar",
    "photoUrl",
    "photoURL",
    "imageUrl",
    "imageURL",
    "profileImageUrl",
    "profilePhotoUrl",
    "picture"
  ]);
}

function firstNumber(record: Record<string, unknown>, keys: string[], fallback = 0): number {
  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^\d.]/g, ""));
      if (Number.isFinite(parsed)) return parsed;
    }
  }
  return fallback;
}

function firstArray(record: Record<string, unknown>, keys: string[]): string[] {
  for (const key of keys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value.map((item) => String(item || "").trim()).filter(Boolean);
    }
  }
  return [];
}

function detailArray(record: Record<string, unknown>): DetailedScore[] {
  const raw = record["Chi tiết"] || record["Chi tiet"] || record.details;
  return Array.isArray(raw) ? (raw as DetailedScore[]) : [];
}

function normalizeRank(value: string): string {
  const rank = value.trim().toUpperCase();
  return rank || "C";
}

function fallbackId(candidate: RawCandidate, index: number, historyId: string): string {
  const base = `${historyId}-${candidate.fileName || "file"}-${candidate.candidateName || "candidate"}-${index}`;
  return base.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
}

function scopedCandidateId(candidate: RawCandidate, entry: HistoryEntry, index: number): string {
  const rawId = String(candidate.id || fallbackId(candidate, index, entry.id)).trim();
  const base = `${entry.id || "history"}-${index}-${rawId}`;
  return base.replace(/[^a-zA-Z0-9_-]+/g, "-").replace(/-+/g, "-");
}

function extractCandidates(entry: HistoryEntry): RawCandidate[] {
  const payload = asRecord(entry.fullPayload);
  const fullPayloadCandidates = payload.candidates;
  if (Array.isArray(fullPayloadCandidates)) return fullPayloadCandidates as RawCandidate[];
  if (Array.isArray(entry.candidates)) return entry.candidates;

  if (Array.isArray(entry.topCandidates)) {
    return entry.topCandidates.map((item) => ({
      id: item.id,
      candidateName: item.name,
      avatarUrl: item.avatarUrl,
      jobTitle: entry.jobPosition,
      status: "SUCCESS",
      analysis: {
        "Tổng điểm": item.score || 0,
        "Hạng": item.grade || "C",
        "Điểm mạnh CV": ["Có trong danh sách ứng viên nổi bật từ lịch sử web."],
        "Điểm yếu CV": []
      }
    }));
  }

  return [];
}

function isUserFacingWarning(warning: string) {
  const normalized = warning
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d");

  return !(
    normalized.includes("ai generation") ||
    normalized.includes("fallback keyword") ||
    normalized.includes("vector scoring") ||
    normalized.includes("expecting")
  );
}

function mapCandidate(candidate: RawCandidate, entry: HistoryEntry, index: number): CandidateView | null {
  if (candidate.status && candidate.status !== "SUCCESS") return null;

  const analysis = asRecord(candidate.analysis);
  const payload = asRecord(entry.fullPayload);
  const hardFilters = asRecord(payload.hardFilters);
  const details = detailArray(analysis);
  const score = firstNumber(analysis, ["Tổng điểm", "Tong diem", "total_score", "score"], 0);
  const candidateId = scopedCandidateId(candidate, entry, index);
  const candidateName = String(candidate.candidateName || candidate.name || "Ứng viên chưa xác định");

  const warnings = [
    ...(Array.isArray(candidate.softFilterWarnings) ? candidate.softFilterWarnings : []),
    ...(candidate.hardFilterFailureReason ? [candidate.hardFilterFailureReason] : [])
  ]
    .map(String)
    .filter(isUserFacingWarning);

  return {
    id: candidateId,
    sourceHistoryId: entry.id,
    syncHistoryId: String(entry.syncHistoryId || ""),
    sessionId: String(entry.sessionId || payload.sessionId || ""),
    candidateName,
    avatarUrl: candidateAvatarUrl(candidate),
    fileName: String(candidate.fileName || "Không rõ file"),
    jobTitle: String(candidate.jobTitle || entry.jobPosition || payload.jobPosition || "Vị trí chưa rõ"),
    industry: String(candidate.industry || "Chưa rõ ngành"),
    experienceLevel: String(candidate.experienceLevel || "Chưa rõ level"),
    detectedLocation: String(candidate.detectedLocation || entry.locationRequirement || ""),
    score,
    rank: normalizeRank(firstString(analysis, ["Hạng", "Hang", "rank"], "C")),
    strengths: firstArray(analysis, ["Điểm mạnh CV", "Diem manh CV", "strengths"]).slice(0, 5),
    weaknesses: firstArray(analysis, ["Điểm yếu CV", "Diem yeu CV", "weaknesses"]).slice(0, 5),
    interviewQuestions: firstArray(analysis, ["Câu hỏi phỏng vấn", "Cau hoi phong van", "interview_questions"]).slice(0, 3),
    details,
    warnings,
    hardFilterFailureReason: candidate.hardFilterFailureReason,
    hardFilters,
    jdText: String(payload.jdText || ""),
    jobPosition: String(payload.jobPosition || entry.jobPosition || candidate.jobTitle || ""),
    raw: candidate
  };
}

export function mapHistoryToInbox(history: HistoryEntry[]): CandidateInbox {
  const candidates = history
    .flatMap((entry) =>
      extractCandidates(entry)
        .map((candidate, index) => mapCandidate(candidate, entry, index))
        .filter((candidate): candidate is CandidateView => Boolean(candidate))
    )
    .sort((a, b) => b.score - a.score);

  return { candidates, history };
}
