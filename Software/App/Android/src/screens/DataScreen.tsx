import { useEffect } from "react";
import { Text, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

export function DataScreen() {
  const navigation = useNavigation<Navigation>();
  const { colors } = useAppTheme();

  useEffect(() => {
    navigation.replace("Templates");
  }, [navigation]);

  return (
    <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
      <View className="flex-1 items-center justify-center px-6">
        <Text className="text-center text-base font-semibold" style={{ color: colors.textPrimary }}>Dữ liệu đã chuyển vào Lịch sử & mẫu JD.</Text>
      </View>
    </SafeAreaView>
  );
}
