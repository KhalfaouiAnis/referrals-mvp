import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole } from "@referrals/shared";

interface AuthUser {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: AuthUser, token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem("access_token", accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      clearAuth: () => {
        localStorage.removeItem("access_token");
        set({ user: null, accessToken: null, isAuthenticated: false });
      },
    }),
    {
      name: "referrals-auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
