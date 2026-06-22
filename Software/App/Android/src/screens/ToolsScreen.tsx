import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Bot, Camera, FileText, type LucideIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
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
      className="min-h-[76px] flex-row items-center gap-3 border-b px-1 py-3 active:opacity-75"
      onPress={onPress}
      style={{ borderColor: colors.border }}
    >
      <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
        <Icon color={colors.accent} size={21} strokeWidth={2.35} />
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[17px] font-semibold" style={{ color: colors.textPrimary }}>
          {title}
        </Text>
        <Text className="mt-1 text-[13px] leading-5" numberOfLines={2} style={{ color: colors.textSecondary }}>
          {description}
        </Text>
      </View>
    </Pressable>
  );
}

export function ToolsScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Công cụ" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4" style={{ width: contentWidth + 32 }}>
          <View className="mb-2">
            <Text className="text-[24px] font-semibold leading-8" style={{ color: colors.textPrimary }}>
              Công cụ tuyển dụng
            </Text>
            <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
              Chatbot và chấm CV nhanh được gom tại đây.
            </Text>
          </View>

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
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
