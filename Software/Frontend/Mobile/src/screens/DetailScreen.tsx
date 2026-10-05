import { useCallback, useMemo, useState, useRef, memo } from "react";
import { ActivityIndicator, Alert, Image, Modal, Pressable, ScrollView, Text, TextInput, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { ArrowLeft, BrainCircuit, CalendarCheck, Check, Link2, Mail, MapPin, Mic, MicOff, MessageSquareText, Send, X, Sparkles, Video } from "lucide-react-native";

import type { RootStackParamList } from "../App";
import { AIAssistSheet } from "../components/AIAssistSheet";
import { AppButton, EmptyState, MutedText, Panel, ScorePill, SectionTitle } from "../components/Primitives";
import { useVoiceInput } from "../services/useVoiceInput";
import { sendEmailViaBackend, openMailtoFallback } from "../services/emailService";
import { getAuthToken } from "../services/auth";
import { createDecisionMeta, type DecisionAction } from "../theme/tokens";
import { useAppTheme } from "../theme/ThemeContext";
import { useRecruiterStore } from "../store/useRecruiterStore";

type Props = NativeStackScreenProps<RootStackParamList, "Detail">;

const BulletList = memo(({ items, tone }: { items: string[]; tone: "success" | "danger" | "warning" }) => {
  const { colors } = useAppTheme();
  const color = tone === "success" ? colors.success : tone === "danger" ? colors.danger : colors.warning;

  if (items.length === 0) {
    return <MutedText>Chưa có dữ liệu được bóc tách.</MutedText>;
  }

  return (
    <View className="gap-3">
      {items.map((item) => (
        <View className="flex-row gap-3" key={item}>
          <View className="mt-1.5 h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
          <Text className="flex-1 text-sm leading-5 font-semibold" style={{ color: colors.textPrimary }}>{item}</Text>
        </View>
      ))}
    </View>
  );
});

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

const CandidateHeroAvatar = memo(({ name, uri }: { name: string; uri?: string }) => {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri && !failed);

  return (
    <View
      className="h-14 w-14 overflow-hidden rounded-[20px] border"
      style={{ backgroundColor: colors.accentSoft, borderColor: showImage ? colors.border : colors.accent, borderWidth: 1 }}
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
});

const DetailEvidence = memo(({ candidateId }: { candidateId: string }) => {
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
              className="rounded-2xl border p-3.5"
              key={`${title}-${index}`}
              style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}
            >
              <View className="flex-row items-center justify-between gap-3">
                <Text className="flex-1 text-sm font-black tracking-tight" style={{ color: colors.textPrimary }}>{title}</Text>
                {score ? (
                  <View className="rounded-full px-2.5 py-0.5 bg-neutral-200 dark:bg-neutral-800">
                    <Text className="text-xs font-black" style={{ color: colors.accent }}>{score}</Text>
                  </View>
                ) : null}
              </View>
              {evidence ? <MutedText className="mt-2.5 font-medium leading-5">{evidence}</MutedText> : null}
            </View>
          );
        })}
      </View>
    </Panel>
  );
});

type EmailTemplate = "interview" | "reject" | "accept";

interface InterviewInfo {
  meetLink: string;
  dateTime: string;
  location: string;
  format: string;
}

function buildEmailSubject(template: EmailTemplate, jobTitle: string, candidateName: string): string {
  if (template === "interview") return `[CVMatch] Thư mời phỏng vấn – ${jobTitle} – ${candidateName}`;
  if (template === "reject") return `[CVMatch] Thông báo kết quả ứng tuyển – ${jobTitle}`;
  return `[CVMatch] Chúc mừng – Xác nhận tuyển dụng vị trí ${jobTitle}`;
}

function buildEmailBody(
  template: EmailTemplate,
  candidateName: string,
  jobTitle: string,
  note: string,
  interview?: InterviewInfo,
): string {
  const firstName = candidateName.trim().split(" ").pop() || candidateName;

  if (template === "interview") {
    const lines = [
      `Kính gửi ${firstName},`,
      ``,
      `Cảm ơn bạn đã ứng tuyển vào vị trí ${jobTitle} tại công ty chúng tôi. Chúng tôi đánh giá cao sự quan tâm và nỗ lực mà bạn đã bỏ ra trong quá trình chuẩn bị hồ sơ.`,
      ``,
      `Sau khi xem xét kỹ lưỡng, chúng tôi vui mừng thông báo rằng bạn đã vượt qua vòng sơ tuyển và được mời tham dự buổi phỏng vấn.`,
      ``,
      `📅 Thời gian   : ${interview?.dateTime || "(sẽ được cập nhật)"}`,
      `📍 Địa điểm   : ${interview?.location || interview?.format || "Trực tuyến"}`,
      `🔗 Link tham dự: ${interview?.meetLink || "(sẽ được cập nhật)"}`,
    ];
    if (note) lines.push(``, `📝 Ghi chú thêm: ${note}`);
    lines.push(
      ``,
      `Vui lòng xác nhận tham dự bằng cách trả lời email này. Nếu thời gian trên chưa phù hợp, bạn hãy đề xuất khung giờ khác và chúng tôi sẽ sắp xếp lại.`,
      ``,
      `Rất mong được gặp bạn!`,
      ``,
      `Trân trọng,`,
      `Bộ phận Tuyển dụng – CVMatch`,
    );
    return lines.join("\n");
  }

  if (template === "reject") {
    const lines = [
      `Kính gửi ${firstName},`,
      ``,
      `Cảm ơn bạn đã dành thời gian và công sức ứng tuyển vào vị trí ${jobTitle} tại công ty chúng tôi. Chúng tôi trân trọng sự quan tâm của bạn.`,
      ``,
      `Sau quá trình xét duyệt kỹ lưỡng, chúng tôi đã tìm thấy ứng viên có hồ sơ phù hợp hơn với yêu cầu của vị trí này tại thời điểm hiện tại. Do đó, chúng tôi xin phép không tiếp tục quy trình phỏng vấn với bạn lần này.`,
    ];
    if (note) lines.push(``, `Nhận xét thêm: ${note}`);
    lines.push(
      ``,
      `Chúng tôi trân trọng hồ sơ và năng lực của bạn, và hy vọng sẽ có cơ hội được hợp tác với bạn trong tương lai gần.`,
      ``,
      `Chúc bạn sức khỏe và thành công trong sự nghiệp.`,
      ``,
      `Trân trọng,`,
      `Bộ phận Tuyển dụng – CVMatch`,
    );
    return lines.join("\n");
  }

  // accept / shortlist
  const lines = [
    `Kính gửi ${firstName},`,
    ``,
    `Thay mặt Ban lãnh đạo và toàn thể đội ngũ công ty, chúng tôi vui mừng thông báo rằng bạn đã chính thức được chọn vào vị trí ${jobTitle}.`,
    ``,
    `Đây là kết quả của quá trình xét duyệt kỹ lưỡng, và chúng tôi tin rằng bạn sẽ là người phù hợp để đồng hành và đóng góp cho sự phát triển của đội ngũ.`,
  ];
  if (note) lines.push(``, `📝 Ghi chú: ${note}`);
  lines.push(
    ``,
    `Chúng tôi sẽ liên hệ với bạn sớm để trao đổi thêm về các bước tiếp theo, bao gồm điều khoản hợp đồng và ngày bắt đầu làm việc.`,
    ``,
    `Xin chúc mừng và chào mừng bạn đến với gia đình chúng tôi! 🎉`,
    ``,
    `Trân trọng,`,
    `Bộ phận Tuyển dụng – CVMatch`,
  );
  return lines.join("\n");
}

export function DetailScreen({ navigation, route }: Props) {
  const { colors } = useAppTheme();
  const { width } = useWindowDimensions();
  const candidate = useRecruiterStore((state) => state.getCandidate(route.params.id));
  const candidates = useRecruiterStore((state) => state.candidates);
  const submitting = useRecruiterStore((state) => state.submitting);
  const submitDecision = useRecruiterStore((state) => state.submitDecision);
  const error = useRecruiterStore((state) => state.error);
  const [note, setNote] = useState("");
  const [assistVisible, setAssistVisible] = useState(false);

  // Email modal state
  const [emailModalVisible, setEmailModalVisible] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState<EmailTemplate>("interview");
  const [emailBody, setEmailBody] = useState("");
  const [emailSending, setEmailSending] = useState(false);
  const currentInterviewRef = useRef<InterviewInfo | undefined>(undefined);

  // Interview setup modal state
  const [interviewModalVisible, setInterviewModalVisible] = useState(false);
  const [meetLink, setMeetLink] = useState("");
  const [dateTime, setDateTime] = useState("");
  const [location, setLocation] = useState("");
  const [interviewFormat, setInterviewFormat] = useState("Trực tuyến qua Google Meet");

  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  const appendTranscript = useCallback((value: string) => {
    setNote((current) => (current.trim() ? `${current.trim()} ${value}` : value));
  }, []);

  const { isListening, voiceError, startListening, stopListening } = useVoiceInput(appendTranscript);

  /** Mở email modal với template cụ thể, có thể kèm interview info */
  const openEmailModal = useCallback((template: EmailTemplate, interviewInfo?: InterviewInfo) => {
    if (!candidate) return;
    currentInterviewRef.current = interviewInfo;
    setEmailTemplate(template);
    setEmailBody(buildEmailBody(template, candidate.candidateName, candidate.jobTitle, note, interviewInfo));
    setEmailModalVisible(true);
  }, [candidate, note]);

  /** Xử lý bấm nút "Hẹn phỏng vấn" → mở form setup trước */
  const handleInterviewAction = useCallback(() => {
    setInterviewModalVisible(true);
  }, []);

  /** Sau khi điền form interview → tiến vào email modal */
  const confirmInterviewSetup = useCallback(() => {
    setInterviewModalVisible(false);
    const info: InterviewInfo = { meetLink, dateTime, location, format: interviewFormat };
    openEmailModal("interview", info);
  }, [meetLink, dateTime, location, interviewFormat, openEmailModal]);

  /** Gửi email: thử backend trước, fallback sang mailto: */
  const sendEmail = useCallback(async () => {
    if (!candidate) return;
    const toEmail = candidate.raw?.email as string | undefined;
    if (!toEmail) {
      Alert.alert("Không có email", "Hồ sơ ứng viên này chưa có địa chỉ email.");
      return;
    }
    const subject = buildEmailSubject(emailTemplate, candidate.jobTitle, candidate.candidateName);
    setEmailSending(true);
    try {
      // Thử gửi qua backend (cần Google OAuth đã kết nối)
      let sent = false;
      try {
        const token = await getAuthToken();
        if (token) {
          const result = await sendEmailViaBackend([{ to: toEmail, subject, body: emailBody }], token);
          if (result && result.sent > 0) {
            sent = true;
            Alert.alert("✅ Đã gửi email", `Email đã được gửi tới ${toEmail} thành công.`);
            setEmailModalVisible(false);
          }
        }
      } catch {
        // Backend không khả dụng — tiếp tục fallback
      }
      // Fallback: mở ứng dụng email trên thiết bị
      if (!sent) {
        const opened = await openMailtoFallback({ to: toEmail, subject, body: emailBody });
        if (opened) {
          setEmailModalVisible(false);
        } else {
          Alert.alert(
            "Không gửi được email",
            "Không thể kết nối backend email. Vui lòng cài ứng dụng Gmail hoặc Outlook trên thiết bị."
          );
        }
      }
    } finally {
      setEmailSending(false);
    }
  }, [candidate, emailBody, emailTemplate]);

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
          className="flex-1 px-4"
          contentContainerStyle={{ paddingBottom: 110, paddingTop: 10 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View className="mb-4 min-h-12 flex-row items-center justify-between">
            <Pressable
              accessibilityLabel="Quay lại"
              accessibilityRole="button"
              className="h-11 w-11 items-center justify-center rounded-2xl border"
              onPress={() => navigation.goBack()}
              style={({ pressed }) => [{
                backgroundColor: colors.surface,
                borderColor: colors.border,
                borderWidth: 0.85,
                opacity: pressed ? 0.9 : 1,
                transform: [{ scale: pressed ? 0.97 : 1 }]
              }]}
            >
              <ArrowLeft color={colors.textPrimary} size={19} strokeWidth={2.5} />
            </Pressable>
            <Text className="text-center text-lg font-black tracking-tight" style={{ color: colors.textPrimary }}>Chi tiết ứng viên</Text>
            <View className="h-11 w-11" />
          </View>

          {/* Hero details panel */}
          <Panel>
            <View className="flex-row items-start justify-between gap-4">
              <CandidateHeroAvatar name={candidate.candidateName} uri={candidate.avatarUrl} />
              <View className="min-w-0 flex-1">
                <Text className="text-[22px] font-black leading-7 tracking-tight" style={{ color: colors.textPrimary }}>{candidate.candidateName}</Text>
                <Text className="mt-1 text-sm font-semibold" style={{ color: colors.textSecondary }}>{candidate.jobTitle}</Text>
              </View>
              <ScorePill rank={candidate.rank} score={candidate.score} />
            </View>

            <View className="mt-4 flex-row flex-wrap gap-2">
              <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{candidate.experienceLevel}</Text>
              </View>
              <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{candidate.industry}</Text>
              </View>
              {candidate.detectedLocation ? (
                <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}>
                  <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>{candidate.detectedLocation}</Text>
                </View>
              ) : null}
            </View>
          </Panel>

          {/* AI insights panel */}
          <Panel className="mt-4">
            <SectionTitle>Tóm tắt AI</SectionTitle>
            <Text className="mb-3 mt-4 text-xs font-black uppercase tracking-wider" style={{ color: colors.success }}>Điểm mạnh</Text>
            <BulletList items={candidate.strengths} tone="success" />
            <Text className="mb-3 mt-5 text-xs font-black uppercase tracking-wider" style={{ color: colors.danger }}>Điểm cần hỏi kỹ</Text>
            <BulletList items={candidate.weaknesses} tone="danger" />
          </Panel>

          {/* Filter warnings */}
          {warnings.length > 0 ? (
            <Panel className="mt-4">
              <SectionTitle>Cảnh báo lọc cứng</SectionTitle>
              <View className="mt-4">
                <BulletList items={warnings} tone="warning" />
              </View>
            </Panel>
          ) : null}

          {/* Rapid evidence details */}
          <DetailEvidence candidateId={candidate.id} />

          {/* Feedback & AI notes panel */}
          <Panel className="mt-4">
            <View className="flex-row items-center gap-2">
              <MessageSquareText color={colors.accent} size={20} />
              <SectionTitle>Feedback nhanh</SectionTitle>
            </View>
            <TextInput
              className="mt-4 min-h-[104px] rounded-2xl border p-4 text-sm font-semibold leading-6"
              multiline
              onChangeText={setNote}
              placeholder="Ghi chú lý do chọn / loại / hẹn phỏng vấn..."
              placeholderTextColor={colors.textSecondary}
              style={{
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.border,
                color: colors.textPrimary,
                borderWidth: 0.85
              }}
              textAlignVertical="top"
              value={note}
            />
            <View className="mt-3.5 flex-row gap-2">
              <AppButton
                className="flex-1"
                icon={isListening ? MicOff : Mic}
                label={isListening ? "Dừng ghi" : "Ghi giọng nói"}
                onPress={() => void (isListening ? stopListening() : startListening())}
                variant="ghost"
              />
              <AppButton className="flex-1" icon={BrainCircuit} label="AI Assist" onPress={() => setAssistVisible(true)} />
            </View>
            {voiceError ? <Text className="mt-3 text-sm font-semibold leading-5" style={{ color: colors.warning }}>{voiceError}</Text> : null}
            {error ? <Text className="mt-3 text-sm font-semibold leading-5" style={{ color: colors.danger }}>{error}</Text> : null}
          </Panel>

          {/* Email quick-action panel (chỉ khi có email trong hồ sơ) */}
          {candidate.raw?.email ? (
            <Panel className="mt-4">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-2">
                  <Mail color={colors.accent} size={18} />
                  <SectionTitle>Gửi email ứng viên</SectionTitle>
                </View>
                <MutedText className="text-xs">{String(candidate.raw.email)}</MutedText>
              </View>
              <View className="mt-4 gap-2">
                <Pressable
                  accessibilityRole="button"
                  className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-2xl border active:opacity-75"
                  onPress={() => openEmailModal("reject")}
                  style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger, borderWidth: 1 }}
                >
                  <Mail color={colors.danger} size={15} strokeWidth={2.5} />
                  <Text className="text-xs font-black" style={{ color: colors.danger }}>Gửi thư từ chối lịch sự</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-2xl border active:opacity-75"
                  onPress={handleInterviewAction}
                  style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1 }}
                >
                  <Video color={colors.accent} size={15} strokeWidth={2.5} />
                  <Text className="text-xs font-black" style={{ color: colors.accent }}>Gửi thư mời phỏng vấn</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  className="min-h-[44px] flex-row items-center justify-center gap-2 rounded-2xl border active:opacity-75"
                  onPress={() => openEmailModal("accept")}
                  style={{ backgroundColor: colors.surface, borderColor: colors.success, borderWidth: 1 }}
                >
                  <Check color={colors.success} size={15} strokeWidth={2.5} />
                  <Text className="text-xs font-black" style={{ color: colors.success }}>Gửi thư xác nhận tuyển dụng</Text>
                </Pressable>
              </View>
            </Panel>
          ) : null}
        </ScrollView>
      </SafeAreaView>

      {/* Modern sticky bottom action panel (Thumb-zone friendly) */}
      <View
        className="absolute bottom-0 left-0 right-0 border-t"
        style={{
          backgroundColor: colors.surface,
          borderColor: colors.border,
          paddingTop: 12,
          paddingBottom: 20,
          paddingHorizontal: 16
        }}
      >
        <View className="flex-row gap-2" style={{ maxWidth: contentWidth, alignSelf: "center", width: "100%" }}>
          <Pressable
            accessibilityRole="button"
            className="flex-1 min-h-[48px] items-center justify-center rounded-2xl border"
            disabled={submitting}
            style={({ pressed }) => [{
              backgroundColor: colors.dangerSoft,
              borderColor: colors.danger,
              borderWidth: 1,
              opacity: submitting ? 0.5 : (pressed ? 0.9 : 1),
              transform: [{ scale: pressed ? 0.97 : 1 }]
            }]}
            onPress={() => {
              void submitDecision(candidate, "reject", note);
              if (candidate.raw?.email) openEmailModal("reject");
            }}
          >
            <Text className="text-xs font-black" style={{ color: colors.danger }}>Loại bỏ</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="flex-[1.2] min-h-[48px] items-center justify-center rounded-2xl border"
            disabled={submitting}
            style={({ pressed }) => [{
              backgroundColor: colors.accentSoft,
              borderColor: colors.accent,
              borderWidth: 1,
              opacity: submitting ? 0.5 : (pressed ? 0.9 : 1),
              transform: [{ scale: pressed ? 0.97 : 1 }]
            }]}
            onPress={() => {
              void submitDecision(candidate, "interview", note);
              if (candidate.raw?.email) handleInterviewAction();
            }}
          >
            <Text className="text-xs font-black" style={{ color: colors.accent }}>Hẹn phỏng vấn</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            className="flex-1 min-h-[48px] items-center justify-center rounded-2xl"
            disabled={submitting}
            style={({ pressed }) => [{
              backgroundColor: colors.success,
              opacity: submitting ? 0.5 : (pressed ? 0.9 : 1),
              transform: [{ scale: pressed ? 0.97 : 1 }]
            }]}
            onPress={() => {
              void submitDecision(candidate, "shortlist", note);
              if (candidate.raw?.email) openEmailModal("accept");
            }}
          >
            <Text className="text-xs font-black text-white">Shortlist</Text>
          </Pressable>
        </View>
      </View>

      <AIAssistSheet
        candidate={candidate}
        candidates={candidates}
        onClose={() => setAssistVisible(false)}
        visible={assistVisible}
      />

      {/* ── INTERVIEW SETUP MODAL ── */}
      <Modal
        animationType="slide"
        onRequestClose={() => setInterviewModalVisible(false)}
        presentationStyle="pageSheet"
        visible={interviewModalVisible}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          <View className="flex-row items-center justify-between border-b px-5 py-4" style={{ borderColor: colors.border }}>
            <Pressable
              accessibilityLabel="Đóng"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full"
              onPress={() => setInterviewModalVisible(false)}
              style={{ backgroundColor: colors.surfaceSoft }}
            >
              <X color={colors.textPrimary} size={18} strokeWidth={2.5} />
            </Pressable>
            <Text className="text-base font-black" style={{ color: colors.textPrimary }}>Thông tin phỏng vấn</Text>
            <Pressable
              accessibilityLabel="Tiếp tục soạn email"
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-full px-4 py-2"
              onPress={confirmInterviewSetup}
              style={{ backgroundColor: colors.accent }}
            >
              <Mail color="#111827" size={14} strokeWidth={2.5} />
              <Text className="text-sm font-black" style={{ color: "#111827" }}>Soạn email</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 24, gap: 20 }} showsVerticalScrollIndicator={false}>
            <MutedText className="text-sm leading-5">
              Điền thông tin phỏng vấn bên dưới. Nội dung sẽ được tự động điền vào mẫu thư mời.
            </MutedText>

            {/* Link phòng họp */}
            <View>
              <View className="mb-2 flex-row items-center gap-2">
                <Video color={colors.accent} size={15} strokeWidth={2.5} />
                <Text className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Link phòng họp (Meet / Zoom / Teams)</Text>
              </View>
              <TextInput
                autoCapitalize="none"
                autoCorrect={false}
                className="min-h-[46px] rounded-2xl border px-4 text-sm"
                keyboardType="url"
                onChangeText={setMeetLink}
                placeholder="https://meet.google.com/..."
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: colors.surfaceSoft,
                  borderColor: meetLink ? colors.accent : colors.border,
                  borderWidth: 0.85,
                  color: colors.textPrimary,
                } as never}
                value={meetLink}
              />
            </View>

            {/* Ngày giờ */}
            <View>
              <View className="mb-2 flex-row items-center gap-2">
                <CalendarCheck color={colors.accent} size={15} strokeWidth={2.5} />
                <Text className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Ngày & Giờ phỏng vấn</Text>
              </View>
              <TextInput
                className="min-h-[46px] rounded-2xl border px-4 text-sm"
                onChangeText={setDateTime}
                placeholder="VD: 14:00 Thứ Năm, 21/08/2026"
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: colors.surfaceSoft,
                  borderColor: dateTime ? colors.accent : colors.border,
                  borderWidth: 0.85,
                  color: colors.textPrimary,
                } as never}
                value={dateTime}
              />
            </View>

            {/* Địa điểm */}
            <View>
              <View className="mb-2 flex-row items-center gap-2">
                <MapPin color={colors.accent} size={15} strokeWidth={2.5} />
                <Text className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Địa điểm / Hình thức</Text>
              </View>
              <TextInput
                className="min-h-[46px] rounded-2xl border px-4 text-sm"
                onChangeText={setInterviewFormat}
                placeholder="VD: Trực tuyến qua Google Meet"
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.border,
                  borderWidth: 0.85,
                  color: colors.textPrimary,
                } as never}
                value={interviewFormat}
              />
            </View>

            {/* Địa điểm cụ thể nếu offline */}
            <View>
              <View className="mb-2 flex-row items-center gap-2">
                <Link2 color={colors.textSecondary} size={15} strokeWidth={2.5} />
                <Text className="text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Địa chỉ cụ thể (nếu trực tiếp)</Text>
              </View>
              <TextInput
                className="min-h-[46px] rounded-2xl border px-4 text-sm"
                onChangeText={setLocation}
                placeholder="Tầng X, Tòa nhà Y, Địa chỉ Z"
                placeholderTextColor={colors.textSecondary}
                style={{
                  backgroundColor: colors.surfaceSoft,
                  borderColor: colors.border,
                  borderWidth: 0.85,
                  color: colors.textPrimary,
                } as never}
                value={location}
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* ── EMAIL COMPOSER MODAL ── */}
      <Modal
        animationType="slide"
        onRequestClose={() => setEmailModalVisible(false)}
        presentationStyle="pageSheet"
        visible={emailModalVisible}
      >
        <SafeAreaView className="flex-1" style={{ backgroundColor: colors.background }}>
          {/* Modal header */}
          <View className="flex-row items-center justify-between border-b px-5 py-4" style={{ borderColor: colors.border }}>
            <Pressable
              accessibilityLabel="Đóng"
              accessibilityRole="button"
              className="h-9 w-9 items-center justify-center rounded-full"
              onPress={() => setEmailModalVisible(false)}
              style={{ backgroundColor: colors.surfaceSoft }}
            >
              <X color={colors.textPrimary} size={18} strokeWidth={2.5} />
            </Pressable>
            <View className="items-center">
              <Text className="text-base font-black" style={{ color: colors.textPrimary }}>Soạn email</Text>
              <Text className="text-xs" style={{ color: colors.textSecondary }}>
                {emailTemplate === "interview" ? "Mời phỏng vấn" : emailTemplate === "reject" ? "Từ chối lịch sự" : "Xác nhận tuyển dụng"}
              </Text>
            </View>
            <Pressable
              accessibilityLabel="Gửi email"
              accessibilityRole="button"
              className="flex-row items-center gap-1.5 rounded-full px-4 py-2"
              disabled={emailSending}
              onPress={() => void sendEmail()}
              style={{ backgroundColor: emailSending ? colors.accentSoft : colors.accent, opacity: emailSending ? 0.7 : 1 }}
            >
              {emailSending
                ? <ActivityIndicator color="#111827" size="small" />
                : <Send color="#111827" size={14} strokeWidth={2.5} />}
              <Text className="text-sm font-black" style={{ color: "#111827" }}>{emailSending ? "Đang gửi..." : "Gửi"}</Text>
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-5" contentContainerStyle={{ paddingVertical: 20 }} showsVerticalScrollIndicator={false}>
            {/* Template selector */}
            <Text className="mb-3 text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Mẫu email</Text>
            <View className="mb-5 flex-row gap-2">
              {([
                { key: "reject" as EmailTemplate, label: "Từ chối" },
                { key: "interview" as EmailTemplate, label: "Mời PV" },
                { key: "accept" as EmailTemplate, label: "Nhận" },
              ]).map((t) => (
                <Pressable
                  accessibilityRole="button"
                  className="flex-1 min-h-[36px] items-center justify-center rounded-full"
                  key={t.key}
                  onPress={() => {
                    setEmailTemplate(t.key);
                    if (candidate) setEmailBody(buildEmailBody(t.key, candidate.candidateName, candidate.jobTitle, note, currentInterviewRef.current));
                  }}
                  style={{
                    backgroundColor: emailTemplate === t.key ? colors.accent : colors.surfaceSoft,
                    borderColor: emailTemplate === t.key ? colors.accent : colors.border,
                    borderWidth: 1
                  }}
                >
                  <Text className="text-xs font-bold" style={{ color: emailTemplate === t.key ? "#111827" : colors.textSecondary }}>{t.label}</Text>
                </Pressable>
              ))}
            </View>

            {/* Recipient info */}
            <Text className="mb-2 text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Gửi đến</Text>
            <View
              className="mb-5 flex-row items-center gap-3 rounded-2xl border px-4 py-3"
              style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}
            >
              <View className="h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: colors.accentSoft }}>
                <Mail color={colors.accent} size={16} strokeWidth={2.5} />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>{candidate?.candidateName}</Text>
                <Text className="mt-0.5 text-xs font-medium" style={{ color: colors.textSecondary }}>{String(candidate?.raw?.email || "")}</Text>
              </View>
            </View>

            {/* Email body editor */}
            <Text className="mb-2 text-xs font-black uppercase tracking-wider" style={{ color: colors.textSecondary }}>Nội dung thư</Text>
            <TextInput
              className="rounded-2xl border p-4 text-sm leading-6"
              multiline
              onChangeText={setEmailBody}
              style={{
                backgroundColor: colors.surfaceSoft,
                borderColor: colors.border,
                borderWidth: 0.85,
                color: colors.textPrimary,
                minHeight: 300,
                textAlignVertical: "top",
                fontFamily: "System",
              } as never}
              value={emailBody}
            />
            <MutedText className="mt-3 text-xs leading-5">
              💡 Email sẽ được gửi qua backend CVMatch. Nếu chưa kết nối Google OAuth, ứng dụng email trên thiết bị sẽ được mở thay thế.
            </MutedText>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}
