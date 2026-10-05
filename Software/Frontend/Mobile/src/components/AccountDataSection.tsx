import { useCallback, useEffect, useMemo, useState } from "react";
import { Image, Platform, Pressable, Text, TextInput, View, type ViewStyle } from "react-native";
import { FilePenLine, History, Plus, Save, ScrollText, X } from "lucide-react-native";

import { AppButton, EmptyState, MutedText } from "./Primitives";
import { getAuthToken } from "../services/auth";
import {
  createFirestoreJDTemplate,
  fetchFirestoreFilterHistory,
  fetchFirestoreJDTemplates,
  updateFirestoreJDTemplate
} from "../services/firebaseStore";
import {
  createRenderJDTemplate,
  extractRecentUsedJDTemplates,
  fetchRenderHistoryEntries,
  fetchRenderJDTemplates,
  historyEntriesToFilterSessions,
  mergeSavedAndHistoryTemplates,
  updateRenderJDTemplate
} from "../services/renderStore";
import { localCacheKeys, readLocalCache, writeLocalCache } from "../services/localDataCache";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";
import type { ThemeColors } from "../theme/colors";
import type { FilterHistorySession, JDTemplateInput, UserJDTemplate } from "../types";

type DataTab = "history" | "templates";

interface AccountDataCache {
  history: FilterHistorySession[];
  templates: UserJDTemplate[];
}

const RENDER_WARM_ACCOUNT_TIMEOUT_MS = 12000;
const RENDER_COLD_ACCOUNT_TIMEOUT_MS = 90000;

const emptyTemplateForm: JDTemplateInput = {
  name: "",
  category: "",
  jobPosition: "",
  jdText: "",
  hardFilters: {}
};

function formatDate(timestamp: number) {
  if (!timestamp) return "Chưa rõ";
  return new Date(timestamp).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function flatCardStyle(colors: ThemeColors, isDark: boolean): ViewStyle {
  if (isDark) {
    return {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderWidth: 1
    };
  }

  if (Platform.OS === "web") {
    return {
      backgroundColor: "#FFFFFF",
      borderWidth: 0,
      boxShadow: "0 4px 12px rgba(0,0,0,0.03)"
    } as ViewStyle;
  }

  return {
    backgroundColor: "#FFFFFF",
    borderWidth: 0,
    elevation: 1,
    shadowColor: "#000000",
    shadowOffset: { height: 4, width: 0 },
    shadowOpacity: 0.03,
    shadowRadius: 12
  };
}

function ScoreChip({ label, score }: { label: string; score: string }) {
  const { colors, isDark } = useAppTheme();

  return (
    <View className="rounded-lg px-2.5 py-1.5" style={{ backgroundColor: isDark ? colors.metricPill : "#F3F4F6" }}>
      <Text className="text-[11px] font-medium" numberOfLines={1} style={{ color: isDark ? colors.textSecondary : "#4B5563" }}>
        {label}: <Text style={{ color: colors.accent, fontWeight: "700" }}>{score || "-"}</Text>
      </Text>
    </View>
  );
}

function CandidateScoreAvatar({ name, uri }: { name: string; uri?: string }) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri && !failed);
  const initials = name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(-2)
    .join("")
    .toUpperCase() || "UV";

  return (
    <View
      className="h-10 w-10 overflow-hidden rounded-full border"
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
          <Text className="text-xs font-black" style={{ color: colors.accent }}>
            {initials}
          </Text>
        </View>
      )}
    </View>
  );
}

function HistoryRow({ session }: { session: FilterHistorySession }) {
  const { colors, isDark } = useAppTheme();
  const cardStyle = flatCardStyle(colors, isDark);

  return (
    <View className="mb-7">
      <View className="mb-4">
        <Text className="text-[17px] font-semibold leading-6" numberOfLines={1} style={{ color: colors.textPrimary }}>
          {session.jobPosition}
        </Text>
        <MutedText className="mt-1 text-[13px]">
          {formatDate(session.timestamp)} · {session.totalCandidates} hồ sơ
        </MutedText>
      </View>

      <View className="gap-3">
        {session.candidates.slice(0, 4).map((candidate) => (
          <View
            className="rounded-2xl p-4"
            key={candidate.id}
            style={cardStyle}
          >
            <View className="flex-row items-start justify-between gap-3">
              <CandidateScoreAvatar name={candidate.candidateName} uri={candidate.avatarUrl} />
              <View className="min-w-0 flex-1">
                <Text className="text-[16px] font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
                  {candidate.candidateName}
                </Text>
                <Text className="mt-1 text-xs font-medium" style={{ color: colors.textSecondary }}>Hạng {candidate.rank}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xl font-semibold" style={{ color: colors.accent }}>{Math.round(candidate.totalScore)}</Text>
                <Text className="text-[10px] font-medium" style={{ color: colors.textSecondary }}>Tổng</Text>
              </View>
            </View>
            {candidate.componentScores.length > 0 ? (
              <View className="mt-3 flex-row flex-wrap gap-2">
                {candidate.componentScores.map((item) => (
                  <ScoreChip key={`${candidate.id}-${item.label}`} label={item.label} score={item.score} />
                ))}
              </View>
            ) : null}
          </View>
        ))}
      </View>
    </View>
  );
}

function TemplateCard({
  template,
  onEdit
}: {
  template: UserJDTemplate;
  onEdit: (template: UserJDTemplate) => void;
}) {
  const { colors, isDark } = useAppTheme();
  const originLabel = template.origin === "history" ? "Từ lịch sử" : "Đã lưu";
  const cardStyle = flatCardStyle(colors, isDark);

  return (
    <View className="mb-4 rounded-2xl p-4" style={cardStyle}>
      <View className="flex-row items-start justify-between gap-3">
        <View className="min-w-0 flex-1">
          <Text className="text-base font-semibold leading-5" numberOfLines={1} style={{ color: colors.textPrimary }}>
            {template.name || template.jobPosition || "Mẫu JD"}
          </Text>
          <Text className="mt-0.5 text-xs leading-4" numberOfLines={1} style={{ color: colors.textSecondary }}>
            {template.jobPosition || "Vị trí chưa đặt"} · {template.category || "Chưa phân loại"}
          </Text>
        </View>
        <View className="items-end gap-2">
          <View className="rounded-lg px-2.5 py-1" style={{ backgroundColor: colors.accentSoft }}>
            <Text className="text-[10px] font-semibold" style={{ color: colors.accent }}>{originLabel}</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            className="h-11 w-11 items-center justify-center rounded-xl active:scale-95"
            onPress={() => onEdit(template)}
            style={{ backgroundColor: colors.accentSoft }}
          >
            <FilePenLine color={colors.accent} size={17} />
          </Pressable>
        </View>
      </View>
      <Text className="mt-3 text-xs leading-5" numberOfLines={3} style={{ color: colors.textPrimary }}>
        {template.jdText || "Chưa có nội dung JD."}
      </Text>
    </View>
  );
}

export function AccountDataSection({
  compact = false,
  initialTab = "history"
}: {
  compact?: boolean;
  defaultOpen?: boolean;
  initialTab?: DataTab;
}) {
  const { colors, isDark } = useAppTheme();
  const authUser = useRecruiterStore((state) => state.authUser);
  const syncedHistory = useRecruiterStore((state) => state.history);
  const [activeTab, setActiveTab] = useState<DataTab>(initialTab);
  const [history, setHistory] = useState<FilterHistorySession[]>([]);
  const [templates, setTemplates] = useState<UserJDTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<UserJDTemplate | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<JDTemplateInput>(emptyTemplateForm);

  const selectedHistory = useMemo(() => history.slice(0, 2), [history]);
  const selectedTemplates = useMemo(() => templates.slice(0, 3), [templates]);

  const loadData = useCallback(async () => {
    if (!authUser) return;
    const cacheKey = localCacheKeys.accountData(authUser.email || authUser.uid);
    const cached = await readLocalCache<AccountDataCache>(cacheKey);
    let cachedHistory: FilterHistorySession[] = [];
    let cachedTemplates: UserJDTemplate[] = [];
    const warmHistory = historyEntriesToFilterSessions(syncedHistory).slice(0, 10);
    const warmTemplates = extractRecentUsedJDTemplates(syncedHistory);

    if (cached) {
      cachedHistory = cached.history;
      cachedTemplates = cached.templates;
      setHistory(cachedHistory);
      setTemplates(cachedTemplates);
    } else if (warmHistory.length > 0 || warmTemplates.length > 0) {
      setHistory(warmHistory);
      setTemplates(warmTemplates);
    }

    setLoading(!cached && warmHistory.length === 0 && warmTemplates.length === 0);
    setError(null);
    try {
      const token = await getAuthToken();
      if (!token) throw new Error("Không có token đăng nhập.");

      const cachedHistoryTemplates = cachedTemplates.filter((template) => template.origin === "history");
      const renderTimeoutMs = cached || warmHistory.length > 0 || warmTemplates.length > 0
        ? RENDER_WARM_ACCOUNT_TIMEOUT_MS
        : RENDER_COLD_ACCOUNT_TIMEOUT_MS;
      const [savedTemplatesResult, historyEntriesResult] = await Promise.allSettled([
        fetchRenderJDTemplates(token, false, { timeoutMs: renderTimeoutMs }),
        fetchRenderHistoryEntries(token, 12, authUser.email, {
          includeManual: false,
          timeoutMs: renderTimeoutMs
        })
      ]);

      if (savedTemplatesResult.status === "rejected" && historyEntriesResult.status === "rejected") {
        throw savedTemplatesResult.reason;
      }

      const savedTemplates = savedTemplatesResult.status === "fulfilled" ? savedTemplatesResult.value : [];
      const historyEntries = historyEntriesResult.status === "fulfilled" ? historyEntriesResult.value : [];
      const nextHistory =
        historyEntriesResult.status === "fulfilled"
          ? historyEntriesToFilterSessions(historyEntries).slice(0, 10)
          : cachedHistory.length > 0
            ? cachedHistory
            : warmHistory;
      const nextTemplates = mergeSavedAndHistoryTemplates(
        savedTemplates,
        historyEntriesResult.status === "fulfilled" ? extractRecentUsedJDTemplates(historyEntries) : cachedHistoryTemplates
      );

      setHistory(nextHistory);
      setTemplates(nextTemplates);
      setLoading(false);
      await writeLocalCache(cacheKey, { history: nextHistory, templates: nextTemplates });
    } catch (renderError) {
      try {
        const [fallbackTemplatesResult, fallbackHistoryResult] = await Promise.allSettled([
          fetchFirestoreJDTemplates(),
          fetchFirestoreFilterHistory(10)
        ]);

        if (fallbackTemplatesResult.status === "rejected" && fallbackHistoryResult.status === "rejected") {
          throw fallbackTemplatesResult.reason;
        }

        const fallbackTemplates = fallbackTemplatesResult.status === "fulfilled" ? fallbackTemplatesResult.value : [];
        const fallbackHistory = fallbackHistoryResult.status === "fulfilled" ? fallbackHistoryResult.value : [];
        const nextTemplates = fallbackTemplates.map((template) => ({ ...template, origin: "saved" as const }));
        setHistory(fallbackHistory);
        setTemplates(nextTemplates);
        await writeLocalCache(cacheKey, { history: fallbackHistory, templates: nextTemplates });
      } catch (fallbackError) {
        const renderMessage = renderError instanceof Error ? renderError.message : "";
        const fallbackMessage = fallbackError instanceof Error ? fallbackError.message : "";
        setError(
          renderMessage ||
            fallbackMessage ||
            "Không thể tải lịch sử và mẫu JD từ dữ liệu Firebase/Render thật."
        );
      }
    } finally {
      setLoading(false);
    }
  }, [authUser, syncedHistory]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  if (!authUser) return null;

  const startCreate = () => {
    setEditingTemplate(null);
    setForm(emptyTemplateForm);
    setFormOpen(true);
    setActiveTab("templates");
  };

  const startEdit = (template: UserJDTemplate) => {
    setEditingTemplate(template);
    setForm({
      name: template.name,
      category: template.category,
      jobPosition: template.jobPosition,
      jdText: template.jdText,
      hardFilters: template.hardFilters || {}
    });
    setFormOpen(true);
    setActiveTab("templates");
  };

  const reloadTemplatesAfterSave = async (token: string | null) => {
    if (!token) {
      const nextTemplates = (await fetchFirestoreJDTemplates()).map((template) => ({ ...template, origin: "saved" as const }));
      setTemplates(nextTemplates);
      await writeLocalCache(localCacheKeys.accountData(authUser.email || authUser.uid), { history, templates: nextTemplates });
      return;
    }
    const [historyEntries, savedTemplates] = await Promise.all([
      fetchRenderHistoryEntries(token, 50, authUser.email),
      fetchRenderJDTemplates(token, true)
    ]);
    const nextHistory = historyEntriesToFilterSessions(historyEntries).slice(0, 10);
    const nextTemplates = mergeSavedAndHistoryTemplates(savedTemplates, extractRecentUsedJDTemplates(historyEntries));
    setHistory(nextHistory);
    setTemplates(nextTemplates);
    await writeLocalCache(localCacheKeys.accountData(authUser.email || authUser.uid), {
      history: nextHistory,
      templates: nextTemplates
    });
  };

  const saveTemplate = async () => {
    if (!form.name.trim() || !form.jobPosition.trim() || !form.jdText.trim()) {
      setError("Cần nhập tên mẫu, vị trí và nội dung JD.");
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const token = await getAuthToken();
      if (token) {
        if (editingTemplate?.origin === "saved") {
          await updateRenderJDTemplate(token, editingTemplate.id, form);
        } else {
          await createRenderJDTemplate(token, form);
        }
        await reloadTemplatesAfterSave(token);
      } else if (editingTemplate?.origin === "saved") {
        await updateFirestoreJDTemplate(editingTemplate.id, form);
        await reloadTemplatesAfterSave(null);
      } else {
        await createFirestoreJDTemplate(form);
        await reloadTemplatesAfterSave(null);
      }

      setFormOpen(false);
      setEditingTemplate(null);
      setForm(emptyTemplateForm);
    } catch (saveError) {
      try {
        if (editingTemplate?.origin === "saved") {
          await updateFirestoreJDTemplate(editingTemplate.id, form);
        } else {
          await createFirestoreJDTemplate(form);
        }
        await reloadTemplatesAfterSave(null);
        setFormOpen(false);
        setEditingTemplate(null);
        setForm(emptyTemplateForm);
      } catch {
        setError(saveError instanceof Error ? saveError.message : "Không thể lưu mẫu JD.");
      }
    } finally {
      setSaving(false);
    }
  };

  const formCardStyle = flatCardStyle(colors, isDark);

  return (
    <View className={compact ? "mt-4 w-full" : "mt-1 w-full"}>
        <View className={compact ? "mb-3 min-h-[48px] justify-center" : "mb-4 min-h-[54px] justify-center"}>
          <Text className={compact ? "text-[15px] font-semibold leading-5" : "text-[22px] font-semibold leading-7"} style={{ color: colors.textPrimary }}>
            Lịch sử & mẫu JD
          </Text>
          <Text className="mt-1 text-xs leading-4" style={{ color: colors.textSecondary }}>
            {history.length} lịch sử · {templates.length} mẫu
          </Text>
        </View>

        <View>
            <View
              className="mb-4 flex-row overflow-hidden rounded-xl"
              style={{
                backgroundColor: isDark ? colors.surfaceSoft : "#FFFFFF",
                borderColor: isDark ? colors.border : "transparent",
                borderWidth: isDark ? 1 : 0
              }}
            >
              {[
                { key: "history" as const, label: "Lịch sử", icon: History },
                { key: "templates" as const, label: "Mẫu JD", icon: ScrollText }
              ].map((item, index) => {
                const Icon = item.icon;
                const active = activeTab === item.key;
                return (
                  <Pressable
                    className={[
                      "min-h-11 flex-1 flex-row items-center justify-center gap-2",
                      index > 0 ? "border-l" : ""
                    ].join(" ")}
                    key={item.key}
                    onPress={() => setActiveTab(item.key)}
                    style={{ backgroundColor: active ? colors.accent : "transparent", borderColor: isDark ? colors.border : "#F4F6F8" }}
                  >
                    <Icon color={active ? "#111827" : colors.textSecondary} size={16} />
                    <Text className="text-[13px] font-semibold" style={{ color: active ? "#111827" : colors.textSecondary }}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {error ? (
                <View className="mb-3 rounded-xl p-3" style={{ backgroundColor: colors.warningSoft }}>
                <Text className="text-sm leading-5" style={{ color: colors.warning }}>{error}</Text>
              </View>
            ) : null}

            {activeTab === "history" ? (
              loading && selectedHistory.length === 0 ? (
                <View className="rounded-xl p-3" style={{ backgroundColor: colors.surfaceSoft }}>
                  <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Đang tải lịch sử...</Text>
                </View>
              ) : selectedHistory.length > 0 ? (
                selectedHistory.map((session) => <HistoryRow key={session.id} session={session} />)
              ) : (
                <EmptyState
                  action={<AppButton label="Tải lại" onPress={() => void loadData()} />}
                  description="Chưa có phiên lọc CV nào được đồng bộ từ Render API hoặc Firebase."
                  title="Chưa có lịch sử"
                />
              )
            ) : (
              <View>
                <Pressable
                  accessibilityRole="button"
                  className="mb-3 min-h-11 flex-row items-center justify-center gap-2 rounded-xl active:scale-95"
                  onPress={startCreate}
                  style={{ backgroundColor: colors.accent }}
                >
                  <Plus color="#111827" size={17} />
                  <Text className="text-sm font-black text-black">Tạo mẫu</Text>
                </Pressable>

                {formOpen ? (
                  <View className="mb-4 rounded-2xl p-4" style={formCardStyle}>
                    <View className="mb-3 flex-row items-center justify-between">
                      <Text className="text-base font-semibold" style={{ color: colors.textPrimary }}>
                        {editingTemplate ? "Sửa mẫu JD" : "Tạo mẫu JD"}
                      </Text>
                      <Pressable
                        accessibilityRole="button"
                        className="h-11 w-11 items-center justify-center rounded-xl active:scale-95"
                        onPress={() => setFormOpen(false)}
                        style={{ backgroundColor: colors.surface }}
                      >
                        <X color={colors.textSecondary} size={16} />
                      </Pressable>
                    </View>
                    <TextInput
                      className="mb-2 min-h-11 rounded-xl border px-3 text-sm"
                      onChangeText={(value) => setForm((current) => ({ ...current, name: value }))}
                      placeholder="Tên mẫu"
                      placeholderTextColor={colors.textSecondary}
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      value={form.name}
                    />
                    <View className="mb-2 flex-row gap-2">
                      <TextInput
                        className="min-h-11 flex-1 rounded-xl border px-3 text-sm"
                        onChangeText={(value) => setForm((current) => ({ ...current, jobPosition: value }))}
                        placeholder="Vị trí"
                        placeholderTextColor={colors.textSecondary}
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                        value={form.jobPosition}
                      />
                      <TextInput
                        className="min-h-11 flex-1 rounded-xl border px-3 text-sm"
                        onChangeText={(value) => setForm((current) => ({ ...current, category: value }))}
                        placeholder="Nhóm"
                        placeholderTextColor={colors.textSecondary}
                        style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                        value={form.category}
                      />
                    </View>
                    <TextInput
                      className="min-h-[104px] rounded-xl border px-3 py-2 text-sm leading-5"
                      multiline
                      onChangeText={(value) => setForm((current) => ({ ...current, jdText: value }))}
                      placeholder="Nội dung JD"
                      placeholderTextColor={colors.textSecondary}
                      style={{ backgroundColor: colors.surface, borderColor: colors.border, color: colors.textPrimary }}
                      textAlignVertical="top"
                      value={form.jdText}
                    />
                    <AppButton
                      className="mt-3"
                      icon={Save}
                      label={editingTemplate?.origin === "history" ? "Lưu thành mẫu" : editingTemplate ? "Lưu thay đổi" : "Lưu mẫu"}
                      loading={saving}
                      onPress={() => void saveTemplate()}
                    />
                  </View>
                ) : null}

                {loading && selectedTemplates.length === 0 ? (
                  <View className="rounded-xl p-3" style={{ backgroundColor: colors.surfaceSoft }}>
                    <Text className="text-sm font-semibold" style={{ color: colors.textPrimary }}>Đang tải mẫu JD...</Text>
                  </View>
                ) : selectedTemplates.length > 0 ? (
                  selectedTemplates.map((template) => (
                    <TemplateCard key={template.id} onEdit={startEdit} template={template} />
                  ))
                ) : (
                  <EmptyState
                    action={<AppButton label="Tạo mẫu đầu tiên" onPress={startCreate} />}
                    description="Chưa có mẫu JD nào từ dữ liệu Firebase/Render thật."
                    title="Chưa có mẫu JD"
                  />
                )}
              </View>
            )}
        </View>
    </View>
  );
}

