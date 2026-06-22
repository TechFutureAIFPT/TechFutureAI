import { useEffect, useRef } from "react";
import { ActivityIndicator, Animated, Easing, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { CheckCircle2, Monitor, Radio, Smartphone, Wifi, WifiOff, Zap } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { AppHeader, BottomNav } from "../components/AppChrome";
import { sendSessionCommand } from "../services/firebaseStore";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

function PulsingDot({ color }: { color: string }) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(scale, { toValue: 1.7, duration: 900, easing: Easing.out(Easing.ease), useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(scale, { toValue: 1, duration: 900, easing: Easing.in(Easing.ease), useNativeDriver: Platform.OS !== "web" })
        ]),
        Animated.sequence([
          Animated.timing(opacity, { toValue: 0.25, duration: 900, useNativeDriver: Platform.OS !== "web" }),
          Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: Platform.OS !== "web" })
        ])
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, scale]);

  return (
    <View className="relative h-3 w-3 items-center justify-center">
      <Animated.View className="absolute h-3 w-3 rounded-full" style={{ backgroundColor: color, opacity, transform: [{ scale }] }} />
      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </View>
  );
}

function StepRow({ done, index, subtitle, title }: { done?: boolean; index: number; subtitle: string; title: string }) {
  const { colors } = useAppTheme();
  return (
    <View className="flex-row items-start gap-4">
      <View
        className="h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: done ? colors.accent : colors.surfaceSoft }}
      >
        {done ? (
          <CheckCircle2 color={colors.background} size={16} strokeWidth={2.5} />
        ) : (
          <Text className="text-xs font-black" style={{ color: colors.textSecondary }}>
            {index}
          </Text>
        )}
      </View>
      <View className="min-w-0 flex-1 pt-1">
        <Text className="text-[15px] font-semibold" style={{ color: done ? colors.accent : colors.textPrimary }}>
          {title}
        </Text>
        <Text className="mt-0.5 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
          {subtitle}
        </Text>
      </View>
    </View>
  );
}

export function PCConnectScreen() {
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();
  const liveSession = useRecruiterStore((state) => state.liveSession);
  const authUser = useRecruiterStore((state) => state.authUser);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  const isAnalyzing = liveSession?.status === "analyzing";
  const isDone = liveSession?.status === "done";
  const isConnected = Boolean(liveSession && liveSession.status !== "idle");
  const progress =
    liveSession && liveSession.totalCvs > 0
      ? Math.round((liveSession.analyzedCount / liveSession.totalCvs) * 100)
      : 0;

  const handleApproveAllA = async () => {
    if (!authUser?.uid) return;
    await sendSessionCommand(authUser.uid, "approve_all_a");
  };

  const handlePing = async () => {
    if (!authUser?.uid) return;
    await sendSessionCommand(authUser.uid, "ping");
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Kết nối với PC" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", paddingBottom: 96, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 px-4" style={{ width: contentWidth + 32 }}>

          {/* Status card */}
          <View
            className="overflow-hidden rounded-3xl border"
            style={[
              {
                backgroundColor: colors.surface,
                borderColor: isAnalyzing ? colors.accent : isConnected ? colors.accent : colors.border
              },
              surfaceShadowStyle
            ]}
          >
            {/* Header strip */}
            <View
              className="flex-row items-center justify-between px-5 py-4"
              style={{ borderBottomWidth: 1, borderBottomColor: colors.border }}
            >
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
                  <Monitor color={isConnected ? colors.accent : colors.textSecondary} size={20} strokeWidth={2.25} />
                </View>
                <View>
                  <Text className="text-[15px] font-bold" style={{ color: colors.textPrimary }}>
                    Máy tính
                  </Text>
                  <View className="mt-1 flex-row items-center gap-2">
                    {isConnected ? (
                      <PulsingDot color={isAnalyzing ? colors.accent : "#22c55e"} />
                    ) : (
                      <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.textSecondary }} />
                    )}
                    <Text className="text-[12px] font-semibold" style={{ color: isConnected ? colors.accent : colors.textSecondary }}>
                      {isAnalyzing ? "Đang phân tích CV" : isDone ? "Phân tích xong" : "Không có phiên nào"}
                    </Text>
                  </View>
                </View>
              </View>

              <View className="items-center gap-2">
                {isAnalyzing ? (
                  <ActivityIndicator color={colors.accent} size="small" />
                ) : isConnected ? (
                  <Wifi color={colors.accent} size={20} strokeWidth={2.2} />
                ) : (
                  <WifiOff color={colors.textSecondary} size={20} strokeWidth={2.2} />
                )}
              </View>
            </View>

            {/* Body */}
            {isConnected ? (
              <View className="gap-4 p-5">
                <View>
                  <Text className="text-[13px] font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>
                    Vị trí tuyển dụng
                  </Text>
                  <Text className="mt-1 text-[18px] font-bold leading-6" numberOfLines={2} style={{ color: colors.textPrimary }}>
                    {liveSession?.jobPosition || "Sàng lọc CV"}
                  </Text>
                </View>

                {liveSession && liveSession.totalCvs > 0 && (
                  <View>
                    <View className="mb-2 flex-row items-end justify-between">
                      <Text className="text-[13px]" style={{ color: colors.textSecondary }}>
                        Đã phân tích
                      </Text>
                      <Text className="text-[22px] font-black leading-none" style={{ color: colors.accent }}>
                        {liveSession.analyzedCount}
                        <Text className="text-[14px] font-semibold" style={{ color: colors.textSecondary }}>
                          /{liveSession.totalCvs}
                        </Text>
                      </Text>
                    </View>
                    <View className="h-2.5 overflow-hidden rounded-full" style={{ backgroundColor: colors.surfaceSoft }}>
                      <View
                        className="h-full rounded-full"
                        style={{ backgroundColor: colors.accent, width: `${progress}%` }}
                      />
                    </View>
                    <Text className="mt-1.5 text-right text-[12px] font-semibold" style={{ color: colors.textSecondary }}>
                      {progress}%
                    </Text>
                  </View>
                )}

                {isDone && (
                  <View className="flex-row items-center gap-3 rounded-2xl p-3" style={{ backgroundColor: colors.surfaceSoft }}>
                    <CheckCircle2 color={colors.accent} size={18} strokeWidth={2.4} />
                    <Text className="flex-1 text-[13px] font-semibold leading-5" style={{ color: colors.textPrimary }}>
                      Phân tích hoàn tất. Mở máy tính để xem kết quả đầy đủ.
                    </Text>
                  </View>
                )}

                {/* Actions */}
                <View className="gap-2.5 pt-1">
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-85"
                    onPress={() => void handlePing()}
                    style={{ backgroundColor: colors.accent }}
                  >
                    <Radio color={colors.background} size={16} strokeWidth={2.5} />
                    <Text className="text-[14px] font-black" style={{ color: colors.background }}>
                      Ping máy tính
                    </Text>
                  </Pressable>

                  {isDone && (
                    <Pressable
                      accessibilityRole="button"
                      className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl border px-4 active:opacity-80"
                      onPress={() => void handleApproveAllA()}
                      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
                    >
                      <Zap color={colors.accent} size={16} strokeWidth={2.5} />
                      <Text className="text-[14px] font-black" style={{ color: colors.textPrimary }}>
                        Phê duyệt tất cả hạng A
                      </Text>
                    </Pressable>
                  )}
                </View>
              </View>
            ) : (
              <View className="items-center gap-2 px-5 py-8">
                <View className="mb-2 h-16 w-16 items-center justify-center rounded-3xl" style={{ backgroundColor: colors.surfaceSoft }}>
                  <Smartphone color={colors.textSecondary} size={30} strokeWidth={2} />
                </View>
                <Text className="text-center text-[16px] font-bold" style={{ color: colors.textPrimary }}>
                  Chưa có phiên nào đang chạy
                </Text>
                <Text className="text-center text-[13px] leading-5" style={{ color: colors.textSecondary }}>
                  Bắt đầu phân tích CV trên máy tính để tiến độ hiển thị tại đây theo thời gian thực.
                </Text>
              </View>
            )}
          </View>

          {/* How it works */}
          <View
            className="gap-5 rounded-3xl border p-5"
            style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
          >
            <Text className="text-[17px] font-bold" style={{ color: colors.textPrimary }}>
              Cách kết nối
            </Text>
            <View className="gap-5">
              <StepRow
                done={Boolean(authUser)}
                index={1}
                title="Đăng nhập cùng tài khoản"
                subtitle="Dùng cùng Gmail trên cả điện thoại và máy tính."
              />
              <StepRow
                done={false}
                index={2}
                title="Mở SupportHR trên máy tính"
                subtitle="Truy cập phần mềm trên trình duyệt PC."
              />
              <StepRow
                done={false}
                index={3}
                title="Bắt đầu phân tích CV"
                subtitle="Upload JD và CV rồi chạy AI screening."
              />
              <StepRow
                done={isConnected}
                index={4}
                title="Tiến độ xuất hiện tại đây"
                subtitle="Điện thoại tự động nhận dữ liệu, không cần làm gì thêm."
              />
            </View>
          </View>

          {/* Connection info */}
          <View
            className="rounded-3xl border p-5"
            style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
          >
            <Text className="mb-3 text-[17px] font-bold" style={{ color: colors.textPrimary }}>
              Thông tin kết nối
            </Text>
            <View className="gap-3">
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>Phương thức</Text>
                <Text className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>Firestore Real-Time</Text>
              </View>
              <View className="h-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>Độ trễ</Text>
                <Text className="text-[13px] font-semibold" style={{ color: colors.textPrimary }}>~100–300ms</Text>
              </View>
              <View className="h-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>Cần cùng WiFi</Text>
                <Text className="text-[13px] font-semibold" style={{ color: colors.accent }}>Không</Text>
              </View>
              <View className="h-px" style={{ backgroundColor: colors.border }} />
              <View className="flex-row items-center justify-between">
                <Text className="text-[13px]" style={{ color: colors.textSecondary }}>Trạng thái</Text>
                <View className="flex-row items-center gap-2">
                  {isConnected ? (
                    <PulsingDot color={colors.accent} />
                  ) : (
                    <View className="h-2 w-2 rounded-full" style={{ backgroundColor: colors.textSecondary }} />
                  )}
                  <Text className="text-[13px] font-semibold" style={{ color: isConnected ? colors.accent : colors.textSecondary }}>
                    {isConnected ? "Đang kết nối" : "Chờ kết nối"}
                  </Text>
                </View>
              </View>
            </View>
          </View>

        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
