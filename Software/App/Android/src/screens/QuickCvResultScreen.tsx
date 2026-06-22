import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Sparkles,
  TrendingUp
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { QuickCvScoreItem } from "../types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

function ScoreBadge({ item }: { item: QuickCvScoreItem }) {
  const { colors } = useAppTheme();

  return (
    <View className="items-center rounded-[24px] border px-4 py-3" style={{ backgroundColor: colors.successSoft, borderColor: colors.success }}>
      <Text className="text-[34px] font-black leading-9" style={{ color: colors.success }}>{item.score}</Text>
      <Text className="mt-1 text-[11px] font-black uppercase" style={{ color: colors.success }}>Hạng {item.rank}</Text>
    </View>
  );
}

function InsightBlock({
  color,
  icon: Icon,
  items,
  title
}: {
  color: string;
  icon: typeof CheckCircle2;
  items: string[];
  title: string;
}) {
  const { colors } = useAppTheme();

  return (
    <View className="rounded-3xl border p-4" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
      <View className="mb-3 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surface }}>
          <Icon color={color} size={18} strokeWidth={2.4} />
        </View>
        <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>{title}</Text>
      </View>
      <View className="gap-2">
        {(items.length > 0 ? items : ["AI chưa có đủ dữ liệu để kết luận mục này."]).slice(0, 4).map((text) => (
          <View className="flex-row gap-2" key={text}>
            <Text className="text-sm font-black" style={{ color: colors.textSecondary }}>•</Text>
            <Text className="min-w-0 flex-1 text-sm leading-5" style={{ color: colors.textPrimary }}>{text}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function KeywordPanel({
  items,
  subtitle,
  title,
  tone
}: {
  items: string[];
  subtitle: string;
  title: string;
  tone: "good" | "missing";
}) {
  const { colors } = useAppTheme();
  const isGood = tone === "good";
  const color = isGood ? colors.success : colors.warning;
  const visibleItems = items.slice(0, 8);

  return (
    <View className="rounded-3xl border p-3" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
      <View className="mb-3 flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>{title}</Text>
          <Text className="mt-1 text-[11px] font-medium" style={{ color: colors.textSecondary }}>{subtitle}</Text>
        </View>
        <View
          className="min-h-8 min-w-8 items-center justify-center rounded-xl border px-2"
          style={{ backgroundColor: isGood ? colors.successSoft : colors.warningSoft, borderColor: color }}
        >
          <Text className="text-xs font-black" style={{ color }}>
            {visibleItems.length}
          </Text>
        </View>
      </View>

      <View className="gap-2">
        {visibleItems.length > 0 ? (
          visibleItems.map((keyword, index) => (
            <View
              className="min-h-11 flex-row items-start gap-3 rounded-2xl border px-3 py-2.5"
              key={`${tone}-${keyword}-${index}`}
              style={{ backgroundColor: isGood ? colors.successSoft : colors.warningSoft, borderColor: color }}
            >
              <View
                className="mt-0.5 h-6 w-6 items-center justify-center rounded-lg"
                style={{ backgroundColor: colors.surface }}
              >
                {isGood ? (
                  <CheckCircle2 color={color} size={14} strokeWidth={2.5} />
                ) : (
                  <AlertTriangle color={color} size={14} strokeWidth={2.5} />
                )}
              </View>
              <Text className="min-w-0 flex-1 text-xs font-semibold leading-5" style={{ color: colors.textPrimary }}>
                {keyword}
              </Text>
            </View>
          ))
        ) : (
          <View className="min-h-11 justify-center rounded-2xl border px-3" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Chưa có dữ liệu kỹ năng.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

function ResultCard({ item, order }: { item: QuickCvScoreItem; order: number }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  return (
    <View className="gap-4 rounded-[30px] border p-4" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
      <View className="flex-row items-start gap-3">
        <View className="mt-1 h-12 w-12 items-center justify-center rounded-2xl border" style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent }}>
          <FileText color={colors.accent} size={22} strokeWidth={2.4} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: colors.textSecondary }}>CV {order}</Text>
          <Text className="mt-1 text-xl font-semibold leading-6" numberOfLines={2} style={{ color: colors.textPrimary }}>
            {item.candidate_name || item.file_name || "Ứng viên"}
          </Text>
          <Text className="mt-1 text-sm" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {item.target_role || "Chưa rõ vị trí"}
          </Text>
        </View>
        <ScoreBadge item={item} />
      </View>

      {item.summary ? (
        <View className="rounded-3xl border p-4" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
          <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Tóm tắt AI</Text>
          <Text className="mt-2 text-sm leading-6" style={{ color: colors.textPrimary }}>{item.summary}</Text>
        </View>
      ) : null}

      <InsightBlock
        color={colors.success}
        icon={CheckCircle2}
        items={item.strengths}
        title="Điểm mạnh"
      />
      <InsightBlock
        color={colors.danger}
        icon={AlertTriangle}
        items={item.weaknesses}
        title="Điểm yếu"
      />
      <InsightBlock
        color={colors.accent}
        icon={TrendingUp}
        items={item.improvements}
        title="Cần cải thiện"
      />

      <View className="gap-3 rounded-3xl border p-3" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
        <KeywordPanel
          items={item.matched_keywords}
          subtitle="Các điểm AI tìm thấy trong CV"
          title="Kỹ năng đã có"
          tone="good"
        />
        <KeywordPanel
          items={item.missing_keywords}
          subtitle="Nên bổ sung hoặc làm rõ trong CV"
          title="Kỹ năng còn thiếu"
          tone="missing"
        />
      </View>
    </View>
  );
}

export function QuickCvResultScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();
  const results = useRecruiterStore((state) => state.quickCvResults);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          right={
            <Pressable
              accessibilityRole="button"
              className="min-h-10 flex-row items-center gap-2 rounded-full border px-3 active:opacity-80"
              onPress={() => navigation.navigate("QuickCv")}
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <ArrowLeft color={colors.accent} size={16} strokeWidth={2.5} />
              <Text className="text-xs font-semibold" style={{ color: colors.accent }}>Nạp CV</Text>
            </Pressable>
          }
        />

        <View className="gap-4 px-4 pt-2" style={{ width: contentWidth + 32 }}>
          <View className="rounded-[30px] border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
              <Sparkles color={colors.accent} size={23} strokeWidth={2.4} />
            </View>
            <Text className="text-[28px] font-semibold leading-8" style={{ color: colors.textPrimary }}>Kết quả chấm CV</Text>
            <Text className="mt-2 text-sm leading-6" style={{ color: colors.textSecondary }}>
              AI đã tách riêng điểm mạnh, điểm yếu và gợi ý cải thiện để bạn xem kết quả rõ ràng hơn.
            </Text>
          </View>

          {results.length > 0 ? (
            results.map((item, index) => <ResultCard item={item} key={`${item.file_name}-${index}`} order={index + 1} />)
          ) : (
            <View className="items-center rounded-[30px] border p-6" style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}>
              <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>Chưa có kết quả</Text>
              <Text className="mt-2 text-center text-sm leading-6" style={{ color: colors.textSecondary }}>
                Hãy quay lại trang chủ để chụp hoặc tải CV lên trước.
              </Text>
              <Pressable
                accessibilityRole="button"
                className="mt-5 min-h-12 items-center justify-center rounded-2xl px-5 active:scale-[0.98]"
                onPress={() => navigation.navigate("QuickCv")}
                style={{ backgroundColor: colors.accent }}
              >
                <Text className="text-sm font-black text-black">Nạp CV ngay</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
