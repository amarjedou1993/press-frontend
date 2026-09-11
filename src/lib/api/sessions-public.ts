import { apiFetch } from "./client";

/**
 * What kind of cycle a session is.
 *
 * ⚠️ THE ENDPOINT RETURNS BOTH, AND ALWAYS DID ONCE RENEWALS EXISTED.
 *
 * /api/public/sessions returns every RECEIVING session ordered by start date
 * descending. That is deliberate — a holder whose e-mail invitation went to
 * spam needs somewhere to learn their renewal window is open.
 *
 * But it means `sessions[0]` is simply the MOST RECENT, of either kind. Every
 * caller that treated it as "the session I may apply to" was reading a
 * renewal as a candidature the moment one opened.
 */
export type SessionType = "CANDIDACY" | "RENEWAL";

export interface OpenSession {
  id: number;
  /** ⚠️ Required. Without it every caller guesses. */
  type: SessionType;
  startDate: string;
  receivingEnd: string;
}

export interface PressCategory {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
}

export const catalogKeys = {
  openSessions: ["public", "sessions"] as const,
  categories: ["public", "categories"] as const,
};

export function listOpenSessions() {
  return apiFetch<OpenSession[]>("/api/public/sessions");
}

export function listCategories() {
  return apiFetch<PressCategory[]>("/api/public/categories");
}

/**
 * The session a candidate may file a NEW dossier in.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ THIS EXISTS BECAUSE `sessions[0]` WAS WRONG IN TWO PLACES AT ONCE.
 *
 * The dashboard announced "une session est ouverte" and offered a button; the
 * page behind that button then said "aucune session ouverte". Both read the
 * same list, both took index zero, and they disagreed because one of them
 * later filtered and the other did not.
 *
 * A candidate with no card cannot enter a renewal session. So "the open
 * session" for that purpose is the candidature — and it is defined here,
 * once, rather than as an index in each screen.
 * ───────────────────────────────────────────────────────────────────────
 */
export function openCandidacySession(sessions?: OpenSession[]) {
  return sessions?.find((s) => s.type === "CANDIDACY");
}

/**
 * The open renewal session, if there is one.
 *
 * ⚠️ Eligibility is NOT decided here. Whether this particular candidate may
 * renew is the server's answer — /api/renewal/context — because it depends on
 * a card, a grace period and whether one was already filed. This only says a
 * window exists.
 */
export function openRenewalSession(sessions?: OpenSession[]) {
  return sessions?.find((s) => s.type === "RENEWAL");
}
