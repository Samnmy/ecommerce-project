// ─── Auth Types ───────────────────────────────────────────────
export interface User {
  userId: number;
  name: string;
  email: string;
  role: 'ROLE_USER' | 'ROLE_ADMIN';
  provider: 'local' | 'google';
  avatarUrl?: string;
  token: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginFormData {
  email: string;
  password: string;
}

export interface RegisterFormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ApiAuthResponse {
  status: string;
  message: string;
  data: {
    token: string;
    type: string;
    userId: number;
    name: string;
    email: string;
    role: 'ROLE_USER' | 'ROLE_ADMIN';
    provider: string;
    avatarUrl?: string;
  };
}
