import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  updateProfile,
  linkWithPopup,
  sendPasswordResetEmail,
  type User as FirebaseUser,
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import type { AuthUser, SignUpData, SignInData, AuthCallback } from './authTypes';

const USERS = 'users';

function toAuthUser(user: FirebaseUser, provider?: 'google' | 'email'): AuthUser {
  return {
    uid: user.uid,
    email: user.email || '',
    displayName: user.displayName || undefined,
    photoURL: user.photoURL,
    provider: provider ?? 'email',
    createdAt: user.metadata.creationTime
      ? new Date(user.metadata.creationTime).getTime()
      : Date.now(),
  };
}

function mapFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/email-already-in-use': 'Email này đã được đăng ký. Hãy đăng nhập hoặc dùng email khác.',
    'auth/invalid-email': 'Định dạng email không hợp lệ.',
    'auth/weak-password': 'Mật khẩu phải có ít nhất 6 ký tự.',
    'auth/wrong-password': 'Mật khẩu không đúng.',
    'auth/user-not-found': 'Tài khoản không tồn tại. Hãy đăng ký trước.',
    'auth/user-disabled': 'Tài khoản đã bị vô hiệu hóa.',
    'auth/too-many-requests': 'Quá nhiều yêu cầu. Vui lòng thử lại sau.',
    'auth/popup-closed-by-user': 'Đã hủy đăng nhập Google.',
    'auth/network-request-failed': 'Lỗi mạng. Kiểm tra kết nối và thử lại.',
    'auth/invalid-credential': 'Email hoặc mật khẩu không đúng.',
    'auth/operation-not-allowed': 'Đăng nhập bằng email chưa được bật. Liên hệ hỗ trợ.',
  };
  return map[code] || 'Đã xảy ra lỗi. Vui lòng thử lại.';
}

async function ensureFirestoreProfile(
  user: FirebaseUser,
  provider: 'google' | 'email',
  displayName?: string,
): Promise<void> {
  const ref = doc(db, USERS, user.uid);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, { updatedAt: serverTimestamp() });
  } else {
    await setDoc(ref, {
      uid: user.uid,
      email: user.email || '',
      displayName: displayName || user.displayName || user.email?.split('@')[0] || '',
      avatar: user.photoURL || '',
      provider,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }
}

export function onAuthChange(callback: AuthCallback): () => void {
  return onAuthStateChanged(auth, async (user) => {
    if (!user) {
      callback(null);
      return;
    }
    const isGoogle = !!user.providerData[0]?.providerId?.includes('google');
    const provider: 'google' | 'email' = isGoogle ? 'google' : 'email';
    callback(toAuthUser(user, provider));
  });
}

export async function signUpWithEmail(data: SignUpData): Promise<AuthUser> {
  const result = await createUserWithEmailAndPassword(auth, data.email, data.password);

  if (data.displayName) {
    await updateProfile(result.user, { displayName: data.displayName });
  }

  await ensureFirestoreProfile(result.user, 'email', data.displayName);
  return toAuthUser(result.user, 'email');
}

export async function signInWithEmail(data: SignInData): Promise<AuthUser> {
  const result = await signInWithEmailAndPassword(auth, data.email, data.password);
  return toAuthUser(result.user, 'email');
}

export async function signInWithGoogle(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');

  const result = await signInWithPopup(auth, provider);
  await ensureFirestoreProfile(result.user, 'google');

  return toAuthUser(result.user, 'google');
}

export async function linkGoogleAccount(): Promise<AuthUser> {
  const provider = new GoogleAuthProvider();
  provider.addScope('https://www.googleapis.com/auth/drive.readonly');
  const result = await linkWithPopup(auth.currentUser!, provider);
  await ensureFirestoreProfile(result.user, 'google');
  return toAuthUser(result.user, 'google');
}

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

export async function sendResetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export { mapFirebaseError };
