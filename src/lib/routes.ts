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
    /**
     * ⚠️ THE PATH IS BUILT INTO A SENT E-MAIL, so it cannot move.
     *
     * EmailService composes frontendLink(locale, "/institution-request/confirm",
     * token). A request confirmed a week after it was filed follows the link
     * as it was written that day — renaming this route breaks links already
     * in people's inboxes.
     */
    institutionRequestConfirm: "/institution-request/confirm",
  },

  /* ── candidate space ────────────────────────────────── */
  candidate: {
    dashboard: "/dashboard",
    application: "/application",
    newApplication: "/application/new",
    correction: "/application/correction",
    /**
     * ⚠️ NOT under /application. A renewal is where a holder decides whether
     * to file at all — the eligibility, the card being replaced, the
     * deadline. Only once they accept does it become an ordinary dossier at
     * /application, and nesting it there would imply a dossier already
     * exists.
     */
    renewal: "/renewal",
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

  /* ── institution space ──────────────────────────────────
     ⚠️ ONE DESTINATION, AND THAT IS THE WHOLE SPACE.

     The account belongs to the body rather than to a person, so there is no
     profile to edit and no identity to change. An institution files its
     staff, attaches their photographs, and waits for the Ministry to grant.
     A sidebar with one entry is honest about that; three entries invented to
     fill it would not be. */
  institution: {
    home: "/institution",
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
    honour: "/admin/honour",
    /** Les corps admis à déposer — pas leurs registres. */
    institutions: "/admin/institutions",
    /**
     * ⚠️ SA PROPRE PAGE, et pas une section du registre.
     *
     * Examiner une demande, c'est lire une lettre officielle : elle a besoin
     * de place, et on ne tranche pas trois dossiers en survolant une liste.
     * Le registre annonce l'attente ; l'examen a son écran.
     */
    institutionRequests: "/admin/institutions/demandes",
    /** Le registre d'un corps, côté Ministère : ce qui attend l'octroi. */
    institutionalStaff: (id: number | string) => `/admin/institutions/${id}/agents`,
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
    case "INSTITUTION":
      return routes.institution.home;
    case "CANDIDATE":
    default:
      return routes.candidate.dashboard;
  }
}