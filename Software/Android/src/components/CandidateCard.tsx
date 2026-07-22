import { memo, useState } from "react";
import { Image, Pressable, Text, View } from "react-native";
import { AlertTriangle, BriefcaseBusiness, MapPin } from "lucide-react-native";

import type { CandidateView } from "../types";
import { createDecisionMeta } from "../theme/tokens";
import { useAppTheme } from "../theme/ThemeContext";
import { ScorePill } from "./Primitives";

function initials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] || "S";
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0] : "";
  return `${first}${last}`.toUpperCase();
}

function CandidateAvatar({ name, uri }: { name: string; uri?: string }) {
  const { colors } = useAppTheme();
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(uri && !failed);

  return (
    <View
      className="h-12 w-12 overflow-hidden rounded-2xl border"
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
            {initials(name)}
          </Text>
        </View>
      )}
    </View>
  );
}

function CandidateCardBase({
  candidate,
  onPress
}: {
  candidate: CandidateView;
  onPress: () => void;
}) {
  const { colors, surfaceShadowStyle } = useAppTheme();
  const decision = candidate.decision ? createDecisionMeta(colors)[candidate.decision] : null;

  return (
    <Pressable
      accessibilityLabel={`Mở hồ sơ ${candidate.candidateName}`}
      accessibilityRole="button"
      className="mb-4 rounded-2xl border p-4 active:scale-[0.98]"
      onPress={onPress}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border
        },
        surfaceShadowStyle
      ]}
    >
      <View className="flex-row items-start gap-3">
        <CandidateAvatar name={candidate.candidateName} uri={candidate.avatarUrl} />

        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-3">
            <View className="min-w-0 flex-1">
              <Text className="text-lg font-black" numberOfLines={1} style={{ color: colors.textPrimary }}>
                {candidate.candidateName}
              </Text>
              <View className="mt-1 flex-row items-center gap-2">
                <BriefcaseBusiness color={colors.textSecondary} size={14} />
                <Text className="flex-1 text-sm font-semibold" numberOfLines={1} style={{ color: colors.textSecondary }}>
                  {candidate.jobTitle}
                </Text>
              </View>
            </View>
            <ScorePill rank={candidate.rank} score={candidate.score} />
          </View>

          <View className="mt-3 flex-row flex-wrap gap-2">
            <View
              className="rounded-full border px-3 py-1"
              style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
            >
              <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                {candidate.experienceLevel}
              </Text>
            </View>
            {candidate.detectedLocation ? (
              <View
                className="flex-row items-center gap-1 rounded-full border px-3 py-1"
                style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
              >
                <MapPin color={colors.textSecondary} size={12} />
                <Text className="text-xs font-bold" style={{ color: colors.textPrimary }}>
                  {candidate.detectedLocation}
                </Text>
              </View>
            ) : null}
            {decision ? (
              <View className="rounded-lg border px-3 py-1" style={{ borderColor: decision.color, backgroundColor: decision.background }}>
                <Text className="text-xs font-black" style={{ color: decision.color }}>
                  {decision.successLabel}
                </Text>
              </View>
            ) : null}
          </View>

          <View
            className="mt-3 rounded-xl border p-3"
            style={{ backgroundColor: colors.surfaceSoft, borderColor: colors.border }}
          >
            <Text className="text-sm leading-5" numberOfLines={2} style={{ color: colors.textPrimary }}>
              {candidate.strengths[0] || "Chưa có điểm mạnh được bóc tách từ phân tích web."}
            </Text>
          </View>

          {candidate.warnings.length > 0 ? (
            <View className="mt-3 flex-row items-start gap-2">
              <AlertTriangle color={colors.warning} size={15} />
              <Text className="flex-1 text-xs leading-4" numberOfLines={2} style={{ color: colors.warning }}>
                {candidate.warnings[0]}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
  );
}

export const CandidateCard = memo(CandidateCardBase);
