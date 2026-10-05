import { useCallback, useEffect, useMemo, useState } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MessageCircle, Plus } from "lucide-react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { getAuthToken } from "../services/auth";
import { localCacheKeys, readLocalCache, writeLocalCache } from "../services/localDataCache";
import { fetchRenderChatbotSessions } from "../services/renderStore";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

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

function formatDate(timestamp?: number) {
  if (!timestamp) return "Chưa rõ";
  return new Date(timestamp).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

export function AdvisorChatHistoryScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const authUser = useRecruiterStore((state) => state.authUser);
  const [sessions, setSessions] = useState<AdvisorChatSession[]>([]);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const userKey = authUser?.email || authUser?.uid || null;

  const sortedSessions = useMemo(
    () => [...sessions].sort((left, right) => right.updatedAt - left.updatedAt),
    [sessions]
  );

  const loadSessions = useCallback(async () => {
    const cacheKey = localCacheKeys.advisorChat(userKey);
    const cached = await readLocalCache<AdvisorChatCache>(cacheKey);
    if (cached?.sessions) {
      setSessions(cached.sessions);
    }

    const token = await getAuthToken();
    if (!token) return;

    try {
      const remoteSessions = await fetchRenderChatbotSessions(token, 30);
      if (remoteSessions.length === 0) return;

      const converted = remoteSessions.map<AdvisorChatSession>((session) => ({
        id: `render-${session.id}`,
        renderSessionId: session.id,
        title: session.sessionTitle || session.jobPosition || "Tư vấn ứng viên",
        historyId: null,
        totalCandidates: session.totalCandidates,
        updatedAt: session.lastMessageAt || Date.now(),
        messages: session.messages.map((message) => ({
          id: message.id,
          role: message.author === "user" ? "user" : "assistant",
          text: message.content,
          candidateIds: message.suggestedCandidateIds || []
        }))
      }));

      setSessions((current) => {
        const renderIds = new Set(current.map((session) => session.renderSessionId).filter(Boolean));
        const merged = [
          ...current,
          ...converted.filter((session) => !renderIds.has(session.renderSessionId))
        ].slice(0, 30);
        void writeLocalCache<AdvisorChatCache>(cacheKey, { sessions: merged });
        return merged;
      });
    } catch {
      // Local chat history remains available if remote sync is unavailable.
    }
  }, [userKey]);

  useEffect(() => {
    void loadSessions();
  }, [loadSessions]);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader
        minimal
        right={
          <Pressable
            accessibilityLabel="Tạo tư vấn mới"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-xl active:opacity-70"
            onPress={() => navigation.navigate("Advisor")}
            style={{ backgroundColor: colors.accentSoft }}
          >
            <Plus color={colors.accent} size={20} strokeWidth={2.45} />
          </Pressable>
        }
        title="Lịch sử chatbot"
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingBottom: 32, paddingTop: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full px-4" style={{ maxWidth: contentWidth }}>
          <Text className="text-[20px] font-semibold leading-7" style={{ color: colors.textPrimary }}>
            Lịch sử chatbot
          </Text>
          <Text className="mt-1 text-sm leading-5" style={{ color: colors.textSecondary }}>
            {sortedSessions.length} cuộc trò chuyện đã lưu
          </Text>

          <View className="mt-5 gap-3">
            {sortedSessions.length > 0 ? (
              sortedSessions.map((session) => (
                <Pressable
                  accessibilityRole="button"
                  className="rounded-2xl p-4 active:opacity-75"
                  key={session.id}
                  onPress={() => navigation.navigate("Advisor", { sessionId: session.id })}
                  style={{ backgroundColor: colors.surfaceRaised }}
                >
                  <View className="flex-row items-start gap-3">
                    <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
                      <MessageCircle color={colors.accent} size={18} strokeWidth={2.35} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-[15px] font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                        {session.title}
                      </Text>
                      <Text className="mt-1 text-xs leading-4" style={{ color: colors.textSecondary }}>
                        {session.messages.length} tin nhắn · {session.totalCandidates || 0} ứng viên · {formatDate(session.updatedAt)}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))
            ) : (
              <View className="items-center px-6 py-12">
                <Text className="text-center text-[17px] font-semibold" style={{ color: colors.textPrimary }}>
                  Chưa có lịch sử chatbot
                </Text>
                <Text className="mt-2 text-center text-sm leading-5" style={{ color: colors.textSecondary }}>
                  Các cuộc tư vấn đã lưu từ web hoặc mobile sẽ xuất hiện tại đây.
                </Text>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
