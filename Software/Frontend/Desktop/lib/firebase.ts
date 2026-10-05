import { initializeApp, getApps, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  type Auth,
  type User,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  updateProfile as updateFirebaseProfile,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { APP_CONFIG } from "./config";

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;

export function getFirebaseApp(): FirebaseApp | null {
  if (typeof window === "undefined") return null;
  if (!firebaseApp) {
    const existing = getApps();
    if (existing.length > 0) {
      firebaseApp = existing[0];
    } else {
      firebaseApp = initializeApp(APP_CONFIG.firebase);
    }
  }
  return firebaseApp;
}

export function getFirebaseAuth(): Auth | null {
  if (typeof window === "undefined") return null;
  if (!firebaseAuth) {
    const app = getFirebaseApp();
    if (app) {
      firebaseAuth = getAuth(app);
    }
  }
  return firebaseAuth;
}

export async function getCurrentIdToken(forceRefresh = false): Promise<string | null> {
  try {
    const auth = getFirebaseAuth();
    if (!auth || !auth.currentUser) return null;
    return await auth.currentUser.getIdToken(forceRefresh);
  } catch {
    return null;
  }
}

export async function signInWithEmail(email: string, pass: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth chưa sẵn sàng");
  const cred = await signInWithEmailAndPassword(auth, email, pass);
  return cred.user;
}

export async function signInWithGoogle(): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth chưa sẵn sàng");
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const cred = await signInWithPopup(auth, provider);
  return cred.user;
}

export async function registerWithEmail(email: string, pass: string, displayName?: string): Promise<User> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth chưa sẵn sàng");
  const cred = await createUserWithEmailAndPassword(auth, email, pass);
  if (displayName) {
    await updateFirebaseProfile(cred.user, { displayName });
  }
  return cred.user;
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) throw new Error("Firebase Auth chưa sẵn sàng");
  await sendPasswordResetEmail(auth, email);
}

export async function signOutUser(): Promise<void> {
  const auth = getFirebaseAuth();
  if (!auth) return;
  await signOut(auth);
}

export function observeAuth(callback: (user: User | null) => void): (() => void) | null {
  const auth = getFirebaseAuth();
  if (!auth) return null;
  return onAuthStateChanged(auth, callback);
}

export function mapAuthError(error: unknown): string {
  const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
  switch (code) {
    case "auth/invalid-email":
      return "Địa chỉ email không hợp lệ.";
    case "auth/user-disabled":
      return "Tài khoản đã bị khóa. Vui lòng liên hệ quản trị viên.";
    case "auth/user-not-found":
    case "auth/wrong-password":
    case "auth/invalid-credential":
    case "auth/invalid-login-credentials":
      return "Email hoặc mật khẩu không đúng.";
    case "auth/too-many-requests":
      return "Đăng nhập sai quá nhiều lần. Vui lòng thử lại sau ít phút.";
    case "auth/email-already-in-use":
      return "Email này đã được đăng ký tài khoản.";
    case "auth/weak-password":
      return "Mật khẩu quá yếu; cần tối thiểu 6 ký tự.";
    case "auth/popup-blocked":
      return "Trình duyệt đã chặn cửa sổ đăng nhập popup.";
    case "auth/popup-closed-by-user":
      return "Cửa sổ đăng nhập đã bị đóng trước khi hoàn tất.";
    case "auth/network-request-failed":
      return "Không kết nối được tới dịch vụ xác thực Firebase. Vui lòng kiểm tra mạng.";
    default:
      return error instanceof Error ? error.message : "Đăng nhập không thành công. Vui lòng thử lại.";
  }
}
