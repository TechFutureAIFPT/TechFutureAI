export type ThemeColors = {
  background: string;
  surface: string;
  textPrimary: string;
  textSecondary: string;
  border: string;
  success: string;
  danger: string;
  accent: string;
  warning: string;
  info: string;
  disabled: string;
  surfaceRaised: string;
  surfaceSoft: string;
  metricPill: string;
  accentSoft: string;
  successSoft: string;
  dangerSoft: string;
  warningSoft: string;
  overlay: string;
};

export const darkThemeColors: ThemeColors = {
  background: "#0B0F19",
  surface: "#131A29",
  textPrimary: "#F8FAFC",
  textSecondary: "#94A3B8",
  border: "rgba(255, 255, 255, 0.09)",
  success: "#10B981",
  danger: "#EF4444",
  accent: "#3B82F6",
  warning: "#F59E0B",
  info: "#3B82F6",
  disabled: "#64748B",
  surfaceRaised: "#1A2336",
  surfaceSoft: "#0E1422",
  metricPill: "#1A2336",
  accentSoft: "rgba(59, 130, 246, 0.16)",
  successSoft: "rgba(16, 185, 129, 0.14)",
  dangerSoft: "rgba(239, 68, 68, 0.14)",
  warningSoft: "rgba(245, 158, 11, 0.14)",
  overlay: "rgba(0, 0, 0, 0.65)"
};

export const lightThemeColors: ThemeColors = {
  background: "#F8FAFC",
  surface: "#FFFFFF",
  textPrimary: "#0F172A",
  textSecondary: "#64748B",
  border: "rgba(226, 232, 240, 0.85)",
  success: "#10B981",
  danger: "#EF4444",
  accent: "#2563EB",
  warning: "#D97706",
  info: "#2563EB",
  disabled: "#94A3B8",
  surfaceRaised: "#FFFFFF",
  surfaceSoft: "#F1F5F9",
  metricPill: "#F1F5F9",
  accentSoft: "rgba(37, 99, 235, 0.08)",
  successSoft: "rgba(16, 185, 129, 0.10)",
  dangerSoft: "rgba(239, 68, 68, 0.10)",
  warningSoft: "rgba(245, 158, 11, 0.10)",
  overlay: "rgba(15, 23, 42, 0.38)"
};

export const themePalettes = {
  dark: darkThemeColors,
  light: lightThemeColors
} as const;

