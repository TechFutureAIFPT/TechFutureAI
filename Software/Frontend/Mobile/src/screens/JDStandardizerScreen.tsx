import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { ChevronRight, Sparkles, UploadCloud, X } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { standardizeRenderJDFile, standardizeRenderJDText } from "../services/renderStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { JDSupplementalFields, JDTargetPlatform } from "../types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type SelectedJDFile = {
  file?: Blob;
  mimeType?: string;
  name: string;
  type: string;
  uri: string;
};

type Step = "input" | "supplement";

const supplementalFieldMeta: Array<{ key: keyof JDSupplementalFields; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "companyName", label: "Tên công ty", placeholder: "VD: CV Match" },
  { key: "salary", label: "Mức lương", placeholder: "VD: 15-25 triệu hoặc Thỏa thuận" },
  { key: "location", label: "Địa điểm", placeholder: "VD: Hà Nội / Remote / Hybrid" },
  { key: "workingTime", label: "Thời gian làm việc", placeholder: "VD: Thứ 2 - Thứ 6, 8:30 - 17:30" },
  { key: "benefits", label: "Quyền lợi", placeholder: "VD: BHXH, thưởng KPI, đào tạo nội bộ", multiline: true },
  { key: "applicationInfo", label: "Cách ứng tuyển", placeholder: "VD: Gửi CV về hr@company.com" },
  { key: "notes", label: "Ghi chú thêm", placeholder: "Những thông tin HR muốn AI đưa vào JD", multiline: true }
];

const emptySupplementalFields: JDSupplementalFields = {
  applicationInfo: "",
  benefits: "",
  companyName: "",
  location: "",
  notes: "",
  salary: "",
  workingTime: ""
};

const platformChoices: Array<{ key: JDTargetPlatform; label: string; description: string; color: string }> = [
  { key: "topcv", label: "TopCV", description: "Định dạng đăng tuyển phổ biến nhất Việt Nam", color: "#0EA5E9" },
  { key: "linkedin", label: "LinkedIn", description: "Chuẩn tiếng Anh, phù hợp tuyển dụng quốc tế", color: "#0077B5" }
];

function appendJDFile(formData: FormData, asset: { uri: string; name?: string; mimeType?: string; type?: string; file?: Blob }) {
  const name = asset.name || `jd-${Date.now()}.txt`;
  const type = asset.mimeType || asset.type || "application/octet-stream";

  if (asset.file) {
    formData.append("file", asset.file, name);
    return;
  }

  formData.append("file", { uri: asset.uri, name, type } as unknown as Blob);
}

export function JDStandardizerScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, isDark, surfaceShadowStyle } = useAppTheme();

  const [step, setStep] = useState<Step>("input");
  const [jdText, setJdText] = useState("");
  const [selectedFile, setSelectedFile] = useState<SelectedJDFile | null>(null);
  const [targetPlatform, setTargetPlatform] = useState<JDTargetPlatform>("topcv");
  const [supplementalFields, setSupplementalFields] = useState<JDSupplementalFields>(emptySupplementalFields);
  const [visibleFields, setVisibleFields] = useState<Array<keyof JDSupplementalFields>>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            border: colors.border,
            accent: colors.accent,
            accentSoft: colors.accentSoft,
            dashed: colors.accent,
            buttonText: "#111827"
          }
        : {
            background: "#F0F4FF",
            surface: "#FFFFFF",
            surfaceSoft: "#F0F4FF",
            text: "#0F172A",
            muted: "#64748B",
            border: "#DBEAFE",
            accent: "#2563EB",
            accentSoft: "rgba(37, 99, 235, 0.10)",
            dashed: "#93C5FD",
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

  const pickDocument = async () => {
    const pickerResult = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/*",
        "text/plain"
      ]
    });

    if (pickerResult.canceled || !pickerResult.assets[0]) return;

    const asset = pickerResult.assets[0];
    setSelectedFile({
      file: "file" in asset ? (asset.file as Blob | undefined) : undefined,
      mimeType: asset.mimeType || undefined,
      name: asset.name || "uploaded-jd",
      type: asset.mimeType || "application/octet-stream",
      uri: asset.uri
    });
    setJdText("");
    setError(null);
  };

  const updateSupplementalField = (key: keyof JDSupplementalFields, value: string) => {
    setSupplementalFields((current) => ({ ...current, [key]: value }));
  };

  /** Step 1: Quick-parse to find missing fields, then go to step 2 */
  const analyzeJD = async () => {
    const text = jdText.trim();
    if (!selectedFile && !text) {
      setError("Bạn hãy upload file JD hoặc dán nội dung JD trước.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      let parseResult;
      if (selectedFile) {
        const formData = new FormData();
        formData.append("target_platform", "parse_jd");
        formData.append("supplemental_fields_json", JSON.stringify({}));
        appendJDFile(formData, selectedFile);
        parseResult = await standardizeRenderJDFile(formData);
      } else {
        parseResult = await standardizeRenderJDText(text, "parse_jd", {});
      }

      const missedKeys = parseResult.missingSections
        .map((s) => s.key as keyof JDSupplementalFields)
        .filter((k) => k in emptySupplementalFields);

      setVisibleFields(missedKeys);
      setStep("supplement");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Không thể phân tích JD. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  /** Step 2: Submit with chosen platform + supplemental fields */
  const submit = async () => {
    const text = jdText.trim();
    setLoading(true);
    setError(null);
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append("target_platform", targetPlatform);
        formData.append("supplemental_fields_json", JSON.stringify(supplementalFields));
        appendJDFile(formData, selectedFile);
        const result = await standardizeRenderJDFile(formData);
        navigation.navigate("JDStandardizerResult", { result });
      } else {
        const result = await standardizeRenderJDText(text, targetPlatform, supplementalFields);
        navigation.navigate("JDStandardizerResult", { result });
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Không thể chuẩn hóa JD.");
    } finally {
      setLoading(false);
    }
  };

  const resetToInput = () => {
    setStep("input");
    setError(null);
    setVisibleFields([]);
    setSupplementalFields(emptySupplementalFields);
  };

  // ─── Step 1: Input ────────────────────────────────────────────────────────
  const renderInputStep = () => (
    <View className="gap-5 px-5" style={{ width: contentWidth + 40 }}>
      <View className="px-1">
        <Text className="text-[24px] font-bold leading-8" style={{ color: ui.text }}>
          Chuẩn hóa JD
        </Text>
        <Text className="mt-2 text-[13px] leading-5" style={{ color: ui.muted }}>
          Thả file JD hoặc dán nội dung — hệ thống sẽ kiểm tra và hướng dẫn bạn bổ sung thông tin còn thiếu.
        </Text>
      </View>

      {/* Drop zone */}
      <Pressable
        accessibilityRole="button"
        className="rounded-3xl p-3 active:scale-[0.99] active:opacity-90"
        onPress={() => void pickDocument()}
        style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}
      >
        <View
          className="min-h-[142px] items-center justify-center rounded-[24px] border-2 border-dashed px-5"
          style={{ backgroundColor: ui.accentSoft, borderColor: ui.dashed }}
        >
          <View className="h-14 w-14 items-center justify-center rounded-full" style={{ backgroundColor: ui.surface }}>
            <UploadCloud color={ui.accent} size={28} strokeWidth={2.35} />
          </View>
          <Text className="mt-4 text-center text-[17px] font-bold" style={{ color: ui.text }}>
            {selectedFile ? selectedFile.name : "Thả file JD vào đây"}
          </Text>
          <Text className="mt-1.5 text-center text-[12px] leading-5" style={{ color: ui.muted }}>
            {selectedFile ? "Nhấn để chọn file khác" : "Hỗ trợ PDF, DOCX, TXT hoặc ảnh chụp JD"}
          </Text>
        </View>
      </Pressable>

      {/* Paste area */}
      <View className="rounded-3xl p-5" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
        <Text className="mb-3 text-[15px] font-semibold" style={{ color: ui.text }}>
          Hoặc dán nội dung JD
        </Text>
        <TextInput
          className="min-h-[140px] rounded-2xl px-4 py-3 text-[13px] leading-5"
          multiline
          onChangeText={(value) => {
            setJdText(value);
            if (value.trim()) setSelectedFile(null);
          }}
          placeholder="Dán JD vào đây nếu không upload file..."
          placeholderTextColor={isDark ? colors.textSecondary : "#9CA3AF"}
          style={{
            backgroundColor: ui.surfaceSoft,
            borderColor: isDark ? colors.border : "#EEF2F7",
            borderWidth: 1,
            color: ui.text,
            textAlignVertical: "top"
          }}
          value={jdText}
        />
      </View>

      {/* Analyze button */}
      <Pressable
        accessibilityRole="button"
        className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-4 active:scale-[0.99] active:opacity-90"
        disabled={loading}
        onPress={() => void analyzeJD()}
        style={[{ backgroundColor: ui.accent }, blueButtonShadow]}
      >
        {loading ? <ActivityIndicator color={ui.buttonText} /> : <Sparkles color={ui.accent === ui.buttonText ? "#fff" : ui.buttonText} size={18} strokeWidth={2.35} />}
        <Text className="text-[15px] font-bold" style={{ color: ui.buttonText }}>
          {loading ? "Đang phân tích..." : "Phân tích JD"}
        </Text>
      </Pressable>

      {error ? (
        <View className="rounded-2xl p-3" style={{ backgroundColor: colors.dangerSoft }}>
          <Text className="text-sm font-semibold" style={{ color: colors.danger }}>
            Không thể phân tích JD
          </Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: ui.muted }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );

  // ─── Step 2: Supplement + Platform ───────────────────────────────────────
  const renderSupplementStep = () => (
    <View className="gap-5 px-5" style={{ width: contentWidth + 40 }}>
      {/* Back header */}
      <View className="flex-row items-center gap-3 px-1">
        <Pressable
          accessibilityRole="button"
          className="h-9 w-9 items-center justify-center rounded-full active:opacity-70"
          onPress={resetToInput}
          style={{ backgroundColor: ui.surface }}
        >
          <X color={ui.muted} size={18} strokeWidth={2.4} />
        </Pressable>
        <View className="flex-1">
          <Text className="text-[20px] font-bold" style={{ color: ui.text }}>
            Bước tiếp theo
          </Text>
          <Text className="text-[12px]" style={{ color: ui.muted }}>
            {selectedFile ? selectedFile.name : "Nội dung đã dán"}
          </Text>
        </View>
      </View>

      {/* Missing fields (only if any) */}
      {visibleFields.length > 0 ? (
        <View className="rounded-3xl p-5" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
          <View className="mb-4">
            <Text className="text-[16px] font-bold" style={{ color: ui.text }}>
              JD còn thiếu một số thông tin
            </Text>
            <Text className="mt-1 text-[12px] leading-5" style={{ color: ui.muted }}>
              Điền nhanh các trường dưới đây để AI tạo JD đầy đủ hơn (bỏ qua nếu không có).
            </Text>
          </View>
          <View className="gap-3">
            {visibleFields.map((fieldKey) => {
              const field = supplementalFieldMeta.find((f) => f.key === fieldKey);
              if (!field) return null;
              return (
                <View key={field.key}>
                  <Text className="mb-1.5 text-[12px] font-semibold" style={{ color: ui.text }}>
                    {field.label}
                  </Text>
                  <TextInput
                    className="rounded-2xl px-4 py-3 text-[13px]"
                    multiline={field.multiline}
                    onChangeText={(value) => updateSupplementalField(field.key, value)}
                    placeholder={field.placeholder}
                    placeholderTextColor={isDark ? colors.textSecondary : "#9CA3AF"}
                    style={{
                      backgroundColor: ui.surfaceSoft,
                      borderColor: isDark ? colors.border : "#EEF2F7",
                      borderWidth: 1,
                      color: ui.text,
                      minHeight: field.multiline ? 76 : 46,
                      textAlignVertical: field.multiline ? "top" : "center"
                    }}
                    value={supplementalFields[field.key]}
                  />
                </View>
              );
            })}
          </View>
        </View>
      ) : (
        <View className="rounded-2xl px-4 py-3" style={{ backgroundColor: colors.successSoft }}>
          <Text className="text-[13px] font-semibold" style={{ color: colors.success }}>
            ✓ JD của bạn đã đầy đủ thông tin
          </Text>
          <Text className="mt-0.5 text-[12px]" style={{ color: ui.muted }}>
            Chọn nền tảng bên dưới để chuẩn hóa ngay.
          </Text>
        </View>
      )}

      {/* Platform selection */}
      <View className="rounded-3xl p-5" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
        <Text className="mb-1 text-[16px] font-bold" style={{ color: ui.text }}>
          Bạn muốn đăng lên nền tảng nào?
        </Text>
        <Text className="mb-4 text-[12px] leading-5" style={{ color: ui.muted }}>
          AI sẽ chuẩn hóa JD theo đúng định dạng và ngôn ngữ của nền tảng bạn chọn.
        </Text>
        <View className="gap-3">
          {platformChoices.map((platform) => {
            const active = targetPlatform === platform.key;
            return (
              <Pressable
                accessibilityRole="radio"
                className="flex-row items-center gap-3 rounded-2xl px-4 py-3 active:scale-[0.99] active:opacity-85"
                key={platform.key}
                onPress={() => setTargetPlatform(platform.key)}
                style={{
                  backgroundColor: active ? platform.color + "15" : ui.surfaceSoft,
                  borderColor: active ? platform.color : isDark ? colors.border : "#EEF2F7",
                  borderWidth: 1.5
                }}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-xl"
                  style={{ backgroundColor: active ? platform.color : ui.surface }}
                >
                  <Text className="text-[13px] font-bold" style={{ color: active ? "#FFFFFF" : ui.muted }}>
                    {platform.label.slice(0, 2)}
                  </Text>
                </View>
                <View className="flex-1">
                  <Text className="text-[14px] font-bold" style={{ color: active ? platform.color : ui.text }}>
                    {platform.label}
                  </Text>
                  <Text className="text-[11px] leading-4" style={{ color: ui.muted }}>
                    {platform.description}
                  </Text>
                </View>
                <View
                  className="h-5 w-5 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: active ? platform.color : "transparent",
                    borderColor: active ? platform.color : ui.border,
                    borderWidth: 2
                  }}
                >
                  {active ? <View className="h-2 w-2 rounded-full" style={{ backgroundColor: "#FFFFFF" }} /> : null}
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Submit button */}
      <Pressable
        accessibilityRole="button"
        className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-4 active:scale-[0.99] active:opacity-90"
        disabled={loading}
        onPress={() => void submit()}
        style={[{ backgroundColor: ui.accent }, blueButtonShadow]}
      >
        {loading ? (
          <ActivityIndicator color={ui.buttonText} />
        ) : (
          <Sparkles color={ui.buttonText} size={18} strokeWidth={2.35} />
        )}
        <Text className="text-[15px] font-bold" style={{ color: ui.buttonText }}>
          {loading ? "Đang chuẩn hóa..." : `Chuẩn hóa theo ${platformChoices.find((p) => p.key === targetPlatform)?.label ?? ""}`}
        </Text>
        {!loading ? <ChevronRight color={ui.buttonText} size={16} strokeWidth={2.5} /> : null}
      </Pressable>

      {error ? (
        <View className="rounded-2xl p-3" style={{ backgroundColor: colors.dangerSoft }}>
          <Text className="text-sm font-semibold" style={{ color: colors.danger }}>
            Chưa thể chuẩn hóa JD
          </Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: ui.muted }}>
            {error}
          </Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: ui.background }}>
      <AppHeader minimal title="Chuẩn hóa JD" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: ui.background, paddingBottom: 32, paddingTop: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === "input" ? renderInputStep() : renderSupplementStep()}
      </ScrollView>
    </SafeAreaView>
  );
}
