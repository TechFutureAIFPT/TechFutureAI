/**
 * Runtime Configuration for CV Match Support HR Frontend.
 * Public Firebase Web values & Backend API Base URLs.
 */
export const APP_CONFIG = {
  // Port 8000: Core API Server tổng
  apiBaseUrl:
    process.env.NEXT_PUBLIC_API_BASE_URL || "https://backendsupporthr.onrender.com",
  apiFallbackUrl:
    process.env.NEXT_PUBLIC_API_FALLBACK_URL || "https://backendsupporthr.up.railway.app",
  localApiUrl:
    process.env.NEXT_PUBLIC_LOCAL_API_URL || "http://127.0.0.1:8000",

  // Port 8080: Dịch vụ Trợ lý AI Tuyển dụng & Deep Research
  assistantApiBaseUrl:
    process.env.NEXT_PUBLIC_ASSISTANT_API_BASE_URL || "https://supporthr-ai-assistant.onrender.com",
  localAssistantApiUrl:
    process.env.NEXT_PUBLIC_LOCAL_ASSISTANT_API_URL || "http://127.0.0.1:8080",

  // Port 8001: Dịch vụ Chatbot Định hướng Nghề nghiệp & Khảo sát Holland (Career Compass)
  careerCompassApiBaseUrl:
    process.env.NEXT_PUBLIC_CAREER_COMPASS_API_BASE_URL || "https://careercompass-ai-api.vercel.app",
  localCareerCompassApiUrl:
    process.env.NEXT_PUBLIC_LOCAL_CAREER_COMPASS_API_URL || "http://127.0.0.1:8001",

  // Port 5000: Dịch vụ Microservice Phân loại Ngành nghề CV độc lập
  classifierApiBaseUrl:
    process.env.NEXT_PUBLIC_CLASSIFIER_API_BASE_URL || "https://supporthr-classifier-service.onrender.com",
  localClassifierApiUrl:
    process.env.NEXT_PUBLIC_LOCAL_CLASSIFIER_API_URL || "http://127.0.0.1:5000",

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
