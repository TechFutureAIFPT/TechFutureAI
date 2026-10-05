import { Image, Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useState, type ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronRight,
  FileText,
  LockKeyhole,
  LogOut,
  Moon,
  RefreshCw,
  Scale,
  Sun,
  User,
  X,
  type LucideIcon
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <View className="mb-6">
      <Text className="mb-2 px-3 text-[13px] font-semibold" style={{ color: colors.textSecondary }}>
        {title}
      </Text>
      <View
        className="overflow-hidden rounded-2xl"
        style={{ backgroundColor: colors.surface }}
      >
        {children}
      </View>
    </View>
  );
}

function SettingsRow({
  icon: Icon,
  label,
  value,
  onPress,
  rightChevron = true,
  isLast = false,
  destructive = false
}: {
  icon?: LucideIcon;
  isLast?: boolean;
  label: string;
  onPress?: () => void;
  destructive?: boolean;
  rightChevron?: boolean;
  value?: string;
}) {
  const { colors } = useAppTheme();
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? "button" : undefined}
      className="min-h-[52px] flex-row items-center justify-between px-4 py-3.5 active:opacity-70"
      onPress={onPress}
      style={{
        borderBottomColor: isLast ? "transparent" : colors.border,
        borderBottomWidth: isLast ? 0 : 0.6
      }}
    >
      <View className="flex-row items-center gap-3.5 min-w-0 flex-1">
        {Icon ? (
          <Icon
            color={destructive ? colors.danger : colors.textPrimary}
            size={20}
            strokeWidth={1.9}
          />
        ) : null}
        <Text
          className="text-[15px] font-medium leading-5"
          style={{ color: destructive ? colors.danger : colors.textPrimary }}
        >
          {label}
        </Text>
      </View>

      <View className="flex-row items-center gap-2">
        {value ? (
          <Text className="text-[14px] font-normal" style={{ color: colors.textSecondary }}>
            {value}
          </Text>
        ) : null}
        {rightChevron && onPress ? (
          <ChevronRight color={colors.textSecondary} size={18} strokeWidth={2} />
        ) : null}
      </View>
    </Container>
  );
}

export function AccountSettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const loading = useRecruiterStore((state) => state.loading);
  const inboxRefreshing = useRecruiterStore((state) => state.inboxRefreshing);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);
  const setUserRole = useRecruiterStore((state) => state.setUserRole);
  const logout = useRecruiterStore((state) => state.logout);
  const [photoFailed, setPhotoFailed] = useState(false);

  const contentWidth = Math.min(Math.max(width - 32, 300), 430);
  const displayName = authUser?.displayName || authUser?.email || "Người dùng Match";
  const initialLetter = (displayName || "U").slice(0, 1).toUpperCase();
  const showPhoto = Boolean(authUser?.photoUrl && !photoFailed);

  return (
    <SafeAreaView className="flex-1" edges={["top", "bottom"]} style={{ backgroundColor: colors.background }}>
      <View className="flex-row items-center justify-between px-5 pt-3 pb-2" style={{ alignSelf: "center", width: contentWidth + 32 }}>
        <View className="w-9" />
        <Text className="text-[17px] font-bold" style={{ color: colors.textPrimary }}>
          Cài đặt
        </Text>
        <Pressable
          accessibilityLabel="Đóng cài đặt"
          accessibilityRole="button"
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
          onPress={() => navigation.goBack()}
          style={{ backgroundColor: colors.surface }}
        >
          <X color={colors.textPrimary} size={20} strokeWidth={2.2} />
        </Pressable>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingBottom: 60, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ width: contentWidth + 32 }} className="px-4">
          {/* Profile Avatar Header */}
          <View className="items-center mb-6 mt-2">
            <View
              className="relative h-20 w-20 items-center justify-center rounded-full overflow-hidden"
              style={{ backgroundColor: colors.surfaceSoft }}
            >
              {showPhoto ? (
                <Image
                  onError={() => setPhotoFailed(true)}
                  source={{ uri: authUser?.photoUrl || undefined }}
                  style={{ height: 80, width: 80 }}
                />
              ) : (
                <Text className="text-2xl font-bold uppercase" style={{ color: colors.accent }}>
                  {initialLetter}
                </Text>
              )}
            </View>
            <Text className="mt-3 text-[19px] font-bold" style={{ color: colors.textPrimary }}>
              {displayName}
            </Text>
            {authUser?.email ? (
              <Text className="mt-0.5 text-[13px]" style={{ color: colors.textSecondary }}>
                {authUser.email}
              </Text>
            ) : null}
          </View>

          {/* Section 1: Tùy chỉnh Match */}
          <SettingsSection title="Tùy chỉnh CV Match">
            <View className="p-3.5">
              <Text className="text-[12px] font-medium mb-3" style={{ color: colors.textSecondary }}>
                Chế độ sử dụng
              </Text>
              <View className="flex-row rounded-xl p-1" style={{ backgroundColor: colors.surfaceSoft }}>
                <Pressable
                  accessibilityRole="button"
                  className="flex-1 min-h-[38px] items-center justify-center rounded-lg active:opacity-85"
                  onPress={() => setUserRole("recruiter")}
                  style={{
                    backgroundColor: authUser?.userRole !== "candidate" ? colors.accent : "transparent"
                  }}
                >
                  <Text
                    className="text-[13px] font-bold"
                    style={{
                      color: authUser?.userRole !== "candidate" ? "#FFFFFF" : colors.textSecondary
                    }}
                  >
                    Nhà tuyển dụng
                  </Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  className="flex-1 min-h-[38px] items-center justify-center rounded-lg active:opacity-85"
                  onPress={() => setUserRole("candidate")}
                  style={{
                    backgroundColor: authUser?.userRole === "candidate" ? colors.accent : "transparent"
                  }}
                >
                  <Text
                    className="text-[13px] font-bold"
                    style={{
                      color: authUser?.userRole === "candidate" ? "#FFFFFF" : colors.textSecondary
                    }}
                  >
                    Ứng viên
                  </Text>
                </Pressable>
              </View>
            </View>
          </SettingsSection>

          {/* Section 2: Tài khoản */}
          <SettingsSection title="Tài khoản">
            <SettingsRow
              icon={User}
              label="Email"
              rightChevron={false}
              value={authUser?.email || "Chưa đăng nhập"}
            />
            <SettingsRow
              icon={User}
              label="Quyền hạn"
              rightChevron={false}
              value={authUser?.userRole === "candidate" ? "Ứng viên" : "Nhà tuyển dụng"}
            />
            {authUser ? (
              <SettingsRow
                destructive
                icon={LogOut}
                isLast
                label="Đăng xuất"
                onPress={() => void logout().then(() => navigation.navigate("Home"))}
                rightChevron={false}
              />
            ) : (
              <SettingsRow
                icon={User}
                isLast
                label="Đăng nhập tài khoản"
                onPress={() => navigation.navigate("Account")}
              />
            )}
          </SettingsSection>

          {/* Section 3: Giao diện & Dữ liệu */}
          <SettingsSection title="Giao diện & Dữ liệu">
            <SettingsRow
              icon={isDark ? Moon : Sun}
              label="Giao diện"
              onPress={toggleTheme}
              value={isDark ? "Tối (Dark)" : "Sáng (Light)"}
            />
            <SettingsRow
              icon={RefreshCw}
              isLast
              label={loading || inboxRefreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
              onPress={() => void loadInbox(true)}
            />
          </SettingsSection>

          {/* Section 4: Chính sách & Pháp lý */}
          <SettingsSection title="Chính sách & Điều khoản">
            <SettingsRow
              icon={FileText}
              label="Chính sách bảo mật"
              onPress={() => void Linking.openURL("https://www.aimatching.com.vn/privacy-policy")}
            />
            <SettingsRow
              icon={Scale}
              label="Điều khoản sử dụng"
              onPress={() => void Linking.openURL("https://www.aimatching.com.vn/terms")}
            />
            <SettingsRow
              icon={LockKeyhole}
              isLast
              label="Bảo mật dữ liệu"
              onPress={() => void Linking.openURL("https://www.aimatching.com.vn/security")}
            />
          </SettingsSection>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
