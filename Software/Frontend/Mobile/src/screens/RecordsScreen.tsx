import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Clock3, UsersRound, type LucideIcon } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader } from "../components/AppChrome";
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
      <View className="flex-row items-center gap-1.5">
        <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.accentSoft }}>
          <Text className="text-[13px] font-black" style={{ color: colors.accent }}>
            {count}
          </Text>
        </View>
        <ChevronRight color={colors.textSecondary} size={17} strokeWidth={2.2} />
      </View>
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
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 32, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4" style={{ width: contentWidth + 32 }}>
          <View className="mb-4">
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
    </SafeAreaView>
  );
}
