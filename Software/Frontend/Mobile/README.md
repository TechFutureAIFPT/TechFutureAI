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

The app uses Firebase Authentication, Cloud Firestore security rules and realtime listeners:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=gen-lang-client-0595612537
EXPO_PUBLIC_FIREBASE_APP_ID=...
EXPO_PUBLIC_PASSWORD_RESET_REDIRECT_URL=supporthr://reset-password
```

The mobile app reads owner-scoped collections through Firestore security rules and keeps the backend HTTP API for AI and account workflows. Firebase client configuration is public; never place a Firebase Admin service-account key in this app.

Voice-to-text uses `@react-native-voice/voice` on native dev builds. On web it falls back to browser speech recognition when available, otherwise the typed feedback note remains available.
