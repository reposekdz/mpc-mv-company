import { create } from "zustand";
import type { User } from "../types";

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; role?: string }>;
  logout: () => void;
  fetchCurrentUser: () => Promise<boolean>;
  clearError: () => void;
  isManager: () => boolean;
  isAdmin: () => boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export const useAuthStore = create<AuthState>((set, get) => ({
  isAuthenticated: !!localStorage.getItem("accessToken"),
  user: null,
  accessToken: localStorage.getItem("accessToken"),
  refreshToken: localStorage.getItem("refreshToken"),
  loading: false,
  error: null,

  login: async (email: string, password: string): Promise<{ success: boolean; role?: string }> => {
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
        return { success: false };
      }

      // Verify user has manager/admin role
      if (!['manager', 'admin'].includes(data.user.role)) {
        set({ error: "Access denied. Only managers and admins can access this dashboard.", loading: false });
        return { success: false };
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

      return { success: true, role: data.user.role };
    } catch (error) {
      set({ error: "Network error. Please try again.", loading: false });
      return { success: false };
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

  fetchCurrentUser: async (): Promise<boolean> => {
    const { accessToken } = get();
    if (!accessToken) return false;

    try {
      const response = await fetch(`${API_BASE}/auth/me`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (response.ok) {
        const data = await response.json();
        // Verify role on fetch
        if (!['manager', 'admin'].includes(data.user.role)) {
          get().logout();
          return false;
        }
        set({ user: data.user });
        return true;
      } else {
        get().logout();
        return false;
      }
    } catch {
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
}));

// Initialize user data on store load
if (localStorage.getItem("accessToken")) {
  useAuthStore.getState().fetchCurrentUser();
}
