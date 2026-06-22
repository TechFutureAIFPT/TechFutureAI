import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, ChevronLeft, Clock3, History, Search, SendHorizonal, UsersRound } from "lucide-react-native";
import { useNavigation, useRoute, type RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { AppButton, EmptyState } from "../components/Primitives";
import { getAuthToken } from "../services/auth";
import { localCacheKeys, readLocalCache, writeLocalCache } from "../services/localDataCache";
import {
  addRenderChatbotMessages,
  createRenderChatbotSession,
  fetchRenderChatbotSessions,
  type RenderChatbotMessage
} from "../services/renderStore";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { CandidateView, HistoryEntry } from "../types";

type ChatMessage = {
  id: string;
  role: "assistant" | "user";
  text: string;
  candidateIds?: string[];
  questions?: string[];
};

type AdvisorChatSession = {
  id: string;
  title: string;
  historyId: string | null;
  renderSessionId?: string;
  totalCandidates: number;
  updatedAt: number;
  messages: ChatMessage[];
};

type AdvisorChatCache = {
  sessions: AdvisorChatSession[];
};

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type AdvisorRoute = RouteProp<RootStackParamList, "Advisor">;
type HistoryDateFilter = "all" | "today" | "month";

const initialMessages: ChatMessage[] = [];

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .trim();
}

function formatDate(timestamp?: number) {
  if (!timestamp) return "Chưa rõ";
  return new Date(timestamp).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function historyDateKey(timestamp?: number) {
  if (!timestamp) return "";
  return new Date(timestamp).toISOString().slice(0, 10);
}

function uniqueItems(items: string[], maxCount: number) {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const item of items) {
    const cleaned = item.trim();
    const key = normalize(cleaned);
    if (!cleaned || seen.has(key)) continue;
    seen.add(key);
    result.push(cleaned);
    if (result.length >= maxCount) break;
  }

  return result;
}

function candidateMatchesHistory(candidate: CandidateView, historyId: string) {
  return candidate.sourceHistoryId === historyId || candidate.syncHistoryId === historyId || candidate.sessionId === historyId;
}

function countCandidatesForHistory(candidates: CandidateView[], history: HistoryEntry) {
  const scopedCount = candidates.filter((candidate) => candidateMatchesHistory(candidate, history.id)).length;
  return scopedCount || history.totalCandidates || history.fullPayload?.candidates?.length || history.candidates?.length || 0;
}

function getCandidateNamesForHistory(candidates: CandidateView[], history: HistoryEntry) {
  const scopedNames = candidates
    .filter((candidate) => candidateMatchesHistory(candidate, history.id))
    .map((candidate) => candidate.candidateName);
  const payloadNames = [
    ...(history.fullPayload?.candidates || []).map((candidate) => String(candidate.candidateName || candidate.name || "")),
    ...(history.candidates || []).map((candidate) => String(candidate.candidateName || candidate.name || "")),
    ...(history.topCandidates || []).map((candidate) => String(candidate.name || ""))
  ];

  return uniqueItems([...scopedNames, ...payloadNames], 3);
}

function matchCandidate(candidate: CandidateView, query: string) {
  const normalizedQuery = normalize(query);
  const tokens = normalizedQuery.split(/\s+/).filter((token) => token.length >= 2);
  const searchText = normalize(
    [
      candidate.candidateName,
      candidate.jobTitle,
      candidate.jobPosition,
      candidate.industry,
      candidate.experienceLevel,
      candidate.strengths.join(" "),
      candidate.weaknesses.join(" ")
    ].join(" ")
  );
  const matchedTokens = tokens.filter((token) => searchText.includes(token)).length;
  const directMatch = normalizedQuery && searchText.includes(normalizedQuery) ? 32 : 0;
  const tokenMatch = matchedTokens * 9;
  const rankBoost = candidate.rank === "A" ? 18 : candidate.rank === "B" ? 9 : 0;

  return candidate.score + directMatch + tokenMatch + rankBoost;
}

function selectCandidates(candidates: CandidateView[], query: string) {
  const sorted = [...candidates].sort((left, right) => matchCandidate(right, query) - matchCandidate(left, query));
  const normalizedQuery = normalize(query);

  if (!normalizedQuery) return sorted.slice(0, 3);

  const matched = sorted.filter((candidate) => matchCandidate(candidate, query) > candidate.score + 4);
  return (matched.length > 0 ? matched : sorted).slice(0, 3);
}

function isTechnicalScoringNote(value: string) {
  const text = normalize(value);
  return (
    /ai generation|fallback|vector|keyword|expecting|json|parse|scoring/.test(text) ||
    /cham diem tam thoi|khop noi dung|khong noi dung|noi dung jd|noi dung cv|khong trich xuat/.test(text)
  );
}

function usefulWeaknesses(candidate: CandidateView) {
  return candidate.weaknesses.filter((weakness) => weakness.trim() && !isTechnicalScoringNote(weakness));
}

function friendlyRiskItems(selected: CandidateView[]) {
  const directRisks = uniqueItems(selected.flatMap((candidate) => usefulWeaknesses(candidate)).slice(0, 5), 3);
  if (directRisks.length > 0) {
    return directRisks.map((risk) => `- **Điểm cần kiểm chứng:** ${risk}`);
  }

  const hasTechnicalNotes = selected.some((candidate) => candidate.weaknesses.some(isTechnicalScoringNote));
  if (!hasTechnicalNotes) {
    return [
      "- **Kinh nghiệm thực tế:** Yêu cầu ứng viên nêu ví dụ có số liệu và kết quả cụ thể.",
      "- **Khả năng phối hợp:** Kiểm tra cách ứng viên làm việc với quản lý và các bộ phận liên quan.",
      "- **Mức độ phù hợp văn hóa:** Trao đổi trực tiếp để đánh giá phong cách làm việc và mức độ gắn bó."
    ];
  }

  return [
    "- **Tính chuyên nghiệp:** Dữ liệu hiện ở mức đánh giá sơ bộ, nên kiểm chứng thêm qua tình huống làm việc thực tế.",
    "- **Mức độ gắn bó & lịch sử làm việc:** Xác nhận lại các mốc thời gian, lý do chuyển việc và định hướng 6-12 tháng tới.",
    "- **Mức độ phù hợp văn hóa:** Trao đổi trực tiếp để xem ứng viên có phù hợp với môi trường và kỳ vọng của công ty không."
  ];
}

function matchedCandidateNames(query: string, candidates: CandidateView[]) {
  const normalizedQuery = normalize(query);
  if (!normalizedQuery) return [];

  return candidates
    .filter((candidate) => {
      const fullName = normalize(candidate.candidateName);
      const nameParts = fullName.split(/\s+/).filter((part) => part.length >= 3);
      return fullName.includes(normalizedQuery) || normalizedQuery.includes(fullName) || nameParts.some((part) => normalizedQuery.includes(part));
    })
    .map((candidate) => candidate.candidateName);
}

function inferAdviceTarget(query: string, selected: CandidateView[], selectedHistory?: HistoryEntry | null) {
  const names = uniqueItems(matchedCandidateNames(query, selected), 2);
  if (names.length > 0) {
    return { label: `ứng viên ${names.join(", ")}`, names };
  }

  const cleaned = query
    .replace(/hello|hi|xin chào|chào bạn|chào|nhé|ạ/gi, " ")
    .replace(/tôi|mình|em|anh|chị|bạn|cần|muốn|hãy|giúp|tư vấn|về|cho|ứng viên/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (cleaned.length >= 4 && !/^van$|vân$/i.test(cleaned)) {
    return { label: cleaned, names };
  }

  return { label: selectedHistory?.jobPosition || "vị trí đang tuyển", names };
}

function domainQuestions(query: string) {
  const normalizedQuery = normalize(query);

  if (/marketing|content|digital|seo|ads|truyen thong/.test(normalizedQuery)) {
    return [
      "Bạn đo hiệu quả chiến dịch bằng những chỉ số nào và xử lý khi CPA/CPL tăng ra sao?",
      "Hãy mô tả một chiến dịch bạn trực tiếp tối ưu từ insight đến kết quả.",
      "Bạn phối hợp với sales/product thế nào khi thông điệp thị trường chưa rõ?"
    ];
  }

  if (/it|lap trinh|developer|frontend|backend|data|java|react|software/.test(normalizedQuery)) {
    return [
      "Bạn giải thích kiến trúc dự án gần nhất và quyết định kỹ thuật khó nhất là gì?",
      "Khi gặp lỗi production hoặc hiệu năng kém, bạn debug theo quy trình nào?",
      "Bạn kiểm soát chất lượng code, test và review trong team ra sao?"
    ];
  }

  if (/kinh doanh|sales|ban hang|business/.test(normalizedQuery)) {
    return [
      "Bạn xây pipeline khách hàng như thế nào và tỷ lệ chuyển đổi từng bước ra sao?",
      "Kể một deal khó bạn đã xử lý, phản đối chính là gì và bạn chốt bằng cách nào?",
      "Bạn ưu tiên chăm sóc khách hàng cũ hay tìm khách mới trong 30 ngày đầu?"
    ];
  }

  if (/nhan su|hr|tuyen dung|c&b/.test(normalizedQuery)) {
    return [
      "Bạn thiết kế phễu tuyển dụng và đo chất lượng nguồn ứng viên như thế nào?",
      "Khi hiring manager thay đổi yêu cầu liên tục, bạn xử lý kỳ vọng ra sao?",
      "Bạn từng cải thiện time-to-hire hoặc offer acceptance rate bằng cách nào?"
    ];
  }

  return [
    "Bạn hãy mô tả thành tựu phù hợp nhất với vị trí này bằng số liệu cụ thể.",
    "Điểm yếu lớn nhất của bạn trong vai trò này là gì và bạn đang cải thiện ra sao?",
    "Nếu nhận việc, 30 ngày đầu bạn sẽ ưu tiên việc gì để tạo kết quả nhanh?"
  ];
}

function buildInterviewQuestions(query: string, selected: CandidateView[], selectedHistory?: HistoryEntry | null) {
  const candidateQuestions = selected.flatMap((candidate) => candidate.interviewQuestions);
  const weaknessQuestions = selected.flatMap((candidate) =>
    usefulWeaknesses(candidate).slice(0, 2).map((weakness) => `Làm rõ điểm cần kiểm chứng: ${weakness}`)
  );
  const strengthQuestions = selected.flatMap((candidate) =>
    candidate.strengths.slice(0, 1).map((strength) => `Yêu cầu ứng viên đưa ví dụ thực tế chứng minh: ${strength}`)
  );
  const domainQuery = `${query} ${selectedHistory?.jobPosition || ""}`;

  return uniqueItems([...candidateQuestions, ...weaknessQuestions, ...domainQuestions(domainQuery), ...strengthQuestions], 6);
}

function buildAdvice(query: string, candidates: CandidateView[], selectedHistory?: HistoryEntry | null) {
  if (candidates.length === 0) {
    return "Phiên lọc này chưa có ứng viên trong dữ liệu mobile. Bạn hãy đồng bộ lại lịch sử hoặc chọn phiên lọc khác.";
  }

  const selected = selectCandidates(candidates, query);
  const top = selected[0];
  const averageScore = Math.round(selected.reduce((sum, candidate) => sum + candidate.score, 0) / selected.length);
  const riskItems = friendlyRiskItems(selected);
  const target = inferAdviceTarget(query, selected, selectedHistory);
  const role = top.jobTitle || selectedHistory?.jobPosition || "vị trí đang tuyển";
  const opening =
    target.names.length > 0
      ? `Chào bạn! Đối với vị trí **${role}**, mình xin thông tin về ứng viên **${top.candidateName}** như sau:`
      : `Chào bạn! Đối với vị trí **${role}**, mình đề xuất ưu tiên ứng viên **${top.candidateName}** như sau:`;

  return [
    opening,
    `Ứng viên này đang được hệ thống ưu tiên với số điểm **${Math.round(top.score)} (Hạng ${top.rank})**. Mức điểm này ${Math.round(top.score) >= averageScore ? "khá tích cực" : "cần cân nhắc thêm"} so với điểm trung bình **${averageScore}** của nhóm **${selected.length}** ứng viên phù hợp nhất hiện tại.`,
    "Dựa trên đánh giá sơ bộ từ dữ liệu CV/JD đã lưu, dưới đây là các điểm bạn nên khai thác kỹ hơn khi phỏng vấn:",
    riskItems.join("\n"),
    "Mình đã chuẩn bị bộ câu hỏi phỏng vấn chi tiết ở bên dưới dựa trên kết quả lọc này."
  ].join("\n\n");
}

function toRenderMessage(message: ChatMessage): RenderChatbotMessage {
  return {
    id: message.id,
    author: message.role === "user" ? "user" : "bot",
    content: message.text,
    timestamp: Date.now(),
    suggestedCandidateIds: message.candidateIds || []
  };
}

function fromRenderMessage(message: RenderChatbotMessage): ChatMessage {
  return {
    id: message.id,
    role: message.author === "user" ? "user" : "assistant",
    text: message.content,
    candidateIds: message.suggestedCandidateIds || []
  };
}

function RichMessageText({ color, text }: { color: string; text: string }) {
  const blocks = text.split("\n");

  return (
    <Text className="text-[14px] leading-5" style={{ color }}>
      {blocks.map((block, blockIndex) => {
        const parts = block.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
        return (
          <Text key={`block-${blockIndex}`}>
            {parts.map((part, partIndex) => {
              const bold = part.startsWith("**") && part.endsWith("**");
              return (
                <Text key={`part-${blockIndex}-${partIndex}`} style={bold ? { fontWeight: "700" } : undefined}>
                  {bold ? part.slice(2, -2) : part}
                </Text>
              );
            })}
            {blockIndex < blocks.length - 1 ? "\n" : ""}
          </Text>
        );
      })}
    </Text>
  );
}

function miniInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  return `${parts[0]?.[0] || "U"}${parts.length > 1 ? parts[parts.length - 1]?.[0] : ""}`.toUpperCase();
}

function CandidateMiniCard({ candidate }: { candidate: CandidateView }) {
  const { colors } = useAppTheme();
  const [avatarFailed, setAvatarFailed] = useState(false);
  const showAvatar = Boolean(candidate.avatarUrl && !avatarFailed);
  const highScore = candidate.score >= 80;
  const badgeTone = highScore
    ? { backgroundColor: colors.successSoft, color: colors.success }
    : candidate.score >= 60
      ? { backgroundColor: colors.warningSoft, color: colors.warning }
      : { backgroundColor: colors.dangerSoft, color: colors.danger };

  return (
    <View
      className="mt-3 w-full max-w-[92%] rounded-2xl border p-4"
      style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}
    >
      <View className="flex-row items-start gap-3">
        <View
          className="h-10 w-10 overflow-hidden rounded-full border"
          style={{ backgroundColor: colors.accentSoft, borderColor: showAvatar ? colors.border : colors.accent }}
        >
          {showAvatar ? (
            <Image
              accessibilityIgnoresInvertColors
              className="h-full w-full"
              onError={() => setAvatarFailed(true)}
              source={{ uri: candidate.avatarUrl || "" }}
              style={{ resizeMode: "cover" }}
            />
          ) : (
            <View className="h-full w-full items-center justify-center">
              <Text className="text-xs font-black" style={{ color: colors.accent }}>
                {miniInitials(candidate.candidateName)}
              </Text>
            </View>
          )}
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[15px] font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
            {candidate.candidateName}
          </Text>
          <Text className="mt-1 text-xs leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {candidate.jobTitle} · {candidate.industry}
          </Text>
        </View>
        <View className="items-center rounded-full px-3 py-1.5" style={{ backgroundColor: badgeTone.backgroundColor }}>
          <Text className="text-[12px] font-semibold leading-4" numberOfLines={1} style={{ color: badgeTone.color }}>
            {Math.round(candidate.score)} · Hạng {candidate.rank}
          </Text>
        </View>
      </View>
      {candidate.strengths[0] ? (
        <Text className="mt-3 text-xs leading-5" numberOfLines={2} style={{ color: colors.textPrimary }}>
          {candidate.strengths[0]}
        </Text>
      ) : null}
    </View>
  );
}

function MessageBubble({ candidateMap, message }: { candidateMap: Map<string, CandidateView>; message: ChatMessage }) {
  const { colors, isDark } = useAppTheme();
  const isUser = message.role === "user";
  const messageCandidates = (message.candidateIds || []).map((id) => candidateMap.get(id)).filter((candidate): candidate is CandidateView => Boolean(candidate));

  return (
    <View className={["mb-5", isUser ? "items-end" : "items-start"].join(" ")}>
      <View
        className="max-w-[88%] rounded-2xl px-4 py-3"
        style={{
          backgroundColor: isUser ? colors.accent : isDark ? colors.surface : "#F1F5F9",
          borderBottomLeftRadius: isUser ? 16 : 4,
          borderBottomRightRadius: isUser ? 4 : 16
        }}
      >
        <RichMessageText color={isUser ? "#111827" : colors.textPrimary} text={message.text} />
      </View>

      {messageCandidates.map((candidate) => <CandidateMiniCard candidate={candidate} key={`${message.id}-${candidate.id}`} />)}

      {message.questions && message.questions.length > 0 ? (
        <View className="mt-3 w-full max-w-[92%] rounded-2xl border p-4" style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border }}>
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
            Câu hỏi phỏng vấn gợi ý
          </Text>
          <View className="mt-3 gap-2">
            {message.questions.map((question, index) => (
              <View className="flex-row gap-2" key={`${message.id}-question-${index}`}>
                <View className="mt-1 h-5 w-5 items-center justify-center rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                  <Text className="text-[10px] font-black" style={{ color: colors.accent }}>
                    {index + 1}
                  </Text>
                </View>
                <Text className="flex-1 text-xs leading-5" style={{ color: colors.textPrimary }}>
                  {question}
                </Text>
              </View>
            ))}
          </View>
        </View>
      ) : null}
    </View>
  );
}

export function AdvisorScreen() {
  const { colors, isDark } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const route = useRoute<AdvisorRoute>();
  const authUser = useRecruiterStore((state) => state.authUser);
  const candidates = useRecruiterStore((state) => state.candidates);
  const history = useRecruiterStore((state) => state.history);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);
  const loading = useRecruiterStore((state) => state.loading);
  const inboxRefreshing = useRecruiterStore((state) => state.inboxRefreshing);
  const scrollRef = useRef<ScrollView>(null);
  const [input, setInput] = useState("");
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<HistoryDateFilter>("all");
  const [selectedHistoryId, setSelectedHistoryId] = useState<string | null>(null);
  const [chatStarted, setChatStarted] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [chatSessions, setChatSessions] = useState<AdvisorChatSession[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const userKey = authUser?.email || authUser?.uid || null;

  const candidateMap = useMemo(() => new Map(candidates.map((candidate) => [candidate.id, candidate])), [candidates]);
  const candidatesByHistory = useMemo(() => {
    const grouped = new Map<string, CandidateView[]>();

    candidates.forEach((candidate) => {
      const ids = [candidate.sourceHistoryId, candidate.syncHistoryId, candidate.sessionId].filter(Boolean) as string[];
      ids.forEach((id) => {
        const list = grouped.get(id) || [];
        if (!list.some((item) => item.id === candidate.id)) {
          list.push(candidate);
          grouped.set(id, list);
        }
      });
    });

    return grouped;
  }, [candidates]);
  const historyNamesById = useMemo(() => {
    const namesById = new Map<string, string[]>();

    history.forEach((entry) => {
      const scopedNames = (candidatesByHistory.get(entry.id) || []).map((candidate) => candidate.candidateName);
      const payloadNames = [
        ...(entry.fullPayload?.candidates || []).map((candidate) => String(candidate.candidateName || candidate.name || "")),
        ...(entry.candidates || []).map((candidate) => String(candidate.candidateName || candidate.name || "")),
        ...(entry.topCandidates || []).map((candidate) => String(candidate.name || ""))
      ];
      namesById.set(entry.id, uniqueItems([...scopedNames, ...payloadNames], 3));
    });

    return namesById;
  }, [candidatesByHistory, history]);
  const selectedHistory = useMemo(
    () => history.find((item) => item.id === selectedHistoryId) || null,
    [history, selectedHistoryId]
  );
  const contextCandidates = useMemo(
    () =>
      selectedHistoryId
        ? candidatesByHistory.get(selectedHistoryId) || []
        : candidates,
    [candidates, candidatesByHistory, selectedHistoryId]
  );
  const selectedCandidateNames = useMemo(
    () => uniqueItems(contextCandidates.map((candidate) => candidate.candidateName).filter(Boolean), 8),
    [contextCandidates]
  );
  const filteredHistory = useMemo(() => {
    const normalizedQuery = normalize(historyQuery);
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const today = now.toISOString().slice(0, 10);

    return history
      .filter((entry) => {
        const matchesQuery =
          !normalizedQuery ||
          normalize(`${entry.jobPosition} ${entry.userEmail || ""} ${entry.locationRequirement || ""}`).includes(normalizedQuery);
        const dateKey = historyDateKey(entry.timestamp);
        const matchesDate =
          historyDateFilter === "all" ||
          (historyDateFilter === "today" && dateKey === today) ||
          (historyDateFilter === "month" && dateKey.startsWith(currentMonth));

        return matchesQuery && matchesDate;
      })
      .slice(0, 12);
  }, [history, historyDateFilter, historyQuery]);
  const roles = useMemo(() => uniqueItems(contextCandidates.map((candidate) => candidate.jobTitle).filter(Boolean), 4), [contextCandidates]);
  const flat = {
    background: isDark ? "#000000" : colors.background,
    bottomBar: isDark ? "#121212" : colors.surface,
    divider: isDark ? "#333333" : colors.border,
    search: isDark ? "#1E1E1E" : "#F3F4F6",
    pill: isDark ? "#27272A" : colors.surface,
    muted: isDark ? "#A1A1AA" : colors.textSecondary
  };

  const persistSessions = (nextSessions: AdvisorChatSession[]) => {
    const compactSessions = nextSessions
      .map((session) => ({
        ...session,
        messages: session.messages.slice(-80)
      }))
      .slice(0, 30);
    setChatSessions(compactSessions);
    void writeLocalCache<AdvisorChatCache>(localCacheKeys.advisorChat(userKey), { sessions: compactSessions });
  };

  useEffect(() => {
    let mounted = true;

    const loadChatHistory = async () => {
      const cached = await readLocalCache<AdvisorChatCache>(localCacheKeys.advisorChat(userKey));
      if (mounted && cached?.sessions) {
        setChatSessions(cached.sessions);
      }

      const token = await getAuthToken();
      if (!token) return;

      try {
        const remoteSessions = await fetchRenderChatbotSessions(token, 20);
        if (!mounted || remoteSessions.length === 0) return;

        const converted = remoteSessions.map<AdvisorChatSession>((session) => ({
          id: `render-${session.id}`,
          renderSessionId: session.id,
          title: session.sessionTitle || session.jobPosition || "Tư vấn ứng viên",
          historyId: null,
          totalCandidates: session.totalCandidates,
          updatedAt: session.lastMessageAt || Date.now(),
          messages: session.messages.length > 0 ? session.messages.map(fromRenderMessage) : initialMessages
        }));

        setChatSessions((current) => {
          const existingRenderIds = new Set(current.map((session) => session.renderSessionId).filter(Boolean));
          const merged = [
            ...current,
            ...converted.filter((session) => !existingRenderIds.has(session.renderSessionId))
          ]
            .sort((left, right) => right.updatedAt - left.updatedAt)
            .slice(0, 30);
          void writeLocalCache<AdvisorChatCache>(localCacheKeys.advisorChat(userKey), { sessions: merged });
          return merged;
        });
      } catch {
        // Local chat history remains available if web sync is unavailable.
      }
    };

    void loadChatHistory();
    return () => {
      mounted = false;
    };
  }, [userKey]);

  const startChatForHistory = (historyId: string | null) => {
    setSelectedHistoryId(historyId);
    setActiveSessionId(null);
    setMessages(initialMessages);
    setInput("");
    setChatStarted(true);
    requestAnimationFrame(() => scrollRef.current?.scrollTo({ animated: false, y: 0 }));
  };

  const openSession = (session: AdvisorChatSession) => {
    setActiveSessionId(session.id);
    setSelectedHistoryId(session.historyId);
    setMessages(session.messages.length > 0 ? session.messages : initialMessages);
    setChatStarted(true);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  useEffect(() => {
    const sessionId = route.params?.sessionId;
    if (!sessionId || activeSessionId === sessionId) return;

    const matchedSession = chatSessions.find((session) => session.id === sessionId);
    if (matchedSession) {
      openSession(matchedSession);
    }
  }, [activeSessionId, chatSessions, route.params?.sessionId]);

  const saveActiveSession = async (nextMessages: ChatMessage[], prompt: string, selected: CandidateView[]) => {
    const now = Date.now();
    const title = selectedHistory?.jobPosition || prompt || "Tư vấn ứng viên";
    const sessionId = activeSessionId || `local-${now}`;
    let renderSessionId = chatSessions.find((session) => session.id === sessionId)?.renderSessionId;

    const nextSession: AdvisorChatSession = {
      id: sessionId,
      renderSessionId,
      title,
      historyId: selectedHistoryId,
      totalCandidates: contextCandidates.length,
      updatedAt: now,
      messages: nextMessages
    };

    const nextSessions = [nextSession, ...chatSessions.filter((session) => session.id !== sessionId)].sort(
      (left, right) => right.updatedAt - left.updatedAt
    );
    persistSessions(nextSessions);
    setActiveSessionId(sessionId);

    const token = await getAuthToken();
    if (!token) return;

    try {
      if (!renderSessionId) {
        renderSessionId = await createRenderChatbotSession(token, title, contextCandidates.length);
        const syncedSessions = nextSessions.map((session) =>
          session.id === sessionId ? { ...session, renderSessionId } : session
        );
        persistSessions(syncedSessions);
      }

      if (renderSessionId) {
        await addRenderChatbotMessages(token, renderSessionId, nextMessages.slice(-2).map(toRenderMessage));
      }
    } catch {
      // Keep local session if remote chatbot history sync is unavailable.
    }
  };

  const sendPrompt = (value = input) => {
    const prompt = value.trim();
    if (!prompt) return;

    const selected = selectCandidates(contextCandidates, prompt);
    const candidateIds = selected.map((candidate) => candidate.id);
    const answer: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: buildAdvice(prompt, contextCandidates, selectedHistory),
      candidateIds,
      questions: buildInterviewQuestions(prompt, selected, selectedHistory)
    };
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      text: prompt
    };
    const nextMessages = [...messages, userMessage, answer];

    setMessages(nextMessages);
    setInput("");
    void saveActiveSession(nextMessages, prompt, selected);
    requestAnimationFrame(() => scrollRef.current?.scrollToEnd({ animated: true }));
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: flat.background }}>
      <AppHeader
        minimal
        right={
          <Pressable
            accessibilityLabel="Mở lịch sử chatbot"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center active:opacity-70"
            onPress={() => navigation.navigate("AdvisorChatHistory")}
            style={{ backgroundColor: "transparent" }}
          >
            <History color={colors.accent} size={19} strokeWidth={2.35} />
          </Pressable>
        }
        title="Tư vấn ứng viên"
      />

      <View className="flex-1">
        <View className="w-full flex-1">
          {candidates.length === 0 ? (
            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 96, paddingTop: 14 }} showsVerticalScrollIndicator={false}>
              <EmptyState
                action={<AppButton icon={UsersRound} label={loading || inboxRefreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"} loading={loading || inboxRefreshing} onPress={() => void loadInbox(true)} />}
                description="Chatbot cần dữ liệu kết quả lọc CV đã lưu để tư vấn chính xác."
                title="Chưa có dữ liệu ứng viên"
              />
            </ScrollView>
          ) : !chatStarted ? (
            <ScrollView
              className="flex-1 px-4"
              contentContainerStyle={{ paddingBottom: 96, paddingTop: 14 }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View className="mb-5">
                <Text className="text-[24px] font-semibold leading-8" style={{ color: colors.textPrimary }}>
                  Chọn phiên cần tư vấn
                </Text>
                <Text className="mt-2 text-sm leading-5" style={{ color: flat.muted }}>
                  Tìm đúng phiên lọc CV để chatbot tư vấn ứng viên và tạo câu hỏi phỏng vấn theo dữ liệu đã lưu.
                </Text>
              </View>

              <View className="mb-4">
                <View className="mb-3 flex-row items-center gap-2">
                  <Search color={colors.accent} size={18} strokeWidth={2.3} />
                  <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                    Tìm lịch sử lọc CV
                  </Text>
                </View>
                <TextInput
                  className="mb-3 min-h-11 rounded-full px-4 text-sm"
                  onChangeText={setHistoryQuery}
                  placeholder="Tìm theo vị trí, email, địa điểm..."
                  placeholderTextColor={flat.muted}
                  style={{ backgroundColor: flat.search, color: colors.textPrimary, outlineStyle: "none" } as never}
                  value={historyQuery}
                />

                <View className="mb-2 flex-row gap-2">
                  {[
                    { key: "all" as const, label: "Tất cả" },
                    { key: "today" as const, label: "Hôm nay" },
                    { key: "month" as const, label: "Tháng này" }
                  ].map((filter) => {
                    const active = historyDateFilter === filter.key;
                    return (
                      <Pressable
                        accessibilityRole="button"
                        className="min-h-8 flex-row items-center justify-center gap-1.5 rounded-full px-3 active:opacity-75"
                        key={filter.key}
                        onPress={() => setHistoryDateFilter(filter.key)}
                        style={{ backgroundColor: active ? colors.accent : flat.pill }}
                      >
                        <CalendarDays color={active ? "#111827" : flat.muted} size={13} strokeWidth={2.3} />
                        <Text className="text-[12px] font-semibold" style={{ color: active ? "#111827" : flat.muted }}>
                          {filter.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                <Pressable
                  accessibilityRole="button"
                  className="min-h-[62px] justify-center border-b py-3 active:opacity-75"
                  onPress={() => startChatForHistory(null)}
                  style={{ borderColor: flat.divider }}
                >
                  <View className="flex-row items-center gap-3">
                    <UsersRound color={colors.accent} size={18} strokeWidth={2.2} />
                    <View className="min-w-0 flex-1">
                      <Text className="text-sm font-semibold" style={{ color: colors.accent }}>
                        Tư vấn tất cả ứng viên
                      </Text>
                      <Text className="mt-0.5 text-xs" style={{ color: flat.muted }}>
                        {candidates.length} ứng viên đã đồng bộ
                      </Text>
                    </View>
                  </View>
                </Pressable>

                <View>
                  {filteredHistory.map((entry) => {
                    const total = candidatesByHistory.get(entry.id)?.length || countCandidatesForHistory(candidates, entry);
                    const names = historyNamesById.get(entry.id) || getCandidateNamesForHistory(candidates, entry);
                    return (
                      <Pressable
                        accessibilityRole="button"
                        className="min-h-[72px] justify-center border-b py-3 active:opacity-75"
                        key={entry.id}
                        onPress={() => startChatForHistory(entry.id)}
                        style={{ borderColor: flat.divider }}
                      >
                        <View className="flex-row items-center gap-3">
                          <Clock3 color={flat.muted} size={18} strokeWidth={2.2} />
                          <View className="min-w-0 flex-1">
                            <Text className="text-sm font-semibold" numberOfLines={1} style={{ color: colors.textPrimary }}>
                              {entry.jobPosition || "Phiên lọc CV"}
                            </Text>
                            <Text className="mt-0.5 text-xs" style={{ color: flat.muted }}>
                              {formatDate(entry.timestamp)} · {total} ứng viên
                            </Text>
                            {names.length > 0 ? (
                              <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.textSecondary }}>
                                {names.join(", ")}
                              </Text>
                            ) : null}
                          </View>
                        </View>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            </ScrollView>
          ) : (
            <>
              <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={{ paddingBottom: 22, paddingTop: 14 }}
                keyboardShouldPersistTaps="handled"
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
              >
                <Pressable
                  accessibilityRole="button"
                  className="mb-4 flex-row items-center gap-2 self-start rounded-full px-3 py-2 active:opacity-75"
                  onPress={() => setChatStarted(false)}
                  style={{ backgroundColor: flat.pill }}
                >
                  <ChevronLeft color={flat.muted} size={16} strokeWidth={2.3} />
                  <Text className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>
                    Đổi phiên tư vấn
                  </Text>
                </Pressable>

                <Text className="mb-4 text-xs leading-5" style={{ color: colors.textSecondary }}>
                  Đang tư vấn trên {contextCandidates.length} ứng viên
                  {selectedHistory ? ` từ "${selectedHistory.jobPosition || "phiên lọc CV"}"` : ""}.
                </Text>

                {selectedHistory ? (
                  <View className="mb-4">
                    <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                      Ứng viên trong phiên đã chọn
                    </Text>
                    <View className="mt-2 flex-row flex-wrap gap-2">
                      {selectedCandidateNames.length > 0 ? (
                        selectedCandidateNames.map((name) => (
                          <View className="rounded-full px-3 py-1.5" key={name} style={{ backgroundColor: flat.pill }}>
                            <Text className="text-[13px] font-semibold" numberOfLines={1} style={{ color: colors.textPrimary }}>
                              {name}
                            </Text>
                          </View>
                        ))
                      ) : (
                        <Text className="text-xs leading-5" style={{ color: colors.textSecondary }}>
                          Phiên này chưa có danh sách ứng viên trong cache mobile.
                        </Text>
                      )}
                    </View>
                  </View>
                ) : null}

                {messages.map((message) => (
                  <MessageBubble candidateMap={candidateMap} key={message.id} message={message} />
                ))}
              </ScrollView>

              <View className="w-full border-t px-4 py-3" style={{ backgroundColor: flat.bottomBar, borderColor: flat.divider }}>
                <View className="flex-row items-end gap-2">
                  <View
                    className="min-h-12 flex-1 rounded-full px-4 py-1"
                    style={{ backgroundColor: flat.search }}
                  >
                    <TextInput
                      className="min-h-10 text-sm"
                      multiline
                      onChangeText={setInput}
                      onSubmitEditing={() => sendPrompt()}
                      placeholder="Nhập ngành/vị trí mong muốn..."
                      placeholderTextColor={flat.muted}
                      style={{ color: colors.textPrimary, outlineStyle: "none" } as never}
                      value={input}
                    />
                  </View>
                  <Pressable
                    accessibilityLabel="Gửi yêu cầu tư vấn"
                    accessibilityRole="button"
                    className="h-12 w-12 items-center justify-center rounded-full active:scale-95"
                    onPress={() => sendPrompt()}
                    style={{ backgroundColor: input.trim() ? colors.accent : flat.search }}
                  >
                    <SendHorizonal color={input.trim() ? "#111827" : flat.muted} size={19} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>
            </>
          )}
        </View>
      </View>

      <BottomNav />
    </SafeAreaView>
  );
}
