import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "../types";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  tokenExpiry: number | null; // Timestamp when access token expires
  refreshInProgress: boolean; // Prevent multiple concurrent refresh attempts

  // Auth actions
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<boolean>;
  fetchCurrentUser: () => Promise<boolean>;
  clearError: () => void;

  // Advanced auth methods
  ensureValidToken: () => Promise<boolean>; // Automatically refresh if needed
  makeAuthenticatedRequest: <T>(
    url: string,
    options?: RequestInit
  ) => Promise<{ data: T | null; error: string | null }>;
  isTokenExpired: () => boolean;
  getTokenExpiryTime: () => number | null;

  // Helper methods
  isManager: () => boolean;
  isAdmin: () => boolean;
  hasRole: (role: User['role']) => boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "/api";

// Helper function to check if we're in a browser environment
const isBrowser = typeof window !== 'undefined';

// Helper function to safely access localStorage
const safeLocalStorage = {
  getItem: (key: string): string | null => {
    if (!isBrowser) return null;
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.setItem(key, value);
    } catch {
      // Ignore localStorage errors
    }
  },
  removeItem: (key: string): void => {
    if (!isBrowser) return;
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignore localStorage errors
    }
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
          const response = await fetch(`${API_BASE}/auth/login`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify({ email, password }),
            credentials: 'include',
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Network error' }));
            const errorMessage = errorData.message || errorData.error || `HTTP ${response.status}: ${response.statusText}`;
            set({ error: errorMessage, loading: false });
            return { success: false };
          }

          const data = await response.json();

          if (!data.user || !data.accessToken) {
            set({ error: "Invalid response from server", loading: false });
            return { success: false };
          }

          // Verify user has manager/admin role
          if (!['manager', 'admin'].includes(data.user.role)) {
            set({ error: "Access denied. Only managers and admins can access this dashboard.", loading: false });
            return { success: false };
          }

          set({
            isAuthenticated: true,
            user: data.user,
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            loading: false,
            error: null,
          });

          return { success: true, role: data.user.role };
        } catch (error: any) {
          console.error('Login error:', error);
          const errorMessage = error.message || "Network error. Please check your connection and try again.";
          set({ error: errorMessage, loading: false });
          return { success: false };
        }
      },

      logout: async (): Promise<void> => {
        const state = get();

        try {
          if (state.accessToken) {
            await fetch(`${API_BASE}/auth/logout`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${state.accessToken}`,
                'Content-Type': 'application/json',
              },
              credentials: 'include',
            }).catch(() => {
              // Ignore logout API errors
            });
          }
        } catch (error) {
          // Ignore logout errors
        }

        set({
          isAuthenticated: false,
          user: null,
          accessToken: null,
          refreshToken: null,
          error: null,
          loading: false,
        });
      },

      refreshToken: async (): Promise<boolean> => {
        const { refreshToken: storedRefreshToken } = get();

        if (!storedRefreshToken) {
          return false;
        }

        try {
          const response = await fetch(`${API_BASE}/auth/refresh`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            body: JSON.stringify({ refreshToken: storedRefreshToken }),
            credentials: 'include',
          });

          if (!response.ok) {
            // Refresh failed, logout user
            await get().logout();
            return false;
          }

          const data = await response.json();

          if (!data.accessToken) {
            await get().logout();
            return false;
          }

          set({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken || storedRefreshToken,
          });

          return true;
        } catch (error) {
          console.error('Token refresh error:', error);
          await get().logout();
          return false;
        }
      },

      fetchCurrentUser: async (): Promise<boolean> => {
        const { accessToken } = get();

        if (!accessToken) {
          return false;
        }

        try {
          const response = await fetch(`${API_BASE}/auth/me`, {
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Accept': 'application/json'
            },
            credentials: 'include',
          });

          if (response.ok) {
            const data = await response.json();

            if (!data.user) {
              await get().logout();
              return false;
            }

            // Verify role on fetch
            if (!['manager', 'admin'].includes(data.user.role)) {
              await get().logout();
              return false;
            }

            set({ user: data.user });
            return true;
          } else if (response.status === 401) {
            // Try to refresh token
            const refreshed = await get().refreshToken();
            if (refreshed) {
              return get().fetchCurrentUser();
            }
            return false;
          } else {
            // Other error, logout
            await get().logout();
            return false;
          }
        } catch (error) {
          console.error('Fetch user error:', error);
          // On network errors, don't logout immediately, but return false
          return false;
        }
      },

      clearError: () => set({ error: null }),

      isManager: () => {
        const user = get().user;
        return user?.role === 'manager' || user?.role === 'admin';
      },

      isAdmin: () => {
        const user = get().user;
        return user?.role === 'admin';
      },

      hasRole: (role: User['role']) => {
        const user = get().user;
        return user?.role === role;
      },
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
      }),
      skipHydration: true, // Prevent SSR hydration issues
      version: 1,
    }
  )
);

// Initialize user data after hydration (only in browser)
if (isBrowser) {
  const initAuth = async () => {
    try {
      const state = useAuthStore.getState();

      // If we have tokens but no user data, fetch it
      if (state.accessToken && !state.user) {
        await state.fetchCurrentUser();
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    }
  };

  // Wait for next tick to ensure store is hydrated
  setTimeout(initAuth, 100);
}
