/**
 * Runtime Configuration for CV Match Support HR Frontend.
 * Public Firebase Web values & Backend API Base URLs.
 */
export const APP_CONFIG = {
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://backendsupporthr.onrender.com",
  apiFallbackUrl:
    process.env.NEXT_PUBLIC_API_FALLBACK_URL || "https://backendsupporthr.up.railway.app",
  localApiUrl:
    process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://127.0.0.1:8000",
  // Dịch vụ AI assistant độc lập (session chat + deep research) — deploy, key
  // Gemini và process riêng, không chung với backend cv-match-api ở trên.
  assistantApiBaseUrl:
    process.env.NEXT_PUBLIC_ASSISTANT_API_BASE_URL || "https://supporthr-ai-assistant.onrender.com",

  firebase: {
    apiKey:
      process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "AIzaSyCddND9ciUpeL3xTpWTUMyQ0TG9FyUCdiU",
    authDomain:
      process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "gen-lang-client-0595612537.firebaseapp.com",
    projectId:
      process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "gen-lang-client-0595612537",
    appId:
      process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:1022447215307:web:5fbf39694b90d420d2314e",
    storageBucket:
      process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "gen-lang-client-0595612537.firebasestorage.app",
    messagingSenderId:
      process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "1022447215307",
    measurementId:
      process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "G-9YGZ8Z594C",
  },

  requestTimeoutMs: 30000,
  analysisPollTimeoutMs: 600000,
  demoMode: false,
};
