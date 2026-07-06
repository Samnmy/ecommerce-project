import api from '@/lib/api';
import type { ApiAuthResponse, LoginFormData, RegisterFormData, User } from '@/types/auth';

const TOKEN_KEY = 'authToken';
const USER_KEY = 'authUser';

// ─── Helpers de persistencia ──────────────────────────────────
export function saveSession(authData: ApiAuthResponse['data']): User {
  const user: User = {
    userId: authData.userId,
    name: authData.name,
    email: authData.email,
    role: authData.role,
    provider: authData.provider as 'local' | 'google',
    avatarUrl: authData.avatarUrl,
    token: authData.token,
  };
  localStorage.setItem(TOKEN_KEY, authData.token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  return user;
}

export function getStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

// ─── API calls ────────────────────────────────────────────────
export async function registerUser(data: RegisterFormData): Promise<User> {
  const res = await api.post<ApiAuthResponse>('/auth/register', {
    name: data.name,
    email: data.email,
    password: data.password,
  });
  return saveSession(res.data.data);
}

export async function loginUser(data: LoginFormData): Promise<User> {
  const res = await api.post<ApiAuthResponse>('/auth/login', {
    email: data.email,
    password: data.password,
  });
  return saveSession(res.data.data);
}

export async function loginWithGoogle(idToken: string): Promise<User> {
  const res = await api.post<ApiAuthResponse>('/auth/google', { idToken });
  return saveSession(res.data.data);
}

export async function getProfile(): Promise<User> {
  const res = await api.get('/auth/profile');
  return res.data.data;
}
