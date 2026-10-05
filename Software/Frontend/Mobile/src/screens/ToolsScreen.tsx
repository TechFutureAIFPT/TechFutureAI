import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bot, Camera, ChevronRight, Compass, FileText, Monitor, type LucideIcon } from "lucide-react-native";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader } from "../components/AppChrome";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function ToolRow({
  description,
  icon: Icon,
  onPress,
  title
}: {
  description: string;
  icon: LucideIcon;
  onPress: () => void;
  title: string;
}) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="mb-3 flex-row items-center gap-3.5 rounded-2xl border p-4 active:opacity-75"
      onPress={onPress}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentSoft }}>
        <Icon color={colors.accent} size={21} strokeWidth={2.35} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>
          {title}
        </Text>
        <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={2} style={{ color: colors.textSecondary }}>
          {description}
        </Text>
      </View>
      <ChevronRight color={colors.textSecondary} size={17} strokeWidth={2.2} />
    </Pressable>
  );
}

export function ToolsScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const liveSession = useRecruiterStore((state) => state.liveSession);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Công cụ" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4" style={{ width: contentWidth + 32 }}>
          <View className="mb-4">
            <Text className="text-[24px] font-semibold leading-8" style={{ color: colors.textPrimary }}>
              Công cụ tuyển dụng
            </Text>
            <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
              Chatbot và chấm CV nhanh được gom tại đây.
            </Text>
          </View>

          <Pressable
            accessibilityRole="button"
            className="mb-3 flex-row items-center gap-3.5 rounded-2xl border p-4 active:opacity-75"
            onPress={() => navigation.navigate("PCConnect")}
            style={{ backgroundColor: colors.surface, borderColor: colors.border }}
          >
            <View className="relative h-11 w-11 items-center justify-center rounded-xl" style={{ backgroundColor: colors.accentSoft }}>
              <Monitor color={colors.accent} size={21} strokeWidth={2.35} />
              {liveSession && liveSession.status === "analyzing" && (
                <View className="absolute -right-1 -top-1 h-3 w-3 rounded-full border-2" style={{ backgroundColor: colors.accent, borderColor: colors.background }} />
              )}
            </View>
            <View className="min-w-0 flex-1">
              <View className="flex-row items-center gap-2">
                <Text className="text-[16px] font-semibold" style={{ color: colors.textPrimary }}>
                  Kết nối với PC
                </Text>
                {liveSession && liveSession.status === "analyzing" && (
                  <View className="rounded-full px-2 py-0.5" style={{ backgroundColor: colors.accentSoft }}>
                    <Text className="text-[10px] font-black uppercase" style={{ color: colors.accent }}>LIVE</Text>
                  </View>
                )}
              </View>
              <Text className="mt-0.5 text-[12px] leading-4" numberOfLines={2} style={{ color: colors.textSecondary }}>
                {liveSession?.status === "analyzing"
                  ? `Đang phân tích: ${liveSession.analyzedCount}/${liveSession.totalCvs} hồ sơ`
                  : "Xem tiến độ phân tích CV trên máy tính theo thời gian thực."}
              </Text>
            </View>
            <ChevronRight color={colors.textSecondary} size={17} strokeWidth={2.2} />
          </Pressable>

          <ToolRow
            description="Chụp hoặc tải CV lên để AI đọc hồ sơ và chấm điểm nhanh."
            icon={Camera}
            onPress={() => navigation.navigate("QuickCv")}
            title="Chấm điểm CV nhanh"
          />
          <ToolRow
            description="Tư vấn theo phiên lọc đã lưu. Lịch sử chatbot nằm bên trong màn hình này."
            icon={Bot}
            onPress={() => navigation.navigate("Advisor")}
            title="Chatbot tư vấn"
          />
          <ToolRow
            description="Upload JD để AI kiểm tra điểm thiếu, gợi ý bổ sung và chuẩn hóa nội dung đăng tuyển."
            icon={FileText}
            onPress={() => navigation.navigate("JDStandardizer")}
            title="Chuẩn hóa JD"
          />
          <ToolRow
            description="Hỏi về một ngành nghề — AI tìm kiếm nhiều nguồn trên web và tổng hợp báo cáo có trích dẫn."
            icon={Compass}
            onPress={() => navigation.navigate("IndustryResearch")}
            title="Nghiên cứu ngành nghề"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
