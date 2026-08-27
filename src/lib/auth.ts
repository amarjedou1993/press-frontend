// import { create } from "zustand";
// import { persist, createJSONStorage } from "zustand/middleware";
// import { registerAuthBridge } from "./api/client";
// import { login as apiLogin, register as apiRegister } from "./api/auth";
// import { routes, homeForRole } from "./routes";
// import type { LoginRequest, RegisterCandidateRequest, Role, AuthResponse } from "./types";

// export { homeForRole };

// export interface SessionUser {
//   role: Role;
//   fullName: string;
// }

// interface AuthState {
//   token: string | null;
//   user: SessionUser | null;
//   ready: boolean;
//   login: (input: LoginRequest) => Promise<SessionUser>;
//   register: (input: RegisterCandidateRequest) => Promise<SessionUser>;
//   logout: () => void;
//   setReady: () => void;
// }

// export const useAuthStore = create<AuthState>()(
//   persist(
//     (set) => ({
//       token: null,
//       user: null,
//       ready: false,

//       login: async (input) => {
//         const r: AuthResponse = await apiLogin(input);
//         const user: SessionUser = { role: r.role, fullName: r.fullName };
//         set({ token: r.token, user });
//         return user;
//       },

//       register: async (input) => {
//         const r: AuthResponse = await apiRegister(input);
//         const user: SessionUser = { role: r.role, fullName: r.fullName };
//         set({ token: r.token, user });
//         return user;
//       },

//       logout: () => set({ token: null, user: null }),
//       setReady: () => set({ ready: true }),
//     }),
//     {
//       name: "pc-auth",
//       storage: createJSONStorage(() => localStorage),
//       partialize: (s) => ({ token: s.token, user: s.user }),
//       onRehydrateStorage: () => (state) => { state?.setReady(); },
//     }
//   )
// );

// export function useAuth() {
//   return useAuthStore();
// }

// // Belt-and-suspenders hydration flag (prevents guard flicker on refresh).
// if (typeof window !== "undefined") {
//   if (useAuthStore.persist.hasHydrated()) {
//     useAuthStore.getState().setReady();
//   }
//   useAuthStore.persist.onFinishHydration(() => {
//     useAuthStore.getState().setReady();
//   });
// }

// // Token injection + global 401 handling.
// registerAuthBridge({
//   getToken: () => useAuthStore.getState().token,
//   onSessionExpired: () => {
//     useAuthStore.getState().logout();
//     if (typeof window !== "undefined") {
//       window.location.assign(routes.auth.loginExpired);
//     }
//   },
// });


// src/lib/auth.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { registerAuthBridge } from "./api/client";
import { login as apiLogin, register as apiRegister } from "./api/auth";
import { routes, homeForRole } from "./routes";
import type { LoginRequest, RegisterCandidateRequest, Role, AuthResponse } from "./types";

export { homeForRole };

/**
 * What the TOKEN says about the holder.
 *
 * ⚠️ A SNAPSHOT, NOT A LIVE RECORD. It is written when the token is issued
 * and never again — so a name changed on the profile page is stale here until
 * the next sign-in.
 *
 * That is correct for `role`, which decides which space a person may enter
 * and must agree with the token the server will honour. It is NOT correct for
 * anything displayed: AppShell reads the `me` query for that.
 */
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

/**
 * ⚠️ SELECTORS, not the whole store.
 *
 * `useAuthStore()` with no argument subscribes to EVERY field, so any change
 * — `ready` flipping, a login, a logout — re-renders every component that
 * calls this. AppShell, AppSidebar and UserMenu all do.
 *
 * The five below are the whole public surface, and each subscribes only to
 * what it names. The three functions are stable references in Zustand, so
 * they never trigger a render on their own.
 */
export function useAuth() {
  const user = useAuthStore((s) => s.user);
  const ready = useAuthStore((s) => s.ready);
  const login = useAuthStore((s) => s.login);
  const register = useAuthStore((s) => s.register);
  const logout = useAuthStore((s) => s.logout);
  return { user, ready, login, register, logout };
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

/**
 * The reader's language, read from the cookie next-intl maintains.
 *
 * ⚠️ THIS FILE CANNOT CALL useLocale — it is a store, not a component. The
 * cookie is the only place the locale is available outside the React tree.
 *
 * It matters because of what uses it below: a session expiring is common, and
 * landing in the wrong language at the moment someone is already confused is
 * a bad way to meet the login page.
 */
function currentLocale(): string {
  if (typeof document === "undefined") return "ar";
  const match = document.cookie.match(/(?:^|;\s*)MCACRP_LOCALE=([^;]+)/);
  const value = match?.[1];
  return value === "fr" || value === "ar" ? value : "ar";
}

// Token injection + global 401 handling.
registerAuthBridge({
  getToken: () => useAuthStore.getState().token,
  onSessionExpired: () => {
    useAuthStore.getState().logout();
    if (typeof window !== "undefined") {
      /**
       * ⚠️ THE LOCALE PREFIX IS NOT OPTIONAL.
       *
       * routes.auth.loginExpired is "/login?expired=1" — an unprefixed path.
       * Every route now lives under /[locale], so this would be redirected by
       * the proxy to the DEFAULT locale: an Arabic session would expire into
       * a French login page.
       *
       * And because this is a full page load rather than a client navigation,
       * nothing corrects it afterwards.
       */
      window.location.assign(`/${currentLocale()}${routes.auth.loginExpired}`);
    }
  },
});