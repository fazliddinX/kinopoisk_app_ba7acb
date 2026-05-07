import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  updateUser: (partial: Partial<User>) => void;
}

/**
 * Authentication store.
 * Persisted to localStorage automatically via `persist` middleware.
 * AI uses `useAuthStore` to access the current user and token.
 * NEVER read the token from localStorage directly — use this store.
 */
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        // No manual localStorage calls — persist handles it
        set({ user, token, isAuthenticated: true });
      },

      logout: () => {
        // No manual localStorage calls — persist handles it
        set({ user: null, token: null, isAuthenticated: false });
      },

      updateUser: (partial) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...partial } : null,
        })),
    }),
    {
      name: 'auth-storage',
      // CORRECT field name is `partialize`, NOT `partialState`
      // Only persist data fields, never functions
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
);
