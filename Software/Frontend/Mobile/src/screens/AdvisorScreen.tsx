import { useEffect, useMemo, useRef, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CalendarDays, ChevronLeft, Clock3, History, Plus, Search, SendHorizonal, SquarePen, UsersRound } from "lucide-react-native";
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
    return "Phiên lọc này chưa có ứng viên trong dữ liệu. Bạn hãy đồng bộ lại lịch sử hoặc chọn phiên lọc khác.";
  }

  const norm = normalize(query);

  // 1. GREETINGS & CASUAL TALK ("hello", "hi", "xin chào", "bạn là ai")
  const isGreeting =
    /^(hello|hi|chao|xin chao|helo|alo|ban la ai|tro ly|giup gi|huong dan)(\s|$)/.test(norm) ||
    norm.includes("hello ban") ||
    norm.includes("chao ban");

  if (isGreeting) {
    const candidateNames = uniqueItems(candidates.map((c) => c.candidateName).filter(Boolean), 5).join(", ");
    const roleName = selectedHistory?.jobPosition || candidates[0]?.jobTitle || "tuyển dụng";
    return [
      `Chào bạn! Mình là AI Assistant tư vấn hồ sơ ứng viên vị trí **${roleName}**.`,
      `Phiên lọc hiện tại đang có **${candidates.length}** ứng viên: **${candidateNames || "các ứng viên đã chọn"}**.`,
      "Bạn có thể hỏi mình các nội dung như:",
      `• **So sánh ứng viên**: *"So sánh ${candidates[0]?.candidateName || "ứng viên 1"} và ${candidates[1]?.candidateName || "ứng viên 2"}"*`,
      `• **Xem điểm mạnh & rủi ro**: *"Cho biết điểm mạnh của ${candidates[0]?.candidateName || "ứng viên 1"}"*`,
      `• **Đề xuất ứng viên tốt nhất**: *"Ai là ứng viên cao điểm nhất?"*`,
      `• **Gợi ý câu hỏi phỏng vấn**: *"Gợi ý câu hỏi phỏng vấn chi tiết"*`
    ].join("\n\n");
  }

  // Find candidate matches based on user query
  const matched = candidates.filter((c) => {
    const fn = normalize(c.candidateName);
    const parts = fn.split(/\s+/).filter((p) => p.length >= 3);
    return norm.includes(fn) || parts.some((p) => norm.includes(p));
  });

  // 2. COMPARISON QUERY ("so sánh", "khác nhau", "ai hơn", "nên chọn ai")
  const isComparison = /so sanh|khac nhau|nen chon ai|ai tot hon|ai hon|giua|voi/.test(norm);
  if (isComparison || matched.length >= 2) {
    const compareList = matched.length >= 2 ? matched.slice(0, 3) : candidates.slice(0, 2);
    const c1 = compareList[0];
    const c2 = compareList[1];

    if (c1 && c2) {
      const winner = c1.score >= c2.score ? c1 : c2;
      return [
        `Dưới đây là so sánh trực diện giữa **${c1.candidateName}** và **${c2.candidateName}**:`,
        `📊 **Điểm số & Xếp hạng:**\n• **${c1.candidateName}**: **${Math.round(c1.score)} điểm** (Hạng ${c1.rank})\n• **${c2.candidateName}**: **${Math.round(c2.score)} điểm** (Hạng ${c2.rank})`,
        `💪 **Điểm mạnh chính:**\n• **${c1.candidateName}**: ${c1.strengths.slice(0, 2).join("; ") || "Kỹ năng chuyên môn tốt"}\n• **${c2.candidateName}**: ${c2.strengths.slice(0, 2).join("; ") || "Kinh nghiệm thực tế phù hợp"}`,
        `💡 **Khuyên dùng:**\nNên ưu tiên **${winner.candidateName}** cho vị trí này nhờ tổng điểm đánh giá cao hơn và độ tương thích tốt hơn.`
      ].join("\n\n");
    }
  }

  // 3. SPECIFIC CANDIDATE INQUIRY (Mentions exact candidate name)
  if (matched.length === 1) {
    const c = matched[0];
    const risks = usefulWeaknesses(c);
    return [
      `Thông tin phân tích chi tiết về ứng viên **${c.candidateName}**:`,
      `📌 **Vị trí & Xếp hạng:** ${c.jobTitle || "Ứng viên"} — **${Math.round(c.score)} điểm** (Hạng ${c.rank})`,
      `💪 **Điểm mạnh nổi bật:**\n${c.strengths.map((s) => `• ${s}`).join("\n") || "• Hồ sơ đáp ứng yêu cầu tuyển dụng"}`,
      `⚠️ **Điểm cần kiểm chứng khi phỏng vấn:**\n${risks.map((r) => `• ${r}`).join("\n") || "• Cần yêu cầu ứng viên đưa ví dụ thực tế và chỉ số dự án đã làm."}`,
      `🎯 **Đánh giá chung:** Ứng viên thuộc nhóm ${c.rank === "A" ? "rất tiềm năng, đề xuất lên lịch phỏng vấn ngay." : "phù hợp, nên phỏng vấn làm rõ kinh nghiệm."}`
    ].join("\n\n");
  }

  // 4. TOP / BEST CANDIDATE INQUIRY ("ai giỏi nhất", "ai cao điểm nhất", "top 1")
  const isTopQuery = /ai cao diem nhat|ai gioi nhat|top 1|tot nhat|de xuat ai|uu tien ai/.test(norm);
  if (isTopQuery) {
    const sorted = [...candidates].sort((a, b) => b.score - a.score);
    const top1 = sorted[0];
    return [
      `Ứng viên cao điểm nhất trong phiên lọc này là **${top1.candidateName}**!`,
      `🏆 **Xếp hạng:** Hạng **${top1.rank}** với **${Math.round(top1.score)}/100 điểm**.`,
      `🌟 **Lý do đề xuất:**\n${top1.strengths.slice(0, 3).map((s) => `• ${s}`).join("\n") || "• Năng lực và kinh nghiệm khớp nhất với JD"}`,
      `📌 **Lời khuyên:** Đề xuất đặt lịch phỏng vấn **${top1.candidateName}** đầu tiên trong danh sách.`
    ].join("\n\n");
  }

  // 5. INTERVIEW QUESTIONS INQUIRY ("câu hỏi", "phỏng vấn", "kịch bản")
  const isQuestionQuery = /cau hoi|phong van|hoi gi|kich ban/.test(norm);
  if (isQuestionQuery) {
    const topC = candidates[0];
    return [
      `Bộ câu hỏi phỏng vấn gợi ý cho ứng viên **${topC?.candidateName || "trong phiên"}**:`,
      "1. Hãy trình bày một dự án thực tế gần nhất mà bạn tự tay thực hiện từ đầu đến cuối và chỉ số kết quả thu được?",
      "2. Khi phát sinh sự cố hoặc bất đồng với quản lý/đồng nghiệp về phương án triển khai, bạn giải quyết ra sao?",
      "3. Bạn dự định phát triển kỹ năng và chuyên môn gì trong 12 tháng tới?"
    ].join("\n\n");
  }

  // 6. DEFAULT TARGETED ADVICE
  const selected = selectCandidates(candidates, query);
  const top = selected[0];
  const averageScore = Math.round(selected.reduce((sum, candidate) => sum + candidate.score, 0) / selected.length);
  const riskItems = friendlyRiskItems(selected);
  const role = top.jobTitle || selectedHistory?.jobPosition || "vị trí đang tuyển";

  return [
    `Đối với vị trí **${role}**, ứng viên **${top.candidateName}** hiện đang được ưu tiên hàng đầu:`,
    `Điểm số: **${Math.round(top.score)} điểm** (Hạng ${top.rank}) — Cao hơn mức trung bình **${averageScore} điểm** của nhóm.`,
    "Các điểm nên đào sâu khi trao đổi:",
    riskItems.join("\n"),
    "Bạn có thể bấm vào các câu hỏi gợi ý phía dưới để phỏng vấn chi tiết hơn."
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
    <View className={["mb-5 w-full", isUser ? "items-end" : "items-start"].join(" ")}>
      <View className="flex-row items-end gap-2 max-w-[88%]">
        {!isUser && (
          <Image
            source={require("../../assets/brand/cvmatch-chatbot.png") as any}
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              marginBottom: 2
            }}
          />
        )}
        <View
          className="flex-1 rounded-2xl px-4 py-3 border"
          style={{
            backgroundColor: isUser ? colors.accent : isDark ? colors.surface : "#F1F5F9",
            borderColor: isUser ? colors.accent : colors.border,
            borderWidth: isUser ? 0 : 0.85,
            borderBottomLeftRadius: isUser ? 16 : 4,
            borderBottomRightRadius: isUser ? 4 : 16
          }}
        >
          <RichMessageText color={isUser ? "#111827" : colors.textPrimary} text={message.text} />
        </View>
      </View>

      {messageCandidates.map((candidate) => (
        <View className="w-full items-start pl-8" key={`${message.id}-${candidate.id}`}>
          <CandidateMiniCard candidate={candidate} />
        </View>
      ))}

      {message.questions && message.questions.length > 0 ? (
        <View className="w-full items-start pl-8">
          <View className="mt-3 w-full max-w-[92%] rounded-2xl border p-4" style={{ backgroundColor: colors.surfaceRaised, borderColor: colors.border, borderWidth: 0.85 }}>
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
    background: colors.background,
    bottomBar: colors.surface,
    divider: colors.border,
    search: isDark ? colors.surfaceSoft : "#F1F5F9",
    pill: isDark ? colors.surfaceSoft : colors.surface,
    muted: colors.textSecondary
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

  const handleNewChat = () => {
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

    const norm = normalize(prompt);
    const isGreeting =
      /^(hello|hi|chao|xin chao|helo|alo|ban la ai|tro ly|giup gi|huong dan)(\s|$)/.test(norm) ||
      norm.includes("hello ban") ||
      norm.includes("chao ban");

    const isQuestionQuery = /cau hoi|phong van|hoi gi|kich ban/.test(norm);

    const selected = selectCandidates(contextCandidates, prompt);
    const matchedNames = matchedCandidateNames(prompt, contextCandidates);
    const isCandidateQuery =
      matchedNames.length > 0 ||
      /ung vien|so sanh|danh sach|ai cao diem|ai gioi|top 1|uu tien|danh gia|hien thi/.test(norm);

    const candidateIds = !isGreeting && isCandidateQuery ? selected.map((c) => c.id) : [];
    const answerQuestions = !isGreeting && isQuestionQuery
      ? buildInterviewQuestions(prompt, selected, selectedHistory)
      : undefined;

    const answerText = buildAdvice(prompt, contextCandidates, selectedHistory);

    const answer: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      text: answerText,
      candidateIds,
      questions: answerQuestions
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
          <View className="flex-row items-center gap-1">
            <Pressable
              accessibilityLabel="Tạo đoạn chat mới"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center active:opacity-70"
              onPress={handleNewChat}
              style={{ backgroundColor: "transparent" }}
            >
              <SquarePen color={colors.accent} size={19} strokeWidth={2.35} />
            </Pressable>

            <Pressable
              accessibilityLabel="Mở lịch sử chatbot"
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center active:opacity-70"
              onPress={() => navigation.navigate("AdvisorChatHistory")}
              style={{ backgroundColor: "transparent" }}
            >
              <History color={colors.accent} size={19} strokeWidth={2.35} />
            </Pressable>
          </View>
        }
        title="Tư vấn ứng viên"
      />

      <View className="flex-1">
        <View className="w-full flex-1">
          {candidates.length === 0 ? (
            <ScrollView className="flex-1 px-4" contentContainerStyle={{ paddingBottom: 24, paddingTop: 14 }} showsVerticalScrollIndicator={false}>
              <EmptyState
                action={<AppButton icon={UsersRound} label={loading || inboxRefreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"} loading={loading || inboxRefreshing} onPress={() => void loadInbox(true)} />}
                description="Chatbot cần dữ liệu kết quả lọc CV đã lưu để tư vấn chính xác."
                title="Chưa có dữ liệu ứng viên"
              />
            </ScrollView>
          ) : !chatStarted ? (
            <ScrollView
              className="flex-1 px-4"
              contentContainerStyle={{ paddingBottom: 24, paddingTop: 14 }}
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
                <View className="mb-4 flex-row items-center justify-between">
                  <Pressable
                    accessibilityRole="button"
                    className="flex-row items-center gap-2 rounded-full px-3 py-2 active:opacity-75"
                    onPress={() => setChatStarted(false)}
                    style={{ backgroundColor: flat.pill }}
                  >
                    <ChevronLeft color={flat.muted} size={16} strokeWidth={2.3} />
                    <Text className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>
                      Đổi phiên tư vấn
                    </Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    className="flex-row items-center gap-1.5 rounded-full px-3 py-2 active:opacity-75"
                    onPress={handleNewChat}
                    style={{ backgroundColor: colors.accentSoft }}
                  >
                    <SquarePen color={colors.accent} size={15} strokeWidth={2.35} />
                    <Text className="text-[13px] font-bold" style={{ color: colors.accent }}>
                      Chat mới
                    </Text>
                  </Pressable>
                </View>

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
                      placeholder="Hỏi về ứng viên, so sánh hoặc gợi ý phỏng vấn..."
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

    </SafeAreaView>
  );
}
