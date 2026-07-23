// src/lib/routes.ts
// THE single place any URL string is written. Nothing else in the app should
// contain a route literal.
//
// Why this exists in a filesystem-routed framework: App Router DERIVES routes
// from folders, but call sites still hardcode strings. Centralising them buys:
//   · autocomplete instead of memory
//   · one edit when a route moves (rename the folder, fix one line here)
//   · dynamic segments as FUNCTIONS, so an id can't be forgotten
//   · a readable map of the whole application in one screen
//
// Convention: keys mirror the route-group structure, so routes.admin.sessions
// lives under src/app/(admin)/admin/sessions/.

export const routes = {
  /* ── public ─────────────────────────────────────────── */
  home: "/",
  publicSessions: "/sessions",
  publicJournalists: "/journalists",          // week 7

  /* ── auth (anonymous only) ──────────────────────────── */
  auth: {
    login: "/login",
    register: "/register",
    forgotPassword: "/forgot-password",       // planned
    resetPassword: "/reset-password",         // planned
    loginExpired: "/login?expired=1",         // global 401 landing
  },

  /* ── candidate space ────────────────────────────────── */
  candidate: {
    dashboard: "/dashboard",
    application: "/application",              // week 3
    newApplication: "/application/new",       // week 3
    correction: "/application/correction",    // week 5
    profile: "/profile",                      // week 3
  },

  /* ── reviewer space ─────────────────────────────────── */
  reviewer: {
    pool: "/pool",                            // week 4
    review: (applicationId: number | string) => `/review/${applicationId}`, // week 4
  },

  /* ── admin space ────────────────────────────────────── */
  admin: {
    home: "/admin",
    sessions: "/admin/sessions",
    newSession: "/admin/sessions/new",
    session: (id: number | string) => `/admin/sessions/${id}`,   // week 3: results
    reviewers: "/admin/users",
    cards: "/admin/cards",                    // week 6
  },
} as const;

/** Where each role lands after login / when bounced from a wrong space. */
export function homeForRole(role: "CANDIDATE" | "REVIEWER" | "SUPER_ADMIN"): string {
  switch (role) {
    case "SUPER_ADMIN":
      return routes.admin.home;
    case "REVIEWER":
      return routes.reviewer.pool;
    case "CANDIDATE":
    default:
      return routes.candidate.dashboard;
  }
}
