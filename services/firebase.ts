import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
const firebaseConfig = {
  apiKey: "AIzaSyCddND9ciUpeL3xTpWTUMyQ0TG9FyUCdiU",
  authDomain: "gen-lang-client-0595612537.firebaseapp.com",
  databaseURL: "https://gen-lang-client-0595612537-default-rtdb.firebaseio.com",
  projectId: "gen-lang-client-0595612537",
  storageBucket: "gen-lang-client-0595612537.firebasestorage.app",
  messagingSenderId: "1022447215307",
  appId: "1:1022447215307:web:5fbf39694b90d420d2314e",
  measurementId: "G-9YGZ8Z594C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
// Initialize Firebase App Check with reCAPTCHA v3 using provided site key
try {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('6LfPgyksAAAAAFZUVhfmSQ_4XuOVU3c-G2KJGnXH'),
    isTokenAutoRefreshEnabled: true,
  });
} catch (e) {
  // Fail gracefully in non-browser environments (SSR/tests)
  // eslint-disable-next-line no-console
  console.warn('App Check initialization skipped:', e);
}
export const auth = getAuth(app);
export const db = getFirestore(app);
