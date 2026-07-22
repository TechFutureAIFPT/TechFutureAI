import { Platform } from "react-native";
import type { User } from "@supabase/supabase-js";

import type { AuthUser } from "../types";
import { fetchRenderUserProfile, upsertRenderUserProfile } from "./renderStore";
import { isSupabaseConfigured, supabase } from "./supabase";


export { isSupabaseConfigured };

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  const metadata = user.user_metadata || {};
  return {
    uid: user.id,
    email: user.email || "",
    displayName: metadata.full_name || metadata.name || metadata.display_name || null,
    photoUrl: metadata.avatar_url || metadata.picture || null
  };
}

async function mapUserWithProfile(user: User | null): Promise<AuthUser | null> {
  const mapped = mapUser(user);
  if (!user || !mapped || !supabase) return mapped;
  try {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (!token) return mapped;
    let profile = await fetchRenderUserProfile(token);
    if (!profile) profile = await upsertRenderUserProfile(token, mapped);
    return {
      ...mapped,
      displayName: profile?.displayName || mapped.displayName,
      photoUrl: profile?.avatar || mapped.photoUrl
    };
  } catch (error) {
    console.warn("Không thể đồng bộ hồ sơ backend cho mobile.", error);
    return mapped;
  }
}

function syncRenderProfileInBackground(user: User): void {
  void mapUserWithProfile(user);
}

function requireSupabase() {
  if (!supabase) {
    throw new Error("Supabase chưa được cấu hình cho ứng dụng mobile.");
  }
  return supabase;
}

export function subscribeAuth(callback: (user: AuthUser | null) => void) {
  if (!supabase) {
    callback(null);
    return () => undefined;
  }
  void supabase.auth.getSession().then(({ data }) => callback(mapUser(data.session?.user ?? null)));
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    const user = session?.user ?? null;
    callback(mapUser(user));
    if (user) syncRenderProfileInBackground(user);
  });
  return () => data.subscription.unsubscribe();
}

export async function getAuthToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session?.access_token ?? null;
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw error;
  const mapped = mapUser(data.user);
  if (!mapped || !data.user) throw new Error("Không thể đọc thông tin đăng nhập.");
  syncRenderProfileInBackground(data.user);
  return mapped;
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signUp({ email: email.trim(), password });
  if (error) throw error;
  const mapped = mapUser(data.user);
  if (!mapped || !data.user) throw new Error("Không thể đọc thông tin tài khoản mới.");
  if (data.session) syncRenderProfileInBackground(data.user);
  return mapped;
}

export async function resetPasswordEmail(email: string): Promise<void> {
  const client = requireSupabase();
  const redirectTo = process.env.EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL?.trim();
  const { error } = await client.auth.resetPasswordForEmail(email.trim(), redirectTo ? { redirectTo } : undefined);
  if (error) throw error;
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const client = requireSupabase();
  if (Platform.OS !== "web") {
    throw new Error("Đăng nhập Google trên Android sử dụng Google ID token của ứng dụng.");
  }
  const redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
  const { error } = await client.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo, queryParams: { prompt: "select_account" } }
  });
  if (error) throw error;
  return new Promise<AuthUser>(() => undefined);
}

export async function loginWithGoogleIdToken(idToken: string): Promise<AuthUser> {
  const client = requireSupabase();
  const { data, error } = await client.auth.signInWithIdToken({ provider: "google", token: idToken });
  if (error) throw error;
  const mapped = mapUser(data.user);
  if (!mapped || !data.user) throw new Error("Không thể đọc thông tin đăng nhập Google.");
  syncRenderProfileInBackground(data.user);
  return mapped;
}

export async function logout(): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
