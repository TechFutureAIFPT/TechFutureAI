import { useEffect, useRef, type ReactNode } from "react";
import { Animated, Easing, Platform, Text, View } from "react-native";
import { BrainCircuit, CheckCircle2, Loader2, Radar, Sparkles } from "lucide-react-native";

import { useAppTheme } from "../theme/ThemeContext";
import { MutedText, Panel } from "./Primitives";

const useNativeAnimationDriver = Platform.OS !== "web";

export function AmbientBackground() {
  const { colors } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimationDriver
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2200,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimationDriver
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const opacity = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.08, 0.2]
  });

  return (
    <View className="absolute inset-0 overflow-hidden" style={{ backgroundColor: colors.background }}>
      <View className="absolute left-0 right-0 top-0 h-[230px]" style={{ backgroundColor: colors.surfaceSoft }} />
      <Animated.View
        className="absolute left-0 right-0 top-20 h-px"
        style={{ backgroundColor: colors.accent, opacity }}
      />
    </View>
  );
}

export function FloatingPanel({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const translate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translate, {
          toValue: -5,
          delay,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimationDriver
        }),
        Animated.timing(translate, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: useNativeAnimationDriver
        })
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [delay, translate]);

  return <Animated.View style={{ transform: [{ translateY: translate }] }}>{children}</Animated.View>;
}

export function BrandedLoadingScreen({ label = "Đang đồng bộ dữ liệu tuyển dụng" }: { label?: string }) {
  const { colors } = useAppTheme();
  const rotate = useRef(new Animated.Value(0)).current;
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const rotateLoop = Animated.loop(
      Animated.timing(rotate, {
        toValue: 1,
        duration: 1200,
        easing: Easing.linear,
        useNativeDriver: useNativeAnimationDriver
      })
    );
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, {
          toValue: 1,
          duration: 1450,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: useNativeAnimationDriver
        }),
        Animated.timing(scan, {
          toValue: 0,
          duration: 1450,
          easing: Easing.inOut(Easing.cubic),
          useNativeDriver: useNativeAnimationDriver
        })
      ])
    );

    rotateLoop.start();
    scanLoop.start();
    return () => {
      rotateLoop.stop();
      scanLoop.stop();
    };
  }, [rotate, scan]);

  const spin = rotate.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"]
  });
  const translateX = scan.interpolate({
    inputRange: [0, 1],
    outputRange: [-110, 110]
  });

  return (
    <View className="flex-1 items-center justify-center px-7" style={{ backgroundColor: colors.background }}>
      <AmbientBackground />
      <Panel className="w-full items-center px-6 py-8">
        <Animated.View style={{ transform: [{ rotate: spin }] }}>
          <Loader2 color={colors.accent} size={34} strokeWidth={2.7} />
        </Animated.View>
        <Text className="mt-5 text-center text-2xl font-black" style={{ color: colors.textPrimary }}>Hipo Tools</Text>
        <Text className="mt-1 text-center text-sm font-bold" style={{ color: colors.accent }}>Đồng hành tuyển dụng</Text>
        <MutedText className="mt-4 text-center">{label}</MutedText>
        <View className="mt-6 h-1.5 w-full overflow-hidden rounded-none" style={{ backgroundColor: colors.surfaceSoft }}>
          <Animated.View
            className="h-full w-28 rounded-none"
            style={{ backgroundColor: colors.accent, transform: [{ translateX }] }}
          />
        </View>
      </Panel>
    </View>
  );
}

export function CandidateSkeletonList() {
  const { colors } = useAppTheme();

  return (
    <View className="gap-3">
      {[0, 1, 2].map((item) => (
        <Panel className="p-4" key={item}>
          <View className="flex-row gap-3">
            <View className="h-12 w-12 rounded-none" style={{ backgroundColor: colors.surfaceSoft }} />
            <View className="flex-1">
              <View className="h-4 w-2/3 rounded-none" style={{ backgroundColor: colors.surfaceSoft }} />
              <View className="mt-3 h-3 w-1/2 rounded-none" style={{ backgroundColor: colors.surfaceSoft }} />
              <View className="mt-4 h-12 rounded-none" style={{ backgroundColor: colors.surfaceSoft }} />
            </View>
          </View>
        </Panel>
      ))}
    </View>
  );
}

export function HomeShowcase() {
  const { colors } = useAppTheme();

  return (
    <View className="mt-5 gap-4">
      <FloatingPanel>
        <Panel className="overflow-hidden p-0">
          <View className="border-b px-4 py-3" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
            <View className="flex-row items-center justify-between">
              <View className="min-w-0 flex-1 pr-3">
                <Text className="text-xs font-black uppercase tracking-[2px]" style={{ color: colors.accent }}>Danh sách chọn</Text>
                <Text className="mt-1 text-lg font-black" numberOfLines={1} style={{ color: colors.textPrimary }}>Lập trình viên cao cấp</Text>
              </View>
              <View className="shrink-0 rounded-none border px-3 py-2" style={{ backgroundColor: colors.successSoft, borderColor: colors.success }}>
                <Text className="text-lg font-black" style={{ color: colors.success }}>92</Text>
              </View>
            </View>
          </View>
          <View className="p-4">
            {[
              ["Trần Tuấn A", "React, Firebase, kiến trúc rõ ràng", "A"],
              ["Nguyễn Minh B", "UI component, JavaScript hiện đại", "B"]
            ].map(([name, desc, rank]) => (
              <View
                className="mb-3 flex-row items-center gap-3 rounded-none border p-3"
                key={name}
                style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
              >
                <View className="h-9 w-9 items-center justify-center rounded-none" style={{ backgroundColor: colors.accentSoft }}>
                  <Text className="text-xs font-black" style={{ color: colors.accent }}>{rank}</Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>{name}</Text>
                  <Text className="mt-1 text-xs" numberOfLines={1} style={{ color: colors.textSecondary }}>{desc}</Text>
                </View>
                <CheckCircle2 color={colors.success} size={18} />
              </View>
            ))}
            <View className="flex-row gap-2">
              <View className="flex-1 rounded-none py-2" style={{ backgroundColor: colors.successSoft }}>
                <Text className="text-center text-xs font-black" style={{ color: colors.success }}>Chọn</Text>
              </View>
              <View className="flex-1 rounded-none py-2" style={{ backgroundColor: colors.dangerSoft }}>
                <Text className="text-center text-xs font-black" style={{ color: colors.danger }}>Loại</Text>
              </View>
              <View className="flex-1 rounded-none py-2" style={{ backgroundColor: colors.accentSoft }}>
                <Text className="text-center text-xs font-black" style={{ color: colors.accent }}>Phỏng vấn</Text>
              </View>
            </View>
          </View>
        </Panel>
      </FloatingPanel>

      <View className="flex-row gap-3">
        <Panel className="flex-1 p-4">
          <Radar color={colors.accent} size={22} />
          <Text className="mt-3 text-2xl font-black" style={{ color: colors.textPrimary }}>1 chạm</Text>
          <Text className="mt-1 text-xs leading-4" style={{ color: colors.textSecondary }}>Duyệt nhanh hồ sơ đã được AI tóm tắt.</Text>
        </Panel>
        <Panel className="flex-1 p-4">
          <BrainCircuit color={colors.info} size={22} />
          <Text className="mt-3 text-2xl font-black" style={{ color: colors.textPrimary }}>Trợ lý AI</Text>
          <Text className="mt-1 text-xs leading-4" style={{ color: colors.textSecondary }}>Câu hỏi phỏng vấn và gợi ý lương.</Text>
        </Panel>
      </View>
    </View>
  );
}

export function LoadingStatusRail({ active = false }: { active?: boolean }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  if (!active) return null;

  return (
    <View
      className="pointer-events-none absolute bottom-4 right-4 border px-3 py-2"
      style={[{ backgroundColor: colors.surface, borderColor: colors.accent }, surfaceShadowStyle]}
    >
      <View className="flex-row items-center gap-2">
        <Sparkles color={colors.accent} size={13} />
        <Text className="text-[10px] font-black uppercase" style={{ color: colors.accent }}>
          Đang tải
        </Text>
      </View>
    </View>
  );
}
