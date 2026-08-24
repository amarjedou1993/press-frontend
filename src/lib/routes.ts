export const routes = {
  /* ── public ─────────────────────────────────────────── */
  home: "/",
  publicSessions: "/sessions",
  publicJournalists: "/journalistes",          // week 7

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

  /* ── admin space ────────────────────────────────────── */
  admin: {
    home: "/admin",
    sessions: "/admin/sessions",
    newSession: "/admin/sessions/new",
    session: (id: number | string) => `/admin/sessions/${id}`,   // week 3: results
    reviewers: "/admin/users",
    cards: "/admin/cards",
    revocations: "/admin/cards/revocations",
    sessionResults: (id: number | string) => `/admin/sessions/${id}/resultats`,                  
  },
} as const;

/** Where each role lands after login / when bounced from a wrong space. */
export function homeForRole(role: "CANDIDATE" | "REVIEWER" | "SUPER_ADMIN"): string {
  switch (role) {
    case "SUPER_ADMIN":
      return routes.admin.home;
    case "REVIEWER":
      return routes.reviewer.home;
    case "CANDIDATE":
    default:
      return routes.candidate.dashboard;
  }
}
