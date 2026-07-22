import { Image, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View, type TextInputProps } from "react-native";
import { useEffect, useState } from "react";
import * as Google from "expo-auth-session/build/providers/Google";
import * as WebBrowser from "expo-web-browser";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  CheckCircle2,
  ChevronRight,
  Chrome,
  Clock,
  Database,
  History,
  LockKeyhole,
  Mail,
  RefreshCw,
  Settings,
  ShieldCheck,
  Smartphone
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { HipoLogoMark } from "../components/HipoLogoMark";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { LoginHistoryEntry } from "../types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

WebBrowser.maybeCompleteAuthSession();

function AccountPhoto({ size = 58 }: { size?: number }) {
  const { colors } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(authUser?.photoUrl && !failed);

  return (
    <View
      className="items-center justify-center overflow-hidden rounded-full border"
      style={{
        backgroundColor: colors.surfaceSoft,
        borderColor: authUser ? colors.accent : colors.border,
        borderWidth: authUser ? 1.5 : 1,
        height: size,
        width: size
      }}
    >
      {showImage ? (
        <Image
          onError={() => setFailed(true)}
          resizeMode="cover"
          source={{ uri: authUser?.photoUrl || "" }}
          style={{ height: size, width: size }}
        />
      ) : (
        <HipoLogoMark size={Math.max(size * 0.72, 30)} />
      )}
    </View>
  );
}

function StatPill({ label, value }: { label: string; value: string | number }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  return (
    <View
      className="min-h-[66px] flex-1 justify-center rounded-2xl border px-3"
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
    >
      <Text className="text-[22px] font-black" style={{ color: colors.textPrimary }}>{value}</Text>
      <Text className="mt-0.5 text-[11px] font-bold" style={{ color: colors.textSecondary }}>{label}</Text>
    </View>
  );
}

function StatsOverview({
  candidatesCount,
  historyCount,
  templatesCount
}: {
  candidatesCount: number;
  historyCount: number;
  templatesCount: number | string;
}) {
  const { colors, surfaceShadowStyle } = useAppTheme();
  const items = [
    { label: "Lịch sử", value: historyCount },
    { label: "Hồ sơ", value: candidatesCount },
    { label: "Mẫu JD", value: templatesCount }
  ];

  return (
    <View
      className="flex-row rounded-3xl border px-2 py-4"
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
    >
      {items.map((item, index) => (
        <View className="min-h-[64px] flex-1 items-center justify-center" key={item.label}>
          <Text className="text-[28px] font-black leading-8" style={{ color: colors.textPrimary }}>{item.value}</Text>
          <Text className="mt-1 text-[11px] font-semibold" style={{ color: colors.textSecondary }}>{item.label}</Text>
          {index < items.length - 1 ? (
            <View className="absolute right-0 top-2 h-12 w-px" style={{ backgroundColor: colors.border, opacity: 0.65 }} />
          ) : null}
        </View>
      ))}
    </View>
  );
}

function AuthField({
  focused,
  icon: Icon,
  label,
  value,
  ...inputProps
}: TextInputProps & {
  focused: boolean;
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  const { colors, isDark } = useAppTheme();
  const active = focused || value.length > 0;

  return (
    <View>
      {active ? (
        <Text className="mb-1.5 ml-1 text-[11px] font-semibold" style={{ color: focused ? colors.accent : colors.textSecondary }}>
          {label}
        </Text>
      ) : null}
      <View
        className="min-h-[48px] flex-row items-center gap-2.5 rounded-2xl px-3.5"
        style={{
          backgroundColor: isDark ? "#0F0F10" : colors.surfaceSoft,
          borderColor: focused ? colors.accent : colors.border,
          borderWidth: 1
        }}
      >
        <Icon color={focused ? colors.accent : colors.textSecondary} size={18} strokeWidth={2.15} />
        <TextInput
          {...inputProps}
          className="min-h-[48px] min-w-0 flex-1 text-[13px] font-medium"
          placeholderTextColor={colors.textSecondary}
          style={{ color: colors.textPrimary }}
          value={value}
        />
      </View>
    </View>
  );
}

function formatLoginTime(timestamp: number) {
  return new Date(timestamp).toLocaleString("vi-VN", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "2-digit"
  });
}

function LoginHistoryPanel({ entries }: { entries: LoginHistoryEntry[] }) {
  const { colors, surfaceShadowStyle } = useAppTheme();
  const visibleEntries =
    entries.length > 0
      ? entries.slice(0, 4)
      : [
          {
            appSurface: "Mobile app",
            deviceLabel: "Thiết bị hiện tại",
            id: "current-session",
            platformLabel: "Android",
            provider: "Supabase" as const,
            signedInAt: Date.now()
          }
        ];

  return (
    <View
      className="rounded-3xl border px-4 py-4"
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
    >
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-black" style={{ color: colors.textPrimary }}>Lịch sử đăng nhập</Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: colors.textSecondary }}>
            Các phiên gần đây được ghi nhận cho tài khoản này.
          </Text>
        </View>
        <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
          <Clock color={colors.accent} size={18} strokeWidth={2.4} />
        </View>
      </View>

      <View className="mt-4 gap-3">
        {visibleEntries.map((entry, index) => (
          <View
            className="min-h-[66px] flex-row items-center gap-3 rounded-2xl px-3 py-3"
            key={entry.id}
            style={{ backgroundColor: colors.surfaceSoft }}
          >
            <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surface }}>
              <Smartphone color={index === 0 ? colors.accent : colors.textSecondary} size={18} strokeWidth={2.3} />
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="min-w-0 flex-1 text-sm font-black" numberOfLines={1} style={{ color: colors.textPrimary }}>
                  {entry.deviceLabel}
                </Text>
                {index === 0 ? (
                  <View className="flex-row items-center gap-1 rounded-full px-2 py-1" style={{ backgroundColor: colors.successSoft }}>
                    <CheckCircle2 color={colors.success} size={12} strokeWidth={2.5} />
                    <Text className="text-[10px] font-black" style={{ color: colors.success }}>
                      Đang hoạt động
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.textSecondary }}>
                {entry.platformLabel} · {entry.appSurface} · {entry.provider}
              </Text>
              <Text className="mt-1 text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                {formatLoginTime(entry.signedInAt)}
              </Text>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

function formatLoginTimeCompact(timestamp: number) {
  const date = new Date(timestamp);
  const time = date.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit"
  });
  const day = date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit"
  });

  return `${time} ${day.replace("/", "-")}`;
}

function LoginHistoryPanelV2({ entries }: { entries: LoginHistoryEntry[] }) {
  const { colors, surfaceShadowStyle } = useAppTheme();
  const visibleEntries =
    entries.length > 0
      ? entries.slice(0, 4)
      : [
          {
            appSurface: "Mobile app",
            deviceLabel: "Thiết bị hiện tại",
            id: "current-session",
            platformLabel: "Android",
            provider: "Supabase" as const,
            signedInAt: Date.now()
          }
        ];

  return (
    <View
      className="rounded-3xl border px-5 py-5"
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
    >
      <View className="flex-row items-start gap-3">
        <View className="mt-0.5 h-8 w-8 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
          <Clock color={colors.accent} size={16} strokeWidth={2.35} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[18px] font-black leading-6" style={{ color: colors.textPrimary }}>Lịch sử đăng nhập</Text>
          <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
            Các phiên gần đây được ghi nhận cho tài khoản này.
          </Text>
        </View>
      </View>

      <View className="mt-5 gap-3">
        {visibleEntries.map((entry, index) => (
          <View
            className="rounded-3xl px-4 py-4"
            key={entry.id}
            style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 1 }}
          >
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surface }}>
                <Smartphone color={index === 0 ? colors.accent : colors.textSecondary} size={18} strokeWidth={2.25} />
              </View>
              <View className="min-w-0 flex-1">
                <View className="flex-row items-start gap-2">
                  <Text className="min-w-0 flex-1 text-[15px] font-black leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                    {entry.deviceLabel}
                  </Text>
                  {index === 0 ? (
                    <View className="flex-row items-center gap-1 rounded-full px-2.5 py-1" style={{ backgroundColor: "rgba(16,185,129,0.16)" }}>
                      <CheckCircle2 color="#34D399" size={12} strokeWidth={2.6} />
                      <Text className="text-[10px] font-black" style={{ color: "#34D399" }}>Đang hoạt động</Text>
                    </View>
                  ) : null}
                </View>
                <Text className="mt-1.5 text-[12px] leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                  {entry.platformLabel} · {entry.appSurface} · {entry.provider}
                </Text>
                <Text className="mt-2 text-[11px] font-semibold" style={{ color: colors.textSecondary }}>
                  {formatLoginTimeCompact(entry.signedInAt)}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

export function AccountScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, isDark, surfaceShadowStyle } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const history = useRecruiterStore((state) => state.history);
  const candidates = useRecruiterStore((state) => state.candidates);
  const loginHistory = useRecruiterStore((state) => state.loginHistory);
  const loading = useRecruiterStore((state) => state.loading);
  const inboxRefreshing = useRecruiterStore((state) => state.inboxRefreshing);
  const error = useRecruiterStore((state) => state.error);
  const login = useRecruiterStore((state) => state.login);
  const loginGoogle = useRecruiterStore((state) => state.loginGoogle);
  const loginGoogleToken = useRecruiterStore((state) => state.loginGoogleToken);
  const register = useRecruiterStore((state) => state.register);
  const resetPassword = useRecruiterStore((state) => state.resetPassword);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);
  const [emailInput, setEmailInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [authMode, setAuthMode] = useState<"login" | "register">("login");
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [authNotice, setAuthNotice] = useState<string | null>(null);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const googleAndroidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim() || "";
  const googleIosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim() || "";
  const googleWebClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim() || "";
  const googleClientId =
    Platform.OS === "android"
      ? googleAndroidClientId
      : Platform.OS === "ios"
        ? googleIosClientId
        : googleWebClientId;
  const [googleRequest, googleResponse, promptGoogleSignIn] = Google.useAuthRequest(
    {
      androidClientId: googleAndroidClientId || undefined,
      clientId: googleClientId || "missing-google-client-id",
      iosClientId: googleIosClientId || undefined,
      selectAccount: true,
      webClientId: googleWebClientId || undefined
    },
    { native: "com.supporthr.companion:/oauthredirect" }
  );
  const accountDescription = authUser?.email || "Kết nối tài khoản của bạn để đồng bộ lịch sử, mẫu JD và hồ sơ.";

  const displayName = authUser?.displayName || "Hipo Tools";
  const description = authUser?.email || "Đăng nhập để đồng bộ lịch sử, mẫu JD và hồ sơ.";
  const submitLogin = () => {
    const email = emailInput.trim();
    if (!email || !passwordInput) return;
    setAuthNotice(null);
    void (authMode === "login" ? login(email, passwordInput) : register(email, passwordInput));
  };
  const handleResetPassword = () => {
    const email = emailInput.trim();
    if (!email) {
      setAuthNotice("Nhập email trước để nhận liên kết đặt lại mật khẩu.");
      return;
    }

    void resetPassword(email).then(() => {
      setAuthNotice("Đã gửi email đặt lại mật khẩu. Vui lòng kiểm tra hộp thư.");
    });
  };

  const handleGoogleLogin = () => {
    setAuthNotice(null);

    if (Platform.OS === "web") {
      void loginGoogle();
      return;
    }

    if (!googleClientId || !googleRequest) {
      setAuthNotice("Thiếu Google Android Client ID. Hãy thêm EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID rồi build lại APK.");
      return;
    }

    void promptGoogleSignIn();
  };

  useEffect(() => {
    if (!googleResponse) return;

    if (googleResponse.type === "success") {
      const idToken = googleResponse.params.id_token || googleResponse.authentication?.idToken;
      if (!idToken) {
        setAuthNotice("Google chưa trả về id_token. Kiểm tra Android OAuth Client ID và redirect URL trong Supabase.");
        return;
      }

      void loginGoogleToken(idToken);
      return;
    }

    if (googleResponse.type === "error") {
      setAuthNotice("Google đăng nhập lỗi. Kiểm tra OAuth Client ID và cấu hình Google provider trong Supabase.");
    }
  }, [googleResponse, loginGoogleToken]);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: authUser ? 96 : 72 }}
        scrollEnabled={Boolean(authUser)}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          right={
            authUser ? (
              <Pressable
                accessibilityRole="button"
                className="min-h-11 flex-row items-center gap-2 rounded-full border px-4 active:opacity-80"
                onPress={() => navigation.navigate("AccountSettings")}
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <Settings color={colors.accent} size={16} strokeWidth={2.4} />
                <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>Hipo Tools</Text>
              </Pressable>
            ) : (
              <View className="min-h-11 flex-row items-center gap-2 rounded-full border px-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <Settings color={colors.accent} size={16} strokeWidth={2.4} />
                <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>Hipo Tools</Text>
              </View>
            )
          }
        />

        <View className={["px-4", authUser ? "gap-5 pt-4" : "gap-0 pt-2"].join(" ")} style={{ width: contentWidth + 32 }}>
          <View
            className={["rounded-[28px] border", authUser ? "px-6 py-6" : "px-4 py-3.5"].join(" ")}
            style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
          >
            <View className="items-center">
              <AccountPhoto size={authUser ? 72 : 52} />
              <View className={["min-w-0 items-center", authUser ? "mt-4" : "mt-2.5"].join(" ")}>
                <View className="items-center">
                  <Text className={["text-center font-black", authUser ? "text-[26px] leading-8" : "text-[22px] leading-7"].join(" ")} numberOfLines={1} style={{ color: colors.textPrimary }}>
                    {displayName}
                  </Text>
                  <View className="hidden" style={{ display: "none" }}>
                    <Text className="text-[10px] font-black" style={{ color: colors.accent }}>
                      {authUser ? "Đã đăng nhập" : "Chưa đăng nhập"}
                    </Text>
                  </View>
                </View>
                <Text className={["max-w-[310px] text-center", authUser ? "mt-2 text-[13px] leading-5" : "mt-1.5 text-[12px] leading-4"].join(" ")} numberOfLines={authUser ? 1 : 2} style={{ color: colors.textSecondary }}>
                  {accountDescription}
                </Text>
              </View>
            </View>

            {!authUser ? (
              <>
                <View className="mt-4 gap-3" style={{ backgroundColor: "transparent", borderColor: "transparent" }}>
                  <View style={{ display: "none" }}>
                    <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Nhập tài khoản</Text>
                    <Text className="mt-1 text-xs leading-5" style={{ color: colors.textSecondary }}>
                      Dùng email/mật khẩu đã đăng ký hoặc đăng nhập nhanh bằng Google.
                    </Text>
                  </View>

                  <View>
                    <Text className="text-center text-[16px] font-bold" style={{ color: colors.textPrimary }}>
                      {authMode === "login" ? "Đăng nhập tài khoản" : "Tạo tài khoản mới"}
                    </Text>
                  </View>

                  <AuthField
                    autoCapitalize="none"
                    focused={emailFocused}
                    icon={Mail}
                    keyboardType="email-address"
                    label="Tài khoản"
                    onBlur={() => setEmailFocused(false)}
                    onChangeText={setEmailInput}
                    onFocus={() => setEmailFocused(true)}
                    placeholder="Email hoặc tài khoản"
                    value={emailInput}
                  />

                  <View>
                    <AuthField
                      focused={passwordFocused}
                      icon={LockKeyhole}
                      label="Mật khẩu"
                      onBlur={() => setPasswordFocused(false)}
                      onChangeText={setPasswordInput}
                      onFocus={() => setPasswordFocused(true)}
                      placeholder="Mật khẩu"
                      secureTextEntry
                      value={passwordInput}
                    />
                    {authMode === "login" ? (
                      <Pressable accessibilityRole="button" className="mt-1.5 self-end active:opacity-70" onPress={handleResetPassword}>
                        <Text className="text-[12px] font-semibold" style={{ color: colors.accent }}>Quên mật khẩu?</Text>
                      </Pressable>
                    ) : null}
                  </View>

                  <View className="hidden" style={{ display: "none" }}>
                    <Mail color={colors.textSecondary} size={17} strokeWidth={2.3} />
                    <TextInput
                      autoCapitalize="none"
                      className="min-h-12 min-w-0 flex-1 text-sm font-semibold"
                      keyboardType="email-address"
                      onChangeText={setEmailInput}
                      placeholder="Email hoặc tài khoản"
                      placeholderTextColor={colors.textSecondary}
                      style={{ color: colors.textPrimary }}
                      value={emailInput}
                    />
                  </View>

                  <View className="hidden" style={{ display: "none" }}>
                    <LockKeyhole color={colors.textSecondary} size={17} strokeWidth={2.3} />
                    <TextInput
                      className="min-h-12 min-w-0 flex-1 text-sm font-semibold"
                      onChangeText={setPasswordInput}
                      placeholder="Mật khẩu"
                      placeholderTextColor={colors.textSecondary}
                      secureTextEntry
                      style={{ color: colors.textPrimary }}
                      value={passwordInput}
                    />
                  </View>

                  <View style={{ display: "none" }}>
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[50px] items-center justify-center rounded-2xl border px-4 active:opacity-80"
                    disabled={loading}
                    onPress={submitLogin}
                    style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                  >
                    <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>
                      {loading ? "Đang đăng nhập..." : "Đăng nhập"}
                    </Text>
                  </Pressable>
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[48px] items-center justify-center rounded-2xl px-4 active:opacity-85"
                    disabled={loading}
                    onPress={submitLogin}
                    style={{ backgroundColor: isDark ? "#2563EB" : colors.accent, opacity: loading ? 0.72 : 1 }}
                  >
                    <Text className="text-[14px] font-bold" style={{ color: isDark ? "#FFFFFF" : "#111827" }}>
                      {authMode === "login" ? "Đăng nhập với Email" : "Tạo tài khoản"}
                    </Text>
                  </Pressable>

                  <View className="flex-row items-center gap-3 py-0">
                    <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
                    <Text className="text-[12px] font-medium" style={{ color: colors.textSecondary }}>hoặc</Text>
                    <View className="h-px flex-1" style={{ backgroundColor: colors.border }} />
                  </View>

                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-85"
                    disabled={loading}
                    onPress={handleGoogleLogin}
                    style={{ backgroundColor: colors.accent, opacity: loading ? 0.72 : 1 }}
                  >
                    <Chrome color="#111827" size={20} strokeWidth={2.5} />
                    <Text className="text-[15px] font-bold text-black">Đăng nhập với Google</Text>
                  </Pressable>

                  <Pressable
                    accessibilityRole="button"
                    className="items-center py-0.5 active:opacity-70"
                    onPress={() => {
                      setAuthNotice(null);
                      setAuthMode((current) => (current === "login" ? "register" : "login"));
                    }}
                  >
                    <Text className="text-[12px] font-medium" style={{ color: colors.textSecondary }}>
                      {authMode === "login" ? "Chưa có tài khoản? " : "Đã có tài khoản? "}
                      <Text style={{ color: colors.accent, fontWeight: "700" }}>
                        {authMode === "login" ? "Đăng ký ngay" : "Đăng nhập"}
                      </Text>
                    </Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="mt-6 min-h-[48px] flex-row items-center justify-center gap-2 rounded-2xl border px-4 active:opacity-80"
                disabled={loading}
                onPress={() => void loadInbox(true)}
                style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
              >
                <RefreshCw color={colors.accent} size={18} strokeWidth={2.45} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>{loading || inboxRefreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}</Text>
              </Pressable>
            )}

            {authNotice ? <Text className="mt-3 text-center text-xs leading-5" style={{ color: colors.accent }}>{authNotice}</Text> : null}
            {error ? <Text className="mt-3 text-xs leading-5" style={{ color: colors.danger }}>{error}</Text> : null}
          </View>

          {authUser ? (
            <>
              <StatsOverview candidatesCount={candidates.length} historyCount={history.length} templatesCount="4" />

              <View className="hidden" style={{ display: "none" }}>
                <StatPill label="Lịch sử" value={history.length} />
                <StatPill label="Hồ sơ" value={candidates.length} />
                <StatPill label="Mẫu JD" value="4" />
              </View>

              <LoginHistoryPanelV2 entries={loginHistory} />

              <Pressable
                accessibilityRole="button"
                className="min-h-[76px] flex-row items-center gap-3 rounded-3xl border px-4 py-3 active:opacity-80"
                onPress={() => navigation.navigate("AccountSettings")}
                style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
              >
                <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
                  <ShieldCheck color={colors.accent} size={20} strokeWidth={2.4} />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-base font-black" style={{ color: colors.textPrimary }}>Tác vụ & chính sách</Text>
                  <Text className="mt-1 text-xs leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
                    Đồng bộ, quyền dữ liệu, bảo mật và điều khoản.
                  </Text>
                </View>
                <ChevronRight color={colors.textSecondary} size={19} strokeWidth={2.35} />
              </Pressable>

              <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
                <AccountLinkRow
                  description="Xem nhanh dữ liệu tuyển dụng đã lưu."
                  icon={History}
                  onPress={() => navigation.navigate("Templates")}
                  title="Lịch sử & mẫu JD"
                />
                <AccountLinkRow
                  description="Mở danh sách hồ sơ đã phân tích."
                  icon={Database}
                  onPress={() => navigation.navigate("Inbox")}
                  title="Hồ sơ ứng viên"
                  withoutBorder
                />
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}

function AccountLinkRow({
  description,
  icon: Icon,
  onPress,
  title,
  withoutBorder = false
}: {
  description: string;
  icon: typeof History;
  onPress: () => void;
  title: string;
  withoutBorder?: boolean;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[64px] flex-row items-center gap-3 px-4 active:opacity-80"
      onPress={onPress}
      style={{ borderBottomColor: colors.border, borderBottomWidth: withoutBorder ? 0 : 1 }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
        <Icon color={colors.accent} size={18} strokeWidth={2.35} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>{title}</Text>
        <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.textSecondary }}>
          {description}
        </Text>
      </View>
      <ChevronRight color={colors.textSecondary} size={18} />
    </Pressable>
  );
}
