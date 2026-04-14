import type { User } from 'firebase/auth';

export interface AuthUser {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string | null;
  provider: 'google' | 'email';
  createdAt: number;
}

export interface AuthError {
  code: string;
  message: string;
}

export type AuthCallback = (user: AuthUser | null) => void;

export type AuthState = 'idle' | 'loading' | 'success' | 'error';

export interface SignUpData {
  email: string;
  password: string;
  displayName?: string;
}

export interface SignInData {
  email: string;
  password: string;
}
