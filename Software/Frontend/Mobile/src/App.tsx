// @ts-ignore NativeWind consumes this CSS file through Metro at build time.
import "./global.css";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppState } from "react-native";

import { PageTransitionProgressBar } from "./components/Motion";

import { AppInfoScreen } from "./screens/AppInfoScreen";
import { QuickCvScreen } from "./screens/HomeScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { DataScreen } from "./screens/DataScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";
import { AccountSettingsScreen } from "./screens/AccountSettingsScreen";
import { QuickCvResultScreen } from "./screens/QuickCvResultScreen";
import { QuickCvEditorScreen } from "./screens/QuickCvEditorScreen";
import { AdvisorScreen } from "./screens/AdvisorScreen";
import { AdvisorChatHistoryScreen } from "./screens/AdvisorChatHistoryScreen";
import { PCConnectScreen } from "./screens/PCConnectScreen";
import { RecordsScreen } from "./screens/RecordsScreen";
import { ToolsScreen } from "./screens/ToolsScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { JDStandardizerScreen } from "./screens/JDStandardizerScreen";
import { JDStandardizerResultScreen } from "./screens/JDStandardizerResultScreen";
import { IndustryResearchScreen } from "./screens/IndustryResearchScreen";
import { subscribeAuth } from "./services/auth";
import { subscribeDesktopSession, subscribeUserSyncState, updateFirestoreSessionHeartbeat } from "./services/firebaseStore";
import { ThemeProvider, useAppTheme } from "./theme/ThemeContext";
import { useRecruiterStore } from "./store/useRecruiterStore";
import type { JDStandardizeResponse, QuickCvScoreItem } from "./types";

export type RootStackParamList = {
  Home: undefined;
  Records: undefined;
  Tools: undefined;
  Notifications: undefined;
  Inbox: undefined;
  Data: undefined;
  Templates: undefined;
  Account: undefined;
  AccountSettings: undefined;
  QuickCv: undefined;
  JDStandardizer: undefined;
  JDStandardizerResult: { result: JDStandardizeResponse };
  Advisor: { sessionId?: string } | undefined;
  AdvisorChatHistory: undefined;
  IndustryResearch: undefined;
  QuickCvResult: undefined;
  QuickCvEditor: { scoreItem: QuickCvScoreItem };
  PCConnect: undefined;
  Detail: { id: string };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking = {
  prefixes: [],
  config: {
    screens: {
      Home: "",
      Records: "records",
      Tools: "tools",
      Notifications: "notifications",
      Inbox: "inbox",
      Data: "data",
      Templates: "templates",
      Account: "account",
      AccountSettings: "account/settings",
      QuickCv: "quick-cv",
      JDStandardizer: "jd-standardizer",
      JDStandardizerResult: "jd-standardizer/result",
      Advisor: "advisor",
      AdvisorChatHistory: "advisor/history",
      IndustryResearch: "industry-research",
      QuickCvResult: "quick-cv-result",
      QuickCvEditor: "quick-cv-editor",
      PCConnect: "pc-connect",
      Detail: "candidate/:id"
    }
  }
};

function AppContent() {
  const { colors, isDark } = useAppTheme();
  const setAuthUser = useRecruiterStore((state) => state.setAuthUser);
  const setAuthReady = useRecruiterStore((state) => state.setAuthReady);
  const loadInbox = useRecruiterStore((state) => state.loadInbox);
  const loadLoginHistory = useRecruiterStore((state) => state.loadLoginHistory);
  const setLiveSession = useRecruiterStore((state) => state.setLiveSession);
  const authUser = useRecruiterStore((state) => state.authUser);
  const currentSessionId = useRecruiterStore((state) => state.currentSessionId);
  const storeLoading = useRecruiterStore(
    (state) => state.loading || state.submitting || state.quickCvLoading || state.inboxRefreshing
  );

  const [pageNavigating, setPageNavigating] = useState(false);
  const navTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleNavigationStateChange = useCallback(() => {
    if (navTimerRef.current) clearTimeout(navTimerRef.current);
    setPageNavigating(true);
    navTimerRef.current = setTimeout(() => {
      setPageNavigating(false);
    }, 380);
  }, []);

  useEffect(() => {
    return () => {
      if (navTimerRef.current) clearTimeout(navTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let unsubSession: (() => void) | null = null;
    let unsubSyncState: (() => void) | null = null;

    const unsubscribe = subscribeAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);

      unsubSession?.();
      unsubSession = null;
      unsubSyncState?.();
      unsubSyncState = null;

      if (user) {
        void loadLoginHistory();
        void loadInbox();
        unsubSession = subscribeDesktopSession(user.uid, setLiveSession);
        unsubSyncState = subscribeUserSyncState(user.uid, (syncState) => {
          const latestRevision = syncState?.latestRevision?.trim();
          if (!latestRevision) return;
          const currentRevision = useRecruiterStore.getState().inboxRevision;
          if (currentRevision && currentRevision === latestRevision) return;
          void loadInbox(true);
        });
      } else {
        setLiveSession(null);
      }
    });

    return () => {
      unsubscribe();
      unsubSession?.();
      unsubSyncState?.();
    };
  }, [loadInbox, loadLoginHistory, setAuthReady, setAuthUser, setLiveSession]);

  // Session activity duration tracking
  useEffect(() => {
    if (!authUser || !currentSessionId) return;

    let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
    const startedAt = Date.now();

    const startHeartbeat = () => {
      if (heartbeatTimer) return;
      void updateFirestoreSessionHeartbeat(authUser, currentSessionId, startedAt);
      heartbeatTimer = setInterval(() => {
        void updateFirestoreSessionHeartbeat(authUser, currentSessionId, startedAt);
      }, 30000);
    };

    const stopHeartbeat = () => {
      if (heartbeatTimer) {
        clearInterval(heartbeatTimer);
        heartbeatTimer = null;
      }
    };

    if (AppState.currentState === "active") {
      startHeartbeat();
    }

    const appStateSubscription = AppState.addEventListener("change", (nextAppState) => {
      if (nextAppState === "active") {
        startHeartbeat();
      } else {
        stopHeartbeat();
      }
    });

    return () => {
      stopHeartbeat();
      appStateSubscription.remove();
    };
  }, [authUser, currentSessionId]);

  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;

    return {
      ...baseTheme,
      dark: isDark,
      colors: {
        ...baseTheme.colors,
        background: colors.background,
        card: colors.surface,
        border: colors.border,
        primary: colors.accent,
        text: colors.textPrimary
      }
    };
  }, [colors, isDark]);

  const showProgress = pageNavigating || Boolean(storeLoading);

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <PageTransitionProgressBar active={showProgress} />
      <NavigationContainer
        linking={linking}
        onStateChange={handleNavigationStateChange}
        theme={navigationTheme}
      >
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
            animationDuration: 220,
            gestureEnabled: true
          }}
        >
          <Stack.Screen component={AppInfoScreen} name="Home" />
          <Stack.Screen component={RecordsScreen} name="Records" />
          <Stack.Screen component={ToolsScreen} name="Tools" />
          <Stack.Screen component={NotificationsScreen} name="Notifications" />
          <Stack.Screen component={QuickCvScreen} name="QuickCv" />
          <Stack.Screen component={JDStandardizerScreen} name="JDStandardizer" />
          <Stack.Screen component={JDStandardizerResultScreen} name="JDStandardizerResult" />
          <Stack.Screen component={InboxScreen} name="Inbox" />
          <Stack.Screen component={DataScreen} name="Data" />
          <Stack.Screen component={TemplatesScreen} name="Templates" />
          <Stack.Screen component={AccountSettingsScreen} name="Account" />
          <Stack.Screen component={AccountSettingsScreen} name="AccountSettings" />
          <Stack.Screen component={AdvisorScreen} name="Advisor" />
          <Stack.Screen component={AdvisorChatHistoryScreen} name="AdvisorChatHistory" />
          <Stack.Screen component={IndustryResearchScreen} name="IndustryResearch" />
          <Stack.Screen component={QuickCvResultScreen} name="QuickCvResult" />
          <Stack.Screen component={QuickCvEditorScreen} name="QuickCvEditor" />
          <Stack.Screen component={PCConnectScreen} name="PCConnect" />
          <Stack.Screen component={DetailScreen} name="Detail" />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
