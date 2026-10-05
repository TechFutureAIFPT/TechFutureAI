import { useMemo } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { Bell, CheckCircle2, RefreshCw } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

function formatTime(timestamp?: number) {
  if (!timestamp) return "Chưa rõ thời gian";
  return new Date(timestamp).toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  });
}

export function NotificationsScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const history = useRecruiterStore((state) => state.history);
  const loading = useRecruiterStore((state) => state.loading);
  const inboxRefreshing = useRecruiterStore((state) => state.inboxRefreshing);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const notifications = useMemo(
    () =>
      [...history]
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
        .slice(0, 20),
    [history]
  );

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Thông báo" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4" style={{ width: contentWidth + 32 }}>
          {/* Page header */}
          <View className="flex-row items-start justify-between gap-3 pb-4">
            <View className="min-w-0 flex-1">
              <Text className="text-[24px] font-semibold leading-8" style={{ color: colors.textPrimary }}>
                Kết quả lọc CV
              </Text>
              <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
                Khi web đồng bộ phiên lọc mới về tài khoản, thông báo sẽ hiện tại đây.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-xl active:opacity-80"
              onPress={() => void loadInbox(true)}
              style={{ backgroundColor: colors.accentSoft }}
            >
              <RefreshCw color={colors.accent} size={18} strokeWidth={2.4} />
            </Pressable>
          </View>

          {/* Notification list — card container */}
          {notifications.length > 0 ? (
            <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {notifications.map((item, idx) => (
                <View
                  className="flex-row items-center gap-3.5 px-4 py-3.5"
                  key={item.id}
                  style={{
                    borderBottomWidth: idx < notifications.length - 1 ? 0.7 : 0,
                    borderBottomColor: colors.border
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: colors.successSoft }}
                  >
                    <CheckCircle2 color={colors.success} size={19} strokeWidth={2.4} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>
                      Đã lọc hồ sơ thành công
                    </Text>
                    <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                      {item.jobPosition || "Phiên lọc CV"} · {item.totalCandidates || item.candidates?.length || 0} hồ sơ
                    </Text>
                    <Text className="mt-0.5 text-[11px]" style={{ color: colors.textSecondary }}>
                      {formatTime(item.timestamp)}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          ) : (
            <View className="px-4 py-12 items-center">
              <View
                className="mb-4 h-12 w-12 items-center justify-center rounded-2xl"
                style={{ backgroundColor: colors.surfaceSoft }}
              >
                <Bell color={colors.textSecondary} size={22} strokeWidth={2.4} />
              </View>
              <Text className="text-[17px] font-semibold text-center" style={{ color: colors.textPrimary }}>
                Chưa có thông báo
              </Text>
              <Text className="mt-2 text-[13px] leading-5 text-center" style={{ color: colors.textSecondary }}>
                Sau khi lọc CV trên máy tính, hãy đồng bộ dữ liệu để xem thông báo ở đây.
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-6 min-h-12 items-center justify-center rounded-xl px-6 active:opacity-80"
                onPress={() => void loadInbox(true)}
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-sm font-bold text-white">
                  {loading || inboxRefreshing ? "Đang đồng bộ..." : "Đồng bộ ngay"}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
