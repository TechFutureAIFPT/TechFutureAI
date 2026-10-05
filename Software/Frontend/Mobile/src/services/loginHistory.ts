import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";

import type { AuthUser, LoginHistoryEntry } from "../types";

const LOGIN_HISTORY_PREFIX = "cvmatch:login-history:";
const MAX_LOGIN_HISTORY = 8;

function userKey(user: AuthUser | null) {
  return (user?.email || user?.uid || "guest").trim().toLowerCase();
}

function storageKey(user: AuthUser | null) {
  return `${LOGIN_HISTORY_PREFIX}${userKey(user)}`;
}

function platformLabel() {
  if (Platform.OS === "android") return "Android";
  if (Platform.OS === "ios") return "iOS";
  if (Platform.OS === "web") return "Web";
  return Platform.OS;
}

function deviceLabel() {
  if (Platform.OS === "android") return "Thiết bị Android";
  if (Platform.OS === "ios") return "iPhone / iPad";
  if (Platform.OS === "web") return "Trình duyệt web";
  return "Thiết bị hiện tại";
}

function appSurface() {
  return Platform.OS === "web" ? "Web app" : "Mobile app";
}

export async function readLoginHistory(user: AuthUser | null): Promise<LoginHistoryEntry[]> {
  if (!user) return [];

  try {
    const raw = await AsyncStorage.getItem(storageKey(user));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed)
      ? parsed
          .filter((item): item is LoginHistoryEntry => Boolean(item?.id && item?.signedInAt))
          .sort((left, right) => right.signedInAt - left.signedInAt)
          .slice(0, MAX_LOGIN_HISTORY)
      : [];
  } catch (error) {
    console.warn("[login-history] Không đọc được lịch sử đăng nhập.", error);
    return [];
  }
}

export async function recordLoginSession(
  user: AuthUser,
  provider: LoginHistoryEntry["provider"]
): Promise<LoginHistoryEntry[]> {
  const currentHistory = await readLoginHistory(user);
  const now = Date.now();
  const entry: LoginHistoryEntry = {
    id: `${now}-${Math.random().toString(36).slice(2, 8)}`,
    signedInAt: now,
    provider,
    deviceLabel: deviceLabel(),
    platformLabel: platformLabel(),
    appSurface: appSurface()
  };

  const nextHistory = [entry, ...currentHistory].slice(0, MAX_LOGIN_HISTORY);

  try {
    await AsyncStorage.setItem(storageKey(user), JSON.stringify(nextHistory));
  } catch (error) {
    console.warn("[login-history] Không ghi được lịch sử đăng nhập.", error);
  }

  return nextHistory;
}
