/**
 * Design Tokens — Single Source of Truth cho toàn bộ màu sắc app
 * Chỉ hỗ trợ Dark Mode (Navy Blue Theme)
 *
 * Quy tac su dung:
 * - Primary: #60a5fa (blue-400) - màu chính cho actions, links, highlights
 * - Accent:  #818cf8 (indigo-400) - màu phụ cho accents, gradients
 * - bgPrimary: #0B1120 (navy rất đậm) - nền app chính
 * - bgSecondary: #0f172a (slate-900) - nền card nhẹ
 * - bgTertiary: #1e293b (slate-800) - nền hover, elevated
 */

export type ThemeMode = 'dark';

export const tokens = {
  // ======== DARK MODE TOKENS — NAVY BLUE THEME ========
  dark: {
    // Backgrounds
    bgPrimary: '#0B1120',      // nền app chính (navy rất đậm)
    bgSecondary: '#0f172a',    // nền card (slate-900)
    bgTertiary: '#1e293b',     // nền hover/elevated (slate-800)
    bgElevated: 'rgba(30, 41, 59, 0.4)',
    bgGlass: 'rgba(255, 255, 255, 0.03)',
    bgOverlay: 'rgba(0, 0, 0, 0.85)',

    // Surfaces — dùng blue từ tokens thay vì hardcode nhiều nơi
    surfaceCard: 'rgba(96, 165, 250, 0.04)',
    surfaceHover: 'rgba(96, 165, 250, 0.08)',
    surfaceActive: 'rgba(96, 165, 250, 0.12)',
    surfaceBorder: 'rgba(96, 165, 250, 0.08)',
    surfaceBorderHover: 'rgba(96, 165, 250, 0.15)',

    // Text
    textPrimary: '#F1F5F9',    // slate-100 - text chính
    textSecondary: '#CBD5E1',   // slate-200 - text phụ
    textMuted: '#94A3B8',      // slate-400 - text mờ
    textDisabled: '#64748B',    // slate-500 - text disabled
    textInverse: '#0f172a',    // text trên nền sáng

    // Brand / Primary — LIGHT BLUE (#60a5fa)
    primary: '#60a5fa',
    primaryHover: '#93C5FD',
    primaryActive: '#3B82F6',
    primaryMuted: 'rgba(96, 165, 250, 0.12)',

    // Accent — INDIGO (#818cf8)
    accent: '#818cf8',
    accentHover: '#A5B4FC',
    accentMuted: 'rgba(129, 140, 248, 0.12)',

    // Status Colors
    success: '#10b981',        // emerald-500
    successMuted: 'rgba(16, 185, 129, 0.12)',
    warning: '#f59e0b',        // amber-500
    warningMuted: 'rgba(245, 158, 11, 0.12)',
    error: '#ef4444',          // red-500
    errorMuted: 'rgba(239, 68, 68, 0.12)',
    info: '#06b6d4',           // cyan-500
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

    // Gradients — Primary gradient (blue → indigo)
    gradientPrimary: 'linear-gradient(135deg, #3B82F6 0%, #6366F1 100%)',
    gradientSurface: 'linear-gradient(145deg, rgba(30, 41, 59, 0.65), rgba(15, 23, 42, 0.55))',
    gradientCard: 'linear-gradient(145deg, #111827 0%, #0E1624 100%)',
    gradientHero: 'radial-gradient(60% 60% at 20% 10%, rgba(96, 165, 250, 0.08), transparent 60%)',
    // Sidebar header gradient (navy blue)
    gradientHeader: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 100%)',

    // Scrollbar
    scrollbarThumb: 'rgba(255, 255, 255, 0.2)',
    scrollbarThumbHover: 'rgba(255, 255, 255, 0.3)',

    // Aurora / Background Effects
    auroraOpacity: 0.2,
    gridOpacity: 0.02,

    // App-level colors (cho index.css compatibility)
    // Sidebar header gradient
    sidebarHeaderGradient: 'linear-gradient(135deg, #1e3a5f, #1e40af)',
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
