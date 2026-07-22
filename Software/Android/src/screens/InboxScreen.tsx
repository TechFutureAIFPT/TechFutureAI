import { useMemo } from "react";
import { FlatList, Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Check, ChevronDown, Search, SlidersHorizontal } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { RootStackParamList } from "../App";
import { AppHeader, BottomNav } from "../components/AppChrome";
import { CandidateCard } from "../components/CandidateCard";
import { CandidateSkeletonList, LoadingStatusRail } from "../components/Motion";
import { AppButton, EmptyState, MutedText, Panel } from "../components/Primitives";
import { useRecruiterStore } from "../store/useRecruiterStore";
import { useAppTheme } from "../theme/ThemeContext";

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const rankFilters = ["all", "A", "B", "C"] as const;

export function InboxScreen() {
  const navigation = useNavigation<Navigation>();
  const { width } = useWindowDimensions();
  const { colors } = useAppTheme();
  const [rankMenuOpen, setRankMenuOpen] = useState(false);
  const candidates = useRecruiterStore((state) => state.candidates);
  const authUser = useRecruiterStore((state) => state.authUser);
  const loading = useRecruiterStore((state) => state.loading);
  const inboxRefreshing = useRecruiterStore((state) => state.inboxRefreshing);
  const error = useRecruiterStore((state) => state.error);
  const query = useRecruiterStore((state) => state.query);
  const rankFilter = useRecruiterStore((state) => state.rankFilter);
  const setQuery = useRecruiterStore((state) => state.setQuery);
  const setRankFilter = useRecruiterStore((state) => state.setRankFilter);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);

  const contentWidth = Math.min(Math.max(width - 32, 300), 390);
  const visibleError =
    error && !(authUser && candidates.length > 0 && /permission|insufficient/i.test(error)) ? error : null;
  const filteredCandidates = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return candidates.filter((candidate) => {
      const matchesRank = rankFilter === "all" || candidate.rank === rankFilter;
      const text = `${candidate.candidateName} ${candidate.jobTitle} ${candidate.industry}`.toLowerCase();
      return matchesRank && (!normalizedQuery || text.includes(normalizedQuery));
    });
  }, [candidates, query, rankFilter]);

  const rankLabel = rankFilter === "all" ? "Tất cả" : rankFilter;

  return (
    <SafeAreaView className="flex-1" edges={["top"]} style={{ backgroundColor: colors.background }}>
      <AppHeader
        right={
          <View className="h-11 flex-row items-center gap-2">
            <View
              className="h-11 min-w-0 flex-1 flex-row items-center gap-2 rounded-2xl border px-3"
              style={{ backgroundColor: colors.surface, borderColor: colors.border }}
            >
              <Search
                color={colors.textSecondary}
                size={17}
                strokeWidth={2.4}
              />
              <TextInput
                className="min-h-11 min-w-0 flex-1 text-sm font-semibold"
                onChangeText={setQuery}
                placeholder="Tìm ứng viên..."
                placeholderTextColor={colors.textSecondary}
                style={{ color: colors.textPrimary, outlineStyle: "none" } as never}
                value={query}
              />
            </View>

            <View className="relative z-50 w-[84px]">
              <Pressable
                accessibilityLabel="Chọn bộ lọc hạng ứng viên"
                accessibilityRole="button"
                className="min-h-11 flex-row items-center justify-between rounded-2xl border px-2.5 active:opacity-80"
                onPress={() => setRankMenuOpen((current) => !current)}
                style={{ backgroundColor: colors.surface, borderColor: colors.border }}
              >
                <View className="min-w-0 flex-1 flex-row items-center">
                  <Text
                    className="text-xs font-black"
                    numberOfLines={1}
                    style={{ color: colors.textPrimary }}
                  >
                    {rankLabel}
                  </Text>
                </View>
                <ChevronDown
                  color={colors.textSecondary}
                  size={15}
                  strokeWidth={2.5}
                />
              </Pressable>

              {rankMenuOpen ? (
                <View
                  className="absolute left-0 right-0 top-12 z-50 overflow-hidden rounded-2xl border"
                  style={{ backgroundColor: colors.surface, borderColor: colors.border, elevation: 18 }}
                >
                  {rankFilters.map((rank) => {
                    const active = rankFilter === rank;
                    const label = rank === "all" ? "Tất cả" : rank;

                    return (
                      <Pressable
                        accessibilityRole="button"
                        className="min-h-11 flex-row items-center justify-between px-3 active:opacity-80"
                        key={rank}
                        onPress={() => {
                          setRankFilter(rank);
                          setRankMenuOpen(false);
                        }}
                        style={{ backgroundColor: active ? colors.accentSoft : "transparent" }}
                      >
                        <Text className="text-xs font-black" style={{ color: active ? colors.accent : colors.textPrimary }}>
                          {label}
                        </Text>
                        {active ? <Check color={colors.accent} size={16} strokeWidth={2.5} /> : null}
                      </Pressable>
                    );
                  })}
                </View>
              ) : null}
            </View>
          </View>
        }
      />
      <FlatList
        className="flex-1"
        contentContainerStyle={{ alignItems: "center", backgroundColor: colors.background, paddingBottom: 96, paddingTop: 12 }}
        data={authUser ? filteredCandidates : []}
        initialNumToRender={6}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={
          <View style={{ width: contentWidth }}>
            {visibleError ? (
              <View className="mb-4 rounded-xl border p-3" style={{ backgroundColor: colors.warningSoft, borderColor: colors.warning }}>
                <Text className="text-sm leading-5" style={{ color: colors.warning }}>{visibleError}</Text>
              </View>
            ) : null}

            {authUser ? (
              <Panel className="mb-4 p-3">
                <View className="flex-row items-center gap-3">
                  <View className="h-9 w-9 items-center justify-center rounded-none" style={{ backgroundColor: colors.accentSoft }}>
                    <SlidersHorizontal color={colors.accent} size={18} />
                  </View>
                  <View className="min-w-0 flex-1">
                    <Text className="text-lg font-black" style={{ color: colors.textPrimary }}>{filteredCandidates.length} hồ sơ cần duyệt</Text>
                    <MutedText className="mt-0.5 text-xs">Chạm thẻ để xem tóm tắt và chốt nhanh.</MutedText>
                  </View>
                </View>
              </Panel>
            ) : null}
          </View>
        }
        ListEmptyComponent={
          <View style={{ width: contentWidth }}>
            {authUser && loading ? (
              <CandidateSkeletonList />
            ) : authUser ? (
              <EmptyState
                action={<AppButton label="Tải lại lịch sử" onPress={() => void loadInbox(true)} />}
                description="Chưa có phiên phân tích nào từ website hoặc tài khoản này chưa đồng bộ dữ liệu."
                title="Không có hồ sơ để duyệt"
              />
            ) : (
              <EmptyState
                description="Ứng dụng không dùng dữ liệu mẫu làm nguồn chính. Đăng nhập để lấy lịch sử thật từ Supabase."
                title="Cần đăng nhập"
              />
            )}
          </View>
        }
        onRefresh={() => void loadInbox(true)}
        maxToRenderPerBatch={8}
        removeClippedSubviews
        refreshing={loading || inboxRefreshing}
        renderItem={({ item }) => (
          <View style={{ width: contentWidth }}>
            <CandidateCard candidate={item} onPress={() => navigation.navigate("Detail", { id: item.id })} />
          </View>
        )}
        showsVerticalScrollIndicator={false}
        updateCellsBatchingPeriod={50}
        windowSize={7}
      />
      <LoadingStatusRail active={loading} />
      <BottomNav />
    </SafeAreaView>
  );
}


