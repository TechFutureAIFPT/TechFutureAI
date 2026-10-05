import type { ComponentType, ReactNode } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";
import type { LucideProps } from "lucide-react-native";

import { useAppTheme } from "../theme/ThemeContext";

type IconType = ComponentType<LucideProps>;

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { colors, surfaceShadowStyle } = useAppTheme();

  return (
    <View
      className={["rounded-[28px] border p-5", className].join(" ")}
      style={[
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          borderWidth: 0.85
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
    <Text className="text-lg font-black tracking-tight" style={{ color: colors.textPrimary }}>
      {children}
    </Text>
  );
}

export function MutedText({ children, className = "" }: { children: ReactNode; className?: string }) {
  const { colors } = useAppTheme();

  return (
    <Text className={["text-xs leading-5 font-semibold", className].join(" ")} style={{ color: colors.textSecondary }}>
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
        "min-h-12 flex-row items-center justify-center gap-2 rounded-2xl px-5 shadow-sm",
        className
      ].join(" ")}
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: variantStyle.backgroundColor,
          borderColor: variantStyle.borderColor,
          borderWidth: 1,
          opacity: disabled ? 0.5 : pressed ? 0.9 : 1,
          transform: [{ scale: pressed ? 0.97 : 1 }]
        }
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variantStyle.contentColor} />
      ) : Icon ? (
        <Icon color={variantStyle.contentColor} size={16} strokeWidth={2.5} />
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
      className="min-h-12 rounded-2xl border px-4 text-sm font-semibold"
      onChangeText={onChangeText}
      placeholder={placeholder}
      placeholderTextColor={colors.textSecondary}
      style={{
        backgroundColor: colors.surface,
        borderColor: colors.border,
        color: colors.textPrimary,
        borderWidth: 0.85
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
      className="items-center rounded-[22px] border px-3.5 py-2.5 min-w-[72px] justify-center"
      style={{
        backgroundColor: tone.backgroundColor,
        borderColor: tone.color,
        borderWidth: 1.2
      }}
    >
      <Text className="text-[26px] font-black leading-7 text-center" style={{ color: tone.color }}>
        {Math.round(score)}
      </Text>
      <Text className="text-[9px] font-extrabold uppercase tracking-wider mt-1 text-center" style={{ color: tone.color }}>
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
      <Text className="text-center text-lg font-black tracking-tight" style={{ color: colors.textPrimary }}>
        {title}
      </Text>
      <MutedText className="mt-2 text-center leading-5">{description}</MutedText>
      {action ? <View className="mt-5 w-full">{action}</View> : null}
    </Panel>
  );
}
