# Support HR Companion Mobile

Expo React Native app isolated in this folder only.

## Run

```bash
npm install
npm run web
```

## Environment

Firebase config is bundled from the Support HR web Firebase project. Override only if you switch Firebase project:

```bash
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

The mobile app reads/writes Firestore directly for account data, inbox history, feedback, and JD templates. It does not require any external backend URL or backend API key.

Voice-to-text uses `@react-native-voice/voice` on native dev builds. On web it falls back to browser speech recognition when available, otherwise the typed feedback note remains available.
