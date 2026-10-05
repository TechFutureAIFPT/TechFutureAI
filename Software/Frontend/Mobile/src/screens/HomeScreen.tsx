import {
  ActivityIndicator,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { useEffect, useRef, useState, memo, useMemo } from "react";
import * as DocumentPicker from "expo-document-picker";
import * as ImagePicker from "expo-image-picker";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  Camera,
  CheckCircle2,
  FileText,
  FileUp,
  ImagePlus,
  Plus,
  Sparkles,
  UploadCloud,
  X
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

type SelectedCvFile = {
  uri: string;
  name: string;
  mimeType?: string;
  file?: Blob;
};

function appendFile(formData: FormData, asset: { uri: string; name?: string; mimeType?: string; file?: Blob }) {
  const name = asset.name || `file-${Date.now()}.jpg`;
  const type = asset.mimeType || "image/jpeg";

  if (asset.file) {
    formData.append("files", asset.file, name);
    return;
  }

  formData.append("files", { uri: asset.uri, name, type } as unknown as Blob);
}

const MemoizedAppHeader = memo(AppHeader);

const IntroHeader = memo(() => {
  const { colors } = useAppTheme();
  return (
    <View>
      <Text className="text-[31px] font-black leading-[36px] tracking-tight" numberOfLines={1} style={{ color: colors.textPrimary }}>
        Chấm điểm CV nhanh
      </Text>
      <Text className="mt-3 text-[13px] leading-5" style={{ color: colors.textSecondary }}>
        Chụp CV hoặc tải file lên để AI đọc hồ sơ, chấm điểm và tách riêng điểm mạnh, điểm yếu, phần cần cải thiện.
      </Text>

      <View className="mt-3.5 flex-row gap-2">
        <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }}>
          <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>
            1-3 CV
          </Text>
        </View>
        <View className="rounded-full border px-3 py-1.5" style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }}>
          <Text className="text-xs font-black" style={{ color: colors.textPrimary }}>
            Ảnh / PDF / DOCX
          </Text>
        </View>
      </View>
    </View>
  );
});

const ScanLoadingCard = memo(() => {
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

  return (
    <Animated.View
      className="items-center rounded-3xl border p-6 my-2"
      style={[
        { backgroundColor: colors.surface, borderColor: colors.accent, borderWidth: 1.5, transform: [{ scale }] },
        surfaceShadowStyle
      ]}
    >
      <ActivityIndicator color={colors.accent} size="large" />
      <Text className="mt-4 text-base font-black" style={{ color: colors.textPrimary }}>
        Đang phân tích CV...
      </Text>
      <Text className="mt-1 text-xs text-center" style={{ color: colors.textSecondary }}>
        Hệ thống AI đang đọc hồ sơ, đánh giá tiêu chí và tạo nhận xét chi tiết.
      </Text>
    </Animated.View>
  );
});

export function QuickCvScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();
  
  const authUser = useRecruiterStore((state) => state.authUser);
  const setCandidateMetadata = useRecruiterStore((state) => state.setCandidateMetadata);
  const scoreQuickCvForm = useRecruiterStore((state) => state.scoreQuickCvForm);
  const quickCvLoading = useRecruiterStore((state) => state.quickCvLoading);
  const quickCvResults = useRecruiterStore((state) => state.quickCvResults);
  const error = useRecruiterStore((state) => state.error);
  
  const [stagedCvs, setStagedCvs] = useState<SelectedCvFile[]>([]);
  const [stagedJdFile, setStagedJdFile] = useState<SelectedCvFile | null>(null);
  const [jdText, setJdText] = useState("");

  const [hoTen, setHoTen] = useState(authUser?.displayName || "");
  const [email, setEmail] = useState(authUser?.email || "");
  const [mssv, setMssv] = useState("");
  const [nganh, setNganh] = useState("");
  const [consent, setConsent] = useState(true);

  const isCandidate = authUser?.userRole === "candidate";
  const contentWidth = Math.min(Math.max(width - 40, 300), 430);

  useEffect(() => {
    if (authUser) {
      setHoTen(authUser.displayName || "");
      setEmail(authUser.email || "");
    }
  }, [authUser]);

  const pickCvDocuments = async () => {
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

    const newAssets: SelectedCvFile[] = result.assets.map((asset) => ({
      uri: asset.uri,
      name: asset.name || `CV_${Date.now()}`,
      mimeType: asset.mimeType || undefined,
      file: "file" in asset ? (asset.file as Blob | undefined) : undefined
    }));

    setStagedCvs((prev) => [...prev, ...newAssets].slice(0, 3));
  };

  const captureCvPhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.9
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const newFile: SelectedCvFile = {
      uri: asset.uri,
      name: asset.fileName || `CV_Photo_${Date.now()}.jpg`,
      mimeType: asset.mimeType || "image/jpeg",
      file: "file" in asset ? (asset.file as Blob | undefined) : undefined
    };

    setStagedCvs((prev) => [...prev, newFile].slice(0, 3));
  };

  const removeCvFile = (index: number) => {
    setStagedCvs((prev) => prev.filter((_, i) => i !== index));
  };

  const pickJdDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "text/plain",
        "image/*"
      ]
    });

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    setStagedJdFile({
      uri: asset.uri,
      name: asset.name || `JD_${Date.now()}`,
      mimeType: asset.mimeType || undefined,
      file: "file" in asset ? (asset.file as Blob | undefined) : undefined
    });
  };

  const handleStartAnalysis = async () => {
    if (stagedCvs.length === 0) {
      alert("Vui lòng tải ít nhất 1 file CV để bắt đầu phân tích.");
      return;
    }

    if (isCandidate) {
      const nameVal = hoTen.trim();
      const mailVal = email.trim();
      if (!nameVal || !mailVal) {
        alert("Vui lòng điền đầy đủ Họ tên và Email liên hệ.");
        return;
      }
      if (!consent) {
        alert("Bạn vui lòng đồng ý điều khoản lưu trữ thông tin để tiếp tục.");
        return;
      }
      setCandidateMetadata({
        hoTen: nameVal,
        email: mailVal,
        mssv: mssv.trim(),
        nganh: nganh.trim()
      });
    }

    const formData = new FormData();
    formData.append("include_extracted_text", "false");

    stagedCvs.forEach((asset) => {
      appendFile(formData, asset);
    });

    const typedJd = jdText.trim();
    if (typedJd) {
      formData.append("jd_text", typedJd);
    }

    if (stagedJdFile) {
      appendFile(formData, { ...stagedJdFile, name: stagedJdFile.name || "jd_file" });
    }

    const items = await scoreQuickCvForm(formData);
    if (items.length > 0) {
      navigation.navigate("QuickCvResult");
    }
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <MemoizedAppHeader
        right={
          <View className="items-end">
            <View
              className="min-h-9 flex-row items-center gap-2 rounded-full border px-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }}
            >
              <Sparkles color={colors.accent} size={14} strokeWidth={2.2} />
              <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                AI phân tích nhanh
              </Text>
            </View>
          </View>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 32, paddingTop: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4 px-5 pt-5" style={{ width: contentWidth + 40 }}>
          <IntroHeader />

          {/* Form Thông tin ứng viên (Góc Ứng viên) */}
          {isCandidate && (
            <View
              className="rounded-3xl border p-5 gap-3.5"
              style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}
            >
              <Text className="text-base font-black tracking-tight" style={{ color: colors.textPrimary }}>
                Thông tin ứng viên
              </Text>
              <View className="gap-3 mt-1">
                <View>
                  <Text className="text-[10px] font-bold mb-1 ml-1" style={{ color: colors.textSecondary }}>
                    Họ và tên *
                  </Text>
                  <TextInput
                    className="min-h-[44px] rounded-xl border px-3 text-sm font-semibold"
                    onChangeText={setHoTen}
                    placeholder="Nguyễn Văn A"
                    placeholderTextColor={colors.textSecondary}
                    style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, color: colors.textPrimary, borderWidth: 0.85 }}
                    value={hoTen}
                  />
                </View>

                <View>
                  <Text className="text-[10px] font-bold mb-1 ml-1" style={{ color: colors.textSecondary }}>
                    Email liên hệ *
                  </Text>
                  <TextInput
                    className="min-h-[44px] rounded-xl border px-3 text-sm font-semibold"
                    keyboardType="email-address"
                    onChangeText={setEmail}
                    placeholder="email@gmail.com"
                    placeholderTextColor={colors.textSecondary}
                    style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, color: colors.textPrimary, borderWidth: 0.85 }}
                    value={email}
                  />
                </View>

                <Pressable
                  accessibilityRole="checkbox"
                  className="flex-row items-start gap-2.5 mt-1.5 p-2 rounded-xl"
                  onPress={() => setConsent(!consent)}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surfaceSoft,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }
                  ]}
                >
                  <View
                    className="mt-0.5 h-4.5 w-4.5 items-center justify-center rounded border"
                    style={{
                      backgroundColor: consent ? colors.accent : "transparent",
                      borderColor: consent ? colors.accent : colors.border,
                      borderWidth: 1.2
                    }}
                  >
                    {consent && <Text className="text-[10px] font-bold text-black">✓</Text>}
                  </View>
                  <Text className="flex-1 text-[11px] leading-4 font-semibold" style={{ color: colors.textSecondary }}>
                    Tôi đồng ý để hệ thống lưu trữ CV và thông tin trên nhằm mục đích hỗ trợ tư vấn nghề nghiệp, sửa đổi CV và kết nối việc làm.
                  </Text>
                </Pressable>
              </View>
            </View>
          )}

          {/* STEP 1: CV INPUT ONLY FIRST */}
          {stagedCvs.length === 0 ? (
            <View className="gap-4">
              <View className="flex-row gap-3">
                <Pressable
                  accessibilityRole="button"
                  className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl px-3"
                  disabled={quickCvLoading}
                  onPress={() => void captureCvPhoto()}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.accent,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }]
                    }
                  ]}
                >
                  <Camera color="#111827" size={18} strokeWidth={2.5} />
                  <Text className="text-sm font-black text-black">Chụp CV</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  className="min-h-12 flex-1 flex-row items-center justify-center gap-2 rounded-2xl border px-3"
                  disabled={quickCvLoading}
                  onPress={() => void pickCvDocuments()}
                  style={({ pressed }) => [
                    {
                      backgroundColor: colors.surface,
                      borderColor: colors.border,
                      borderWidth: 0.85,
                      opacity: pressed ? 0.9 : 1,
                      transform: [{ scale: pressed ? 0.97 : 1 }]
                    }
                  ]}
                >
                  <UploadCloud color={colors.textPrimary} size={18} strokeWidth={2.35} />
                  <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>
                    Tải file
                  </Text>
                </Pressable>
              </View>

              <Pressable
                accessibilityRole="button"
                className="min-h-[140px] items-center justify-center rounded-3xl border-2 border-dashed px-4"
                disabled={quickCvLoading}
                onPress={() => void pickCvDocuments()}
                style={({ pressed }) => [
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                    opacity: pressed ? 0.95 : 1,
                    transform: [{ scale: pressed ? 0.99 : 1 }]
                  },
                  surfaceShadowStyle
                ]}
              >
                <View className="mb-3 h-12 w-12 items-center justify-center rounded-2xl" style={{ backgroundColor: colors.surfaceSoft }}>
                  {quickCvLoading ? (
                    <ActivityIndicator color={colors.accent} />
                  ) : (
                    <ImagePlus color={colors.accent} size={24} strokeWidth={2.3} />
                  )}
                </View>
                <Text className="text-center text-base font-black" style={{ color: colors.textPrimary }}>
                  {quickCvLoading ? "Đang tải và phân tích CV..." : "Chọn CV để chấm điểm"}
                </Text>
                <Text className="mt-1.5 text-center text-[11px] leading-4" style={{ color: colors.textSecondary }}>
                  Thả hoặc bấm chọn file (Ảnh chụp, PNG, JPG, PDF, DOCX). Tối đa 3 file.
                </Text>
              </Pressable>
            </View>
          ) : (
            /* STEP 2: CV IS LOADED -> SHOW STAGED CVS LIST + OPTIONAL JD INPUT */
            <View className="gap-4">
              {/* Staged CV Files List */}
              <View
                className="rounded-3xl border p-4 gap-3"
                style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}
              >
                <View className="flex-row items-center justify-between">
                  <View className="flex-row items-center gap-2">
                    <CheckCircle2 color={colors.accent} size={18} strokeWidth={2.4} />
                    <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>
                      Đã chọn {stagedCvs.length}/3 file CV
                    </Text>
                  </View>
                  {stagedCvs.length < 3 ? (
                    <Pressable
                      accessibilityRole="button"
                      className="flex-row items-center gap-1 rounded-full px-2.5 py-1"
                      onPress={() => void pickCvDocuments()}
                      style={{ backgroundColor: colors.surfaceSoft }}
                    >
                      <Plus color={colors.accent} size={14} strokeWidth={2.5} />
                      <Text className="text-xs font-bold" style={{ color: colors.accent }}>Thêm CV</Text>
                    </Pressable>
                  ) : null}
                </View>

                <View className="gap-2 mt-1">
                  {stagedCvs.map((file, idx) => (
                    <View
                      className="flex-row items-center justify-between rounded-2xl border px-3.5 py-2.5"
                      key={idx}
                      style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border, borderWidth: 0.85 }}
                    >
                      <View className="flex-row items-center gap-2.5 min-w-0 flex-1">
                        <FileText color={colors.accent} size={18} strokeWidth={2.2} />
                        <Text className="text-xs font-bold min-w-0 flex-1" numberOfLines={1} style={{ color: colors.textPrimary }}>
                          {file.name}
                        </Text>
                      </View>
                      <Pressable
                        accessibilityRole="button"
                        className="h-7 w-7 items-center justify-center rounded-full active:opacity-70 ml-2"
                        onPress={() => removeCvFile(idx)}
                        style={{ backgroundColor: colors.dangerSoft }}
                      >
                        <X color={colors.danger} size={14} strokeWidth={2.4} />
                      </Pressable>
                    </View>
                  ))}
                </View>
              </View>

              {/* Step 2: Optional JD Section */}
              <View
                className="rounded-3xl border p-4 gap-3"
                style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}
              >
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-black tracking-tight" style={{ color: colors.textPrimary }}>
                    Mô tả công việc (JD)
                  </Text>
                  <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: colors.surfaceSoft }}>
                    <Text className="text-[10px] font-bold" style={{ color: colors.textSecondary }}>Không bắt buộc</Text>
                  </View>
                </View>

                <Text className="text-xs leading-4" style={{ color: colors.textSecondary }}>
                  Thả file JD (PDF, DOCX, TXT) hoặc dán văn bản mô tả tuyển dụng bên dưới để AI chấm điểm bám sát công việc.
                </Text>

                {/* Option A: Upload JD File */}
                {stagedJdFile ? (
                  <View
                    className="flex-row items-center justify-between rounded-2xl border px-3.5 py-2.5 mt-1"
                    style={{ backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 1 }}
                  >
                    <View className="flex-row items-center gap-2.5 min-w-0 flex-1">
                      <FileUp color={colors.accent} size={18} strokeWidth={2.4} />
                      <Text className="text-xs font-bold min-w-0 flex-1" numberOfLines={1} style={{ color: colors.textPrimary }}>
                        {stagedJdFile.name}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      className="h-7 w-7 items-center justify-center rounded-full active:opacity-70 ml-2"
                      onPress={() => setStagedJdFile(null)}
                      style={{ backgroundColor: colors.dangerSoft }}
                    >
                      <X color={colors.danger} size={14} strokeWidth={2.4} />
                    </Pressable>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    className="flex-row items-center justify-center gap-2 rounded-2xl border border-dashed py-3 px-3 mt-1 active:opacity-80"
                    onPress={() => void pickJdDocument()}
                    style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
                  >
                    <FileUp color={colors.accent} size={18} strokeWidth={2.2} />
                    <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                      Tải file JD lên (PDF / DOCX / TXT)
                    </Text>
                  </Pressable>
                )}

                {/* Option B: Text Area for JD */}
                <TextInput
                  className="min-h-[90px] rounded-xl border px-3 py-2.5 text-xs font-semibold mt-1"
                  multiline
                  numberOfLines={4}
                  onChangeText={setJdText}
                  placeholder="Hoặc dán nội dung mô tả công việc (JD) tại đây..."
                  placeholderTextColor={colors.textSecondary}
                  style={{
                    backgroundColor: colors.surfaceSoft,
                    borderColor: colors.border,
                    color: colors.textPrimary,
                    textAlignVertical: "top",
                    borderWidth: 0.85
                  }}
                  value={jdText}
                />
              </View>

              {/* Primary Action Button */}
              <Pressable
                accessibilityRole="button"
                className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl px-4 active:opacity-85"
                disabled={quickCvLoading}
                onPress={() => void handleStartAnalysis()}
                style={{ backgroundColor: colors.accent }}
              >
                {quickCvLoading ? (
                  <ActivityIndicator color="#111827" />
                ) : (
                  <>
                    <Sparkles color="#111827" size={20} strokeWidth={2.4} />
                    <Text className="text-base font-black text-black">
                      {stagedJdFile || jdText.trim()
                        ? "Phân tích & Chấm điểm CV theo JD"
                        : "Bỏ qua JD & Phân tích CV ngay"}
                    </Text>
                  </>
                )}
              </Pressable>

              {/* Secondary reset button */}
              <Pressable
                accessibilityRole="button"
                className="min-h-[42px] items-center justify-center rounded-xl active:opacity-75"
                disabled={quickCvLoading}
                onPress={() => {
                  setStagedCvs([]);
                  setStagedJdFile(null);
                  setJdText("");
                }}
              >
                <Text className="text-xs font-bold" style={{ color: colors.textSecondary }}>
                  Hủy bỏ & Chọn file CV khác
                </Text>
              </Pressable>
            </View>
          )}

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
              className="min-h-12 items-center justify-center rounded-2xl border px-4"
              onPress={() => navigation.navigate("QuickCvResult")}
              style={({ pressed }) => [
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                  borderWidth: 0.85,
                  opacity: pressed ? 0.95 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }]
                }
              ]}
            >
              <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>
                Xem kết quả chấm CV gần nhất
              </Text>
            </Pressable>
          ) : null}
        </View>
      </ScrollView>

    </SafeAreaView>
  );
}
