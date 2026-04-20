import { create } from "zustand";

interface AuthState {
  isAuthenticated: boolean;
  userEmail: string | null;
  error: string | null;
  login: (email: string, passcode: string) => boolean;
  logout: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  userEmail: null,
  error: null,
  login: (email: string, passcode: string) => {
    if (email === "manager@gmail.com" && passcode === "2026") {
      set({ isAuthenticated: true, userEmail: email, error: null });
      return true;
    }
    set({ error: "Invalid credentials. Please try again." });
    return false;
  },
  logout: () => {
    set({ isAuthenticated: false, userEmail: null, error: null });
  },
  clearError: () => set({ error: null }),
}));
