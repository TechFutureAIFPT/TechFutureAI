/**
 * ThemeProvider — Chỉ hỗ trợ Dark Mode
 * - Đặt CSS variables trên documentElement để dùng xuyên suốt
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokens } from './tokens.ts';

interface ThemeContextType {
  isDarkMode: boolean;
  themeMode: 'dark';
}

const ThemeContext = createContext<ThemeContextType>({
  isDarkMode: true,
  themeMode: 'dark',
});

function applyThemeVariables(mode: 'dark') {
  const root = document.documentElement;
  const t = tokens[mode];

  root.classList.remove('light');
  root.classList.add('dark');

  root.style.setProperty('--th-bg', t.bgPrimary);
  root.style.setProperty('--th-bg-secondary', t.bgSecondary);
  root.style.setProperty('--th-bg-tertiary', t.bgTertiary);
  root.style.setProperty('--th-bg-elevated', t.bgElevated);
  root.style.setProperty('--th-bg-glass', t.bgGlass);
  root.style.setProperty('--th-bg-overlay', t.bgOverlay);

  root.style.setProperty('--th-surface-card', t.surfaceCard);
  root.style.setProperty('--th-surface-hover', t.surfaceHover);
  root.style.setProperty('--th-surface-active', t.surfaceActive);
  root.style.setProperty('--th-surface-border', t.surfaceBorder);
  root.style.setProperty('--th-surface-border-hover', t.surfaceBorderHover);

  root.style.setProperty('--th-text', t.textPrimary);
  root.style.setProperty('--th-text-secondary', t.textSecondary);
  root.style.setProperty('--th-text-muted', t.textMuted);
  root.style.setProperty('--th-text-disabled', t.textDisabled);
  root.style.setProperty('--th-text-inverse', t.textInverse);

  root.style.setProperty('--th-primary', t.primary);
  root.style.setProperty('--th-primary-hover', t.primaryHover);
  root.style.setProperty('--th-primary-active', t.primaryActive);
  root.style.setProperty('--th-primary-muted', t.primaryMuted);

  root.style.setProperty('--th-accent', t.accent);
  root.style.setProperty('--th-accent-hover', t.accentHover);
  root.style.setProperty('--th-accent-muted', t.accentMuted);

  root.style.setProperty('--th-success', t.success);
  root.style.setProperty('--th-success-muted', t.successMuted);
  root.style.setProperty('--th-warning', t.warning);
  root.style.setProperty('--th-warning-muted', t.warningMuted);
  root.style.setProperty('--th-error', t.error);
  root.style.setProperty('--th-error-muted', t.errorMuted);
  root.style.setProperty('--th-info', t.info);
  root.style.setProperty('--th-info-muted', t.infoMuted);

  root.style.setProperty('--th-border-subtle', t.borderSubtle);
  root.style.setProperty('--th-border', t.borderDefault);
  root.style.setProperty('--th-border-strong', t.borderStrong);
  root.style.setProperty('--th-border-focus', t.borderFocus);

  root.style.setProperty('--th-shadow-sm', t.shadowSm);
  root.style.setProperty('--th-shadow-md', t.shadowMd);
  root.style.setProperty('--th-shadow-lg', t.shadowLg);
  root.style.setProperty('--th-shadow-xl', t.shadowXl);
  root.style.setProperty('--th-shadow-glow', t.shadowGlow);
  root.style.setProperty('--th-shadow-glow-accent', t.shadowGlowAccent);

  root.style.setProperty('--th-gradient-primary', t.gradientPrimary);
  root.style.setProperty('--th-gradient-surface', t.gradientSurface);
  root.style.setProperty('--th-gradient-card', t.gradientCard);

  root.style.setProperty('--th-scrollbar-thumb', t.scrollbarThumb);
  root.style.setProperty('--th-scrollbar-thumb-hover', t.scrollbarThumbHover);
}

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeMode] = useState<'dark'>('dark');

  useEffect(() => {
    applyThemeVariables('dark');
  }, []);

  return (
    <ThemeContext.Provider value={{ isDarkMode: true, themeMode: 'dark' }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);

export function useThemeVar(varName: string): string {
  const { themeMode } = useTheme();
  const t = tokens[themeMode];
  const key = varName.replace('--th-', '') as keyof typeof t;
  return (t as any)[key] as string;
}

export function useThemeVars(...varNames: string[]): Record<string, string> {
  const { themeMode } = useTheme();
  const t = tokens[themeMode];
  const result: Record<string, string> = {};
  for (const name of varNames) {
    const key = name.replace('--th-', '') as keyof typeof t;
    result[name] = (t as any)[key] as string;
  }
  return result;
}
