import { useState, useEffect, memo } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  useWindowDimensions,
  View
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import {
  ArrowLeft,
  Briefcase,
  ChevronDown,
  ChevronRight,
  FileText,
  GraduationCap,
  ListPlus,
  Plus,
  Printer,
  Sparkles,
  Trash2,
  Users
} from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

import type { RootStackParamList } from "../App";
import { AppHeader } from "../components/AppChrome";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { QuickCvScoreItem } from "../types";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

// Decoupled, high-performance input wrapper
// Only updates parent state on end editing/blur to prevent typing lag
const CvTextInput = memo(({
  value,
  onChange,
  label,
  placeholder,
  multiline = false,
  numberOfLines = 1,
  style = {}
}: {
  value: string;
  onChange: (text: string) => void;
  label?: string;
  placeholder?: string;
  multiline?: boolean;
  numberOfLines?: number;
  style?: any;
}) => {
  const { colors } = useAppTheme();
  const [localValue, setLocalValue] = useState(value || "");

  useEffect(() => {
    setLocalValue(value || "");
  }, [value]);

  const handleCommit = () => {
    if (localValue !== value) {
      onChange(localValue);
    }
  };

  return (
    <View className="mb-3">
      {label ? (
        <Text className="text-[10px] font-bold mb-1 ml-1" style={{ color: colors.textSecondary }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        className={[
          "rounded-xl border px-3 text-sm font-semibold",
          multiline ? "py-2 text-xs min-h-[80px]" : "min-h-[44px]"
        ].join(" ")}
        multiline={multiline}
        numberOfLines={numberOfLines}
        onChangeText={setLocalValue}
        onEndEditing={handleCommit}
        onBlur={handleCommit}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        style={[
          {
            backgroundColor: colors.surfaceSoft,
            borderColor: colors.border,
            color: colors.textPrimary,
            textAlignVertical: multiline ? "top" : "center",
            borderWidth: 0.85
          },
          style
        ]}
        value={localValue}
      />
    </View>
  );
});

function generateCvHtml(cv: any): string {
  const contact = [
    cv.lien_he?.dien_thoai,
    cv.lien_he?.email,
    cv.lien_he?.dia_chi,
    cv.lien_he?.link
  ].filter(Boolean).join("  ·  ");

  const eduHtml = (cv.hoc_van || []).map((item: any) => `
    <div class="cv-item">
      <div class="row">
        <span class="bold">${item.truong || ""}</span>
        <span class="date">${item.thoi_gian || ""}</span>
      </div>
      <div class="row italic font-sm">
        <span>${item.nganh || ""}</span>
        <span>${item.ket_qua || ""}</span>
      </div>
    </div>
  `).join("");

  const expHtml = (cv.kinh_nghiem || []).map((item: any) => `
    <div class="cv-item">
      <div class="row">
        <span class="bold">${item.vi_tri || ""}</span>
        <span class="date">${item.thoi_gian || ""}</span>
      </div>
      <div class="row italic font-sm">
        <span>${item.to_chuc || ""}</span>
      </div>
      <ul>
        ${(item.mo_ta || []).map((bullet: string) => `<li>${bullet || ""}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  const actHtml = (cv.hoat_dong || []).map((item: any) => `
    <div class="cv-item">
      <div class="row">
        <span class="bold">${item.ten || ""}</span>
        <span class="date">${item.thoi_gian || ""}</span>
      </div>
      <div class="row italic font-sm">
        <span>${item.vai_tro || ""}</span>
      </div>
      <ul>
        ${(item.mo_ta || []).map((bullet: string) => `<li>${bullet || ""}</li>`).join("")}
      </ul>
    </div>
  `).join("");

  const skillHtml = (cv.ky_nang || []).map((item: any) => `
    <div class="cv-skill">
      <span class="bold" style="min-width: 120px; display: inline-block;">${item.nhom || ""}:</span>
      <span>${item.noi_dung || ""}</span>
    </div>
  `).join("");

  const certHtml = (cv.chung_chi || []).map((cert: string) => `
    <div class="cv-item" style="margin-bottom: 4px;">• ${cert}</div>
  `).join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>CV - ${cv.ho_ten || "Candidate"}</title>
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        body {
          font-family: "Segoe UI", Arial, sans-serif;
          color: #1e293b;
          line-height: 1.5;
          padding: 24px 30px;
          background: #fff;
          font-size: 13.5px;
        }
        .header {
          text-align: center;
          margin-bottom: 12px;
        }
        .name {
          font-size: 24px;
          font-weight: 800;
          color: #083d8c;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .title {
          font-size: 14px;
          font-weight: 600;
          color: #0b5ed7;
          margin-top: 2px;
          text-transform: uppercase;
        }
        .contact {
          font-size: 11px;
          color: #475569;
          margin-top: 6px;
          padding-bottom: 8px;
          border-bottom: 2px solid #0b5ed7;
          text-align: center;
        }
        .section {
          margin-top: 12px;
        }
        .section h3 {
          font-size: 12px;
          font-weight: 800;
          color: #083d8c;
          text-transform: uppercase;
          letter-spacing: 1px;
          border-bottom: 1px solid #cbd5e1;
          padding-bottom: 3px;
          margin-bottom: 6px;
          page-break-after: avoid;
          break-after: avoid;
        }
        .cv-item {
          margin-bottom: 8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .row {
          display: flex;
          justify-content: space-between;
          gap: 10px;
        }
        .bold {
          font-weight: 700;
        }
        .italic {
          font-style: italic;
        }
        .date {
          font-weight: 600;
          color: #64748b;
          font-size: 11.5px;
          white-space: nowrap;
        }
        .font-sm {
          font-size: 12.5px;
          color: #334155;
        }
        ul {
          margin: 3px 0 0 16px;
        }
        li {
          margin: 1.5px 0;
          font-size: 12.5px;
          color: #334155;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .cv-skill {
          margin-bottom: 4px;
          font-size: 12.8px;
          page-break-inside: avoid;
          break-inside: avoid;
        }
        .footer {
          margin-top: 20px;
          text-align: center;
          font-size: 9px;
          color: #94a3b8;
          border-top: 1px solid #e2e8f0;
          padding-top: 6px;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="name">${cv.ho_ten || "HỌ VÀ TÊN"}</div>
        <div class="title">${cv.chuc_danh || "VỊ TRÍ ỨNG TUYỂN"}</div>
        <div class="contact">${contact || ""}</div>
      </div>

      <div class="section">
        <h3>Mục tiêu nghề nghiệp</h3>
        <p style="font-size: 12.5px; color: #334155;">${cv.muc_tieu || ""}</p>
      </div>

      ${cv.hoc_van?.length ? `
      <div class="section">
        <h3>Học vấn</h3>
        ${eduHtml}
      </div>
      ` : ""}

      ${cv.kinh_nghiem?.length ? `
      <div class="section">
        <h3>Kinh nghiệm làm việc</h3>
        ${expHtml}
      </div>
      ` : ""}

      ${cv.hoat_dong?.length ? `
      <div class="section">
        <h3>Hoạt động & Dự án</h3>
        ${actHtml}
      </div>
      ` : ""}

      ${cv.ky_nang?.length ? `
      <div class="section">
        <h3>Kỹ năng</h3>
        ${skillHtml}
      </div>
      ` : ""}

      ${cv.chung_chi?.length ? `
      <div class="section">
        <h3>Chứng chỉ</h3>
        ${certHtml}
      </div>
      ` : ""}

      <div class="footer">
        Bản CV được chuẩn hóa bởi CV Match AI · cec.dainam.edu.vn
      </div>
    </body>
    </html>
  `;
}

export function QuickCvEditorScreen() {
  const route = useRoute();
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors, surfaceShadowStyle } = useAppTheme();

  const candidateMetadata = useRecruiterStore((state) => state.candidateMetadata);

  const { scoreItem } = (route.params || {}) as { scoreItem: QuickCvScoreItem };
  
  const [cvData, setCvData] = useState<any>(() => {
    const rawCv = scoreItem?.rewritten_cv || {};
    if (candidateMetadata) {
      return {
        ...rawCv,
        ho_ten: candidateMetadata.hoTen || rawCv.ho_ten,
        lien_he: {
          ...rawCv.lien_he,
          email: candidateMetadata.email || rawCv.lien_he?.email
        }
      };
    }
    return rawCv;
  });

  const [expandedSection, setExpandedSection] = useState<string | null>("co_ban");
  const [exporting, setExporting] = useState(false);
  const contentWidth = Math.min(Math.max(width - 32, 300), 430);

  const toggleSection = (section: string) => {
    setExpandedSection((current) => (current === section ? null : section));
  };

  const updateLienHe = (key: string, value: string) => {
    setCvData((prev: any) => ({
      ...prev,
      lien_he: {
        ...prev.lien_he,
        [key]: value
      }
    }));
  };

  const updateHocVan = (idx: number, key: string, value: string) => {
    setCvData((prev: any) => {
      const list = [...(prev.hoc_van || [])];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, hoc_van: list };
    });
  };

  const addHocVan = () => {
    setCvData((prev: any) => ({
      ...prev,
      hoc_van: [
        ...(prev.hoc_van || []),
        { truong: "Tên trường học", nganh: "Ngành học/Chuyên ngành", thoi_gian: "Thời gian học", ket_qua: "GPA" }
      ]
    }));
  };

  const deleteHocVan = (idx: number) => {
    setCvData((prev: any) => ({
      ...prev,
      hoc_van: (prev.hoc_van || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateKinhNghiem = (idx: number, key: string, value: any) => {
    setCvData((prev: any) => {
      const list = [...(prev.kinh_nghiem || [])];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, kinh_nghiem: list };
    });
  };

  const updateExpBullet = (idx: number, bIdx: number, value: string) => {
    setCvData((prev: any) => {
      const list = [...(prev.kinh_nghiem || [])];
      const bullets = [...(list[idx].mo_ta || [])];
      bullets[bIdx] = value;
      list[idx] = { ...list[idx], mo_ta: bullets };
      return { ...prev, kinh_nghiem: list };
    });
  };

  const addExpBullet = (idx: number) => {
    setCvData((prev: any) => {
      const list = [...(prev.kinh_nghiem || [])];
      const bullets = [...(list[idx].mo_ta || []), "Nội dung đóng góp."];
      list[idx] = { ...list[idx], mo_ta: bullets };
      return { ...prev, kinh_nghiem: list };
    });
  };

  const deleteExpBullet = (idx: number, bIdx: number) => {
    setCvData((prev: any) => {
      const list = [...(prev.kinh_nghiem || [])];
      const bullets = (list[idx].mo_ta || []).filter((_: any, i: number) => i !== bIdx);
      list[idx] = { ...list[idx], mo_ta: bullets };
      return { ...prev, kinh_nghiem: list };
    });
  };

  const addKinhNghiem = () => {
    setCvData((prev: any) => ({
      ...prev,
      kinh_nghiem: [
        ...(prev.kinh_nghiem || []),
        { vi_tri: "Vị trí", to_chuc: "Công ty", thoi_gian: "Thời gian", mo_ta: ["Mô tả công việc."] }
      ]
    }));
  };

  const deleteKinhNghiem = (idx: number) => {
    setCvData((prev: any) => ({
      ...prev,
      kinh_nghiem: (prev.kinh_nghiem || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateHoatDong = (idx: number, key: string, value: any) => {
    setCvData((prev: any) => {
      const list = [...(prev.hoat_dong || [])];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, hoat_dong: list };
    });
  };

  const updateActBullet = (idx: number, bIdx: number, value: string) => {
    setCvData((prev: any) => {
      const list = [...(prev.hoat_dong || [])];
      const bullets = [...(list[idx].mo_ta || [])];
      bullets[bIdx] = value;
      list[idx] = { ...list[idx], mo_ta: bullets };
      return { ...prev, hoat_dong: list };
    });
  };

  const addActBullet = (idx: number) => {
    setCvData((prev: any) => {
      const list = [...(prev.hoat_dong || [])];
      const bullets = [...(list[idx].mo_ta || []), "Mô tả hoạt động."];
      list[idx] = { ...list[idx], mo_ta: bullets };
      return { ...prev, hoat_dong: list };
    });
  };

  const deleteActBullet = (idx: number, bIdx: number) => {
    setCvData((prev: any) => {
      const list = [...(prev.hoat_dong || [])];
      const bullets = (list[idx].mo_ta || []).filter((_: any, i: number) => i !== bIdx);
      list[idx] = { ...list[idx], mo_ta: bullets };
      return { ...prev, hoat_dong: list };
    });
  };

  const addHoatDong = () => {
    setCvData((prev: any) => ({
      ...prev,
      hoat_dong: [
        ...(prev.hoat_dong || []),
        { ten: "Tên hoạt động", vai_tro: "Vai trò", thoi_gian: "Thời gian", mo_ta: ["Mô tả đóng góp."] }
      ]
    }));
  };

  const deleteHoatDong = (idx: number) => {
    setCvData((prev: any) => ({
      ...prev,
      hoat_dong: (prev.hoat_dong || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateKyNang = (idx: number, key: string, value: string) => {
    setCvData((prev: any) => {
      const list = [...(prev.ky_nang || [])];
      list[idx] = { ...list[idx], [key]: value };
      return { ...prev, ky_nang: list };
    });
  };

  const addKyNang = () => {
    setCvData((prev: any) => ({
      ...prev,
      ky_nang: [
        ...(prev.ky_nang || []),
        { nhom: "Nhóm kỹ năng", noi_dung: "Chi tiết kỹ năng" }
      ]
    }));
  };

  const deleteKyNang = (idx: number) => {
    setCvData((prev: any) => ({
      ...prev,
      ky_nang: (prev.ky_nang || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const updateChungChi = (idx: number, value: string) => {
    setCvData((prev: any) => {
      const list = [...(prev.chung_chi || [])];
      list[idx] = value;
      return { ...prev, chung_chi: list };
    });
  };

  const addChungChi = () => {
    setCvData((prev: any) => ({
      ...prev,
      chung_chi: [...(prev.chung_chi || []), "Chứng chỉ chuyên môn"]
    }));
  };

  const deleteChungChi = (idx: number) => {
    setCvData((prev: any) => ({
      ...prev,
      chung_chi: (prev.chung_chi || []).filter((_: any, i: number) => i !== idx)
    }));
  };

  const handleExportPdf = async () => {
    setExporting(true);
    const htmlContent = generateCvHtml(cvData);
    try {
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false
      });
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: `Tải xuống CV của ${cvData.ho_ten || "sinh viên"}`,
        UTI: "com.adobe.pdf"
      });
    } catch (err) {
      console.warn("Lỗi in ấn hoặc chia sẻ file PDF", err);
      alert("Không thể tạo file PDF. Vui lòng kiểm tra lại quyền.");
    } finally {
      setExporting(false);
    }
  };

  return (
    <SafeAreaView className="min-h-screen flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader
        right={
          <Pressable
            accessibilityRole="button"
            className="min-h-10 flex-row items-center gap-2 rounded-full border px-3"
            onPress={() => navigation.navigate("QuickCvResult")}
            style={({ pressed }) => [{
              backgroundColor: colors.surface,
              borderColor: colors.border,
              borderWidth: 0.85,
              opacity: pressed ? 0.9 : 1,
              transform: [{ scale: pressed ? 0.97 : 1 }]
            }]}
          >
            <ArrowLeft color={colors.accent} size={16} strokeWidth={2.5} />
            <Text className="text-xs font-semibold" style={{ color: colors.accent }}>Kết quả</Text>
          </Pressable>
        }
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 32, paddingTop: 10 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View className="gap-4 px-4 pt-2" style={{ width: contentWidth + 32 }}>
          {/* Intro Card */}
          <View className="rounded-[30px] border p-5 gap-1.5" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <View className="h-10 w-10 items-center justify-center rounded-2xl bg-blue-100 dark:bg-blue-900 mb-2">
              <FileText color={colors.accent} size={20} />
            </View>
            <Text className="text-2xl font-black leading-7 tracking-tight" style={{ color: colors.textPrimary }}>
              Trình sửa CV di động
            </Text>
            <Text className="text-xs leading-4" style={{ color: colors.textSecondary }}>
              Bấm trực tiếp vào từng mục để điền thông tin thật của bạn, sau đó ấn Tải PDF để lưu CV.
            </Text>
          </View>

          {/* Section 1: Basic Info & Contact */}
          <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-[58px] flex-row items-center justify-between px-4 py-2"
              onPress={() => toggleSection("co_ban")}
              style={{ backgroundColor: expandedSection === "co_ban" ? colors.surfaceSoft : "transparent" }}
            >
              <View className="flex-row items-center gap-3">
                <Users color={colors.accent} size={18} strokeWidth={2.3} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Thông tin liên hệ</Text>
              </View>
              {expandedSection === "co_ban" ? <ChevronDown color={colors.textSecondary} size={18} /> : <ChevronRight color={colors.textSecondary} size={18} />}
            </Pressable>

            {expandedSection === "co_ban" && (
              <View className="p-4 border-t gap-1" style={{ borderColor: colors.border }}>
                <CvTextInput
                  label="Họ và tên"
                  onChange={(text) => setCvData((p: any) => ({ ...p, ho_ten: text }))}
                  value={cvData.ho_ten}
                />
                <CvTextInput
                  label="Vị trí ứng tuyển"
                  onChange={(text) => setCvData((p: any) => ({ ...p, chuc_danh: text }))}
                  value={cvData.chuc_danh}
                />
                <CvTextInput
                  label="Số điện thoại"
                  onChange={(text) => updateLienHe("dien_thoai", text)}
                  value={cvData.lien_he?.dien_thoai}
                />
                <CvTextInput
                  label="Email liên lạc"
                  onChange={(text) => updateLienHe("email", text)}
                  value={cvData.lien_he?.email}
                />
                <CvTextInput
                  label="Địa chỉ sinh sống"
                  onChange={(text) => updateLienHe("dia_chi", text)}
                  value={cvData.lien_he?.dia_chi}
                />
                <CvTextInput
                  label="Đường dẫn (LinkedIn / Portfolio)"
                  onChange={(text) => updateLienHe("link", text)}
                  value={cvData.lien_he?.link}
                />
              </View>
            )}
          </View>

          {/* Section 2: Career Objective */}
          <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-[58px] flex-row items-center justify-between px-4 py-2"
              onPress={() => toggleSection("muc_tieu")}
              style={{ backgroundColor: expandedSection === "muc_tieu" ? colors.surfaceSoft : "transparent" }}
            >
              <View className="flex-row items-center gap-3">
                <Sparkles color={colors.accent} size={18} strokeWidth={2.3} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Mục tiêu nghề nghiệp</Text>
              </View>
              {expandedSection === "muc_tieu" ? <ChevronDown color={colors.textSecondary} size={18} /> : <ChevronRight color={colors.textSecondary} size={18} />}
            </Pressable>

            {expandedSection === "muc_tieu" && (
              <View className="p-4 border-t" style={{ borderColor: colors.border }}>
                <CvTextInput
                  multiline
                  numberOfLines={4}
                  onChange={(text) => setCvData((p: any) => ({ ...p, muc_tieu: text }))}
                  value={cvData.muc_tieu}
                />
              </View>
            )}
          </View>

          {/* Section 3: Education */}
          <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-[58px] flex-row items-center justify-between px-4 py-2"
              onPress={() => toggleSection("hoc_van")}
              style={{ backgroundColor: expandedSection === "hoc_van" ? colors.surfaceSoft : "transparent" }}
            >
              <View className="flex-row items-center gap-3">
                <GraduationCap color={colors.accent} size={18} strokeWidth={2.3} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Học vấn</Text>
              </View>
              {expandedSection === "hoc_van" ? <ChevronDown color={colors.textSecondary} size={18} /> : <ChevronRight color={colors.textSecondary} size={18} />}
            </Pressable>

            {expandedSection === "hoc_van" && (
              <View className="p-4 border-t gap-4" style={{ borderColor: colors.border }}>
                {(cvData.hoc_van || []).map((item: any, idx: number) => (
                  <View key={idx} className="border-b pb-3 mb-2 gap-1.5" style={{ borderColor: colors.border }}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-black" style={{ color: colors.accent }}>Hạng mục {idx + 1}</Text>
                      <Pressable accessibilityRole="button" onPress={() => deleteHocVan(idx)}>
                        <Trash2 color={colors.danger} size={16} />
                      </Pressable>
                    </View>

                    <CvTextInput
                      label="Trường học"
                      onChange={(text) => updateHocVan(idx, "truong", text)}
                      value={item.truong}
                    />

                    <CvTextInput
                      label="Chuyên ngành"
                      onChange={(text) => updateHocVan(idx, "nganh", text)}
                      value={item.nganh}
                    />

                    <View className="flex-row gap-3">
                      <View className="flex-1">
                        <CvTextInput
                          label="Thời gian"
                          onChange={(text) => updateHocVan(idx, "thoi_gian", text)}
                          placeholder="2022 - 2026"
                          value={item.thoi_gian}
                        />
                      </View>
                      <View className="flex-1">
                        <CvTextInput
                          label="Xếp loại/GPA"
                          onChange={(text) => updateHocVan(idx, "ket_qua", text)}
                          placeholder="GPA: 3.2"
                          value={item.ket_qua}
                        />
                      </View>
                    </View>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  className="min-h-[42px] flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed"
                  onPress={addHocVan}
                  style={({ pressed }) => [{
                    borderColor: colors.accent,
                    backgroundColor: colors.surfaceSoft,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }]}
                >
                  <Plus color={colors.accent} size={15} strokeWidth={2.5} />
                  <Text className="text-xs font-bold" style={{ color: colors.accent }}>Thêm trường học</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Section 4: Work Experience */}
          <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-[58px] flex-row items-center justify-between px-4 py-2"
              onPress={() => toggleSection("kinh_nghiem")}
              style={{ backgroundColor: expandedSection === "kinh_nghiem" ? colors.surfaceSoft : "transparent" }}
            >
              <View className="flex-row items-center gap-3">
                <Briefcase color={colors.accent} size={18} strokeWidth={2.3} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Kinh nghiệm làm việc</Text>
              </View>
              {expandedSection === "kinh_nghiem" ? <ChevronDown color={colors.textSecondary} size={18} /> : <ChevronRight color={colors.textSecondary} size={18} />}
            </Pressable>

            {expandedSection === "kinh_nghiem" && (
              <View className="p-4 border-t gap-5" style={{ borderColor: colors.border }}>
                {(cvData.kinh_nghiem || []).map((item: any, idx: number) => (
                  <View key={idx} className="border-b pb-4 mb-3 gap-1.5" style={{ borderColor: colors.border }}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-black" style={{ color: colors.accent }}>Công việc {idx + 1}</Text>
                      <Pressable accessibilityRole="button" onPress={() => deleteKinhNghiem(idx)}>
                        <Trash2 color={colors.danger} size={16} />
                      </Pressable>
                    </View>

                    <CvTextInput
                      label="Vị trí / Chức danh"
                      onChange={(text) => updateKinhNghiem(idx, "vi_tri", text)}
                      value={item.vi_tri}
                    />

                    <CvTextInput
                      label="Tổ chức / Công ty"
                      onChange={(text) => updateKinhNghiem(idx, "to_chuc", text)}
                      value={item.to_chuc}
                    />

                    <CvTextInput
                      label="Thời gian làm việc"
                      onChange={(text) => updateKinhNghiem(idx, "thoi_gian", text)}
                      placeholder="2025 - Hiện tại"
                      value={item.thoi_gian}
                    />

                    {/* Bullets List */}
                    <View className="gap-1 mt-1">
                      <Text className="text-[10px] font-bold ml-1 mb-1" style={{ color: colors.textSecondary }}>Mô tả công việc & Đóng góp</Text>
                      {(item.mo_ta || []).map((bullet: string, bIdx: number) => (
                        <View key={bIdx} className="flex-row items-center gap-2">
                          <View className="flex-1">
                            <CvTextInput
                              onChange={(text) => updateExpBullet(idx, bIdx, text)}
                              value={bullet}
                            />
                          </View>
                          <Pressable accessibilityRole="button" className="p-1 mb-3" onPress={() => deleteExpBullet(idx, bIdx)}>
                            <Trash2 color={colors.danger} size={15} />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable
                        accessibilityRole="button"
                        className="flex-row items-center gap-1 mt-1 self-start py-1 px-3 rounded-lg"
                        onPress={() => addExpBullet(idx)}
                        style={{ backgroundColor: colors.accentSoft }}
                      >
                        <Plus color={colors.accent} size={12} strokeWidth={2.5} />
                        <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>Thêm dòng mô tả</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  className="min-h-[42px] flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed"
                  onPress={addKinhNghiem}
                  style={({ pressed }) => [{
                    borderColor: colors.accent,
                    backgroundColor: colors.surfaceSoft,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }]}
                >
                  <Plus color={colors.accent} size={15} strokeWidth={2.5} />
                  <Text className="text-xs font-bold" style={{ color: colors.accent }}>Thêm công việc</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Section 5: Activities & Projects */}
          <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-[58px] flex-row items-center justify-between px-4 py-2"
              onPress={() => toggleSection("hoat_dong")}
              style={{ backgroundColor: expandedSection === "hoat_dong" ? colors.surfaceSoft : "transparent" }}
            >
              <View className="flex-row items-center gap-3">
                <Users color={colors.accent} size={18} strokeWidth={2.3} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Hoạt động & Dự án</Text>
              </View>
              {expandedSection === "hoat_dong" ? <ChevronDown color={colors.textSecondary} size={18} /> : <ChevronRight color={colors.textSecondary} size={18} />}
            </Pressable>

            {expandedSection === "hoat_dong" && (
              <View className="p-4 border-t gap-5" style={{ borderColor: colors.border }}>
                {(cvData.hoat_dong || []).map((item: any, idx: number) => (
                  <View key={idx} className="border-b pb-4 mb-3 gap-1.5" style={{ borderColor: colors.border }}>
                    <View className="flex-row items-center justify-between mb-1">
                      <Text className="text-xs font-black" style={{ color: colors.accent }}>Hoạt động {idx + 1}</Text>
                      <Pressable accessibilityRole="button" onPress={() => deleteHoatDong(idx)}>
                        <Trash2 color={colors.danger} size={16} />
                      </Pressable>
                    </View>

                    <CvTextInput
                      label="Tên hoạt động/Dự án"
                      onChange={(text) => updateHoatDong(idx, "ten", text)}
                      value={item.ten}
                    />

                    <CvTextInput
                      label="Vai trò"
                      onChange={(text) => updateHoatDong(idx, "vai_tro", text)}
                      value={item.vai_role}
                    />

                    <CvTextInput
                      label="Thời gian"
                      onChange={(text) => updateHoatDong(idx, "thoi_gian", text)}
                      placeholder="2023 - 2024"
                      value={item.thoi_gian}
                    />

                    {/* Bullets List */}
                    <View className="gap-1 mt-1">
                      <Text className="text-[10px] font-bold ml-1 mb-1" style={{ color: colors.textSecondary }}>Đóng góp & Kết quả nổi bật</Text>
                      {(item.mo_ta || []).map((bullet: string, bIdx: number) => (
                        <View key={bIdx} className="flex-row items-center gap-2">
                          <View className="flex-1">
                            <CvTextInput
                              onChange={(text) => updateActBullet(idx, bIdx, text)}
                              value={bullet}
                            />
                          </View>
                          <Pressable accessibilityRole="button" className="p-1 mb-3" onPress={() => deleteActBullet(idx, bIdx)}>
                            <Trash2 color={colors.danger} size={15} />
                          </Pressable>
                        </View>
                      ))}
                      <Pressable
                        accessibilityRole="button"
                        className="flex-row items-center gap-1 mt-1 self-start py-1 px-3 rounded-lg"
                        onPress={() => addActBullet(idx)}
                        style={{ backgroundColor: colors.accentSoft }}
                      >
                        <Plus color={colors.accent} size={12} strokeWidth={2.5} />
                        <Text className="text-[10px] font-bold" style={{ color: colors.accent }}>Thêm dòng mô tả</Text>
                      </Pressable>
                    </View>
                  </View>
                ))}

                <Pressable
                  accessibilityRole="button"
                  className="min-h-[42px] flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed"
                  onPress={addHoatDong}
                  style={({ pressed }) => [{
                    borderColor: colors.accent,
                    backgroundColor: colors.surfaceSoft,
                    opacity: pressed ? 0.8 : 1,
                    transform: [{ scale: pressed ? 0.98 : 1 }]
                  }]}
                >
                  <Plus color={colors.accent} size={15} strokeWidth={2.5} />
                  <Text className="text-xs font-bold" style={{ color: colors.accent }}>Thêm hoạt động</Text>
                </Pressable>
              </View>
            )}
          </View>

          {/* Section 6: Skills & Certifications */}
          <View className="overflow-hidden rounded-3xl border" style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 0.85 }, surfaceShadowStyle]}>
            <Pressable
              accessibilityRole="button"
              className="min-h-[58px] flex-row items-center justify-between px-4 py-2"
              onPress={() => toggleSection("ky_nang")}
              style={{ backgroundColor: expandedSection === "ky_nang" ? colors.surfaceSoft : "transparent" }}
            >
              <View className="flex-row items-center gap-3">
                <ListPlus color={colors.accent} size={18} strokeWidth={2.3} />
                <Text className="text-sm font-black" style={{ color: colors.textPrimary }}>Kỹ năng & Chứng chỉ</Text>
              </View>
              {expandedSection === "ky_nang" ? <ChevronDown color={colors.textSecondary} size={18} /> : <ChevronRight color={colors.textSecondary} size={18} />}
            </Pressable>

            {expandedSection === "ky_nang" && (
              <View className="p-4 border-t gap-5" style={{ borderColor: colors.border }}>
                {/* Skills */}
                <View className="gap-2">
                  <Text className="text-xs font-black mb-2 ml-1" style={{ color: colors.accent }}>Nhóm kỹ năng chuyên môn</Text>
                  {(cvData.ky_nang || []).map((item: any, idx: number) => (
                    <View key={idx} className="gap-1.5 border border-dashed p-3 rounded-2xl mb-2.5" style={{ borderColor: colors.border, borderWidth: 0.85 }}>
                      <View className="flex-row items-center justify-between mb-1">
                        <Text className="text-[10px] font-black" style={{ color: colors.textSecondary }}>Nhóm {idx + 1}</Text>
                        <Pressable accessibilityRole="button" onPress={() => deleteKyNang(idx)}>
                          <Trash2 color={colors.danger} size={14} />
                        </Pressable>
                      </View>
                      <CvTextInput
                        placeholder="Ví dụ: Chuyên môn / Công cụ"
                        onChange={(text) => updateKyNang(idx, "nhom", text)}
                        value={item.nhom}
                      />
                      <CvTextInput
                        multiline
                        placeholder="react native, nodejs, sql..."
                        onChange={(text) => updateKyNang(idx, "noi_dung", text)}
                        value={item.noi_dung}
                      />
                    </View>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[38px] flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed"
                    onPress={addKyNang}
                    style={({ pressed }) => [{
                      borderColor: colors.accent,
                      backgroundColor: colors.surfaceSoft,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }]}
                  >
                    <Plus color={colors.accent} size={14} strokeWidth={2.5} />
                    <Text className="text-[11px] font-bold" style={{ color: colors.accent }}>Thêm nhóm kỹ năng</Text>
                  </Pressable>
                </View>

                {/* Certifications */}
                <View className="gap-2 border-t pt-4" style={{ borderColor: colors.border }}>
                  <Text className="text-xs font-black mb-1 ml-1" style={{ color: colors.accent }}>Chứng chỉ</Text>
                  {(cvData.chung_chi || []).map((cert: string, idx: number) => (
                    <View key={idx} className="flex-row items-center gap-2">
                      <View className="flex-1">
                        <CvTextInput
                          onChange={(text) => updateChungChi(idx, text)}
                          value={cert}
                        />
                      </View>
                      <Pressable accessibilityRole="button" className="p-1 mb-3" onPress={() => deleteChungChi(idx)}>
                        <Trash2 color={colors.danger} size={15} />
                      </Pressable>
                    </View>
                  ))}
                  <Pressable
                    accessibilityRole="button"
                    className="min-h-[38px] flex-row items-center justify-center gap-1.5 rounded-xl border border-dashed mt-1"
                    onPress={addChungChi}
                    style={({ pressed }) => [{
                      borderColor: colors.accent,
                      backgroundColor: colors.surfaceSoft,
                      opacity: pressed ? 0.8 : 1,
                      transform: [{ scale: pressed ? 0.98 : 1 }]
                    }]}
                  >
                    <Plus color={colors.accent} size={14} strokeWidth={2.5} />
                    <Text className="text-[11px] font-bold" style={{ color: colors.accent }}>Thêm chứng chỉ</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </View>

          {/* Export & Print PDF Button */}
          <Pressable
            accessibilityRole="button"
            className="min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl shadow"
            disabled={exporting}
            onPress={handleExportPdf}
            style={({ pressed }) => [{
              backgroundColor: colors.accent,
              opacity: exporting ? 0.75 : (pressed ? 0.9 : 1),
              transform: [{ scale: pressed ? 0.98 : 1 }]
            }]}
          >
            {exporting ? (
              <ActivityIndicator color="#111827" size="small" />
            ) : (
              <Printer color="#111827" size={18} strokeWidth={2.5} />
            )}
            <Text className="text-sm font-black text-black">
              {exporting ? "Đang tạo file PDF..." : "Tải bản CV đẹp (PDF)"}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
