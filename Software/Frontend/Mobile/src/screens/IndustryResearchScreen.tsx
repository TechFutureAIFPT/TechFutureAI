import { useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Compass, ExternalLink, Search, Sparkles } from "lucide-react-native";

import { AppHeader } from "../components/AppChrome";
import { AppButton, EmptyState, MutedText, Panel } from "../components/Primitives";
import {
  DeepResearchAuthError,
  runDeepResearch,
  type DeepResearchResult,
  type DeepResearchSource
} from "../services/deepResearchApi";
import { useAppTheme } from "../theme/ThemeContext";

const SUGGESTIONS = [
  "Ngành AI Engineer có tiềm năng ở Việt Nam không?",
  "Data Analyst và Data Engineer khác nhau thế nào?",
  "Kỹ năng nào đang tăng nhu cầu nhanh nhất năm 2026?",
  "Ngành Marketing Digital hiện có cạnh tranh cao không?"
];

function sourceDomain(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function ReportLine({ line }: { line: string }) {
  const { colors } = useAppTheme();

  if (line.startsWith("## ")) {
    return (
      <Text className="mb-2 mt-4 text-[17px] font-black" style={{ color: colors.textPrimary }}>
        {line.slice(3)}
      </Text>
    );
  }

  const isBullet = line.trimStart().startsWith("- ") || line.trimStart().startsWith("* ");
  const content = isBullet ? line.trimStart().slice(2) : line;
  const parts = content.split(/(\*\*[^*]+\*\*|\[\d+\](?:\[\d+\])*)/g).filter(Boolean);

  const rendered = parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={index} style={{ fontWeight: "800" }}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (/^(\[\d+\])+$/.test(part)) {
      return (
        <Text key={index} style={{ color: colors.accent, fontWeight: "700", fontSize: 12 }}>
          {" "}
          {part}
        </Text>
      );
    }
    return <Text key={index}>{part}</Text>;
  });

  if (!content.trim()) return null;

  return (
    <View className="mb-1.5 flex-row" style={{ paddingLeft: isBullet ? 4 : 0 }}>
      {isBullet ? (
        <Text className="mr-2 text-[14px]" style={{ color: colors.accent }}>
          •
        </Text>
      ) : null}
      <Text className="flex-1 text-[14px] leading-6" style={{ color: colors.textPrimary }}>
        {rendered}
      </Text>
    </View>
  );
}

function SourceCard({ index, source }: { index: number; source: DeepResearchSource }) {
  const { colors } = useAppTheme();

  return (
    <Pressable
      accessibilityRole="button"
      className="mb-2 flex-row items-center gap-3 rounded-xl border p-3 active:opacity-75"
      onPress={() => void Linking.openURL(source.url)}
      style={{ backgroundColor: colors.surface, borderColor: colors.border }}
    >
      <View
        className="h-7 w-7 items-center justify-center rounded-full"
        style={{ backgroundColor: colors.accentSoft }}
      >
        <Text className="text-[11px] font-black" style={{ color: colors.accent }}>
          {index}
        </Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text className="text-[13px] font-semibold" numberOfLines={2} style={{ color: colors.textPrimary }}>
          {source.title}
        </Text>
        <Text className="mt-0.5 text-[11px]" numberOfLines={1} style={{ color: colors.textSecondary }}>
          {sourceDomain(source.url)}
        </Text>
      </View>
      <ExternalLink color={colors.textSecondary} size={15} strokeWidth={2.2} />
    </Pressable>
  );
}

export function IndustryResearchScreen() {
  const { colors } = useAppTheme();
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DeepResearchResult | null>(null);

  const runResearch = async (value = question) => {
    const trimmed = value.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await runDeepResearch(trimmed);
      setResult(response);
    } catch (err) {
      if (err instanceof DeepResearchAuthError) {
        setError(err.message);
      } else {
        setError(err instanceof Error ? err.message : "Không thể hoàn tất nghiên cứu, thử lại sau.");
      }
    } finally {
      setLoading(false);
    }
  };

  const reportLines = result?.report.split("\n") ?? [];

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader minimal title="Nghiên cứu ngành nghề" />

      <ScrollView
        className="flex-1 px-4"
        contentContainerStyle={{ paddingBottom: 32, paddingTop: 14 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-4">
          <View className="mb-2 flex-row items-center gap-2">
            <Compass color={colors.accent} size={20} strokeWidth={2.3} />
            <Text className="text-[20px] font-black" style={{ color: colors.textPrimary }}>
              Deep Research
            </Text>
          </View>
          <MutedText className="leading-5">
            Đặt câu hỏi về một ngành nghề — hệ thống sẽ tìm kiếm nhiều nguồn trên web và tổng hợp báo cáo có trích dẫn,
            thay vì chỉ trả lời theo kiến thức chung.
          </MutedText>
        </View>

        <Panel className="mb-4">
          <TextInput
            className="min-h-[64px] text-sm font-medium"
            multiline
            onChangeText={setQuestion}
            placeholder="VD: Ngành Data Analyst ở Việt Nam có tiềm năng không?"
            placeholderTextColor={colors.textSecondary}
            style={{ color: colors.textPrimary, textAlignVertical: "top" }}
            value={question}
          />
          <AppButton
            className="mt-3"
            disabled={!question.trim()}
            icon={Search}
            label={loading ? "Đang nghiên cứu..." : "Bắt đầu nghiên cứu"}
            loading={loading}
            onPress={() => void runResearch()}
          />
        </Panel>

        {!result && !loading ? (
          <View className="mb-4 flex-row flex-wrap gap-2">
            {SUGGESTIONS.map((suggestion) => (
              <Pressable
                accessibilityRole="button"
                className="rounded-full border px-3 py-2 active:opacity-70"
                key={suggestion}
                onPress={() => {
                  setQuestion(suggestion);
                  void runResearch(suggestion);
                }}
                style={{ borderColor: colors.border, backgroundColor: colors.surface }}
              >
                <Text className="text-[12px] font-semibold" style={{ color: colors.textSecondary }}>
                  {suggestion}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}

        {loading ? (
          <Panel className="items-center py-8">
            <ActivityIndicator color={colors.accent} size="large" />
            <Text className="mt-4 text-center text-sm font-semibold" style={{ color: colors.textPrimary }}>
              Đang tìm kiếm và tổng hợp từ nhiều nguồn...
            </Text>
            <MutedText className="mt-1 text-center">Bước này có thể mất khoảng 20-40 giây.</MutedText>
          </Panel>
        ) : null}

        {error ? (
          <EmptyState
            action={
              error.includes("đăng nhập") ? undefined : (
                <AppButton icon={Search} label="Thử lại" onPress={() => void runResearch()} />
              )
            }
            description={error}
            title="Chưa hoàn tất được nghiên cứu"
          />
        ) : null}

        {result ? (
          <View>
            {result.queries.length > 0 ? (
              <View className="mb-4 flex-row flex-wrap items-center gap-1.5">
                <Sparkles color={colors.textSecondary} size={13} strokeWidth={2.2} />
                <MutedText>Đã tìm kiếm: {result.queries.join(" · ")}</MutedText>
              </View>
            ) : null}

            <Panel className="mb-4">
              {reportLines.map((line, index) => (
                <ReportLine key={index} line={line} />
              ))}
            </Panel>

            {result.sources.length > 0 ? (
              <View>
                <Text className="mb-2 text-sm font-black" style={{ color: colors.textPrimary }}>
                  Nguồn tham khảo ({result.sources.length})
                </Text>
                {result.sources.map((source, index) => (
                  <SourceCard index={index + 1} key={source.url} source={source} />
                ))}
              </View>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}
