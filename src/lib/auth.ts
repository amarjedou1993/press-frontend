// src/lib/auth.ts
// Session store (Zustand). Pure client state; never mirrors server data.
// Route knowledge now lives in lib/routes.ts — homeForRole is re-exported
// here so existing imports keep working.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { registerAuthBridge } from "./api/client";
import { login as apiLogin, register as apiRegister } from "./api/auth";
import { routes, homeForRole } from "./routes";
import type { LoginRequest, RegisterCandidateRequest, Role, AuthResponse } from "./types";

export { homeForRole };

export interface SessionUser {
  role: Role;
  fullName: string;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  ready: boolean;
  login: (input: LoginRequest) => Promise<SessionUser>;
  register: (input: RegisterCandidateRequest) => Promise<SessionUser>;
  logout: () => void;
  setReady: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      ready: false,

      login: async (input) => {
        const r: AuthResponse = await apiLogin(input);
        const user: SessionUser = { role: r.role, fullName: r.fullName };
        set({ token: r.token, user });
        return user;
      },

      register: async (input) => {
        const r: AuthResponse = await apiRegister(input);
        const user: SessionUser = { role: r.role, fullName: r.fullName };
        set({ token: r.token, user });
        return user;
      },

      logout: () => set({ token: null, user: null }),
      setReady: () => set({ ready: true }),
    }),
    {
      name: "pc-auth",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => { state?.setReady(); },
    }
  )
);

export function useAuth() {
  return useAuthStore();
}

// Belt-and-suspenders hydration flag (prevents guard flicker on refresh).
if (typeof window !== "undefined") {
  if (useAuthStore.persist.hasHydrated()) {
    useAuthStore.getState().setReady();
  }
  useAuthStore.persist.onFinishHydration(() => {
    useAuthStore.getState().setReady();
  });
}

// Token injection + global 401 handling.
registerAuthBridge({
  getToken: () => useAuthStore.getState().token,
  onSessionExpired: () => {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      window.location.assign(routes.auth.loginExpired);
    }
  },
});
