import { apiFetch } from "./client";

export type SessionStatus =
  | "PLANNED" | "RECEIVING" | "REVIEW" | "CORRECTION" | "RECLAMATION" | "CLOSED";

/**
 * What kind of cycle a session is.
 *
 * ⚠️ THE TWO DIFFER IN MORE THAN A LABEL.
 *
 * A CANDIDACY is open to anyone and demands the full dossier. A RENEWAL is
 * open only to holders of a card in force — or lapsed within the grace period
 * — demands only the pieces that answer "is this person still a working
 * journalist", and INVITES EVERY ELIGIBLE HOLDER BY E-MAIL the moment its
 * receiving phase opens.
 *
 * Which is why nothing anywhere defaults it.
 */
export type SessionType = "CANDIDACY" | "RENEWAL";


export interface SessionResponse {
  id: number;
  /** ⚠️ Was `string`. A screen that switches on it needs the union. */
  type: SessionType;
  status: SessionStatus;
  startDate: string;
  totalDays: number;
  // allotted durations (guaranteed to each phase)
  receivingDays: number;
  reviewDays: number;
  correctionDays: number;
  reclamationDays: number;
  // current forecast
  receivingEnd: string;
  reviewEnd: string;
  correctionEnd: string;
  reclamationEnd: string;
  // countdown
  //
  // These are OPTIONAL on the wire: the backend runs
  // jackson.default-property-inclusion=non_null, so a null value is omitted
  // from the JSON and arrives as `undefined`. Typing them as `| null` only
  // was what let a strict !== null check through and produced NaN.
  phaseStartedAt: string;
  currentPhaseEnd?: string | null;
  allottedDaysInPhase?: number | null;
  daysRemainingInPhase?: number | null;   // negative = overdue
  nextPhase?: SessionStatus | null;
  cardExpiryDate?: string | null; 

    /** The phase as HAPA names it, from the server. */
  statusLabelFr: string;

  /**
   * Dossiers still awaiting their candidate's corrections.
   *
   * Zero outside the CORRECTION phase. A primitive `long` on the wire, so
   * unlike the countdown fields it is never omitted by non_null — but the
   * `?? 0` at the use site costs nothing and survives the field being made
   * nullable later.
   */
  awaitingCorrection: number;


}

export interface CreateSessionRequest {
  /**
   * ⚠️ REQUIRED, AND NOT OPTIONAL ON THE WIRE.
   *
   * The server rejects a request without it rather than assuming a
   * candidature: opening a renewal by omission would send two hundred
   * invitations nobody chose to send.
   */
  type: SessionType;
  startDate: string;
  receivingDays: number;
  reviewDays: number;
  correctionDays: number;
  reclamationDays: number;
  cardExpiryDate: string;
}

export interface SessionSchedulingRules {
  minimumGapDays: number;
  /** null when no session has ever been created. */
  lastSessionStart: string | null;
  /** The earliest date a new session may start — never before tomorrow. */
  earliestNextStart: string;
}

export function getSchedulingRules() {
  return apiFetch<SessionSchedulingRules>("/api/admin/sessions/scheduling-rules");
}

export const sessionKeys = {
  all: ["sessions"] as const,
  detail: (id: number) => ["sessions", id] as const,
  schedulingRules: ["sessions", "scheduling-rules"] as const,
};

export function listSessions() {
  return apiFetch<SessionResponse[]>("/api/admin/sessions");
}

export function getSession(id: number) {
  return apiFetch<SessionResponse>(`/api/admin/sessions/${id}`);
}

export function createSession(body: CreateSessionRequest) {
  return apiFetch<SessionResponse>("/api/admin/sessions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function advanceSessionPhase(id: number) {
  return apiFetch<SessionResponse>(`/api/admin/sessions/${id}/advance`, {
    method: "POST",
  });
}

export const PHASE_LABELS: Record<SessionStatus, string> = {
  PLANNED: "Planifiée",
  RECEIVING: "Réception des dossiers",
  REVIEW: "Examen",
  CORRECTION: "Correction",
  RECLAMATION: "Réclamation",
  CLOSED: "Clôturée",
};

/**
 * The type, as the administration space names it.
 *
 * ⚠️ FRENCH ONLY, like PHASE_LABELS above — the administration space is not
 * bilingual, and the proxy redirects /ar/admin to /fr/admin. A screen shared
 * with the candidate space would need the catalogue instead.
 */
export const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  CANDIDACY: "Candidature",
  RENEWAL: "Renouvellement",
};