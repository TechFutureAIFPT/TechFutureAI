import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useMemo, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Sparkles, UploadCloud } from "lucide-react-native";
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

const platformOptions: Array<{ key: JDTargetPlatform; label: string }> = [
  { key: "generic", label: "Chung" },
  { key: "topcv", label: "TopCV" },
  { key: "vietnamworks", label: "VietnamWorks" },
  { key: "linkedin", label: "LinkedIn" },
  { key: "parse_jd", label: "Parse JD" }
];

const supplementalFieldMeta: Array<{ key: keyof JDSupplementalFields; label: string; placeholder: string; multiline?: boolean }> = [
  { key: "companyName", label: "Tên công ty", placeholder: "VD: Hipo Tools" },
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
  const [jdText, setJdText] = useState("");
  const [targetPlatform, setTargetPlatform] = useState<JDTargetPlatform>("generic");
  const [selectedFile, setSelectedFile] = useState<SelectedJDFile | null>(null);
  const [supplementalFields, setSupplementalFields] = useState<JDSupplementalFields>(emptySupplementalFields);
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
            background: "#F9FAFB",
            surface: "#FFFFFF",
            surfaceSoft: "#F9FAFB",
            text: "#111827",
            muted: "#6B7280",
            border: "#F3F4F6",
            accent: "#F59E0B",
            accentSoft: "rgba(245, 158, 11, 0.10)",
            dashed: "#FDBA74",
            buttonText: "#FFFFFF"
          },
    [colors, isDark]
  );
  const orangeButtonShadow = useMemo(
    () => ({
      elevation: isDark ? 0 : 6,
      shadowColor: "#F59E0B",
      shadowOffset: { height: 10, width: 0 },
      shadowOpacity: isDark ? 0 : 0.28,
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
    setError(null);
  };

  const updateSupplementalField = (key: keyof JDSupplementalFields, value: string) => {
    setSupplementalFields((current) => ({ ...current, [key]: value }));
  };

  const submit = async () => {
    const text = jdText.trim();
    if (!selectedFile && !text) {
      setError("Bạn hãy upload file JD hoặc dán nội dung JD trước.");
      return;
    }

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

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: ui.background }}>
      <AppHeader minimal title="Chuẩn hóa JD" />
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: ui.background, paddingBottom: 116, paddingTop: 18 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-5 px-5" style={{ width: contentWidth + 40 }}>
          <View className="px-1">
            <Text className="text-[24px] font-bold leading-8" style={{ color: ui.text }}>
              Chuẩn hóa JD
            </Text>
            <Text className="mt-2 text-[13px] leading-5" style={{ color: ui.muted }}>
              Upload hoặc dán JD để kiểm tra điểm thiếu, nhận gợi ý bổ sung và tạo bản JD sẵn sàng đăng tuyển.
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ gap: 8, paddingHorizontal: 2, paddingVertical: 2 }}
          >
            {platformOptions.map((option) => {
                const active = targetPlatform === option.key;
                return (
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-10 justify-center rounded-full px-4 active:scale-[0.98] active:opacity-85"
                    key={option.key}
                    onPress={() => setTargetPlatform(option.key)}
                    style={[
                      {
                        backgroundColor: active ? ui.accent : ui.surface,
                        borderColor: active ? ui.accent : ui.border,
                        borderWidth: 1
                      },
                      active && !isDark ? orangeButtonShadow : surfaceShadowStyle
                    ]}
                  >
                    <Text className="text-[13px] font-semibold" style={{ color: active ? "#FFFFFF" : ui.text }}>
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
          </ScrollView>

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
                {selectedFile ? selectedFile.name : "Tải file JD"}
              </Text>
              <Text className="mt-1.5 text-center text-[12px] leading-5" style={{ color: ui.muted }}>
                Hỗ trợ PDF, DOCX, TXT hoặc ảnh chụp JD.
              </Text>
            </View>
          </Pressable>

          <View
            className="rounded-3xl p-5"
            style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}
          >
            <Text className="mb-3 text-[15px] font-semibold" style={{ color: ui.text }}>
              Dán nội dung JD
            </Text>
            <TextInput
              className="min-h-[158px] rounded-2xl px-4 py-3 text-[13px] leading-5"
              multiline
              onChangeText={(value) => {
                setJdText(value);
                if (value.trim()) {
                  setSelectedFile(null);
                }
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

          <View className="rounded-3xl p-5" style={[{ backgroundColor: ui.surface }, surfaceShadowStyle]}>
            <View className="mb-4">
              <Text className="text-[16px] font-bold" style={{ color: ui.text }}>
                Bổ sung thông tin còn thiếu
              </Text>
              <Text className="mt-1 text-[12px] leading-5" style={{ color: ui.muted }}>
                Điền nhanh các trường JD hay thiếu để AI đưa vào bản chuẩn hóa.
              </Text>
            </View>
            <View className="gap-3">
              {supplementalFieldMeta.map((field) => (
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
              ))}
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            className="min-h-[54px] flex-row items-center justify-center gap-2 rounded-2xl px-4 active:scale-[0.99] active:opacity-90"
            disabled={loading}
            onPress={() => void submit()}
            style={[{ backgroundColor: ui.accent }, orangeButtonShadow]}
          >
            {loading ? <ActivityIndicator color={ui.buttonText} /> : <Sparkles color={ui.buttonText} size={18} strokeWidth={2.35} />}
            <Text className="text-[15px] font-bold" style={{ color: ui.buttonText }}>
              {loading ? "Đang chuẩn hóa..." : "Chuẩn hóa JD"}
            </Text>
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
      </ScrollView>
      <BottomNav />
    </SafeAreaView>
  );
}
