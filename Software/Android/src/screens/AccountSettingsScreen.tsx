import { Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import type { ReactNode } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ChevronRight,
  Cloud,
  Database,
  ExternalLink,
  FileText,
  History,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Scale,
  Settings,
  ShieldCheck,
  Sparkles,
  Trash2,
  type LucideIcon
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";

type Navigation = NativeStackNavigationProp<RootStackParamList>;
type RowTone = "default" | "danger" | "success";
type RowRight = "chevron" | "external" | "none";

const policyLinks: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
  url: string;
}> = [
  {
    title: "Chính sách bảo mật",
    description: "Thu thập, xử lý và bảo vệ dữ liệu tuyển dụng.",
    icon: FileText,
    url: "https://www.supporthr-tf.com.vn/privacy-policy"
  },
  {
    title: "Điều khoản sử dụng",
    description: "Quy định dịch vụ, đầu ra AI và trách nhiệm.",
    icon: Scale,
    url: "https://www.supporthr-tf.com.vn/terms"
  },
  {
    title: "Bảo mật dữ liệu",
    description: "Lưu trữ, phân quyền và vận hành dữ liệu.",
    icon: LockKeyhole,
    url: "https://www.supporthr-tf.com.vn/security"
  }
];

const dataCommitments: Array<{
  title: string;
  description: string;
  icon: LucideIcon;
}> = [
  {
    title: "Google Drive chỉ đọc",
    description: "Chỉ đọc file bạn chọn để nhập CV/JD.",
    icon: Cloud
  },
  {
    title: "Không bán dữ liệu",
    description: "Dữ liệu chỉ dùng để vận hành Hipo Tools.",
    icon: ShieldCheck
  },
  {
    title: "Xóa theo yêu cầu",
    description: "Yêu cầu hợp lệ được xử lý trong 30 ngày.",
    icon: Trash2
  },
  {
    title: "AI chỉ hỗ trợ",
    description: "Kết quả cần được nhà tuyển dụng kiểm tra lại.",
    icon: Sparkles
  }
];

function openUrl(url: string) {
  void Linking.openURL(url);
}

function rowTone(tone: RowTone, colors: ThemeColors) {
  if (tone === "danger") return { backgroundColor: colors.dangerSoft, color: colors.danger, textColor: colors.danger };
  if (tone === "success") return { backgroundColor: colors.successSoft, color: colors.success, textColor: colors.textPrimary };
  return { backgroundColor: colors.accentSoft, color: colors.accent, textColor: colors.textPrimary };
}

function Section({ children, title }: { children: ReactNode; title: string }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  return (
    <View className="gap-2">
      <Text className="px-1 text-[11px] font-black uppercase tracking-wide" style={{ color: colors.textSecondary }}>{title}</Text>
      <View
        className="overflow-hidden rounded-3xl border"
        style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
      >
        {children}
      </View>
    </View>
  );
}

function ListRow({
  description,
  icon: Icon,
  onPress,
  right = "chevron",
  title,
  tone = "default"
}: {
  description: string;
  icon: LucideIcon;
  onPress?: () => void;
  right?: RowRight;
  title: string;
  tone?: RowTone;
}) {
  const { colors } = useAppTheme();
  const toneMeta = rowTone(tone, colors);
  const Container = onPress ? Pressable : View;

  return (
    <Container
      accessibilityRole={onPress ? (right === "external" ? "link" : "button") : undefined}
      className="min-h-[66px] flex-row items-center gap-3 px-4 py-3 active:opacity-75"
      onPress={onPress}
      style={{ borderBottomColor: colors.border, borderBottomWidth: 1 }}
    >
      <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: toneMeta.backgroundColor }}>
        <Icon color={toneMeta.color} size={18} strokeWidth={2.35} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-sm font-black" numberOfLines={1} style={{ color: toneMeta.textColor }}>
          {title}
        </Text>
        <Text className="mt-1 text-xs leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
          {description}
        </Text>
      </View>
      {right === "external" ? <ExternalLink color={colors.textSecondary} size={17} strokeWidth={2.3} /> : null}
      {right === "chevron" ? <ChevronRight color={colors.textSecondary} size={18} /> : null}
    </Container>
  );
}

export function AccountSettingsScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const loading = useRecruiterStore((state) => state.loading);
  const inboxRefreshing = useRecruiterStore((state) => state.inboxRefreshing);
  const error = useRecruiterStore((state) => state.error);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);
  const logout = useRecruiterStore((state) => state.logout);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          right={
            <View className="min-h-11 flex-row items-center gap-2 rounded-full border px-4" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
              <Settings color={colors.accent} size={16} strokeWidth={2.4} />
              <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>Cài đặt</Text>
            </View>
          }
        />

        <View className="gap-5 px-4 pt-3" style={{ width: contentWidth + 32 }}>
          {!authUser ? (
            <View className="rounded-[28px] border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
              <Text className="text-2xl font-black leading-8" style={{ color: colors.textPrimary }}>Đăng nhập để mở cài đặt</Text>
              <Text className="mt-2 text-sm leading-5" style={{ color: colors.textSecondary }}>
                Tác vụ, chính sách và quyền dữ liệu chỉ hiển thị sau khi tài khoản Google đã được đồng bộ.
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-5 min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-80"
                disabled={loading}
                onPress={() => navigation.navigate("Account")}
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-base font-black text-black">
                  {loading ? "Đang mở đăng nhập..." : "Mở trang đăng nhập"}
                </Text>
              </Pressable>
              {error ? <Text className="mt-3 text-xs leading-5" style={{ color: colors.danger }}>{error}</Text> : null}
            </View>
          ) : (
            <>
              <View className="rounded-[28px] border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
                <Text className="text-2xl font-black leading-8" style={{ color: colors.textPrimary }}>Tác vụ & chính sách</Text>
                <Text className="mt-2 text-sm leading-5" style={{ color: colors.textSecondary }}>
                  Các thao tác đồng bộ, quyền dữ liệu và chính sách được tách riêng khỏi trang account để giao diện gọn hơn.
                </Text>
              </View>

              <Section title="Tác vụ">
                <ListRow
                  description="Lấy dữ liệu mới nhất từ tài khoản."
                  icon={RefreshCw}
                  onPress={() => void loadInbox(true)}
                  title={loading || inboxRefreshing ? "Đang đồng bộ..." : "Đồng bộ dữ liệu"}
                  tone="success"
                />
                <ListRow
                  description="Lịch sử lọc CV và kho mẫu JD."
                  icon={History}
                  onPress={() => navigation.navigate("Templates")}
                  title="Lịch sử & mẫu JD"
                />
                <ListRow
                  description="Hồ sơ ứng viên đã phân tích."
                  icon={Database}
                  onPress={() => navigation.navigate("Inbox")}
                  title="Hồ sơ ứng viên"
                />
                <ListRow
                  description="Tài khoản có quyền đọc dữ liệu."
                  icon={ShieldCheck}
                  right="none"
                  title="Quyền dữ liệu"
                />
                <ListRow
                  description="Thoát tài khoản trên thiết bị này."
                  icon={LogOut}
                  onPress={() => void logout()}
                  title="Đăng xuất"
                  tone="danger"
                />
              </Section>

              <Section title="Chính sách">
                {policyLinks.map((item) => (
                  <ListRow
                    description={item.description}
                    icon={item.icon}
                    key={item.title}
                    onPress={() => openUrl(item.url)}
                    right="external"
                    title={item.title}
                  />
                ))}
              </Section>

              <Section title="Cam kết dữ liệu">
                {dataCommitments.map((item) => (
                  <ListRow
                    description={item.description}
                    icon={item.icon}
                    key={item.title}
                    right="none"
                    title={item.title}
                  />
                ))}
              </Section>
            </>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
