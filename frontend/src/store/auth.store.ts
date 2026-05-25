import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

// Session expires after 2 hours of inactivity
const SESSION_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  lastActivity: number | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  checkSession: () => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      lastActivity: null,

      login: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token, isAuthenticated: true, lastActivity: Date.now() });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null, isAuthenticated: false, lastActivity: null });
      },

      updateUser: (user) => {
        set({ user, lastActivity: Date.now() });
      },

      checkSession: () => {
        const { lastActivity, isAuthenticated } = get();
        if (!isAuthenticated || !lastActivity) return false;

        const elapsed = Date.now() - lastActivity;
        if (elapsed > SESSION_DURATION_MS) {
          // Session expired
          get().logout();
          return false;
        }

        // Session valid - update activity timestamp
        set({ lastActivity: Date.now() });
        return true;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
        lastActivity: state.lastActivity,
      }),
    },
  ),
);
