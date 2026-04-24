import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types";
import { authApi, api } from "@/lib/api";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  tokenExpiry: number | null;
  refreshInProgress: boolean;

  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<boolean>;
  clearError: () => void;
  ensureValidToken: () => Promise<boolean>;
  makeAuthenticatedRequest: <T>(url: string, options?: RequestInit) => Promise<{ data: T | null; error: string | null }>;
  isTokenExpired: () => boolean;
  getTokenExpiryTime: () => number | null;
  isManager: () => boolean;
  isAdmin: () => boolean;
  hasRole: (role: User['role']) => boolean;
}

const isBrowser = typeof window !== 'undefined';

const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try { localStorage.setItem(key, value); } catch {}
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try { localStorage.removeItem(key); } catch {}
  }
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      loading: false,
      error: null,
      tokenExpiry: null,
      refreshInProgress: false,

      login: async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
        set({ loading: true, error: null });
        try {
          // authApi.login() uses api.post() which automatically unwraps { success, data: {...} }
          // Returns: { user, accessToken, refreshToken, expiresIn, company }
          const data = await authApi.login({ email, password });

          if (!data?.user || !data?.accessToken) {
            set({ error: "Invalid response from server. Please contact administrator.", loading: false });
            return { success: false };
          }

          if (!['manager', 'admin'].includes(data.user.role)) {
            set({ error: "Inzira yanzwe. Abayobozi gusa barashobora kwinjira.", loading: false });
            return { success: false };
          }

          // Sync token to api client for subsequent calls
          api.setToken(data.accessToken);

          const tokenExpiry = Date.now() + ((data.expiresIn || 86400) * 1000);

          set({
            isAuthenticated: true,
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            loading: false,
            error: null,
            tokenExpiry,
          });

          return { success: true, role: data.user.role };
        } catch (error: any) {
          console.error('Login error:', error);
          const msg = error?.message || "Ikosa rya murandasi. Reba imiyoboro yawe.";
          set({ error: msg, loading: false });
          return { success: false };
        }
      },

      logout: async (): Promise<void> => {
        const { accessToken } = get();
        try {
          if (accessToken) {
            await authApi.getCurrentUser().catch(() => {});
          }
        } catch {}

        api.setToken(null);
        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          loading: false,
          tokenExpiry: null,
        });
      },

      refreshToken: async (): Promise<boolean> => {
        const { refreshToken: storedToken, refreshInProgress } = get();
        if (!storedToken || refreshInProgress) return false;

        set({ refreshInProgress: true });
        try {
          const data = await authApi.refresh(storedToken);

          if (!data?.accessToken) {
            await get().logout();
            return false;
          }

          api.setToken(data.accessToken);
          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || storedToken,
            tokenExpiry: Date.now() + 86400 * 1000,
            refreshInProgress: false,
          });
          return true;
        } catch {
          set({ refreshInProgress: false });
          await get().logout();
          return false;
        }
      },

      fetchCurrentUser: async (): Promise<boolean> => {
        const { accessToken } = get();
        if (!accessToken) return false;

        try {
          api.setToken(accessToken);
          const data = await authApi.getCurrentUser();

          const user = (data as any)?.user || data;
          if (!user?.role) {
            await get().logout();
            return false;
          }

          if (!['manager', 'admin'].includes(user.role)) {
            await get().logout();
            return false;
          }

          set({ user });
          return true;
        } catch (error: any) {
          if (error?.status === 401) {
            const refreshed = await get().refreshToken();
            if (refreshed) return get().fetchCurrentUser();
          }
          return false;
        }
      },

      ensureValidToken: async (): Promise<boolean> => {
        const { accessToken, tokenExpiry, isTokenExpired } = get();
        if (!accessToken) return false;
        if (isTokenExpired()) return get().refreshToken();
        return true;
      },

      makeAuthenticatedRequest: async <T>(url: string, options?: RequestInit) => {
        const { accessToken } = get();
        if (!accessToken) return { data: null, error: 'Not authenticated' };

        try {
          const response = await fetch(url, {
            ...options,
            headers: {
              ...options?.headers,
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
          });

          const json = await response.json().catch(() => ({}));
          if (!response.ok) return { data: null, error: json.message || json.error || 'Request failed' };
          return { data: (json.data ?? json) as T, error: null };
        } catch (error: any) {
          return { data: null, error: error.message || 'Network error' };
        }
      },

      isTokenExpired: () => {
        const { tokenExpiry } = get();
        if (!tokenExpiry) return false;
        return Date.now() > tokenExpiry - 5 * 60 * 1000; // 5 min buffer
      },

      getTokenExpiryTime: () => get().tokenExpiry,

      clearError: () => set({ error: null }),

      isManager: () => {
        const { user } = get();
        return user?.role === 'manager' || user?.role === 'admin';
      },

      isAdmin: () => get().user?.role === 'admin',

      hasRole: (role: User['role']) => get().user?.role === role,
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => ({
        getItem: safeLocalStorage.getItem,
        setItem: safeLocalStorage.setItem,
        removeItem: safeLocalStorage.removeItem,
      })),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        tokenExpiry: state.tokenExpiry,
      }),
      skipHydration: true,
      version: 2,
    }
  )
);

// Initialize auth after hydration
if (isBrowser) {
  setTimeout(async () => {
    try {
      useAuthStore.persist.rehydrate();
      const state = useAuthStore.getState();
      if (state.accessToken) {
        api.setToken(state.accessToken);
        if (state.isTokenExpired()) {
          await state.refreshToken();
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  }, 50);
}
