import { create } from "zustand";
import { persist } from "zustand/middleware";
import { registerAuthBridge } from "./api/client";
import { login as apiLogin, register as apiRegister } from "./api/auth";
import type {
  LoginRequest,
  RegisterCandidateRequest,
  Role,
} from "./types";

export interface SessionUser {
  role: Role;
  fullName: string;
}

interface AuthState {
  token: string | null;
  user: SessionUser | null;
  /** true once localStorage rehydration finished — prevents redirect flicker */
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
      // Persist only the session itself — never flags or actions.
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => state?._setReady(),
    }
  )
);

/** Drop-in replacement for the old context hook — same shape, no provider. */
export function useAuth() {
  return useAuthStore();
}

// ── Bridge to the HTTP layer ─────────────────────────────────────────
// client.ts stays free of store imports (no module cycle); the store
// registers itself as the token source and the session-expiry handler.
registerAuthBridge({
  getToken: () => useAuthStore.getState().token,
  onSessionExpired: () => {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      window.location.assign("/login?expired=1");
    }
  },
});
