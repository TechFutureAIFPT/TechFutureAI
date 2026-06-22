import { useCallback, useMemo, useState } from "react";
import { Image, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, BrainCircuit, CalendarCheck, Check, Mic, MicOff, MessageSquareText, X } from "lucide-react-native";

import type { RootStackParamList } from "../App";
import { AIAssistSheet } from "../components/AIAssistSheet";
import { AppButton, EmptyState, MutedText, Panel, ScorePill, SectionTitle } from "../components/Primitives";
import { useVoiceInput } from "../services/useVoiceInput";
import { createDecisionMeta, type DecisionAction } from "../theme/tokens";
import { useAppTheme } from "../theme/ThemeContext";
import { useRecruiterStore } from "../store/useRecruiterStore";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

function BulletList({ items, tone }: { items: string[]; tone: "success" | "danger" | "warning" }) {
  const { colors } = useAppTheme();
  const color = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.warning;

  if (items.length === 0) {
    return <MutedText>Chưa có dữ liệu được bóc tách.</MutedText>;
  }

  return (
    <View className="gap-3">
      {items.map((item) => (
        <View className="flex-row gap-3" key={item}>
          <View className="mt-1 h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
          <Text className="flex-1 text-sm leading-5" style={{ color: colors.textPrimary }}>{item}</Text>
        </View>
      ))}
    </View>
  );
}

function candidateInitials(name: string) {
  return (
    name
      .trim()
      .split(/\s+/)
      .map((part) => part[0])
      .slice(-2)
      .join("")
      .toUpperCase() || "UV"
  );
}

function CandidateHeroAvatar({ name, uri }: { name: string; uri?: string }) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri && !failed);

  return (
    <View
      className="h-14 w-14 overflow-hidden rounded-full border"
      style={{ backgroundColor: colors.accentSoft, borderColor: showImage ? colors.border : colors.accent }}
    >
      {showImage ? (
        <Image
          accessibilityIgnoresInvertColors
          className="h-full w-full"
          onError={() => setFailed(true)}
          source={{ uri: uri || "" }}
          style={{ resizeMode: "cover" }}
        />
      ) : (
        <View className="h-full w-full items-center justify-center">
          <Text className="text-base font-black" style={{ color: colors.accent }}>
            {candidateInitials(name)}
          </Text>
        </View>
      )}
    </View>
  );
}

function DetailEvidence({ candidateId }: { candidateId: string }) {
  const { colors } = useAppTheme();
  const candidate = useRecruiterStore((state) => state.getCandidate(candidateId));
  const details = candidate?.details.slice(0, 4) || [];

  if (details.length === 0) return null;

  return (
    <Panel className="mt-4">
      <SectionTitle>Dẫn chứng nhanh</SectionTitle>
      <View className="mt-4 gap-3">
        {details.map((detail, index) => {
          const title = String(detail["Tiêu chí"] || detail.criterion || `Tiêu chí ${index + 1}`);
          const score = String(detail["Điểm"] || detail.score || "");
          const evidence = String(detail["Dẫn chứng"] || detail.evidence || detail["Giải thích"] || detail.explanation || "");
          return (
            <View
              className="rounded-xl border p-3"
              key={`${title}-${index}`}
              style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm font-black" style={{ color: colors.textPrimary }}>{title}</Text>
                {score ? <Text className="text-xs font-black" style={{ color: colors.accent }}>{score}</Text> : null}
              </View>
              {evidence ? <MutedText className="mt-2">{evidence}</MutedText> : null}
            </View>
          );
        })}
      </View>
    </Panel>
  );
}

export function DetailScreen({ navigation, route }: Props) {
  const { colors } = useAppTheme();
  const decisionMeta = createDecisionMeta(colors);
  const candidate = useRecruiterStore((state) => state.getCandidate(route.params.id));
  const candidates = useRecruiterStore((state) => state.candidates);
  const submitting = useRecruiterStore((state) => state.submitting);
  const submitDecision = useRecruiterStore((state) => state.submitDecision);
  const error = useRecruiterStore((state) => state.error);
  const [note, setNote] = useState("");
  const [assistVisible, setAssistVisible] = useState(false);

  const appendTranscript = useCallback((value: string) => {
    setNote((current) => (current.trim() ? `${current.trim()} ${value}` : value));
  }, []);

  const { isListening, voiceError, startListening, stopListening } = useVoiceInput(appendTranscript);

  const warnings = useMemo(() => candidate?.warnings || [], [candidate]);

  if (!candidate) {
    return (
      <SafeAreaView className="flex-1 px-5 pt-6" style={{ backgroundColor: colors.background }}>
        <EmptyState
          action={<AppButton icon={ArrowLeft} label="Quay lại" onPress={() => navigation.goBack()} />}
          description="Hồ sơ này không còn nằm trong inbox hiện tại."
          title="Không tìm thấy ứng viên"
        />
      </SafeAreaView>
    );
  }

  const handleDecision = (action: DecisionAction) => {
    void submitDecision(candidate, action, note);
  };

  return (
    <View className="flex-1" style={{ backgroundColor: colors.background }}>
      <SafeAreaView className="flex-1" edges={["top"]}>
        <ScrollView
          className="flex-1 px-5"
          contentContainerStyle={{ paddingBottom: 40, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="mb-4 min-h-12 flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Quay lại"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-2xl border active:scale-[0.98]"
              onPress={() => navigation.goBack()}
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <ArrowLeft color={colors.textPrimary} size={19} strokeWidth={2.5} />
            </Pressable>
            <Text className="text-center text-lg font-black" style={{ color: colors.textPrimary }}>Chi tiết ứng viên</Text>
            <View className="h-11 w-11" />
          </View>

          <Panel>
            <View className="flex-row items-start justify-between gap-4">
              <CandidateHeroAvatar name={candidate.candidateName} uri={candidate.avatarUrl} />
              <View className="min-w-0 flex-1">
                <Text className="text-[22px] font-black leading-7" style={{ color: colors.textPrimary }}>{candidate.candidateName}</Text>
                <Text className="mt-1 text-sm font-semibold" style={{ color: colors.textSecondary }}>{candidate.jobTitle}</Text>
              </View>
              <ScorePill rank={candidate.rank} score={candidate.score} />
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{candidate.experienceLevel}</Text>
              </View>
              <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{candidate.industry}</Text>
              </View>
              {candidate.detectedLocation ? (
                <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
                  <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{candidate.detectedLocation}</Text>
                </View>
              ) : null}
            </View>
          </Panel>

          <Panel className="mt-4">
            <SectionTitle>Tóm tắt AI</SectionTitle>
            <Text className="mb-3 mt-5 text-sm font-black uppercase" style={{ color: colors.success }}>Điểm mạnh</Text>
            <BulletList items={candidate.strengths} tone="success" />
            <Text className="mb-3 mt-5 text-sm font-black uppercase" style={{ color: colors.danger }}>Điểm cần hỏi kỹ</Text>
            <BulletList items={candidate.weaknesses} tone="danger" />
          </Panel>

          {warnings.length > 0 ? (
            <Panel className="mt-4">
              <SectionTitle>Cảnh báo lọc cứng</SectionTitle>
              <View className="mt-4">
                <BulletList items={warnings} tone="warning" />
              </View>
            </Panel>
          ) : null}

          <DetailEvidence candidateId={candidate.id} />

          <Panel className="mt-4">
            <View className="flex-row items-center gap-2">
              <MessageSquareText color={colors.accent} size={20} />
              <SectionTitle>Feedback nhanh</SectionTitle>
            </View>
            <TextInput
              className="mt-4 min-h-[104px] rounded-xl border p-4 text-base leading-6"
              multiline
              onChangeText={setNote}
              placeholder="Ghi chú lý do chọn / loại / hẹn phỏng vấn..."
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.border,
                color: colors.textPrimary
              }}
              textAlignVertical="top"
              value={note}
            />
            <View className="mt-3 flex-row gap-2">
              <AppButton
                className="flex-1"
                icon={isListening ? MicOff : Mic}
                label={isListening ? "Dừng ghi âm" : "Ghi bằng giọng nói"}
                onPress={() => void (isListening ? stopListening() : startListening())}
                variant="ghost"
              />
              <AppButton className="flex-1" icon={BrainCircuit} label="AI Assist" onPress={() => setAssistVisible(true)} />
            </View>
            {voiceError ? <Text className="mt-3 text-sm leading-5" style={{ color: colors.warning }}>{voiceError}</Text> : null}
            {error ? <Text className="mt-3 text-sm leading-5" style={{ color: colors.danger }}>{error}</Text> : null}
          </Panel>

          <Panel className="mt-4">
            <SectionTitle>Quyết định</SectionTitle>
            <View className="mt-4 gap-2">
              <AppButton icon={Check} label={decisionMeta.shortlist.label} loading={submitting} onPress={() => handleDecision("shortlist")} variant="success" />
              <AppButton icon={X} label={decisionMeta.reject.label} loading={submitting} onPress={() => handleDecision("reject")} variant="danger" />
              <AppButton icon={CalendarCheck} label={decisionMeta.interview.label} loading={submitting} onPress={() => handleDecision("interview")} />
            </View>
          </Panel>
        </ScrollView>
      </SafeAreaView>

      <AIAssistSheet
        candidate={candidate}
        candidates={candidates}
        onClose={() => setAssistVisible(false)}
        visible={assistVisible}
      />
    </View>
  );
}


