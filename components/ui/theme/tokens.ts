/**
 * Design Tokens — Hệ thống màu và biến CSS tập trung
 * Chỉ hỗ trợ Dark Mode
 */

export type ThemeMode = 'dark';

export const tokens = {
  // ======== DARK MODE TOKENS ========
  dark: {
    // Backgrounds
    bgPrimary: '#0B1120',
    bgSecondary: '#0f172a',
    bgTertiary: '#1e293b',
    bgElevated: 'rgba(30, 41, 59, 0.4)',
    bgGlass: 'rgba(255, 255, 255, 0.03)',
    bgOverlay: 'rgba(0, 0, 0, 0.85)',

    // Surfaces
    surfaceCard: 'rgba(59, 130, 246, 0.04)',
    surfaceHover: 'rgba(59, 130, 246, 0.08)',
    surfaceActive: 'rgba(59, 130, 246, 0.12)',
    surfaceBorder: 'rgba(59, 130, 246, 0.08)',
    surfaceBorderHover: 'rgba(59, 130, 246, 0.15)',

    // Text
    textPrimary: '#F1F5F9',
    textSecondary: '#CBD5E1',
    textMuted: '#94A3B8',
    textDisabled: '#64748B',
    textInverse: '#0f172a',

    // Brand / Primary
    primary: '#60a5fa',
    primaryHover: '#93C5FD',
    primaryActive: '#3B82F6',
    primaryMuted: 'rgba(96, 165, 250, 0.12)',

    // Accent
    accent: '#818cf8',
    accentHover: '#A5B4FC',
    accentMuted: 'rgba(129, 140, 248, 0.12)',

    // Status Colors
    success: '#10b981',
    successMuted: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',
    warningMuted: 'rgba(245, 158, 11, 0.12)',
    error: '#ef4444',
    errorMuted: 'rgba(239, 68, 68, 0.12)',
    info: '#06b6d4',
    infoMuted: 'rgba(6, 182, 212, 0.12)',

    // Borders
    borderSubtle: 'rgba(255, 255, 255, 0.05)',
    borderDefault: 'rgba(255, 255, 255, 0.08)',
    borderStrong: 'rgba(255, 255, 255, 0.12)',
    borderFocus: 'rgba(96, 165, 250, 0.5)',

    // Shadows
    shadowSm: '0 1px 2px rgba(0, 0, 0, 0.3)',
    shadowMd: '0 4px 12px rgba(0, 0, 0, 0.4)',
    shadowLg: '0 10px 30px rgba(0, 0, 0, 0.5)',
    shadowXl: '0 20px 60px rgba(0, 0, 0, 0.6)',
    shadowGlow: '0 0 20px rgba(96, 165, 250, 0.3)',
    shadowGlowAccent: '0 0 20px rgba(129, 140, 248, 0.3)',

    // Gradients
    gradientPrimary: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    gradientSurface: 'linear-gradient(145deg, rgba(30, 41, 59, 0.65), rgba(15, 23, 42, 0.55))',
    gradientCard: 'linear-gradient(145deg, #111827 0%, #0E1624 100%)',
    gradientHero: 'radial-gradient(60% 60% at 20% 10%, rgba(96, 165, 250, 0.08), transparent 60%)',

    // Scrollbar
    scrollbarThumb: 'rgba(255, 255, 255, 0.2)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.3)',

    // Aurora / Background Effects
    auroraOpacity: 0.2,
    gridOpacity: 0.02,
  },
} as const;

export type TokenKey = keyof typeof tokens.dark;

export function getToken<K extends TokenKey>(key: K): typeof tokens.dark[K] {
  return tokens.dark[key] as typeof tokens.dark[K];
}

export function themeClasses() {
  const t = tokens.dark;
  return {
    bg: t.bgPrimary,
    bgSecondary: t.bgSecondary,
    bgTertiary: t.bgTertiary,
    bgGlass: t.bgGlass,
    text: t.textPrimary,
    textMuted: t.textMuted,
    primary: t.primary,
    border: t.borderDefault,
  };
}
