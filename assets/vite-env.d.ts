/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string
  readonly DEV: boolean
  readonly PROD: boolean
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_GEMINI_API_KEY_1: string
  readonly VITE_GEMINI_API_KEY_2: string
  readonly VITE_GEMINI_API_KEY_3: string
  readonly VITE_GEMINI_API_KEY_4: string
  readonly VITE_OPENAI_API_KEY: string
  readonly VITE_OPENAI_MODEL: string
  readonly VITE_GOOGLE_API_KEY: string
  readonly VITE_GOOGLE_PICKER_API_KEY: string
  readonly VITE_GOOGLE_CLOUD_VISION_API_KEY: string
  readonly VITE_GOOGLE_PICKER_CLIENT_ID: string
  readonly VITE_GOOGLE_PICKER_APP_ID: string
  readonly VITE_GEMINI_API_KEY: string
  readonly VITE_APP_NAME: string
  readonly VITE_APP_VERSION: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}