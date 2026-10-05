import { ActivityIndicator, Linking, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useMemo, useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";
import { CheckCircle2, ExternalLink, FileText, Save, ShieldAlert } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { createRenderJDTemplate } from "../services/renderStore";
import { getAuthToken } from "../services/auth";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { JDStandardizeResponse } from "../types";

type ResultRoute = RouteProp<RootStackParamList, "JDStandardizerResult">;
type Navigation = NativeStackNavigationProp<RootStackParamList>;

function buildTemplateText(result: JDStandardizeResponse): string {
  const jd = result.normalizedJD;
  const sections = [
    jd.title ? `# ${jd.title}` : "",
    jd.overview ? `\nTổng quan\n${jd.overview}` : "",
    jd.responsibilities.length > 0 ? `\nMô tả công việc\n${jd.responsibilities.map((item) => `- ${item}`).join("\n")}` : "",
    jd.requirements.length > 0 ? `\nYêu cầu công việc\n${jd.requirements.map((item) => `- ${item}`).join("\n")}` : "",
    jd.benefits.length > 0 ? `\nQuyền lợi\n${jd.benefits.map((item) => `- ${item}`).join("\n")}` : "",
    jd.salary ? `\nMức lương\n${jd.salary}` : "",
    jd.location ? `\nĐịa điểm\n${jd.location}` : "",
    jd.workingTime ? `\nThời gian làm việc\n${jd.workingTime}` : "",
    jd.applicationInfo ? `\nCách ứng tuyển\n${jd.applicationInfo}` : ""
  ];

  return sections.filter(Boolean).join("\n").trim();
}

function SectionList({ items, title }: { items: Array<{ label: string; detail?: string; reason?: string }>; title: string }) {
  const { colors, isDark } = useAppTheme();
  const cardColor = isDark ? colors.surfaceSoft : "#F9FAFB";
  const titleColor = isDark ? colors.textPrimary : "#1F2937";
  const bodyColor = isDark ? colors.textSecondary : "#6B7280";

  if (items.length === 0) return null;

  return (
    <View className="gap-2">
      <Text className="text-[15px] font-semibold" style={{ color: titleColor }}>
        {title}
      </Text>
      {items.map((item, index) => (
        <View className="rounded-2xl px-3 py-2.5" key={`${title}-${index}`} style={{ backgroundColor: cardColor }}>
          <Text className="text-[13px] font-semibold" style={{ color: titleColor }}>
            {item.label}
          </Text>
          <Text className="mt-1 text-[12px] leading-5" style={{ color: bodyColor }}>
            {item.detail || item.reason}
          </Text>
        </View>
      ))}
    </View>
  );
}

function BulletSection({ items, title }: { items: string[]; title: string }) {
  const { colors, isDark } = useAppTheme();
  const titleColor = isDark ? colors.textPrimary : "#1F2937";
  const bodyColor = isDark ? colors.textSecondary : "#6B7280";
  if (items.length === 0) return null;

  return (
    <View>
      <Text className="mb-2 text-[14px] font-semibold" style={{ color: titleColor }}>
        {title}
      </Text>
      <View className="gap-1.5">
        {items.map((item, index) => (
          <Text className="text-[12px] leading-5" key={`${title}-${index}`} style={{ color: bodyColor }}>
            • {item}
          </Text>
        ))}
      </View>
    </View>
  );
}

export function JDStandardizerResultScreen() {
  const navigation = useNavigation<Navigation>();
  const route = useRoute<ResultRoute>();
  const { result } = route.params;
  const { width } = useWindowDimensions();
  const { colors, isDark, surfaceShadowStyle } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [templateSaved, setTemplateSaved] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const contentWidth = Math.min(Math.max(width - 40, 300), 430);
  const ui = useMemo(
    () =>
      isDark
        ? {
            background: colors.background,
            surface: colors.surface,
            surfaceSoft: colors.surfaceSoft,
            text: colors.textPrimary,
            muted: colors.textSecondary,
            accent: colors.accent,
            accentSoft: colors.accentSoft,
            buttonText: "#111827"
          }
        : {
            background: "#F0F4FF",
            surface: "#FFFFFF",
            surfaceSoft: "#F0F4FF",
            text: "#0F172A",
            muted: "#64748B",
            accent: "#2563EB",
            accentSoft: "rgba(37, 99, 235, 0.10)",
            buttonText: "#FFFFFF"
          },
    [colors, isDark]
  );
  const blueButtonShadow = useMemo(
    () => ({
      elevation: isDark ? 0 : 6,
      shadowColor: "#2563EB",
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: isDark ? 0 : 0.25,
      shadowRadius: 18
    }),
    [isDark]
  );
  const scoreColor = result.score >= 80 ? colors.success : result.score >= 60 ? ui.accent : colors.danger;
  const hasHighPriorityMissing = result.missingSections.some((item) => item.priority === "high");
  const canCreateTemplate = result.score >= 80 && !hasHighPriorityMissing;

  const saveAsTemplate = async () => {
    if (!canCreateTemplate || templateSaved || savingTemplate) return;
    setSavingTemplate(true);
    setSaveError(null);

    try {
      const token = await getAuthToken();
      if (!token) {
        throw new Error("Bạn cần đăng nhập để lưu mẫu JD.");
      }

      const title = result.normalizedJD.title || "JD đã chuẩn hóa";
      await createRenderJDTemplate(token, {
        category: "Chuẩn hóa JD",
        hardFilters: {
          generatedFrom: "jd-standardizer",
          location: result.normalizedJD.location,
          platform: result.platform.name,
          salary: result.normalizedJD.salary,
          source: result.source,
          score: result.score
        },
        jdText: buildTemplateText(result),
        jobPosition: title,
        name: title
      });
      setTemplateSaved(true);
    } catch (error) {
      setSaveError(error instanceof Error ? error.message : "Không thể lưu mẫu JD.");
    } finally {
      setSavingTemplate(false);
    }
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: ui.background }}>
      <AppHeader minimal title="Kết quả JD" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: ui.background, paddingBottom: 32, paddingTop: 18 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 px-5" style={{ width: contentWidth + 40 }}>
          <View className="gap-4 rounded-3xl p-4" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
            <View className="flex-row items-start gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: ui.accentSoft }}>
                <FileText color={ui.accent} size={22} strokeWidth={2.35} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[20px] font-bold" style={{ color: ui.text }}>
                  JD sau chuẩn hóa
                </Text>
                <Text className="mt-1 text-[12px] leading-5" style={{ color: ui.muted }}>
                  Tối ưu cho {result.platform.name} · Nguồn {result.source === "ai" ? "AI" : "sơ bộ"}
                </Text>
              </View>
              <Text className="text-[32px] font-bold" style={{ color: scoreColor }}>
                {result.score}
              </Text>
            </View>

            <SectionList items={result.missingSections} title="Phần còn thiếu" />
            <SectionList items={result.weakPoints} title="Điểm cần cải thiện" />
            <SectionList items={result.suggestions} title="Gợi ý bổ sung" />
          </View>

          <View className="gap-3 rounded-3xl p-4" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
            <View className="flex-row items-center gap-2">
              <CheckCircle2 color={colors.success} size={18} strokeWidth={2.3} />
              <Text className="flex-1 text-[17px] font-bold" style={{ color: ui.text }}>
                {result.normalizedJD.title || "JD chuẩn hóa"}
              </Text>
            </View>
            {result.normalizedJD.overview ? (
              <Text className="text-[13px] leading-5" style={{ color: ui.muted }}>
                {result.normalizedJD.overview}
              </Text>
            ) : null}
            <View className="gap-4 rounded-2xl p-3" style={{ backgroundColor: ui.surfaceSoft }}>
              <BulletSection items={result.normalizedJD.responsibilities} title="Mô tả công việc" />
              <BulletSection items={result.normalizedJD.requirements} title="Yêu cầu" />
              <BulletSection items={result.normalizedJD.benefits} title="Quyền lợi" />
              {result.normalizedJD.salary || result.normalizedJD.location || result.normalizedJD.workingTime ? (
                <Text className="text-[12px] leading-5" style={{ color: ui.muted }}>
                  {[result.normalizedJD.salary, result.normalizedJD.location, result.normalizedJD.workingTime].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
              {result.normalizedJD.applicationInfo ? (
                <Text className="text-[12px] leading-5" style={{ color: ui.muted }}>
                  {result.normalizedJD.applicationInfo}
                </Text>
              ) : null}
            </View>
          </View>

          <View className="gap-3 rounded-3xl p-4" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: canCreateTemplate ? colors.successSoft : colors.warningSoft }}>
                {canCreateTemplate ? (
                  <Save color={colors.success} size={20} strokeWidth={2.35} />
                ) : (
                  <ShieldAlert color={colors.warning} size={20} strokeWidth={2.35} />
                )}
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-[16px] font-bold" style={{ color: ui.text }}>
                  {canCreateTemplate ? "JD này đủ điều kiện tạo mẫu" : "JD chưa đủ thông tin để tạo mẫu"}
                </Text>
                <Text className="mt-1 text-[12px] leading-5" style={{ color: ui.muted }}>
                  {canCreateTemplate
                    ? "Bạn có thể lưu bản JD đã chuẩn hóa vào thư viện mẫu JD của tài khoản."
                    : "Hãy bổ sung các phần còn thiếu ưu tiên cao, sau đó chuẩn hóa lại để tạo mẫu JD sạch hơn."}
                </Text>
              </View>
            </View>

            {!authUser ? (
              <View className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: ui.surfaceSoft }}>
                <Text className="text-[12px] leading-5" style={{ color: ui.muted }}>
                  Cần đăng nhập để lưu mẫu JD vào tài khoản.
                </Text>
              </View>
            ) : null}

            {saveError ? (
              <View className="rounded-2xl px-3 py-2.5" style={{ backgroundColor: colors.dangerSoft }}>
                <Text className="text-[12px] font-semibold" style={{ color: colors.danger }}>
                  {saveError}
                </Text>
              </View>
            ) : null}

            {canCreateTemplate ? (
              <Pressable
                accessibilityRole="button"
                className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 active:scale-[0.99] active:opacity-90"
                disabled={!authUser || savingTemplate || templateSaved}
                onPress={() => void saveAsTemplate()}
                style={[
                  {
                    backgroundColor: !authUser || templateSaved ? ui.surfaceSoft : ui.accent,
                    opacity: !authUser ? 0.72 : 1
                  },
                  !templateSaved && authUser ? blueButtonShadow : null
                ]}
              >
                {savingTemplate ? (
                  <ActivityIndicator color={ui.buttonText} />
                ) : (
                  <Save color={templateSaved || !authUser ? ui.muted : ui.buttonText} size={17} strokeWidth={2.35} />
                )}
                <Text className="text-sm font-bold" style={{ color: templateSaved || !authUser ? ui.muted : ui.buttonText }}>
                  {savingTemplate ? "Đang lưu mẫu..." : templateSaved ? "Đã lưu mẫu JD" : "Tạo mẫu JD"}
                </Text>
              </Pressable>
            ) : (
              <Pressable
                accessibilityRole="button"
                className="min-h-12 items-center justify-center rounded-2xl px-4 active:opacity-85"
                onPress={() => navigation.navigate("JDStandardizer")}
                style={{ backgroundColor: ui.surfaceSoft }}
              >
                <Text className="text-sm font-bold" style={{ color: ui.text }}>
                  Bổ sung thông tin JD
                </Text>
              </Pressable>
            )}

            {templateSaved ? (
              <Pressable
                accessibilityRole="button"
                className="min-h-11 items-center justify-center rounded-2xl px-4 active:opacity-85"
                onPress={() => navigation.navigate("Templates")}
                style={{ backgroundColor: ui.surfaceSoft }}
              >
                <Text className="text-sm font-bold" style={{ color: ui.text }}>
                  Mở Lịch sử & mẫu JD
                </Text>
              </Pressable>
            ) : null}
          </View>

          <Pressable
            accessibilityRole="button"
            className="min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-4 active:scale-[0.99] active:opacity-90"
            onPress={() => {
              if (result.platformUrl) void Linking.openURL(result.platformUrl);
            }}
            style={[{ backgroundColor: ui.accent }, blueButtonShadow]}
          >
            <ExternalLink color={ui.buttonText} size={17} strokeWidth={2.35} />
            <Text className="text-sm font-bold" style={{ color: ui.buttonText }}>
              Mở nền tảng đăng JD
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
