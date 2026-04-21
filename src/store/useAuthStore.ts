import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem("accessToken"),
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  loading: false,
  error: null,

  login: async (email: string, password: string): Promise<boolean> => {
    set({ loading: true, error: null });
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        set({ error: data.message || data.error || "Login failed", loading: false });
        return false;
      }

      localStorage.setItem("accessToken", data.accessToken);
      localStorage.setItem("refreshToken", data.refreshToken);

      set({
        isAuthenticated: true,
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        loading: false,
        error: null,
      });

      return true;
    } catch (error) {
      set({ error: "Network error. Please try again.", loading: false });
      return false;
    }
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    set({
      isAuthenticated: false,
      user: null,
      accessToken: null,
      refreshToken: null,
      error: null,
    });
  },

  fetchCurrentUser: async () => {
    const { accessToken } = get();
    if (!accessToken) return;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        set({ user: data.user });
      } else {
        get().logout();
      }
    } catch {
      // Silent fail - will retry on next load
    }
  },

  clearError: () => set({ error: null }),
}));

// Initialize user data on store load
if (localStorage.getItem("accessToken")) {
  useAuthStore.getState().fetchCurrentUser();
}
