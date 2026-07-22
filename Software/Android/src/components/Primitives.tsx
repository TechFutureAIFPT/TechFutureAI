import type { ComponentType, ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { LucideProps } from "lucide-react-native";

import { useAppTheme } from "../theme/ThemeContext";

type IconType = ComponentType<LucideProps>;

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  return (
    <View
      className={["rounded-2xl border p-4", className].join(" ")}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border
        },
        surfaceShadowStyle
      ]}
    >
      {children}
    </View>
  );
}

export function SectionTitle({ children }: { children: ReactNode }) {
  const { colors } = useAppTheme();

  return (
    <Text className="text-lg font-black" style={{ color: colors.textPrimary }}>
      {children}
    </Text>
  );
}

export function MutedText({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { colors } = useAppTheme();

  return (
    <Text className={["text-sm leading-5", className].join(" ")} style={{ color: colors.textSecondary }}>
      {children}
    </Text>
  );
}

export function AppButton({
  label,
  onPress,
  icon: Icon,
  variant = "primary",
  disabled = false,
  loading = false,
  className = ""
}: {
  label: string;
  onPress: () => void;
  icon?: IconType;
  variant?: "primary" | "ghost" | "danger" | "success";
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}) {
  const { colors } = useAppTheme();
  const variantStyle = {
    primary: {
      backgroundColor: colors.accent,
      borderColor: colors.accent,
      contentColor: "#111827"
    },
    ghost: {
      backgroundColor: colors.surfaceSoft,
      borderColor: colors.border,
      contentColor: colors.textPrimary
    },
    danger: {
      backgroundColor: colors.danger,
      borderColor: colors.danger,
      contentColor: "#FFFFFF"
    },
    success: {
      backgroundColor: colors.success,
      borderColor: colors.success,
      contentColor: "#FFFFFF"
    }
  }[variant];

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={[
        "min-h-12 flex-row items-center justify-center gap-2 rounded-xl border px-4 active:scale-95",
        disabled ? "opacity-50" : "active:opacity-80",
        className
      ].join(" ")}
      onPress={onPress}
      style={{
        backgroundColor: variantStyle.backgroundColor,
        borderColor: variantStyle.borderColor
      }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.contentColor} />
      ) : Icon ? (
        <Icon color={variantStyle.contentColor} size={18} strokeWidth={2.5} />
      ) : null}
      <Text className="text-center text-sm font-black" style={{ color: variantStyle.contentColor }}>
        {label}
      </Text>
    </Pressable>
  );
}

export function SearchInput({
  value,
  onChangeText,
  placeholder
}: {
  value: string;
  onChangeText: (value: string) => void;
  placeholder: string;
}) {
  const { colors } = useAppTheme();

  return (
    <TextInput
      className="min-h-12 rounded-xl border px-4 text-base"
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textPrimary
      }}
      value={value}
    />
  );
}

export function ScorePill({ score, rank }: { score: number; rank: string }) {
  const { colors } = useAppTheme();
  const tone =
    score >= 80
      ? { backgroundColor: colors.successSoft, color: colors.success }
      : score >= 60
        ? { backgroundColor: colors.warningSoft, color: colors.warning }
        : { backgroundColor: colors.dangerSoft, color: colors.danger };

  return (
    <View
      className="items-center rounded-xl border px-3 py-2"
      style={{ backgroundColor: tone.backgroundColor, borderColor: tone.color }}
    >
      <Text className="text-2xl font-black" style={{ color: tone.color }}>
        {Math.round(score)}
      </Text>
      <Text className="text-[10px] font-black uppercase" style={{ color: tone.color }}>
        Hạng {rank}
      </Text>
    </View>
  );
}

export function EmptyState({
  title,
  description,
  action
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const { colors } = useAppTheme();

  return (
    <Panel className="items-center px-5 py-8">
      <Text className="text-center text-xl font-black" style={{ color: colors.textPrimary }}>
        {title}
      </Text>
      <MutedText className="mt-2 text-center">{description}</MutedText>
      {action ? <View className="mt-5 w-full">{action}</View> : null}
    </Panel>
  );
}
