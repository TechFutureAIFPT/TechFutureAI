/// <reference types="vite/client" />

interface ImportMetaEnv {
  // ── Gemini API (key rotation, xem .env.example) ───────────────────────────
  readonly VITE_GEMINI_API_KEY_1: string
  readonly VITE_GEMINI_API_KEY_2: string
  readonly VITE_GEMINI_API_KEY_3?: string   // tuỳ chọn — thêm nếu muốn xoay nhiều key hơn
  readonly VITE_GEMINI_API_KEY_4?: string
  readonly VITE_GEMINI_API_KEY?: string     // alias legacy — dùng _1/_2 là chuẩn

  // ── OpenAI (fallback, gọi qua proxy /api/openai-chat) ─────────────────────
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_MODEL: string        // mặc định: gpt-4o-mini

  // ── Google APIs (Drive Picker, Vision OCR) ────────────────────────────────
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GOOGLE_PICKER_API_KEY: string
  readonly VITE_GOOGLE_CLOUD_VISION_API_KEY: string
  readonly VITE_GOOGLE_PICKER_CLIENT_ID: string
  readonly VITE_GOOGLE_PICKER_APP_ID: string

  // ── Firebase ──────────────────────────────────────────────────────────────
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}