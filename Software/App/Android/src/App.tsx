// @ts-ignore NativeWind consumes this CSS file through Metro at build time.
import "./global.css";

import { useEffect, useMemo } from "react";
import { NavigationContainer, DarkTheme, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { AppInfoScreen } from "./screens/AppInfoScreen";
import { QuickCvScreen } from "./screens/HomeScreen";
import { DetailScreen } from "./screens/DetailScreen";
import { InboxScreen } from "./screens/InboxScreen";
import { DataScreen } from "./screens/DataScreen";
import { TemplatesScreen } from "./screens/TemplatesScreen";
import { AccountScreen } from "./screens/AccountScreen";
import { AccountSettingsScreen } from "./screens/AccountSettingsScreen";
import { QuickCvResultScreen } from "./screens/QuickCvResultScreen";
import { AdvisorScreen } from "./screens/AdvisorScreen";
import { AdvisorChatHistoryScreen } from "./screens/AdvisorChatHistoryScreen";
import { RecordsScreen } from "./screens/RecordsScreen";
import { ToolsScreen } from "./screens/ToolsScreen";
import { NotificationsScreen } from "./screens/NotificationsScreen";
import { JDStandardizerScreen } from "./screens/JDStandardizerScreen";
import { JDStandardizerResultScreen } from "./screens/JDStandardizerResultScreen";
import { subscribeAuth } from "./services/auth";
import { ThemeProvider, useAppTheme } from "./theme/ThemeContext";
import { useRecruiterStore } from "./store/useRecruiterStore";
import type { JDStandardizeResponse } from "./types";

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
  QuickCvResult: undefined;
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
      QuickCvResult: "quick-cv-result",
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

  useEffect(() => {
    const unsubscribe = subscribeAuth((user) => {
      setAuthUser(user);
      setAuthReady(true);
      if (user) {
        void loadLoginHistory();
        void loadInbox();
      }
    });

    return unsubscribe;
  }, [loadInbox, loadLoginHistory, setAuthReady, setAuthUser]);

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

  return (
      <SafeAreaProvider>
      <StatusBar style={isDark ? "light" : "dark"} />
      <NavigationContainer linking={linking} theme={navigationTheme}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
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
          <Stack.Screen component={AccountScreen} name="Account" />
          <Stack.Screen component={AccountSettingsScreen} name="AccountSettings" />
          <Stack.Screen component={AdvisorScreen} name="Advisor" />
          <Stack.Screen component={AdvisorChatHistoryScreen} name="AdvisorChatHistory" />
          <Stack.Screen component={QuickCvResultScreen} name="QuickCvResult" />
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
