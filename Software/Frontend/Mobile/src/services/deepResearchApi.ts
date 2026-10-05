// Self-contained client for the standalone ai-assistant backend
// (Software/backend/ai-assistant), specifically its deep-research feature.
//
// Deliberately does NOT import from ./auth or ./renderStore — those currently
// have a dangling import (renderClient.ts/renderStore.ts were removed pending
// a new API integration) and would fail to bundle. This file owns its own
// minimal Firebase auth reference so the deep-research screen works on its own.
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const defaultFirebaseConfig = {
  apiKey: "AIzaSyCddND9ciUpeL3xTpWTUMyQ0TG9FyUCdiU",
  authDomain: "gen-lang-client-0595612537.firebaseapp.com",
  projectId: "gen-lang-client-0595612537",
  storageBucket: "gen-lang-client-0595612537.firebasestorage.app",
  messagingSenderId: "1022447215307",
  appId: "1:1022447215307:web:5fbf39694b90d420d2314e"
};

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || defaultFirebaseConfig.apiKey,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || defaultFirebaseConfig.authDomain,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || defaultFirebaseConfig.projectId,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || defaultFirebaseConfig.storageBucket,
  messagingSenderId:
    process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || defaultFirebaseConfig.messagingSenderId,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || defaultFirebaseConfig.appId
};

const AI_ASSISTANT_BASE_URL =
  process.env.EXPO_PUBLIC_AI_ASSISTANT_URL?.trim() || "https://supporthr-ai-assistant.onrender.com";

async function getIdToken(): Promise<string | null> {
  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  const auth = getAuth(app);
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export type DeepResearchSource = {
  title: string;
  url: string;
  content: string;
  score: number;
};

export type DeepResearchResult = {
  question: string;
  report: string;
  sources: DeepResearchSource[];
  queries: string[];
};

export class DeepResearchAuthError extends Error {}

export async function runDeepResearch(question: string): Promise<DeepResearchResult> {
  const token = await getIdToken();
  if (!token) {
    throw new DeepResearchAuthError("Cần đăng nhập để dùng tính năng nghiên cứu ngành nghề.");
  }

  const response = await fetch(`${AI_ASSISTANT_BASE_URL}/api/assistant/deep-research`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({ question })
  });

  if (!response.ok) {
    let detail = `Lỗi máy chủ (${response.status}).`;
    try {
      const body = await response.json();
      detail = body?.detail || detail;
    } catch {
      // Ignore body parse failure, keep default detail message.
    }
    throw new Error(detail);
  }

  return (await response.json()) as DeepResearchResult;
}
