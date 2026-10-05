import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { useNavigation, useNavigationState, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  BriefcaseBusiness,
  Bell,
  Bot,
  Camera,
  ChevronLeft,
  FileText,
  Home,
  LayoutGrid,
  Menu,
  Monitor,
  Moon,
  Search,
  Sun,
  UsersRound
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { CvMatchLogoMark } from "./CvMatchLogoMark";
import { PageTransitionProgressBar } from "./Motion";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type MenuRoute =
  | "Home"
  | "Records"
  | "Tools"
  | "Notifications"
  | "Inbox"
  | "Templates"
  | "QuickCv"
  | "Advisor"
  | "AdvisorChatHistory"
  | "Account"
  | "PCConnect"
  | "JDStandardizer";

const cvFilterItem: {
  title: string;
  icon: typeof Home;
  url: string;
} = {
  title: "Lọc CV",
  icon: BriefcaseBusiness,
  url: "https://www.aimatching.com.vn/"
};

function AccountAvatar({ size = 32 }: { size?: number }) {
  const { colors } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(authUser?.photoUrl && !failed);

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full"
      style={{ backgroundColor: colors.surfaceSoft, height: size, width: size }}
    >
      {showImage ? (
        <Image
          onError={() => setFailed(true)}
          source={{ uri: authUser?.photoUrl || undefined }}
          style={{ height: size, width: size }}
        />
      ) : (
        <Text className="font-bold uppercase" style={{ color: colors.textPrimary, fontSize: Math.max(11, size * 0.38) }}>
          {(authUser?.displayName || authUser?.email || "U").slice(0, 1).toUpperCase()}
        </Text>
      )}
    </View>
  );
}

function formatHistoryDate(timestamp?: number) {
  if (!timestamp) return "Chưa rõ thời gian";
  return new Date(timestamp).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  });
}

function getHistoryDateKey(timestamp?: number) {
  if (!timestamp) return "";

  return new Date(timestamp).toISOString().slice(0, 10);
}

export function AppHeader({
  forceDark = false,
  minimal = false,
  title,
  subtitle,
  right
}: {
  title?: string;
  subtitle?: string;
  right?: ReactNode;
  minimal?: boolean;
  forceDark?: boolean;
}) {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const activeRouteName = useNavigationState((state) => state.routes[state.index]?.name);
  const { width } = useWindowDimensions();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const chromeColors = forceDark
    ? {
        ...colors,
        background: "#0B0F19",
        surface: "rgba(19, 26, 41, 0.85)",
        surfaceSoft: "rgba(14, 20, 34, 0.85)",
        surfaceRaised: "rgba(26, 35, 54, 0.9)",
        border: "rgba(255, 255, 255, 0.09)",
        textPrimary: "#F8FAFC",
        textSecondary: "#94A3B8",
        accent: "#3B82F6"
      }
    : colors;
  const authUser = useRecruiterStore((state) => state.authUser);
  const history = useRecruiterStore((state) => state.history);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [pendingRoute, setPendingRoute] = useState<MenuRoute | null>(null);
  const [historyExpanded, setHistoryExpanded] = useState(false);
  const [historySearchOpen, setHistorySearchOpen] = useState(false);
  const [historyQuery, setHistoryQuery] = useState("");
  const [historyDateFilter, setHistoryDateFilter] = useState<"all" | "month" | "today">("all");
  const contentWidth = Math.min(width, 430);
  const filteredHistory = useMemo(() => {
    const normalizedQuery = historyQuery.trim().toLowerCase();
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7);
    const today = now.toISOString().slice(0, 10);

    return history.filter((item) => {
      const historyText = [
        item.jobPosition,
        item.userEmail,
        item.locationRequirement,
        item.fullPayload?.jobPosition,
        item.fullPayload?.jdText,
        ...(item.fullPayload?.candidates || []).map((candidate) =>
          `${candidate.candidateName || ""} ${candidate.name || ""} ${candidate.jobTitle || ""} ${candidate.email || ""}`
        ),
        ...(item.topCandidates || []).map((candidate) => `${candidate.name || ""} ${candidate.grade || ""}`)
      ]
        .join(" ")
        .toLowerCase();
      const dateKey = getHistoryDateKey(item.timestamp);
      const matchesTitle = !normalizedQuery || historyText.includes(normalizedQuery);
      const matchesDate =
        historyDateFilter === "all" ||
        (historyDateFilter === "month" && dateKey.startsWith(currentMonth)) ||
        (historyDateFilter === "today" && dateKey === today);

      return matchesTitle && matchesDate;
    });
  }, [history, historyDateFilter, historyQuery]);
  const visibleHistory = historyExpanded ? filteredHistory.slice(0, 20) : filteredHistory.slice(0, 4);

  useEffect(() => {
    return navigation.addListener("blur", () => {
      setDrawerOpen(false);
      setPendingRoute(null);
    });
  }, [navigation]);

  useEffect(() => {
    if (drawerOpen || !pendingRoute) return;

    const target = pendingRoute;
    setPendingRoute(null);
    if (route.name !== target) {
      navigation.navigate(target);
    }
  }, [drawerOpen, navigation, pendingRoute, route.name]);

  const navigateTo = (target: MenuRoute) => {
    setPendingRoute(target);
    setDrawerOpen(false);
  };

  const openExternalUrl = (url: string) => {
    setDrawerOpen(false);
    void Linking.openURL(url);
  };

  const CvFilterIcon = cvFilterItem.icon;
  const ThemeIcon = forceDark ? Sun : isDark ? Sun : Moon;

  return (
    <>
      <View
        className="z-40 mb-0 w-full border-b"
        style={{
          backgroundColor: minimal ? (forceDark || isDark ? chromeColors.background : chromeColors.surfaceRaised) : chromeColors.background,
          borderColor: chromeColors.border
        }}
      >
        <View
          className={["min-h-[58px] flex-row items-center px-4 py-2", minimal ? "justify-between" : "gap-2"].join(" ")}
          style={{ alignSelf: "center", width: contentWidth }}
        >
          <Pressable
            accessibilityLabel="Mở menu"
            accessibilityRole="button"
            className="h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:opacity-70"
            onPress={() => setDrawerOpen(true)}
            style={{ backgroundColor: "transparent" }}
          >
            <Menu color={chromeColors.accent} size={22} strokeWidth={2.45} />
          </Pressable>

          {minimal ? (
            <>
              <Text className="min-w-0 flex-1 text-center text-[16px] font-semibold leading-6" numberOfLines={1} style={{ color: chromeColors.textPrimary }}>
                {title}
              </Text>
              {right ? <View className="mr-1">{right}</View> : null}
              <Pressable
                accessibilityLabel={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:opacity-70"
                onPress={toggleTheme}
                style={{ backgroundColor: "transparent" }}
              >
                <ThemeIcon color={chromeColors.accent} size={20} strokeWidth={2.35} />
              </Pressable>
            </>
          ) : (
            <>
              {/* Center: Logo + Match brand */}
              <View className="min-w-0 flex-1 items-center">
                <CvMatchLogoMark showText size={26} textColor={chromeColors.textPrimary} />
              </View>

              {/* Right: notification bell + avatar */}
              {right ? (
                <View>{right}</View>
              ) : (
                <View className="flex-row items-center gap-1.5">
                  <Pressable
                    accessibilityLabel="Thông báo"
                    accessibilityRole="button"
                    className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
                    onPress={() => navigation.navigate("Notifications")}
                  >
                    <Bell color={chromeColors.textPrimary} size={19} strokeWidth={2.2} />
                  </Pressable>
                  <Pressable
                    accessibilityLabel="Mở cài đặt tài khoản"
                    accessibilityRole="button"
                    className="active:opacity-70"
                    onPress={() => setDrawerOpen(true)}
                  >
                    <AccountAvatar size={34} />
                  </Pressable>
                </View>
              )}
            </>
          )}
        </View>
      </View>

      <Modal animationType="fade" onRequestClose={() => setDrawerOpen(false)} transparent visible={drawerOpen && route.name === activeRouteName}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <SafeAreaView className="flex-1" edges={["top", "bottom"]} style={{ backgroundColor: colors.background }}>
            <View className="flex-1">
              <View className="px-5 pb-4 pt-5">
                <View className="flex-row items-center justify-between">
                  <CvMatchLogoMark showText size={28} />
                  <Pressable
                    accessibilityLabel="Đóng menu"
                    accessibilityRole="button"
                    className="h-9 w-9 items-center justify-center rounded-xl border active:opacity-70"
                    onPress={() => setDrawerOpen(false)}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <ChevronLeft color={colors.textPrimary} size={19} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 18 }}
                showsVerticalScrollIndicator={false}
              >
                {/* Primary navigation — ChatGPT style: tools listed directly */}
                <View className="pb-3">
                  {authUser?.userRole === "candidate" ? (
                    [
                      { route: "QuickCv" as MenuRoute, label: "Chấm CV nhanh", Icon: Camera }
                    ].map(({ route: r, label, Icon }) => {
                      const isActive = route.name === r;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          className="min-h-[50px] flex-row items-center gap-4 rounded-xl px-3 active:opacity-75"
                          key={r}
                          onPress={() => navigateTo(r)}
                          style={{ backgroundColor: isActive ? colors.surfaceSoft : "transparent" }}
                        >
                          <Icon
                            color={isActive ? colors.accent : colors.textPrimary}
                            size={19}
                            strokeWidth={isActive ? 2.5 : 1.95}
                          />
                          <Text
                            className="flex-1 text-[16px] leading-6"
                            style={{
                              color: isActive ? colors.accent : colors.textPrimary,
                              fontWeight: isActive ? "700" : "500"
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })
                  ) : (
                    [
                      { route: "Records" as MenuRoute, label: "Hồ sơ tuyển dụng", Icon: UsersRound },
                      { route: "PCConnect" as MenuRoute, label: "Kết nối PC", Icon: Monitor },
                      { route: "QuickCv" as MenuRoute, label: "Chấm điểm CV nhanh", Icon: Camera },
                      { route: "Advisor" as MenuRoute, label: "Chatbot tư vấn AI", Icon: Bot },
                      { route: "JDStandardizer" as MenuRoute, label: "Chuẩn hóa JD tuyển dụng", Icon: FileText }
                    ].map(({ route: r, label, Icon }) => {
                      const isActive = route.name === r;
                      return (
                        <Pressable
                          accessibilityRole="button"
                          className="min-h-[50px] flex-row items-center gap-4 rounded-xl px-3 active:opacity-75"
                          key={r}
                          onPress={() => navigateTo(r)}
                          style={{ backgroundColor: isActive ? colors.surfaceSoft : "transparent" }}
                        >
                          <Icon
                            color={isActive ? colors.accent : colors.textPrimary}
                            size={19}
                            strokeWidth={isActive ? 2.5 : 1.95}
                          />
                          <Text
                            className="flex-1 text-[16px] leading-6"
                            style={{
                              color: isActive ? colors.accent : colors.textPrimary,
                              fontWeight: isActive ? "700" : "500"
                            }}
                          >
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })
                  )}
                </View>

                {/* Recent sessions section */}
                {authUser?.userRole !== "candidate" && (
                  <View className="mt-4 pt-3 border-t" style={{ borderColor: colors.border }}>
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text className="text-[17px] font-semibold leading-6" style={{ color: colors.textPrimary }}>
                        Gần đây
                      </Text>
                      {history.length > 0 ? (
                        <Text className="text-xs font-medium" style={{ color: colors.textSecondary }}>
                          {filteredHistory.length}/{history.length}
                        </Text>
                      ) : null}
                    </View>

                    {history.length > 0 ? (
                      <>
                        {historySearchOpen || historyQuery ? (
                          <TextInput
                            autoFocus={historySearchOpen}
                            className="mb-3 min-h-11 rounded-xl px-3 text-sm font-normal"
                            onChangeText={setHistoryQuery}
                            placeholder="Tìm tiêu đề, ứng viên, nội dung JD..."
                            placeholderTextColor={colors.textSecondary}
                            style={{ backgroundColor: colors.surface, color: colors.textPrimary }}
                            value={historyQuery}
                          />
                        ) : null}

                        <View className="mb-3 flex-row gap-2">
                          {[
                            { key: "all" as const, label: "Tất cả" },
                            { key: "month" as const, label: "Tháng" },
                            { key: "today" as const, label: "Hôm nay" }
                          ].map((filter) => {
                            const active = historyDateFilter === filter.key;
                            return (
                              <Pressable
                                accessibilityRole="button"
                                className="min-h-9 items-center justify-center rounded-full px-4 active:opacity-75"
                                key={filter.key}
                                onPress={() => setHistoryDateFilter(filter.key)}
                                style={{ backgroundColor: active ? colors.accent : "transparent" }}
                              >
                                <Text
                                  className="text-xs font-medium"
                                  style={{ color: active ? "#111827" : colors.textSecondary }}
                                >
                                  {filter.label}
                                </Text>
                              </Pressable>
                            );
                          })}
                        </View>

                        {visibleHistory.length > 0 ? (
                          visibleHistory.map((item) => (
                            <Pressable
                              accessibilityRole="button"
                              className="min-h-[52px] justify-center py-1.5 transition-all duration-200 active:opacity-70"
                              key={item.id}
                              onPress={() => navigateTo("Templates")}
                            >
                              <Text className="text-[14px] font-medium leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                                {item.jobPosition || "Phiên lọc CV"}
                              </Text>
                              <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                                {formatHistoryDate(item.timestamp)} · {item.totalCandidates || 0} hồ sơ
                              </Text>
                            </Pressable>
                          ))
                        ) : (
                          <View className="min-h-[52px] justify-center">
                            <Text className="text-[14px] font-medium leading-5" style={{ color: colors.textSecondary }}>Không có kết quả phù hợp</Text>
                          </View>
                        )}

                        {filteredHistory.length > 4 ? (
                          <Pressable
                            accessibilityRole="button"
                            className="mt-3 min-h-10 items-center justify-center rounded-full active:opacity-75"
                            onPress={() => setHistoryExpanded((current) => !current)}
                            style={{ backgroundColor: colors.surface }}
                          >
                            <Text className="text-xs font-medium" style={{ color: colors.textPrimary }}>
                              {historyExpanded ? "Thu gọn" : `Xem thêm ${filteredHistory.length - 4} phiên`}
                            </Text>
                          </Pressable>
                        ) : null}
                      </>
                    ) : (
                      <Pressable
                        accessibilityRole="button"
                        className="min-h-[62px] justify-center active:opacity-75"
                        onPress={() => navigateTo("Templates")}
                      >
                        <Text className="text-[15px] font-semibold leading-6" style={{ color: colors.textPrimary }}>
                          Chưa có lịch sử lọc
                        </Text>
                        <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
                          Mở trang lịch sử để đồng bộ dữ liệu.
                        </Text>
                      </Pressable>
                    )}
                  </View>
                )}
              </ScrollView>

              <View className="border-t px-5 py-4" style={{ borderColor: colors.border }}>
                <Pressable
                  accessibilityLabel="Mở cài đặt tài khoản"
                  accessibilityRole="button"
                  className="min-h-[52px] flex-row items-center gap-3 rounded-xl active:opacity-75"
                  onPress={() => navigateTo("Account")}
                >
                  <AccountAvatar size={36} />
                  <View className="min-w-0 flex-1">
                    <Text className="text-[15px] font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                      {authUser?.displayName || "Tài khoản"}
                    </Text>
                    <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                      {authUser?.email || "Chưa đăng nhập"}
                    </Text>
                  </View>
                  {/* Theme + Search controls */}
                  <View className="flex-row items-center gap-1">
                    <Pressable
                      accessibilityLabel={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                      accessibilityRole="button"
                      className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
                      onPress={toggleTheme}
                      style={{ backgroundColor: colors.surfaceSoft }}
                    >
                      <ThemeIcon color={colors.accent} size={17} strokeWidth={2.4} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Tìm lịch sử"
                      accessibilityRole="button"
                      className="h-9 w-9 items-center justify-center rounded-xl active:opacity-70"
                      onPress={() => setHistorySearchOpen((current) => !current)}
                      style={{ backgroundColor: colors.surfaceSoft }}
                    >
                      <Search color={colors.textPrimary} size={17} strokeWidth={2.4} />
                    </Pressable>
                  </View>
                </Pressable>
              </View>
            </View>
          </SafeAreaView>

        </View>
      </Modal>
    </>
  );
}

export function BottomNav(_props?: { forceDark?: boolean }) {
  return null;
}

export function RouteLoadingOverlay({ active }: { active: boolean }) {
  return <PageTransitionProgressBar active={active} />;
}

