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
  background: "#09090B",
  surface: "#1E1E1E",
  textPrimary: "#FFFFFF",
  textSecondary: "#AAAAAA",
  border: "#333333",
  success: "#00C853",
  danger: "#D32F2F",
  accent: "#F1E0C5",
  warning: "#F59E0B",
  info: "#F1E0C5",
  disabled: "#71717A",
  surfaceRaised: "#252525",
  surfaceSoft: "#121212",
  metricPill: "#2C3036",
  accentSoft: "rgba(241,224,197,0.14)",
  successSoft: "rgba(0,200,83,0.14)",
  dangerSoft: "rgba(211,47,47,0.14)",
  warningSoft: "rgba(245,158,11,0.14)",
  overlay: "rgba(0,0,0,0.55)"
};

export const lightThemeColors: ThemeColors = {
  background: "#F4F6F8",
  surface: "#FFFFFF",
  textPrimary: "#1A1A1A",
  textSecondary: "#637381",
  border: "#E5E8EB",
  success: "#10B981",
  danger: "#EF4444",
  accent: "#F59E0B",
  warning: "#D97706",
  info: "#2563EB",
  disabled: "#9CA3AF",
  surfaceRaised: "#FFFFFF",
  surfaceSoft: "#F8FAFC",
  metricPill: "#EEF2F6",
  accentSoft: "rgba(245,158,11,0.14)",
  successSoft: "rgba(16,185,129,0.12)",
  dangerSoft: "rgba(239,68,68,0.12)",
  warningSoft: "rgba(245,158,11,0.12)",
  overlay: "rgba(15,23,42,0.38)"
};

export const themePalettes = {
  dark: darkThemeColors,
  light: lightThemeColors
} as const;
