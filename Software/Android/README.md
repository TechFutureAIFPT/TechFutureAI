# Support HR Companion Mobile

Expo React Native app isolated in this folder only.

## Project documentation

- [Project and code map](../../Document/01-Tai-Lieu-Du-An/00-BAN-DO-DU-AN.md)
- [Product overview](../../Document/01-Tai-Lieu-Du-An/01-tong-quan-du-an.md)
- [Documentation-code traceability](../../Document/01-Tai-Lieu-Du-An/11-MA-TRAN-TRUY-VET.md)

## Run

```bash
npm install
npm run web
```

## Environment

The app uses Supabase Auth, PostgreSQL/RLS and Realtime:

```bash
EXPO_PUBLIC_SUPABASE_URL=...
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=supporthr://reset-password
```

The mobile app reads owner-scoped tables through Supabase RLS and keeps the existing backend HTTP API for AI and account workflows. The publishable key is safe for the client; never place the service-role key in this app.

Voice-to-text uses `@react-native-voice/voice` on native dev builds. On web it falls back to browser speech recognition when available, otherwise the typed feedback note remains available.
