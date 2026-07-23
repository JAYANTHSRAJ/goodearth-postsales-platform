import { create } from 'zustand';

export type UserRole = 'admin' | 'buyer' | 'employee' | string;

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  onboardingStage?: string;
}

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string, user: User) => void;
  logout: () => void;
  updateUser: (user: Partial<User>) => void;
}

const storedAccessToken = localStorage.getItem('accessToken');
const storedRefreshToken = localStorage.getItem('refreshToken');
const storedUserStr = localStorage.getItem('user');
let parsedUser: User | null = null;

try {
  if (storedUserStr) {
    parsedUser = JSON.parse(storedUserStr);
  }
} catch (e) {
  console.error('Failed to parse stored user session data', e);
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: !!storedAccessToken,
  user: parsedUser,
  accessToken: storedAccessToken,
  refreshToken: storedRefreshToken,
  login: (accessToken, refreshToken, user) => {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({
      isAuthenticated: true,
      accessToken,
      refreshToken,
      user,
    });
  },
  logout: () => {
    localStorage.clear();
    sessionStorage.clear();
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
    });
  },
  updateUser: (updatedFields) => {
    set((state) => {
      if (!state.user) return state;
      const newUser = { ...state.user, ...updatedFields };
      localStorage.setItem('user', JSON.stringify(newUser));
      return { user: newUser };
    });
  },
}));
