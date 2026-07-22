import { useEffect, useMemo, useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { BrainCircuit, CircleDollarSign, X } from "lucide-react-native";

import { buildSalaryHint } from "../services/salary";
import { useAppTheme } from "../theme/ThemeContext";
import type { CandidateView } from "../types";
import { AppButton, MutedText, Panel, SectionTitle } from "./Primitives";

function localInterviewQuestions(candidate: CandidateView): string[] {
  const weakness = candidate.weaknesses[0];
  const strength = candidate.strengths[0];
  const gap = candidate.details
    .map((detail) => String(detail["Tiêu chí"] || detail["TiÃªu chÃ­"] || detail.criterion || ""))
    .find(Boolean);

  return [
    weakness
      ? `Trong CV có điểm cần kiểm chứng: ${weakness}. Bạn giải thích bằng một dự án thật được không?`
      : `Bạn mô tả dự án gần nhất liên quan trực tiếp đến ${candidate.jobPosition || candidate.jobTitle} được không?`,
    gap
      ? `Với tiêu chí ${gap}, bạn tự đánh giá mình mạnh/yếu ở đâu và bằng chứng là gì?`
      : "Nếu nhận việc, 30 ngày đầu bạn sẽ tạo kết quả đo được nào?",
    strength
      ? `Điểm mạnh nổi bật là ${strength}. Kết quả đó có số liệu hoặc phạm vi tác động cụ thể không?`
      : "Mức lương kỳ vọng của bạn dựa trên kỹ năng, kinh nghiệm và phạm vi công việc nào?"
  ];
}

export function AIAssistSheet({
  candidate,
  visible,
  onClose
}: {
  candidate: CandidateView;
  candidates: CandidateView[];
  visible: boolean;
  onClose: () => void;
}) {
  const { colors } = useAppTheme();
  const [questions, setQuestions] = useState<string[]>(candidate.interviewQuestions);
  const salaryHint = useMemo(() => buildSalaryHint(candidate), [candidate]);

  useEffect(() => {
    if (!visible) return;
    setQuestions(
      candidate.interviewQuestions.length >= 3
        ? candidate.interviewQuestions.slice(0, 3)
        : localInterviewQuestions(candidate)
    );
  }, [candidate, visible]);

  return (
    <Modal animationType="slide" onRequestClose={onClose} transparent visible={visible}>
      <View className="flex-1 justify-end" style={{ backgroundColor: colors.overlay }}>
        <Pressable className="flex-1" onPress={onClose} />
        <View className="max-h-[82%] rounded-t-[28px] px-5 pb-6 pt-3" style={{ backgroundColor: colors.background }}>
          <View className="mb-4 flex-row items-center justify-between">
            <View className="h-1.5 w-12 rounded-full" style={{ backgroundColor: colors.accentSoft }} />
            <Pressable
              accessibilityRole="button"
              className="h-10 w-10 items-center justify-center rounded-2xl"
              onPress={onClose}
              style={{ backgroundColor: colors.surface }}
            >
              <X color={colors.textPrimary} size={18} />
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            <View className="flex-row items-start gap-3">
              <View className="h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.accentSoft }}>
                <BrainCircuit color={colors.accent} size={22} />
              </View>
              <View className="min-w-0 flex-1">
                <Text className="text-2xl font-semibold" style={{ color: colors.textPrimary }}>AI Assist</Text>
                <MutedText className="mt-1">
                  Câu hỏi phỏng vấn và gợi ý lương từ dữ liệu Firebase đã đồng bộ.
                </MutedText>
              </View>
            </View>

            <Panel className="mt-5">
              <SectionTitle>3 câu hỏi trọng tâm</SectionTitle>
              <View className="mt-4 gap-3">
                {questions.slice(0, 3).map((question, index) => (
                  <View className="flex-row gap-3 rounded-2xl border p-3" key={`${question}-${index}`} style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}>
                    <View className="h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                      <Text className="text-xs font-black" style={{ color: colors.accent }}>{index + 1}</Text>
                    </View>
                    <Text className="flex-1 text-sm leading-5" style={{ color: colors.textPrimary }}>{question}</Text>
                  </View>
                ))}
              </View>
            </Panel>

            <Panel className="mt-4">
              <View className="flex-row items-center gap-2">
                <CircleDollarSign color={colors.accent} size={20} />
                <SectionTitle>Salary Hint</SectionTitle>
              </View>
              <Text className="mt-4 text-2xl font-black" style={{ color: colors.accent }}>{salaryHint.rangeLabel}</Text>
              <MutedText className="mt-2">{salaryHint.recommendation}</MutedText>
              <Text className="mt-4 text-xs font-semibold" style={{ color: colors.disabled }}>{salaryHint.source}</Text>
            </Panel>

            <AppButton className="mt-5" label="Đóng" onPress={onClose} />
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}


