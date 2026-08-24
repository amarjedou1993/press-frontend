import { apiFetch } from "./client";

export type SessionStatus =
  | "PLANNED" | "RECEIVING" | "REVIEW" | "CORRECTION" | "RECLAMATION" | "CLOSED";

export interface SessionResponse {
  id: number;
  type: string;
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

// export const sessionKeys = {
//   all: ["sessions"] as const,
//   detail: (id: number) => ["sessions", id] as const,
// };

export const sessionKeys = {
  all: ["sessions"] as const,
  detail: (id: number) => ["sessions", id] as const,
  schedulingRules: ["sessions", "scheduling-rules"] as const,   // ← ADD
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
