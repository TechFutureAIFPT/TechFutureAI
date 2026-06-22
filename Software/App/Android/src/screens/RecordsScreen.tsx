import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Clock3, UsersRound, type LucideIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function RecordRow({
  count,
  description,
  icon: Icon,
  onPress,
  title
}: {
  count: number;
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
      <Text className="min-w-8 text-right text-[20px] font-semibold" style={{ color: colors.accent }}>
        {count}
      </Text>
    </Pressable>
  );
}

export function RecordsScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const candidates = useRecruiterStore((state) => state.candidates);
  const history = useRecruiterStore((state) => state.history);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Hồ sơ" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4" style={{ width: contentWidth + 32 }}>
          <View className="mb-2">
            <Text className="text-[24px] font-semibold leading-8" style={{ color: colors.textPrimary }}>
              Ứng viên và lịch sử
            </Text>
            <Text className="mt-1 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
              Theo dõi hồ sơ đã đồng bộ và các phiên lọc CV.
            </Text>
          </View>

          <RecordRow
            count={candidates.length}
            description="Danh sách ứng viên từ các phiên lọc CV đã đồng bộ."
            icon={UsersRound}
            onPress={() => navigation.navigate("Inbox")}
            title="Ứng viên"
          />
          <RecordRow
            count={history.length}
            description="Lịch sử lọc CV, mẫu JD đã lưu và dữ liệu đồng bộ."
            icon={Clock3}
            onPress={() => navigation.navigate("Templates")}
            title="Lịch sử & mẫu JD"
          />
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
