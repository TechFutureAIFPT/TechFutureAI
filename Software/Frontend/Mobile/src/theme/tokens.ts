import { darkThemeColors, type ThemeColors } from "./colors";

export const theme = {
  colors: {
    bgPrimary: darkThemeColors.background,
    bgSecondary: darkThemeColors.surfaceSoft,
    bgTertiary: darkThemeColors.surface,
    surfaceCard: darkThemeColors.surface,
    surfaceHover: darkThemeColors.surfaceRaised,
    surfaceActive: "#1E2638",
    surfaceBorder: "#262E3E",
    surfaceBorderStrong: "#303C52",
    textPrimary: darkThemeColors.textPrimary,
    textSecondary: darkThemeColors.textPrimary,
    textMuted: darkThemeColors.textSecondary,
    accent: darkThemeColors.accent,
    accentHover: "#2563EB",
    accentActive: "#1D4ED8",
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
