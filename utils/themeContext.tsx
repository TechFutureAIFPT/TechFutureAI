import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface ThemeContextType {
  isLightMode: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType>({
  isLightMode: true,
  toggleTheme: () => {},
});

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isLightMode, setIsLightMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('appTheme');
      // Default is light; only dark if user explicitly chose dark
      return saved !== 'dark';
    }
    return true;
  });

  useEffect(() => {
    const html = document.documentElement;
    if (isLightMode) {
      html.classList.add('light');
      html.classList.remove('dark');
      localStorage.setItem('appTheme', 'light');
    } else {
      html.classList.add('dark');
      html.classList.remove('light');
      localStorage.setItem('appTheme', 'dark');
    }
  }, [isLightMode]);

  const toggleTheme = useCallback(() => {
    setIsLightMode(prev => !prev);
  }, []);

  return (
    <ThemeContext.Provider value={{ isLightMode, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
