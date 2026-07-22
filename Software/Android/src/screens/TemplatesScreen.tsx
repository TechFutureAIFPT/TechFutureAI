import { ScrollView, Text, useWindowDimensions, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AccountDataSection } from "../components/AccountDataSection";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

export function TemplatesScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const contentWidth = Math.min(width, 462);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Lịch sử & mẫu JD" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96, paddingTop: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="w-full gap-5 px-4" style={{ maxWidth: contentWidth }}>
          {authUser ? (
            <AccountDataSection defaultOpen initialTab="templates" />
          ) : (
            <View className="items-center px-6 py-12">
              <Text className="text-center text-[20px] font-semibold leading-7" style={{ color: colors.textPrimary }}>
                Cần đăng nhập để xem mẫu JD
              </Text>
              <Text className="mt-3 text-center text-[14px] leading-6" style={{ color: colors.textSecondary }}>
                Đăng nhập để tải mẫu JD đã lưu, lịch sử lọc CV và dữ liệu đồng bộ từ tài khoản.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
