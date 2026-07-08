import { create } from 'zustand';
import { User, AuthTokens } from '../types';
import { storage } from '../utils/storage';
import { authApi } from '../api/auth.api';
import { getErrorMessage } from '../api/client';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isInitialized: boolean;
  error: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,

  // ─── Initialize: restore session from storage ────────────────────────────
  initialize: async () => {
    try {
      const [accessToken, user] = await Promise.all([
        storage.getAccessToken(),
        storage.getUser<User>(),
      ]);

      if (accessToken && user) {
        // Verify token is still valid by calling /me
        try {
          const freshUser = await authApi.getMe();
          await storage.setUser(freshUser);
          set({ user: freshUser, isAuthenticated: true });
        } catch {
          // Token invalid — clear storage
          await storage.clearAll();
          set({ user: null, isAuthenticated: false });
        }
      }
    } catch (error) {
      set({ user: null, isAuthenticated: false });
    } finally {
      set({ isInitialized: true });
    }
  },

  // ─── Login ────────────────────────────────────────────────────────────────
  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await authApi.login({ email, password });
      await storage.setAccessToken(tokens.accessToken);
      await storage.setRefreshToken(tokens.refreshToken);
      await storage.setUser(user);
      set({ user, isAuthenticated: true });
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Register ─────────────────────────────────────────────────────────────
  register: async (name: string, email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const { user, tokens } = await authApi.register({ name, email, password });
      await storage.setAccessToken(tokens.accessToken);
      await storage.setRefreshToken(tokens.refreshToken);
      await storage.setUser(user);
      set({ user, isAuthenticated: true });
    } catch (error) {
      set({ error: getErrorMessage(error) });
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout: async () => {
    set({ isLoading: true });
    try {
      const refreshToken = await storage.getRefreshToken();
      if (refreshToken) {
        await authApi.logout(refreshToken).catch(() => {}); // Don't block on server error
      }
    } finally {
      await storage.clearAll();
      const { useAccountStore } = require('./account.store');
      useAccountStore.getState().clearAccountState();
      set({ user: null, isAuthenticated: false, isLoading: false, error: null });
    }
  },

  setUser: (user: User) => {
    set({ user });
    storage.setUser(user).catch(() => {});
  },

  clearError: () => set({ error: null }),
}));
