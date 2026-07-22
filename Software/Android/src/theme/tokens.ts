import { darkThemeColors, type ThemeColors } from "./colors";

export const theme = {
  colors: {
    bgPrimary: darkThemeColors.background,
    bgSecondary: darkThemeColors.surfaceSoft,
    bgTertiary: darkThemeColors.surface,
    surfaceCard: darkThemeColors.surface,
    surfaceHover: darkThemeColors.surfaceRaised,
    surfaceActive: "#2A2A2A",
    surfaceBorder: "#2A2A2A",
    surfaceBorderStrong: "#3A3A3A",
    textPrimary: darkThemeColors.textPrimary,
    textSecondary: darkThemeColors.textPrimary,
    textMuted: darkThemeColors.textSecondary,
    accent: darkThemeColors.accent,
    accentHover: "#F6E8D5",
    accentActive: "#E6C99F",
    accentMuted: darkThemeColors.accentSoft,
    success: darkThemeColors.success,
    warning: darkThemeColors.warning,
    danger: darkThemeColors.danger,
    info: darkThemeColors.info
  },
  radius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 20
  }
} as const;

export type DecisionAction = "shortlist" | "reject" | "interview";

export type DecisionMeta = Record<
  DecisionAction,
  { label: string; successLabel: string; color: string; background: string }
>;

export function createDecisionMeta(colors: ThemeColors): DecisionMeta {
  return {
    shortlist: {
      label: "Chọn",
      successLabel: "Đã chọn",
      color: colors.success,
      background: colors.successSoft
    },
    reject: {
      label: "Loại",
      successLabel: "Đã loại",
      color: colors.danger,
      background: colors.dangerSoft
    },
    interview: {
      label: "Phỏng vấn",
      successLabel: "Đã hẹn PV",
      color: colors.accent,
      background: colors.accentSoft
    }
  };
}

export const decisionMeta = createDecisionMeta(darkThemeColors);
