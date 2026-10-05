import { useState, memo, useMemo } from "react";
import { Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Sparkles,
  TrendingUp,
  ChevronDown,
  ChevronUp
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { QuickCvScoreItem } from "../types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const MemoizedAppHeader = memo(AppHeader);

function ScoreBadge({ item }: { item: QuickCvScoreItem }) {
  const { colors } = useAppTheme();

  return (
    <View className="items-center rounded-[24px] border px-4 py-3" style={{ backgroundColor: colors.successSoft, borderColor: colors.success, borderWidth: 1.2 }}>
      <Text className="text-[34px] font-black leading-9" style={{ color: colors.success }}>{item.score}</Text>
      <Text className="mt-1 text-[9px] font-extrabold uppercase tracking-wider" style={{ color: colors.success }}>Hạng {item.rank}</Text>
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
    <View className="rounded-3xl border p-4.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
      <View className="mb-3.5 flex-row items-center gap-3">
        <View className="h-10 w-10 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surface }}>
          <Icon color={color} size={18} strokeWidth={2.4} />
        </View>
        <Text className="text-base font-black tracking-tight" style={{ color: colors.textPrimary }}>{title}</Text>
      </View>
      <View className="gap-2.5">
        {(items.length > 0 ? items : ["AI chưa có đủ dữ liệu để kết luận mục này."]).slice(0, 4).map((text) => (
          <View className="flex-row items-start gap-2.5" key={text}>
            <Text className="text-sm font-black mt-0.5" style={{ color: colors.textSecondary }}>•</Text>
            <Text className="min-w-0 flex-1 text-sm leading-5 font-semibold" style={{ color: colors.textPrimary }}>{text}</Text>
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
    <View className="rounded-3xl border p-3.5" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }}>
      <View className="mb-3.5 flex-row items-center justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-sm font-black tracking-tight" style={{ color: colors.textPrimary }}>{title}</Text>
          <Text className="mt-1 text-[11px] font-semibold" style={{ color: colors.textSecondary }}>{subtitle}</Text>
        </View>
        <View
          className="min-h-8 min-w-8 items-center justify-center rounded-xl border px-2.5"
          style={{ backgroundColor: isGood ? colors.successSoft : colors.warningSoft, borderColor: color, borderWidth: 1 }}
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
              style={{ backgroundColor: isGood ? colors.successSoft : colors.warningSoft, borderColor: color, borderWidth: 0.85 }}
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
          <View className="min-h-11 justify-center rounded-2xl border px-3" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
            <Text className="text-xs font-semibold" style={{ color: colors.textSecondary }}>Chưa có dữ liệu kỹ năng.</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// Interactively collapsible Before/After card for clean, custom UX
function BeforeAfterCard({ sug, index }: { sug: any; index: number }) {
  const { colors } = useAppTheme();
  const [expanded, setExpanded] = useState(index === 0); // Default first item expanded

  return (
    <View
      className="overflow-hidden rounded-2xl border mb-2"
      style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }}
    >
      <Pressable
        accessibilityRole="button"
        className="min-h-[50px] flex-row items-center justify-between px-3.5 py-2.5"
        onPress={() => setExpanded(!expanded)}
        style={({ pressed }) => [{
          backgroundColor: expanded ? colors.surfaceSoft : "transparent",
          opacity: pressed ? 0.9 : 1
        }]}
      >
        <Text className="text-xs font-black flex-1 min-w-0 mr-2" numberOfLines={1} style={{ color: colors.accent }}>
          Phần: {sug.section}
        </Text>
        {expanded ? <ChevronUp color={colors.textSecondary} size={16} /> : <ChevronDown color={colors.textSecondary} size={16} />}
      </Pressable>

      {expanded && (
        <View className="p-3.5 border-t gap-3" style={{ borderColor: colors.border }}>
          <View className="gap-1">
            <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.danger }}>Trước:</Text>
            <Text className="text-xs leading-5 font-semibold" style={{ color: colors.textPrimary }}>{sug.before}</Text>
          </View>
          <View className="gap-1">
            <Text className="text-[10px] font-black uppercase tracking-wider" style={{ color: colors.success }}>Sau (Gợi ý):</Text>
            <Text className="text-xs leading-5 font-bold" style={{ color: colors.textPrimary }}>{sug.after}</Text>
          </View>
          <View className="mt-1 flex-row gap-1 bg-neutral-100 dark:bg-neutral-800 p-2.5 rounded-xl border" style={{ borderColor: colors.border, borderWidth: 0.6 }}>
            <Text className="text-[10px] font-black" style={{ color: colors.textSecondary }}>Lý do:</Text>
            <Text className="flex-1 text-[10px] leading-4 font-semibold" style={{ color: colors.textSecondary }}>{sug.reason}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const ResultCard = memo(({ item, order, authUser }: { item: QuickCvScoreItem; order: number; authUser: any }) => {
  const { colors, surfaceShadowStyle } = useAppTheme();
  const navigation = useNavigation<Navigation>();
  const isCandidate = authUser?.userRole === "candidate";

  return (
    <View className="gap-4.5 rounded-[30px] border p-4.5" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
      <View className="flex-row items-start gap-3">
        <View className="mt-1 h-12 w-12 items-center justify-center rounded-2xl border" style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1 }}>
          <FileText color={colors.accent} size={22} strokeWidth={2.4} />
        </View>
        <View className="min-w-0 flex-1">
          <Text className="text-[11px] font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>CV {order}</Text>
          <Text className="mt-1 text-xl font-black leading-6" numberOfLines={2} style={{ color: colors.textPrimary }}>
            {item.candidate_name || item.file_name || "Ứng viên"}
          </Text>
          <Text className="mt-1 text-sm font-semibold" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {item.target_role || "Chưa rõ vị trí"}
          </Text>
        </View>
        <ScoreBadge item={item} />
      </View>

      {isCandidate && (
        <Pressable
          accessibilityRole="button"
          className="min-h-12 items-center justify-center rounded-2xl"
          onPress={() => navigation.navigate("QuickCvEditor", { scoreItem: item })}
          style={({ pressed }) => [{
            backgroundColor: colors.accent,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }]}
        >
          <Text className="text-sm font-black text-black">✏️ Chỉnh sửa & Xuất PDF mới</Text>
        </Pressable>
      )}

      {item.summary ? (
        <View className="rounded-3xl border p-4" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
          <Text className="text-sm font-black tracking-tight" style={{ color: colors.textPrimary }}>Tóm tắt AI</Text>
          <Text className="mt-2 text-sm leading-6 font-semibold" style={{ color: colors.textPrimary }}>{item.summary}</Text>
        </View>
      ) : null}

      {/* 5-Criteria Rubric Breakdown */}
      {item.rubric_scores && item.rubric_scores.length > 0 ? (
        <View className="rounded-3xl border p-4.5 gap-3.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
          <Text className="text-sm font-black tracking-tight" style={{ color: colors.textPrimary }}>Tiêu chí đánh giá chi tiết (Rubric)</Text>
          <View className="gap-3.5">
            {item.rubric_scores.map((rubric) => {
              const progress = (rubric.score / 20) * 100;
              const barColor = rubric.score >= 16 ? colors.success : rubric.score >= 12 ? colors.warning : colors.danger;
              return (
                <View key={rubric.name} className="gap-1.5">
                  <View className="flex-row justify-between text-xs font-semibold">
                    <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>{rubric.name}</Text>
                    <Text className="text-xs font-black" style={{ color: barColor }}>{rubric.score}/20đ</Text>
                  </View>
                  <View className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.border }}>
                    <View className="h-full rounded-full" style={{ backgroundColor: barColor, width: `${progress}%` }} />
                  </View>
                  <Text className="text-[11px] leading-4 font-semibold" style={{ color: colors.textSecondary }}>{rubric.comment}</Text>
                </View>
              );
            })}
          </View>
        </View>
      ) : null}

      {/* Before / After Suggestions collapsible panels */}
      {item.before_after_suggestions && item.before_after_suggestions.length > 0 ? (
        <View className="rounded-3xl border p-4 gap-3" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
          <Text className="text-sm font-black tracking-tight" style={{ color: colors.textPrimary }}>Gợi ý chỉnh sửa chi tiết (Trước ➜ Sau)</Text>
          <View>
            {item.before_after_suggestions.map((sug, idx) => (
              <BeforeAfterCard sug={sug} index={idx} key={idx} />
            ))}
          </View>
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

      <View className="gap-3.5 rounded-3xl border p-3.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
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
});

export function QuickCvResultScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();
  
  const authUser = useRecruiterStore((state) => state.authUser);
  const results = useRecruiterStore((state) => state.quickCvResults);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  // Performance Optimization: Memoize result map
  const resultsNode = useMemo(() => {
    if (results.length > 0) {
      return results.map((item, index) => (
        <ResultCard
          item={item}
          key={`${item.file_name}-${index}`}
          order={index + 1}
          authUser={authUser}
        />
      ));
    }
    return (
      <View className="items-center rounded-[30px] border p-6" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
        <Text className="text-base font-black tracking-tight" style={{ color: colors.textPrimary }}>Chưa có kết quả</Text>
        <Text className="mt-2 text-center text-sm leading-6 font-semibold" style={{ color: colors.textSecondary }}>
          Hãy quay lại trang chủ để chụp hoặc tải CV lên trước.
        </Text>
        <Pressable
          accessibilityRole="button"
          className="mt-5 min-h-12 items-center justify-center rounded-2xl px-5"
          onPress={() => navigation.navigate("QuickCv")}
          style={({ pressed }) => [{
            backgroundColor: colors.accent,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }]
          }]}
        >
          <Text className="text-sm font-black text-black">Nạp CV ngay</Text>
        </Pressable>
      </View>
    );
  }, [results, authUser, colors, surfaceShadowStyle, navigation]);

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <MemoizedAppHeader
        right={
          <Pressable
            accessibilityRole="button"
            className="min-h-10 flex-row items-center gap-2 rounded-full border px-3"
            onPress={() => navigation.navigate("QuickCv")}
            style={({ pressed }) => [{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 0.85,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }]
            }]}
          >
            <ArrowLeft color={colors.accent} size={16} strokeWidth={2.5} />
            <Text className="text-xs font-semibold" style={{ color: colors.accent }}>Nạp CV</Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 32, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4 px-4 pt-2" style={{ width: contentWidth + 32 }}>
          <View className="rounded-[30px] border p-5" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <View className="mb-4 h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900">
              <Sparkles color={colors.accent} size={23} strokeWidth={2.4} />
            </View>
            <Text className="text-[28px] font-black leading-8 tracking-tight" style={{ color: colors.textPrimary }}>Kết quả chấm CV</Text>
            <Text className="mt-2 text-sm leading-6 font-semibold" style={{ color: colors.textSecondary }}>
              AI đã đánh giá CV theo thang rubric chuẩn Đại học Đại Nam và gợi ý sửa đổi Trước/Sau chi tiết.
            </Text>
          </View>

          {resultsNode}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
