import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  Animated,
  Easing,
  Platform,
  StyleSheet,
  useColorScheme,
  useWindowDimensions,
  View,
  type ViewStyle
} from "react-native";

import { themePalettes, type ThemeColors } from "./colors";

export type ThemeMode = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

type ThemeContextValue = {
  mode: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  colors: ThemeColors;
  setThemeMode: (mode: ThemeMode) => void;
  toggleTheme: () => void;
  surfaceShadowStyle: ViewStyle;
};

const THEME_STORAGE_KEY = "@supporthr/theme-mode";

const ThemeContext = createContext<ThemeContextValue | null>(null);

function isThemeMode(value: string | null): value is ThemeMode {
  return value === "system" || value === "light" || value === "dark";
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const { width } = useWindowDimensions();
  const [mode, setMode] = useState<ThemeMode>("light");
  const [transitionColor, setTransitionColor] = useState<string | null>(null);
  const [transitionAccent, setTransitionAccent] = useState(themePalettes.light.accent);
  const previousTheme = useRef<ResolvedTheme | null>(null);
  const previousColors = useRef<ThemeColors>(themePalettes.light);
  const fade = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let mounted = true;

    AsyncStorage.getItem(THEME_STORAGE_KEY)
      .then((storedMode) => {
        if (mounted && isThemeMode(storedMode)) {
          setMode(storedMode);
        }
      })
      .catch(() => {
        // Fallback to system theme if persisted state cannot be read.
      });

    return () => {
      mounted = false;
    };
  }, []);

  const setThemeMode = useCallback((nextMode: ThemeMode) => {
    setMode(nextMode);
    void AsyncStorage.setItem(THEME_STORAGE_KEY, nextMode);
  }, []);

  const resolvedTheme: ResolvedTheme =
    mode === "system" ? (systemScheme === "dark" ? "dark" : "light") : mode;
  const colors = themePalettes[resolvedTheme];
  const isDark = resolvedTheme === "dark";

  useEffect(() => {
    if (!previousTheme.current) {
      previousTheme.current = resolvedTheme;
      previousColors.current = colors;
      return;
    }

    if (previousTheme.current !== resolvedTheme) {
      const nativeDriver = Platform.OS !== "web";

      fade.stopAnimation();
      burst.stopAnimation();
      fade.setValue(1);
      burst.setValue(0);
      setTransitionColor(previousColors.current.background);
      setTransitionAccent(colors.accent);

      Animated.parallel([
        Animated.timing(fade, {
          duration: 520,
          easing: Easing.out(Easing.cubic),
          toValue: 0,
          useNativeDriver: nativeDriver
        }),
        Animated.timing(burst, {
          duration: 620,
          easing: Easing.out(Easing.cubic),
          toValue: 1,
          useNativeDriver: nativeDriver
        })
      ]).start(({ finished }) => {
        if (finished) {
          setTransitionColor(null);
        }
      });
    }

    previousTheme.current = resolvedTheme;
    previousColors.current = colors;
  }, [burst, colors, fade, resolvedTheme]);

  const surfaceShadowStyle = useMemo<ViewStyle>(
    () =>
      isDark
        ? {
            borderColor: colors.border
          }
        : Platform.OS === "web"
          ? ({
              borderColor: colors.border,
              boxShadow: "0 8px 14px rgba(15,23,42,0.08)"
            } as ViewStyle)
          : {
              borderColor: colors.border,
              shadowColor: "#0F172A",
              shadowOffset: { height: 8, width: 0 },
              shadowOpacity: 0.08,
              shadowRadius: 14,
              elevation: 3
            },
    [colors.border, isDark]
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      mode,
      resolvedTheme,
      isDark,
      colors,
      setThemeMode,
      toggleTheme: () => setThemeMode(isDark ? "light" : "dark"),
      surfaceShadowStyle
    }),
    [colors, isDark, mode, resolvedTheme, setThemeMode, surfaceShadowStyle]
  );

  const burstOpacity = burst.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.18, 0.1, 0]
  });
  const burstScale = burst.interpolate({
    inputRange: [0, 1],
    outputRange: [0.18, 8]
  });

  return (
    <ThemeContext.Provider value={value}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        {children}
        {transitionColor ? (
          <View pointerEvents="none" style={StyleSheet.absoluteFill}>
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.transitionLayer,
                {
                  backgroundColor: transitionColor,
                  opacity: fade
                }
              ]}
            />
            <Animated.View
              style={[
                styles.themeBurst,
                {
                  backgroundColor: transitionAccent,
                  opacity: burstOpacity,
                  transform: [
                    { translateX: Math.max(width - 98, 0) },
                    { translateY: 18 },
                    { scale: burstScale }
                  ]
                }
              ]}
            />
          </View>
        ) : null}
      </View>
    </ThemeContext.Provider>
  );
}

export function useAppTheme() {
  const value = useContext(ThemeContext);

  if (!value) {
    throw new Error("useAppTheme must be used inside ThemeProvider");
  }

  return value;
}

const styles = StyleSheet.create({
  root: {
    flex: 1
  },
  themeBurst: {
    borderRadius: 48,
    height: 96,
    position: "absolute",
    width: 96,
    zIndex: 1001
  },
  transitionLayer: {
    zIndex: 1000
  }
});
