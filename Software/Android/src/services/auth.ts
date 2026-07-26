import { Platform } from "react-native";
import { getApps, initializeApp } from "firebase/app";
import {
  createUserWithEmailAndPassword,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithCredential,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type User
} from "firebase/auth";

import type { AuthUser } from "../types";
import { fetchRenderUserProfile, upsertRenderUserProfile } from "./renderStore";

const defaultFirebaseConfig = {
  apiKey: "AIzaSyCddND9ciUpeL3xTpWTUMyQ0TG9FyUCdiU",
  authDomain: "gen-lang-client-0595612537.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0595612537-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0595612537",
  storageBucket: "gen-lang-client-0595612537.firebasestorage.app",
  messagingSenderId: "1022447215307",
  appId: "1:1022447215307:web:5fbf39694b90d420d2314e",
  measurementId: "G-9YGZ8Z594C"
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || defaultFirebaseConfig.databaseURL,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId,
  measurementId: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID || defaultFirebaseConfig.measurementId
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId
);

export const firebaseApp = isFirebaseConfigured
  ? getApps()[0] ?? initializeApp(firebaseConfig)
  : null;

export const auth = firebaseApp ? getAuth(firebaseApp) : null;

function mapUser(user: User | null): AuthUser | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email || "",
    displayName: user.displayName,
    photoUrl: user.photoURL
  };
}

async function mapUserWithProfile(user: User | null): Promise<AuthUser | null> {
  const mapped = mapUser(user);
  if (!user || !mapped) return mapped;
  try {
    const token = await user.getIdToken();
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

function requireFirebaseAuth() {
  if (!auth) {
    throw new Error("Firebase chưa được cấu hình cho ứng dụng mobile.");
  }
  return auth;
}

export function subscribeAuth(callback: (user: AuthUser | null) => void) {
  if (!auth) {
    callback(null);
    return () => undefined;
  }
  return onAuthStateChanged(auth, (user) => {
    callback(mapUser(user));
    if (user) syncRenderProfileInBackground(user);
  });
}

export async function getAuthToken(): Promise<string | null> {
  if (!auth?.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export async function loginWithEmail(email: string, password: string): Promise<AuthUser> {
  const client = requireFirebaseAuth();
  const credential = await signInWithEmailAndPassword(client, email.trim(), password);
  const mapped = mapUser(credential.user);
  if (!mapped) throw new Error("Không thể đọc thông tin đăng nhập.");
  syncRenderProfileInBackground(credential.user);
  return mapped;
}

export async function registerWithEmail(email: string, password: string): Promise<AuthUser> {
  const client = requireFirebaseAuth();
  const credential = await createUserWithEmailAndPassword(client, email.trim(), password);
  const mapped = mapUser(credential.user);
  if (!mapped) throw new Error("Không thể đọc thông tin tài khoản mới.");
  syncRenderProfileInBackground(credential.user);
  return mapped;
}

export async function resetPasswordEmail(email: string): Promise<void> {
  await sendPasswordResetEmail(requireFirebaseAuth(), email.trim());
}

export async function loginWithGoogle(): Promise<AuthUser> {
  const client = requireFirebaseAuth();
  if (Platform.OS !== "web") {
    throw new Error("Đăng nhập Google trên Android sử dụng Google ID token của ứng dụng.");
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await signInWithPopup(client, provider);
  const mapped = mapUser(credential.user);
  if (!mapped) throw new Error("Không thể đọc thông tin đăng nhập Google.");
  syncRenderProfileInBackground(credential.user);
  return mapped;
}

export async function loginWithGoogleIdToken(idToken: string): Promise<AuthUser> {
  const client = requireFirebaseAuth();
  const credential = GoogleAuthProvider.credential(idToken);
  const userCredential = await signInWithCredential(client, credential);
  const mapped = mapUser(userCredential.user);
  if (!mapped) throw new Error("Không thể đọc thông tin đăng nhập Google.");
  syncRenderProfileInBackground(userCredential.user);
  return mapped;
}

export async function logout(): Promise<void> {
  if (auth) await signOut(auth);
}
