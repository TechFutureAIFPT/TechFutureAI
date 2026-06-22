import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  useWindowDimensions,
  View
} from "react-native";
import { useEffect, useRef, useState } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Camera, FileText, ImagePlus, Sparkles, UploadCloud } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type SelectedCvFile = {
  name: string;
  type: string;
};

function appendFile(formData: FormData, asset: { uri: string; name?: string; mimeType?: string; file?: Blob }) {
  const name = asset.name || `cv-${Date.now()}.jpg`;
  const type = asset.mimeType || "image/jpeg";

  if (asset.file) {
    formData.append("files", asset.file, name);
    return;
  }

  formData.append("files", { uri: asset.uri, name, type } as unknown as Blob);
}

function ScanLoadingCard() {
  const { colors, surfaceShadowStyle } = useAppTheme();
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          duration: 760,
          easing: Easing.inOut(Easing.ease),
          toValue: 1,
          useNativeDriver: Platform.OS !== "web"
        }),
        Animated.timing(pulse, {
          duration: 760,
          easing: Easing.inOut(Easing.ease),
          toValue: 0,
          useNativeDriver: Platform.OS !== "web"
        })
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulse]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.96, 1.05] });
  const opacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.45, 1] });

  return (
    <View
      className="overflow-hidden rounded-[28px] border p-4"
      style={[{ backgroundColor: colors.surface, borderColor: colors.border }, surfaceShadowStyle]}
    >
      <View className="flex-row items-center gap-3">
        <Animated.View
          className="h-12 w-12 items-center justify-center rounded-2xl"
          style={{ backgroundColor: colors.surfaceSoft, opacity, transform: [{ scale }] }}
        >
          <Sparkles color={colors.accent} size={22} strokeWidth={2.4} />
        </Animated.View>
        <View className="min-w-0 flex-1">
          <Text className="text-base font-black" style={{ color: colors.textPrimary }}>
            AI đang đọc CV
          </Text>
          <Text className="mt-1 text-xs leading-5" style={{ color: colors.textSecondary }}>
            Đang trích xuất nội dung, chấm điểm và tạo nhận xét riêng cho từng hồ sơ.
          </Text>
        </View>
        <ActivityIndicator color={colors.accent} />
      </View>

      <View className="mt-4 h-2 overflow-hidden rounded-full" style={{ backgroundColor: colors.surfaceSoft }}>
        <Animated.View
          className="h-full rounded-full"
          style={{
            backgroundColor: colors.accent,
            opacity,
            transform: [
              {
                scaleX: pulse.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] })
              }
            ]
          }}
        />
      </View>
    </View>
  );
}

function CvSlot({ file, index }: { file?: SelectedCvFile; index: number }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  return (
    <View
      className="min-h-[72px] flex-1 rounded-2xl border px-3 py-2.5"
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: file ? colors.accent : colors.border
        },
        surfaceShadowStyle
      ]}
    >
      <View className="mb-2 h-7 w-7 items-center justify-center rounded-full" style={{ backgroundColor: colors.surfaceSoft }}>
        <FileText color={file ? colors.accent : colors.textSecondary} size={14} strokeWidth={2.4} />
      </View>
      <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>
        CV {index + 1}
      </Text>
      <Text className="mt-1 text-[11px] font-semibold" numberOfLines={1} style={{ color: colors.textSecondary }}>
        {file?.name || (index === 0 ? "Chưa chọn" : "Có thể thêm")}
      </Text>
    </View>
  );
}

export function QuickCvScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();
  const scoreQuickCvForm = useRecruiterStore((state) => state.scoreQuickCvForm);
  const quickCvLoading = useRecruiterStore((state) => state.quickCvLoading);
  const quickCvResults = useRecruiterStore((state) => state.quickCvResults);
  const error = useRecruiterStore((state) => state.error);
  const [selectedFiles, setSelectedFiles] = useState<SelectedCvFile[]>([]);
  const contentWidth = Math.min(Math.max(width - 40, 300), 430);

  const submitFormData = async (formData: FormData, files: SelectedCvFile[]) => {
    formData.append("include_extracted_text", "false");
    setSelectedFiles(files);
    const items = await scoreQuickCvForm(formData);
    if (items.length > 0) {
      navigation.navigate("QuickCvResult");
    }
  };

  const pickDocuments = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: true,
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "image/*",
        "text/plain"
      ]
    });

    if (result.canceled) return;

    const assets = result.assets.slice(0, 3);
    const formData = new FormData();
    const files = assets.map((asset) => ({
      name: asset.name || "uploaded-cv",
      type: asset.mimeType || "application/octet-stream"
    }));

    assets.forEach((asset) =>
      appendFile(formData, {
        file: "file" in asset ? (asset.file as Blob | undefined) : undefined,
        mimeType: asset.mimeType || undefined,
        name: asset.name,
        uri: asset.uri
      })
    );
    await submitFormData(formData, files);
  };

  const captureCv = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const name = asset.fileName || `cv-photo-${Date.now()}.jpg`;
    const formData = new FormData();
    formData.append("force_ocr", "true");
    appendFile(formData, {
      file: "file" in asset ? (asset.file as Blob | undefined) : undefined,
      mimeType: asset.mimeType || "image/jpeg",
      name,
      uri: asset.uri
    });
    await submitFormData(formData, [{ name, type: asset.mimeType || "image/jpeg" }]);
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96, paddingTop: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <AppHeader
          right={
            <View className="items-end">
              <View
                className="min-h-9 flex-row items-center gap-2 rounded-full border px-3"
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <Sparkles color={colors.accent} size={14} strokeWidth={2.2} />
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                  AI phân tích nhanh
                </Text>
              </View>
            </View>
          }
        />

        <View className="gap-4 px-5 pt-5" style={{ width: contentWidth + 40 }}>
          <View>
            <Text className="text-[31px] font-black leading-[36px]" numberOfLines={1} style={{ color: colors.textPrimary }}>
              Chấm điểm CV nhanh
            </Text>
            <Text className="mt-3 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
              Chụp CV hoặc tải file lên để AI đọc hồ sơ, chấm điểm và tách riêng điểm mạnh, điểm yếu, phần cần cải thiện.
            </Text>

            <View className="mt-3 flex-row gap-2">
              <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>
                  1-3 CV
                </Text>
              </View>
              <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surface, borderColor: colors.border }}>
                <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>
                  Ảnh / PDF / DOCX
                </Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-3">
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3 active:scale-[0.98] active:opacity-85"
              disabled={quickCvLoading}
              onPress={() => void captureCv()}
              style={{ backgroundColor: colors.accent }}
            >
              <Camera color="#111827" size={18} strokeWidth={2.5} />
              <Text className="text-sm font-black text-black">Chụp CV</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border px-3 active:scale-[0.98] active:opacity-85"
              disabled={quickCvLoading}
              onPress={() => void pickDocuments()}
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <UploadCloud color={colors.textPrimary} size={18} strokeWidth={2.35} />
              <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>
                Tải file
              </Text>
            </Pressable>
          </View>

          <Pressable
            accessibilityRole="button"
            className="min-h-[128px] items-center justify-center rounded-3xl border-2 border-dashed px-4 active:opacity-85"
            disabled={quickCvLoading}
            onPress={() => void pickDocuments()}
            style={[
              {
                backgroundColor: colors.surface,
                borderColor: colors.border
              },
              surfaceShadowStyle
            ]}
          >
            <View className="mb-3 h-11 w-11 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
              {quickCvLoading ? (
                <ActivityIndicator color={colors.accent} />
              ) : (
                <ImagePlus color={colors.accent} size={22} strokeWidth={2.3} />
              )}
            </View>
            <Text className="text-center text-base font-black" style={{ color: colors.textPrimary }}>
              {quickCvLoading ? "Đang tải và chấm điểm CV..." : "Chọn CV để chấm điểm"}
            </Text>
            <Text className="mt-1.5 text-center text-[11px] leading-4" style={{ color: colors.textSecondary }}>
              Hỗ trợ ảnh chụp, PNG, JPG, PDF, DOCX. Mỗi lần tối đa 3 CV.
            </Text>
          </Pressable>

          <View className="flex-row gap-2">
            {[0, 1, 2].map((index) => (
              <CvSlot file={selectedFiles[index]} index={index} key={index} />
            ))}
          </View>

          {quickCvLoading ? <ScanLoadingCard /> : null}

          {error ? (
            <View className="rounded-2xl border p-3" style={{ backgroundColor: colors.dangerSoft, borderColor: colors.danger }}>
              <Text className="text-sm font-bold" style={{ color: colors.danger }}>
                Không thể chấm CV
              </Text>
              <Text className="mt-1 text-xs leading-5" style={{ color: colors.textSecondary }}>
                {error}
              </Text>
            </View>
          ) : null}

          {quickCvResults.length > 0 && !quickCvLoading ? (
            <Pressable
              accessibilityRole="button"
              className="min-h-12 items-center justify-center rounded-2xl border px-4 active:opacity-80"
              onPress={() => navigation.navigate("QuickCvResult")}
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>
                Xem kết quả chấm CV gần nhất
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

      <BottomNav />
    </SafeAreaView>
  );
}
