// import { Role } from "./types";

// export const routes = {
//   /* ── public ─────────────────────────────────────────── */
//   home: "/",
//   publicSessions: "/sessions",
//   publicJournalists: "/journalistes",          // week 7

//   /* ── auth (anonymous only) ──────────────────────────── */
//   auth: {
//     login: "/login",
//     register: "/register",
//     forgotPassword: "/forgot-password",       // planned
//     resetPassword: "/reset-password",         // planned
//     loginExpired: "/login?expired=1",         // global 401 landing
//   },

//   /* ── candidate space ────────────────────────────────── */
//   candidate: {
//     dashboard: "/dashboard",
//     application: "/application",             
//     newApplication: "/application/new",       
//     correction: "/application/correction",    
//     profile: "/profile",                      
//   },

//   /* ── reviewer space ─────────────────────────────────── */
//   reviewer: {
//       home: "/reviewer",
//       cards: "/reviewer/cartes", 
//       examination: (id: number) => `/reviewer/${id}`,
//     },

//   /* ── printer space ──────────────────────────────────── */
//   printer: {
//     home: "/printer",
//     history: "/printer/historique",
//   },

//   /* ── admin space ────────────────────────────────────── */
//   admin: {
//     home: "/admin",
//     sessions: "/admin/sessions",
//     newSession: "/admin/sessions/new",
//     session: (id: number | string) => `/admin/sessions/${id}`,   // week 3: results
//     reviewers: "/admin/users",
//     cards: "/admin/cards",
//     revocations: "/admin/cards/revocations",
//     sessionResults: (id: number | string) => `/admin/sessions/${id}/resultats`,                  
//   },
// } as const;

// /** Where each role lands after login / when bounced from a wrong space. */
// export function homeForRole(role: Role): string {
//   switch (role) {
//     case "SUPER_ADMIN":
//       return routes.admin.home;
//     case "REVIEWER":
//       return routes.reviewer.home;
//     case "PRINTER":
//       return routes.printer.home;
//     case "CANDIDATE":
//     default:
//       return routes.candidate.dashboard;
//   }
// }

// src/lib/routes.ts
import { Role } from "./types";

export const routes = {
  /* ── public ─────────────────────────────────────────── */
  home: "/",
  publicSessions: "/sessions",
  publicJournalists: "/journalistes",

  /* ── auth (anonymous only) ──────────────────────────── */
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",
    resetPassword: "/reset-password",
    loginExpired: "/login?expired=1",         // global 401 landing
  },

  /* ── candidate space ────────────────────────────────── */
  candidate: {
    dashboard: "/dashboard",
    application: "/application",
    newApplication: "/application/new",
    correction: "/application/correction",
    profile: "/profile",
  },

  /* ── reviewer space ─────────────────────────────────── */
  reviewer: {
    home: "/reviewer",
    cards: "/reviewer/cartes",
    examination: (id: number) => `/reviewer/${id}`,
  },

  /* ── printer space ──────────────────────────────────── */
  printer: {
    home: "/printer",
    history: "/printer/historique",
  },

  /* ── admin space ────────────────────────────────────── */
  admin: {
    home: "/admin",
    sessions: "/admin/sessions",
    newSession: "/admin/sessions/new",
    session: (id: number | string) => `/admin/sessions/${id}`,
    reviewers: "/admin/users",
    /** Producer accounts — a contractor's access, not a commission's roll. */
    printers: "/admin/printers",
    cards: "/admin/cards",
    revocations: "/admin/cards/revocations",
    sessionResults: (id: number | string) => `/admin/sessions/${id}/resultats`,
  },
} as const;

/**
 * Where each role lands after login, or when bounced from a wrong space.
 *
 * ⚠️ EVERY NAMED ROLE NEEDS ITS CASE, ABOVE THE `default`.
 *
 * Before PRINTER had one, a producer signed in and arrived in the candidate
 * dashboard — no error, no log, a screen that had nothing to do with them.
 * The `default` sent them there, and nothing said so.
 *
 * It stays because CANDIDATE is the honest fallback for a role this function
 * has not been taught. But the parameter is typed `Role` rather than a
 * hardcoded union, so TypeScript will flag the next constant added to the
 * enum — which is the guard the `default` cannot be.
 */
export function homeForRole(role: Role): string {
  switch (role) {
    case "SUPER_ADMIN":
      return routes.admin.home;
    case "REVIEWER":
      return routes.reviewer.home;
    case "PRINTER":
      return routes.printer.home;
    case "CANDIDATE":
    default:
      return routes.candidate.dashboard;
  }
}