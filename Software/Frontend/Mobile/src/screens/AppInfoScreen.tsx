import { useMemo, useEffect } from "react";
import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Bell,
  Bot,
  Briefcase,
  CheckCircle2,
  ChevronRight,
  Clock3,
  ExternalLink,
  FileSearch,
  History as HistoryIcon,
  LayoutGrid,
  MessageCircle,
  Monitor,
  RefreshCw,
  Sparkles,
  TrendingUp,
  type LucideIcon
} from "lucide-react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { CvMatchLogoMark } from "../components/CvMatchLogoMark";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function formatDashboardDate(timestamp?: number) {
  if (!timestamp) return "Chưa rõ";

  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  });
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

const workflowItems: Array<{
  icon: LucideIcon;
  title: string;
  subtitle: string;
  color: string;
}> = [
  {
    icon: CheckCircle2,
    title: "Lọc CV trên máy tính",
    subtitle: "Dữ liệu phiên lọc được đồng bộ về tài khoản di động.",
    color: "#10B981"
  },
  {
    icon: Bell,
    title: "Nhận thông báo tức thời",
    subtitle: "Màn hình thông báo hiển thị các kết quả lọc mới nhất.",
    color: "#F59E0B"
  },
  {
    icon: Bot,
    title: "Tư vấn ứng viên chuyên sâu",
    subtitle: "Trợ lý AI sử dụng dữ liệu đã lọc gợi ý bộ câu hỏi phỏng vấn.",
    color: "#8B5CF6"
  }
];

function LiveSessionCard() {
  const { colors, isDark } = useAppTheme();
  const liveSession = useRecruiterStore((state) => state.liveSession);

  if (!liveSession || liveSession.status === "idle") return null;

  const isAnalyzing = liveSession.status === "analyzing";
  const progress =
    liveSession.totalCvs > 0
      ? Math.round((liveSession.analyzedCount / liveSession.totalCvs) * 100)
      : 0;

  return (
    <View
      className="rounded-3xl border p-4"
      style={{
        backgroundColor: isDark ? "rgba(37,99,235,0.15)" : "rgba(37,99,235,0.06)",
        borderColor: isAnalyzing ? colors.accent : colors.border
      }}
    >
      <View className="flex-row items-center gap-3">
        <View
          className="h-10 w-10 items-center justify-center rounded-2xl"
          style={{ backgroundColor: isDark ? "rgba(37,99,235,0.25)" : "rgba(37,99,235,0.12)" }}
        >
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
          <View className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: colors.surfaceSoft }}>
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

function CandidateHomeView() {
  const navigation = useNavigation<Navigation>();
  const { colors, isDark, surfaceShadowStyle } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const candidateHistory = useRecruiterStore((state) => state.candidateHistory);
  const candidateHistoryLoading = useRecruiterStore((state) => state.candidateHistoryLoading);
  const loadCandidateHistory = useRecruiterStore((state) => state.loadCandidateHistory);
  const setQuickCvResults = useRecruiterStore((state) => state.setQuickCvResults);
  const { width } = useWindowDimensions();
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const accentColor = isDark ? "#6366F1" : "#2563EB";
  const greeting = getGreeting();

  const heroGrad = isDark
    ? { from: "#0F172A", mid: "#1E1B4B", to: "#0F172A" }
    : { from: "#EEF2FF", mid: "#E0E7FF", to: "#F0F4FF" };

  const handleOpenLink = (url: string) => {
    void Linking.openURL(url).catch((err) => console.warn("Không mở được link", err));
  };

  const handleViewDetail = (item: any) => {
    if (item.results && item.results.length > 0) {
      setQuickCvResults(item.results);
      navigation.navigate("QuickCvResult");
    }
  };

  const formatHistoryDate = (timestamp: any) => {
    if (!timestamp) return "";
    let time = 0;
    if (typeof timestamp === "number") time = timestamp;
    else if (timestamp.seconds) time = timestamp.seconds * 1000;
    else if (typeof timestamp === "string") time = Date.parse(timestamp);
    if (!time) return "";
    return new Date(time).toLocaleDateString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric"
    });
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      {/* Header */}
      <View className="border-b px-5 py-3.5" style={{ backgroundColor: colors.background, borderColor: colors.border }}>
        <View className="flex-row items-center justify-between" style={{ maxWidth: contentWidth + 32, alignSelf: "center", width: "100%" }}>
          <CvMatchLogoMark showText size={28} textColor={colors.textPrimary} />
          <View className="flex-row items-center gap-3">
            {authUser?.photoUrl ? (
              <Image className="rounded-full" source={{ uri: authUser.photoUrl }} style={{ height: 34, width: 34 }} />
            ) : (
              <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: isDark ? "rgba(99,102,241,0.18)" : "rgba(37,99,235,0.10)" }}>
                <Sparkles color={accentColor} size={16} strokeWidth={2.3} />
              </View>
            )}
          </View>
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          alignItems: "center",
          backgroundColor: colors.background,
          paddingBottom: 32,
          paddingTop: 0
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4.5 px-4 pt-4" style={{ width: contentWidth + 32 }}>
          {/* Welcome Banner with SVG Gradient */}
          <View className="overflow-hidden rounded-[32px] border" style={[{ borderColor: colors.border }, surfaceShadowStyle]}>
            <View className="absolute inset-0">
              <Svg height="100%" width="100%">
                <Defs>
                  <LinearGradient id="candidateHeroGrad" x1="0" x2="1" y1="0" y2="1">
                    <Stop offset="0" stopColor={heroGrad.from} stopOpacity="1" />
                    <Stop offset="0.5" stopColor={heroGrad.mid} stopOpacity="1" />
                    <Stop offset="1" stopColor={heroGrad.to} stopOpacity="1" />
                  </LinearGradient>
                </Defs>
                <Rect fill="url(#candidateHeroGrad)" height="100%" width="100%" />
              </Svg>
            </View>
            <View className="p-6 gap-2">
              <View className="flex-row items-center gap-2">
                <View className="h-6 w-6 items-center justify-center rounded-lg" style={{ backgroundColor: isDark ? "rgba(99,102,241,0.2)" : "rgba(37,99,235,0.12)" }}>
                  <Sparkles color={colors.accent} size={13} strokeWidth={2.5} />
                </View>
                <Text className="text-[11px] font-black uppercase tracking-wider" style={{ color: colors.accent }}>
                  Góc Ứng Viên
                </Text>
              </View>
              <Text className="text-[26px] font-black leading-8 mt-1" style={{ color: colors.textPrimary }}>
                {greeting},{"\n"}{authUser?.displayName || "bạn"}!
              </Text>
              <Text className="text-[13px] leading-5" style={{ color: colors.textSecondary }}>
                Cùng CV Match tối ưu hóa hồ sơ năng lực và chinh phục nhà tuyển dụng ngay hôm nay.
              </Text>
            </View>
          </View>

          {/* Quick Actions */}
          <View className="gap-3">
            <Pressable
              accessibilityRole="button"
              className="rounded-3xl p-5 flex-row items-center gap-4 active:scale-[0.99] border active:opacity-90"
              onPress={() => navigation.navigate("QuickCv")}
              style={[
                {
                  backgroundColor: colors.accentSoft,
                  borderColor: colors.border
                },
                surfaceShadowStyle
              ]}
            >
              <View className="h-12 w-12 items-center justify-center rounded-2xl shadow-sm" style={{ backgroundColor: colors.surface }}>
                <Briefcase color={colors.accent} size={22} strokeWidth={2.2} />
              </View>
              <View className="flex-1 min-w-0">
                <Text className="text-[16px] font-black" style={{ color: colors.textPrimary }}>
                  Bắt đầu chấm CV mới
                </Text>
                <Text className="mt-0.5 text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                  Tải CV và dán JD để phân tích độ khớp.
                </Text>
              </View>
              <ChevronRight color={colors.textSecondary} size={18} />
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                accessibilityRole="button"
                className="flex-1 rounded-3xl p-4 border active:opacity-85"
                onPress={() => handleOpenLink("https://www.aimatching.com.vn/for-candidates")}
                style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-[13px] font-black" style={{ color: colors.textPrimary }}>
                    Đọc kết quả đúng
                  </Text>
                  <ExternalLink color={colors.textSecondary} size={13} />
                </View>
                <Text className="text-[11px] leading-4" style={{ color: colors.textSecondary }}>
                  Cách đọc phân tích điểm mạnh, điểm yếu từ AI.
                </Text>
              </Pressable>

              <Pressable
                accessibilityRole="button"
                className="flex-1 rounded-3xl p-4 border active:opacity-85"
                onPress={() => handleOpenLink("https://www.aimatching.com.vn/privacy")}
                style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
              >
                <View className="flex-row items-center justify-between mb-1.5">
                  <Text className="text-[13px] font-black" style={{ color: colors.textPrimary }}>
                    Bảo mật dữ liệu
                  </Text>
                  <ExternalLink color={colors.textSecondary} size={13} />
                </View>
                <Text className="text-[11px] leading-4" style={{ color: colors.textSecondary }}>
                  Dữ liệu hồ sơ của bạn được lưu trữ an toàn.
                </Text>
              </Pressable>
            </View>
          </View>

          {/* CV Evaluation History */}
          <View className="rounded-3xl border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
            <View className="mb-4 flex-row items-center justify-between">
              <Text className="text-[16px] font-black" style={{ color: colors.textPrimary }}>
                Lịch sử đánh giá gần đây
              </Text>
              {candidateHistory.length > 0 && (
                <Pressable accessibilityRole="button" className="active:opacity-75 flex-row items-center gap-0.5" onPress={() => loadCandidateHistory()}>
                  <RefreshCw color={colors.accent} size={12} />
                  <Text className="text-[11px] font-bold" style={{ color: colors.accent }}>
                    Làm mới
                  </Text>
                </Pressable>
              )}
            </View>

            {candidateHistoryLoading ? (
              <View className="py-8 items-center justify-center">
                <ActivityIndicator color={colors.accent} size="small" />
              </View>
            ) : candidateHistory.length > 0 ? (
              <View className="gap-3">
                {candidateHistory.slice(0, 5).map((item, index) => {
                  const firstResult = item.results?.[0];
                  const score = firstResult?.score ?? null;
                  const fileName = firstResult?.file_name ?? "Hồ sơ không tên";
                  const targetRole = item.jdTitle || firstResult?.target_role || "Chấm CV nhanh";

                  // Color indicators based on score
                  const leftColor = score !== null ? (score >= 85 ? colors.success : score >= 65 ? colors.warning : colors.danger) : colors.border;

                  return (
                    <Pressable
                      accessibilityRole="button"
                      className="flex-row items-center gap-3 rounded-2xl p-3 border"
                      key={item.id || index}
                      onPress={() => handleViewDetail(item)}
                      style={{
                        backgroundColor: colors.surfaceSoft,
                        borderColor: colors.border,
                        borderLeftWidth: 4,
                        borderLeftColor: leftColor
                      }}
                    >
                      <View className="h-9 w-9 items-center justify-center rounded-xl bg-white dark:bg-neutral-800">
                        <HistoryIcon color={colors.accent} size={16} strokeWidth={2.3} />
                      </View>
                      <View className="min-w-0 flex-1">
                        <Text className="text-[14px] font-black leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                          {targetRole}
                        </Text>
                        <Text className="mt-0.5 text-[11px]" numberOfLines={1} style={{ color: colors.textSecondary }}>
                          {fileName}
                        </Text>
                        <Text className="mt-1 text-[10px] font-semibold" style={{ color: colors.textSecondary }}>
                          {formatHistoryDate(item.timestamp)}
                        </Text>
                      </View>
                      <View className="items-center flex-row gap-1">
                        {score !== null && (
                          <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.accentSoft }}>
                            <Text className="text-[11px] font-black" style={{ color: colors.accent }}>
                              {score}đ
                            </Text>
                          </View>
                        )}
                        <ChevronRight color={colors.textSecondary} size={16} strokeWidth={2.2} />
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            ) : (
              <View className="rounded-2xl border p-5 items-center justify-center" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
                <Text className="text-[13px] font-black text-center" style={{ color: colors.textPrimary }}>
                  Chưa có lịch sử chấm CV
                </Text>
                <Text className="mt-1 text-[11px] leading-4 text-center" style={{ color: colors.textSecondary }}>
                  Các hồ sơ bạn chấm điểm sẽ xuất hiện ở đây để theo dõi kết quả.
                </Text>
                <Pressable
                  accessibilityRole="button"
                  className="mt-3.5 px-5 py-2.5 rounded-xl shadow-sm"
                  onPress={() => navigation.navigate("QuickCv")}
                  style={{ backgroundColor: colors.accent }}
                >
                  <Text className="text-[12px] font-black text-white">Chấm CV ngay</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

export function AppInfoScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, isDark, surfaceShadowStyle } = useAppTheme();
  const history = useRecruiterStore((state) => state.history);
  const authUser = useRecruiterStore((state) => state.authUser);
  const loadCandidateHistory = useRecruiterStore((state) => state.loadCandidateHistory);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const greeting = getGreeting();

  useEffect(() => {
    if (authUser?.userRole === "candidate") {
      void loadCandidateHistory();
    }
  }, [authUser, loadCandidateHistory]);

  const recentHistory = useMemo(
    () =>
      [...history]
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
        .slice(0, 3),
    [history]
  );
  const latestHistory = recentHistory[0];
  const latestCandidates =
    latestHistory?.totalCandidates || latestHistory?.topCandidates?.length || 0;

  const totalCandidates = history.reduce(
    (sum, item) => sum + (item.totalCandidates || item.topCandidates?.length || 0),
    0
  );

  const heroGrad = isDark
    ? { from: "#0F172A", mid: "#1E1B4B", to: "#0F172A" }
    : { from: "#EEF2FF", mid: "#E0E7FF", to: "#F0F4FF" };

  const accentColor = isDark ? "#6366F1" : "#2563EB";

  if (authUser?.userRole === "candidate") {
    return <CandidateHomeView />;
  }

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      {/* Standard AppHeader — includes hamburger + logo */}
      <AppHeader
        right={
          authUser?.photoUrl ? (
            <Image
              className="rounded-full"
              source={{ uri: authUser.photoUrl }}
              style={{ height: 34, width: 34 }}
            />
          ) : undefined
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{
          paddingBottom: 32,
          paddingTop: 16
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Live Session Card */}
        <View className="px-4">
          <LiveSessionCard />
        </View>

        {/* Hero section — clean header */}
        <View className="px-4 pb-4">
          <View className="flex-row items-start justify-between gap-4">
            <View className="min-w-0 flex-1">
              <Text className="text-[26px] font-black leading-[32px]" style={{ color: colors.textPrimary }}>
                {greeting},{"\n"}Tuyển dụng 👋
              </Text>
              <Text className="mt-1.5 text-[13px] leading-[18px]" style={{ color: colors.textSecondary }}>
                Theo dõi hồ sơ, phiên lọc CV và tư vấn phỏng vấn từ AI.
              </Text>
            </View>
            <Image
              source={require("../../assets/brand/product-logo-mark.png") as any}
              style={{ width: 42, height: 42, resizeMode: "contain", marginTop: 4, opacity: 0.9 }}
            />
          </View>
        </View>

        {/* Stats card container */}
        <View className="px-4 pb-4">
          <View
            className="flex-row rounded-2xl border py-3.5"
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center border-r active:opacity-75"
              onPress={() => navigation.navigate("Records")}
              style={{ borderColor: colors.border }}
            >
              <Text className="text-[24px] font-black" style={{ color: colors.textPrimary }}>
                {totalCandidates}
              </Text>
              <Text className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: colors.textSecondary }}>
                Ứng viên
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center border-r active:opacity-75"
              onPress={() => navigation.navigate("Templates")}
              style={{ borderColor: colors.border }}
            >
              <Text className="text-[24px] font-black" style={{ color: colors.textPrimary }}>
                {history.length}
              </Text>
              <Text className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: colors.textSecondary }}>
                Phiên lọc
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="flex-1 items-center active:opacity-75"
              onPress={() => navigation.navigate("Records")}
            >
              <FileSearch color={colors.accent} size={22} strokeWidth={2.2} />
              <Text className="text-[11px] font-semibold uppercase tracking-wider mt-0.5" style={{ color: colors.accent }}>
                Hồ sơ
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Latest session card */}
        <View className="px-4 pb-4">
          <Text className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
            Phiên lọc gần nhất
          </Text>
          <Pressable
            accessibilityRole="button"
            className="flex-row items-center gap-3.5 rounded-2xl border p-4 active:opacity-75"
            onPress={() => navigation.navigate("Templates")}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View
              className="h-11 w-11 items-center justify-center rounded-xl"
              style={{ backgroundColor: colors.accentSoft }}
            >
              <Clock3 color={colors.accent} size={20} strokeWidth={2.3} />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-[15px] font-semibold" numberOfLines={1} style={{ color: colors.textPrimary }}>
                {latestHistory ? latestHistory.jobPosition || "Phiên lọc CV mới" : "Chưa có phiên lọc mới"}
              </Text>
              <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                {latestHistory
                  ? `${formatDashboardDate(latestHistory.timestamp)} · ${latestCandidates} hồ sơ đã đồng bộ`
                  : "Lọc CV trên máy tính để dữ liệu xuất hiện tại đây."}
              </Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={17} strokeWidth={2.2} />
          </Pressable>
        </View>

        {/* Recent Sessions list */}
        {recentHistory.length > 0 && (
          <View className="px-4 pb-4">
            <View className="flex-row items-center justify-between pb-2">
              <Text className="text-[11px] font-bold uppercase tracking-wider" style={{ color: colors.textSecondary }}>
                Gần đây
              </Text>
              <Pressable
                accessibilityRole="button"
                className="flex-row items-center gap-0.5 active:opacity-75"
                onPress={() => navigation.navigate("Templates")}
              >
                <Text className="text-[12px] font-bold" style={{ color: colors.accent }}>Xem tất cả</Text>
                <ChevronRight color={colors.accent} size={13} strokeWidth={2.5} />
              </Pressable>
            </View>
            <View className="overflow-hidden rounded-2xl border" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              {recentHistory.map((item, idx) => (
                <Pressable
                  accessibilityRole="button"
                  className="flex-row items-center gap-3.5 px-4 py-3.5 active:opacity-75"
                  key={item.id}
                  onPress={() => navigation.navigate("Templates")}
                  style={{
                    borderBottomWidth: idx < recentHistory.length - 1 ? 0.7 : 0,
                    borderBottomColor: colors.border
                  }}
                >
                  <View
                    className="h-10 w-10 items-center justify-center rounded-xl"
                    style={{ backgroundColor: colors.accentSoft }}
                  >
                    <Clock3 color={colors.accent} size={18} strokeWidth={2.3} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-[14px] font-semibold" numberOfLines={1} style={{ color: colors.textPrimary }}>
                      {item.jobPosition || "Phiên lọc CV"}
                    </Text>
                    <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                      {formatDashboardDate(item.timestamp)} · {item.totalCandidates || item.topCandidates?.length || 0} hồ sơ
                    </Text>
                  </View>
                  <ChevronRight color={colors.textSecondary} size={16} strokeWidth={2.2} />
                </Pressable>
              ))}
            </View>
          </View>
        )}

        {/* Bottom CTAs */}
        <View className="flex-row gap-3 px-4 pt-2">
          <Pressable
            accessibilityRole="button"
            className="min-h-12 flex-1 items-center justify-center rounded-xl active:opacity-85"
            onPress={() => navigation.navigate("Records")}
            style={{ backgroundColor: colors.accent }}
          >
            <Text className="text-sm font-bold text-white">Xem hồ sơ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl border active:opacity-85"
            onPress={() => navigation.navigate("Tools")}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <LayoutGrid color={colors.textPrimary} size={15} strokeWidth={2.3} />
            <Text className="text-sm font-bold" style={{ color: colors.textPrimary }}>Công cụ</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
