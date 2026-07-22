import { useMemo, type ReactNode } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Bell,
  Bot,
  CheckCircle2,
  ChevronRight,
  Clock3,
  FileSearch,
  LayoutGrid,
  MessageCircle,
  Monitor,
  Sparkles,
  type LucideIcon
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type DashboardPalette = {
  background: string;
  surface: string;
  surfaceStrong: string;
  iconSurface: string;
  border: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  buttonText: string;
};

const darkDashboardColors: DashboardPalette = {
  background: "#09090B",
  surface: "rgba(24, 24, 27, 0.54)",
  surfaceStrong: "rgba(39, 39, 42, 0.62)",
  iconSurface: "rgba(255, 255, 255, 0.08)",
  border: "rgba(255, 255, 255, 0.08)",
  textPrimary: "#FAFAFA",
  textSecondary: "#A1A1AA",
  accent: "#F3E5D8",
  buttonText: "#09090B"
};

function createLightDashboardColors(colors: ReturnType<typeof useAppTheme>["colors"]): DashboardPalette {
  return {
    background: colors.background,
    surface: colors.surface,
    surfaceStrong: colors.surface,
    iconSurface: colors.accentSoft,
    border: colors.border,
    textPrimary: colors.textPrimary,
    textSecondary: colors.textSecondary,
    accent: colors.accent,
    buttonText: "#111827"
  };
}

function useDashboardPalette() {
  const { colors, isDark, surfaceShadowStyle } = useAppTheme();

  return {
    colors: isDark ? darkDashboardColors : createLightDashboardColors(colors),
    isDark,
    surfaceShadowStyle
  };
};

function formatDashboardDate(timestamp?: number) {
  if (!timestamp) return "Chưa rõ";

  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  });
}

const workflowItems: Array<{
  icon: LucideIcon;
  title: string;
  subtitle: string;
}> = [
  {
    icon: CheckCircle2,
    title: "Lọc CV trên máy tính",
    subtitle: "Dữ liệu phiên lọc được đồng bộ về tài khoản."
  },
  {
    icon: Bell,
    title: "Nhận thông báo trên điện thoại",
    subtitle: "Màn hình Thông báo hiển thị các phiên lọc mới nhất."
  },
  {
    icon: Bot,
    title: "Tư vấn ứng viên",
    subtitle: "Chatbot dùng dữ liệu đã lọc để gợi ý phỏng vấn."
  }
];

function DashboardCard({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { colors, isDark, surfaceShadowStyle } = useDashboardPalette();

  return (
    <View
      className={["rounded-3xl border", className].join(" ")}
      style={[
        {
          backgroundColor: isDark ? "rgba(24, 24, 27, 0.42)" : colors.surface,
          borderColor: colors.border
        },
        !isDark ? surfaceShadowStyle : null
      ]}
    >
      {children}
    </View>
  );
}

function QuickAction({
  icon: Icon,
  onPress,
  subtitle,
  title
}: {
  icon: LucideIcon;
  onPress: () => void;
  subtitle: string;
  title: string;
}) {
  const { colors, isDark } = useDashboardPalette();

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-1 rounded-2xl border p-3 active:opacity-80"
      onPress={onPress}
      style={{
        backgroundColor: isDark ? "rgba(39, 39, 42, 0.46)" : colors.surfaceStrong,
        borderColor: colors.border
      }}
    >
      <View className="mb-3 h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.iconSurface }}>
        <Icon color={colors.accent} size={18} strokeWidth={2.3} />
      </View>
      <Text className="text-[14px] font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
        {title}
      </Text>
      <Text className="mt-1 text-[12px] leading-4" numberOfLines={2} style={{ color: colors.textSecondary }}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

function WorkflowItem({ icon: Icon, subtitle, title }: (typeof workflowItems)[number]) {
  const { colors, isDark } = useDashboardPalette();

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-row items-start gap-4 rounded-2xl p-2 active:opacity-75"
      style={({ pressed }) => ({
        backgroundColor: pressed ? (isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(15, 23, 42, 0.04)") : "transparent"
      })}
    >
      <View
        className="h-11 w-11 items-center justify-center rounded-full"
        style={{ backgroundColor: isDark ? colors.surfaceStrong : colors.iconSurface }}
      >
        <Icon color={colors.accent} size={20} strokeWidth={2.25} />
      </View>
      <View className="min-w-0 flex-1 pt-0.5">
        <Text className="text-[16px] font-medium leading-6" style={{ color: colors.textPrimary }}>
          {title}
        </Text>
        <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
          {subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

function LiveSessionCard() {
  const { colors, isDark } = useDashboardPalette();
  const liveSession = useRecruiterStore((state) => state.liveSession);

  if (!liveSession || liveSession.status === "idle") return null;

  const isAnalyzing = liveSession.status === "analyzing";
  const progress = liveSession.totalCvs > 0
    ? Math.round((liveSession.analyzedCount / liveSession.totalCvs) * 100)
    : 0;

  return (
    <View
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: isDark ? "rgba(24, 24, 27, 0.42)" : colors.surface,
        borderColor: isAnalyzing ? colors.accent : colors.border
      }}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.08)" : colors.iconSurface }}>
          <Monitor color={colors.accent} size={18} strokeWidth={2.3} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[13px] font-bold uppercase tracking-wide" style={{ color: colors.accent }}>
            {isAnalyzing ? "Máy tính đang phân tích" : "Phân tích hoàn tất"}
          </Text>
          <Text className="mt-0.5 text-[13px] font-semibold" numberOfLines={1} style={{ color: colors.textPrimary }}>
            {liveSession.jobPosition || "Sàng lọc CV"}
          </Text>
        </View>
        {isAnalyzing && <ActivityIndicator color={colors.accent} size="small" />}
      </View>

      {liveSession.totalCvs > 0 && (
        <View className="mt-3">
          <View className="mb-1.5 flex-row justify-between">
            <Text className="text-[12px]" style={{ color: colors.textSecondary }}>
              {liveSession.analyzedCount} / {liveSession.totalCvs} hồ sơ
            </Text>
            <Text className="text-[12px] font-bold" style={{ color: colors.accent }}>
              {progress}%
            </Text>
          </View>
          <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: isDark ? "rgba(255,255,255,0.1)" : colors.iconSurface }}>
            <View
              className="h-full rounded-full"
              style={{ backgroundColor: colors.accent, width: `${progress}%` }}
            />
          </View>
        </View>
      )}
    </View>
  );
}

export function AppInfoScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, isDark, surfaceShadowStyle } = useDashboardPalette();
  const history = useRecruiterStore((state) => state.history);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const recentHistory = useMemo(
    () =>
      [...history]
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
        .slice(0, 3),
    [history]
  );
  const latestHistory = recentHistory[0];
  const latestCandidates = latestHistory?.totalCandidates || latestHistory?.topCandidates?.length || 0;

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Hipo Tools" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          alignItems: "center",
          backgroundColor: colors.background,
          paddingBottom: 96,
          paddingTop: 18
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4 px-4" style={{ width: contentWidth + 32 }}>
          <LiveSessionCard />

          <DashboardCard className="overflow-hidden p-5">
            <View className="flex-row items-start justify-between gap-4">
              <View className="min-w-0 flex-1">
                <Text className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: colors.accent }}>
                  Bảng điều khiển HR
                </Text>
                <Text className="mt-2 text-[24px] font-bold leading-8" style={{ color: colors.textPrimary }}>
                  Tổng quan tuyển dụng
                </Text>
                <Text className="mt-2 text-[14px] leading-5" style={{ color: colors.textSecondary }}>
                  Theo dõi hồ sơ, phiên lọc CV và nhận tư vấn phỏng vấn từ dữ liệu đã đồng bộ.
                </Text>
              </View>
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.iconSurface }}>
                <Sparkles color={colors.accent} size={22} strokeWidth={2.35} />
              </View>
            </View>

            <View
              className="mt-5 rounded-2xl border p-4"
              style={{
                backgroundColor: isDark ? "rgba(9, 9, 11, 0.38)" : colors.surfaceStrong,
                borderColor: colors.border
              }}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.iconSurface }}>
                  <Clock3 color={colors.accent} size={18} strokeWidth={2.3} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>
                    {latestHistory ? latestHistory.jobPosition || "Phiên lọc CV mới" : "Chưa có phiên lọc mới"}
                  </Text>
                  <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                    {latestHistory
                      ? `${formatDashboardDate(latestHistory.timestamp)} · ${latestCandidates} hồ sơ đã đồng bộ`
                      : "Lọc CV trên máy tính để dữ liệu xuất hiện tại đây."}
                  </Text>
                </View>
              </View>
            </View>
          </DashboardCard>

          <View className="flex-row gap-3">
            <QuickAction
              icon={FileSearch}
              onPress={() => navigation.navigate("Records")}
              subtitle="Xem ứng viên và lịch sử lọc"
              title="Mở hồ sơ"
            />
            <QuickAction
              icon={MessageCircle}
              onPress={() => navigation.navigate("Advisor")}
              subtitle="Tạo câu hỏi phỏng vấn"
              title="Tư vấn"
            />
          </View>

          <DashboardCard className="p-5">
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[18px] font-bold leading-7" style={{ color: colors.textPrimary }}>
                Phiên lọc gần đây
              </Text>
              <Pressable accessibilityRole="button" className="flex-row items-center gap-1 active:opacity-75" onPress={() => navigation.navigate("Templates")}>
                <Text className="text-[12px] font-semibold" style={{ color: colors.accent }}>
                  Xem tất cả
                </Text>
                <ChevronRight color={colors.accent} size={15} strokeWidth={2.4} />
              </Pressable>
            </View>

            {recentHistory.length > 0 ? (
              <View className="gap-1">
                {recentHistory.map((item) => (
                  <Pressable
                    accessibilityRole="button"
                    className="flex-row items-center gap-3 rounded-2xl py-2.5 active:opacity-75"
                    key={item.id}
                    onPress={() => navigation.navigate("Templates")}
                  >
                    <View className="h-10 w-10 items-center justify-center rounded-full" style={{ backgroundColor: colors.iconSurface }}>
                      <Clock3 color={colors.accent} size={18} strokeWidth={2.3} />
                    </View>
                    <View className="min-w-0 flex-1">
                      <Text className="text-[14px] font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                        {item.jobPosition || "Phiên lọc CV"}
                      </Text>
                      <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                        {formatDashboardDate(item.timestamp)} · {item.totalCandidates || item.topCandidates?.length || 0} hồ sơ
                      </Text>
                    </View>
                    <ChevronRight color={colors.textSecondary} size={17} strokeWidth={2.2} />
                  </Pressable>
                ))}
              </View>
            ) : (
              <View className="rounded-2xl border p-4" style={{ backgroundColor: isDark ? "rgba(39, 39, 42, 0.36)" : colors.surfaceStrong, borderColor: colors.border }}>
                <Text className="text-[14px] font-semibold" style={{ color: colors.textPrimary }}>
                  Chưa có dữ liệu đồng bộ
                </Text>
                <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
                  Sau khi lọc CV trên máy tính, phiên lọc mới sẽ xuất hiện ở đây và gửi thông báo về điện thoại.
                </Text>
              </View>
            )}
          </DashboardCard>

          <DashboardCard className="mt-2 p-5">
            <Text className="mb-4 text-[18px] font-bold leading-7" style={{ color: colors.textPrimary }}>
              Luồng làm việc
            </Text>
            <View className="gap-4">
              {workflowItems.map((item) => (
                <WorkflowItem key={item.title} {...item} />
              ))}
            </View>
          </DashboardCard>

          <View className="mt-1 flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 items-center justify-center rounded-xl active:opacity-80"
              onPress={() => navigation.navigate("Records")}
              style={{ backgroundColor: colors.accent }}
            >
              <Text className="text-sm font-semibold" style={{ color: colors.buttonText }}>
                Xem hồ sơ
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border active:opacity-80"
              onPress={() => navigation.navigate("Tools")}
              style={{
                backgroundColor: colors.surfaceStrong,
                borderColor: colors.border
              }}
            >
              <LayoutGrid color={colors.textPrimary} size={16} strokeWidth={2.3} />
              <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>
                Công cụ
              </Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
