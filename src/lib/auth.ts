// src/lib/auth.ts
// Session store (Zustand) + the single source of truth for where each role
// lands after login. Pure client state; never mirrors server data.

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { registerAuthBridge } from "./api/client";
import { login as apiLogin, register as apiRegister } from "./api/auth";
import type { LoginRequest, RegisterCandidateRequest, Role } from "./types";
import type { AuthResponse } from "./types";

export interface SessionUser {
  role: Role;
  fullName: string;
}

/** The home route for each role — used by login and by the group guards. */
export function homeForRole(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "/admin";
    case "REVIEWER":
      return "/pool";
    case "CANDIDATE":
    default:
      return "/dashboard";
  }
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  ready: boolean;
  login: (input: LoginRequest) => Promise<SessionUser>;
  register: (input: RegisterCandidateRequest) => Promise<SessionUser>;
  logout: () => void;
  _setReady: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      ready: false,

      login: async (input) => {
        const r = await apiLogin(input);
        const user: SessionUser = { role: r.role, fullName: r.fullName };
        set({ token: r.token, user });
        return user;
      },

      register: async (input) => {
        const r = await apiRegister(input);
        const user: SessionUser = { role: r.role, fullName: r.fullName };
        set({ token: r.token, user });
        return user;
      },

      logout: () => set({ token: null, user: null }),

      _setReady: () => set({ ready: true }),
    }),
    {
      name: "pc-auth",
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => state?._setReady(),
    }
  )
);

export function useAuth() {
  return useAuthStore();
}

registerAuthBridge({
  getToken: () => useAuthStore.getState().token,
  onSessionExpired: () => {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      window.location.assign("/login?expired=1");
    }
  },
});
