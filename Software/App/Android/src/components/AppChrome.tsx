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
  ChevronLeft,
  Clock3,
  Home,
  LayoutGrid,
  Menu,
  Moon,
  Search,
  Sun,
  UsersRound
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { HipoLogoMark } from "./HipoLogoMark";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type MenuRoute = "Home" | "Records" | "Tools" | "Notifications" | "Inbox" | "Templates" | "QuickCv" | "Advisor" | "AdvisorChatHistory" | "Account";
type BottomRoute = "Home" | "Records" | "Tools" | "Notifications";

const cvFilterItem: {
  title: string;
  icon: typeof Home;
  url: string;
} = {
  title: "Lọc CV",
  icon: BriefcaseBusiness,
  url: "https://www.supporthr-tf.com.vn/"
};

const bottomItems: Array<{
  route: BottomRoute;
  label: string;
  icon: typeof Home;
}> = [
  { route: "Home", label: "Trang chủ", icon: Home },
  { route: "Records", label: "Hồ sơ", icon: UsersRound },
  { route: "Tools", label: "Công cụ", icon: LayoutGrid },
  { route: "Notifications", label: "Thông báo", icon: Bell }
];

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
          resizeMode="cover"
          source={{ uri: authUser?.photoUrl || "" }}
          style={{ height: size, width: size }}
        />
      ) : (
        <HipoLogoMark size={Math.max(size * 0.7, 24)} />
      )}
    </View>
  );
}

function formatHistoryDate(timestamp?: number) {
  if (!timestamp) return "Chưa rõ";

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
        background: "#09090B",
        surface: "rgba(24, 24, 27, 0.72)",
        surfaceSoft: "rgba(39, 39, 42, 0.72)",
        surfaceRaised: "rgba(24, 24, 27, 0.82)",
        border: "rgba(255, 255, 255, 0.10)",
        textPrimary: "#FAFAFA",
        textSecondary: "#71717A",
        accent: "#F3E5D8"
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
              <Pressable
                accessibilityLabel={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                accessibilityRole="button"
                className="h-10 w-10 items-center justify-center rounded-xl transition-all duration-200 active:opacity-70"
                onPress={toggleTheme}
                style={{ backgroundColor: "transparent" }}
              >
                <ThemeIcon color={chromeColors.accent} size={20} strokeWidth={2.35} />
              </Pressable>

              {right ? <View className="min-w-0 flex-1">{right}</View> : <View className="flex-1" />}
            </>
          )}
        </View>
      </View>

      <Modal animationType="fade" onRequestClose={() => setDrawerOpen(false)} transparent visible={drawerOpen && route.name === activeRouteName}>
        <View className="flex-1" style={{ backgroundColor: colors.background }}>
          <SafeAreaView className="flex-1" edges={["top", "bottom"]} style={{ backgroundColor: colors.background }}>
            <View className="flex-1">
              <View className="px-5 pb-4 pt-5">
                <View className="flex-row items-center justify-between gap-3">
                  <Text className="min-w-0 flex-1 text-[27px] font-medium leading-9" numberOfLines={1} style={{ color: colors.textPrimary }}>
                    Hipo Tools
                  </Text>
                  <View
                    className="h-10 flex-row items-center gap-2 rounded-[20px] border px-2"
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <Pressable
                      accessibilityLabel={isDark ? "Chuyển sang giao diện sáng" : "Chuyển sang giao diện tối"}
                      accessibilityRole="button"
                      className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
                      onPress={toggleTheme}
                    >
                      <ThemeIcon color={colors.accent} size={18} strokeWidth={2.4} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Tìm lịch sử"
                      accessibilityRole="button"
                      className="h-8 w-8 items-center justify-center rounded-full active:opacity-70"
                      onPress={() => setHistorySearchOpen((current) => !current)}
                    >
                      <Search color={colors.textPrimary} size={19} strokeWidth={2.4} />
                    </Pressable>
                    <Pressable
                      accessibilityLabel="Mở cài đặt tài khoản"
                      accessibilityRole="button"
                      className="active:opacity-70"
                      onPress={() => navigateTo("Account")}
                    >
                      <AccountAvatar size={30} />
                    </Pressable>
                  </View>
                  <Pressable
                    accessibilityLabel="Đóng menu"
                    accessibilityRole="button"
                    className="h-10 w-10 items-center justify-center rounded-[20px] border active:opacity-70"
                    onPress={() => setDrawerOpen(false)}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <ChevronLeft color={colors.textPrimary} size={21} strokeWidth={2.5} />
                  </Pressable>
                </View>
              </View>

              <ScrollView
                className="flex-1 px-5"
                contentContainerStyle={{ paddingBottom: 18 }}
                showsVerticalScrollIndicator={false}
              >
                <View>
                  <Text className="mb-2 text-[12px] font-semibold uppercase" style={{ color: colors.textSecondary }}>
                    Menu
                  </Text>

                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[54px] flex-row items-center gap-5 rounded-xl px-0 transition-all duration-200 active:opacity-75"
                    onPress={() => openExternalUrl(cvFilterItem.url)}
                  >
                    <CvFilterIcon color={colors.textPrimary} size={21} strokeWidth={1.95} />
                    <Text className="flex-1 text-[17px] font-medium leading-6" style={{ color: colors.textPrimary }}>{cvFilterItem.title}</Text>
                  </Pressable>

                </View>

                <View className="mt-6">
                  <View className="mb-4 flex-row items-center justify-between">
                    <Text className="text-[20px] font-semibold leading-7" style={{ color: colors.textPrimary }}>
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
                              className={[
                                "min-h-10 items-center justify-center rounded-full px-4 active:opacity-75",
                                ""
                              ].join(" ")}
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
                            className="min-h-[56px] justify-center transition-all duration-200 active:opacity-70"
                            key={item.id}
                            onPress={() => navigateTo("Templates")}
                          >
                            <Text className="text-[15px] font-medium leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                              {item.jobPosition || "Phiên lọc CV"}
                            </Text>
                            <Text className="mt-1 text-[13px] leading-5" numberOfLines={1} style={{ color: colors.textSecondary }}>
                              {formatHistoryDate(item.timestamp)} · {item.totalCandidates || 0} hồ sơ
                            </Text>
                          </Pressable>
                        ))
                      ) : (
                        <View className="min-h-[52px] justify-center">
                          <Text className="text-[15px] font-medium leading-5" style={{ color: colors.textSecondary }}>Không có kết quả phù hợp</Text>
                        </View>
                      )}

                      {filteredHistory.length > 4 ? (
                        <Pressable
                          accessibilityRole="button"
                          className="mt-2 min-h-11 items-center justify-center rounded-full active:opacity-75"
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
                      <Text className="text-[16px] font-semibold leading-6" style={{ color: colors.textPrimary }}>
                        Chưa có lịch sử lọc
                      </Text>
                      <Text className="mt-1 text-[14px] leading-5" style={{ color: colors.textSecondary }}>
                        Mở trang lịch sử để đồng bộ dữ liệu.
                      </Text>
                    </Pressable>
                  )}
                </View>
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
                    <Text className="text-[15px] font-medium leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                      {authUser?.displayName || "Tài khoản"}
                    </Text>
                    <Text className="mt-0.5 text-[13px] leading-5" numberOfLines={1} style={{ color: colors.textSecondary }}>
                      {authUser?.email || "Chưa đăng nhập"}
                    </Text>
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

export function BottomNav({ forceDark = false }: { forceDark?: boolean }) {
  const navigation = useNavigation<Navigation>();
  const route = useRoute();
  const { colors } = useAppTheme();
  const chromeColors = forceDark
    ? {
        ...colors,
        background: "rgba(9, 9, 11, 0.88)",
        surfaceSoft: "rgba(39, 39, 42, 0.42)",
        border: "rgba(255, 255, 255, 0.10)",
        textSecondary: "#71717A",
        accent: "#F3E5D8"
      }
    : colors;
  const currentRouteName = route.name;

  const isBottomItemActive = (target: BottomRoute) => {
    if (target === "Records") {
      return ["Records", "Inbox", "Templates", "Detail"].includes(currentRouteName);
    }

    if (target === "Tools") {
      return ["Tools", "QuickCv", "QuickCvResult", "Advisor", "AdvisorChatHistory", "JDStandardizer", "JDStandardizerResult"].includes(currentRouteName);
    }

    return currentRouteName === target;
  };

  return (
    <SafeAreaView
      className="border-t px-0 pt-1"
      edges={["bottom"]}
      style={{ backgroundColor: chromeColors.background, borderColor: chromeColors.border }}
    >
      <View className="flex-row">
        {bottomItems.map((item) => {
          const Icon = item.icon;
          const active = isBottomItemActive(item.route);

          return (
            <Pressable
              accessibilityRole="button"
              className={[
                "min-h-[56px] flex-1 items-center justify-center border-t-2 transition-all duration-200 active:opacity-75",
                active ? "" : "border-transparent"
              ].join(" ")}
              key={item.route}
              onPress={() => {
                if (currentRouteName !== item.route) {
                  navigation.navigate(item.route);
                }
              }}
              style={{
                backgroundColor: active ? chromeColors.surfaceSoft : "transparent",
                borderTopColor: active ? chromeColors.accent : "transparent"
              }}
            >
              <Icon color={active ? chromeColors.accent : chromeColors.textSecondary} size={19} strokeWidth={2.35} />
              <Text
                className="mt-1 text-[11px] font-semibold"
                style={{ color: active ? chromeColors.accent : chromeColors.textSecondary }}
              >
                {item.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export function RouteLoadingOverlay({ active }: { active: boolean }) {
  return null;
}

