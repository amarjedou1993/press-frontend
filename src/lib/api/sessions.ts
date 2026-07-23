// src/lib/api/sessions.ts
// Session endpoints. The response now carries the ALLOTTED durations, the
// current phase's start/end, and daysRemainingInPhase computed SERVER-SIDE —
// the client no longer does calendar math it can get wrong.

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
  phaseStartedAt: string;
  currentPhaseEnd: string | null;
  allottedDaysInPhase: number | null;
  daysRemainingInPhase: number | null;   // negative = overdue
  nextPhase: SessionStatus | null;
}

export interface CreateSessionRequest {
  startDate: string;
  receivingDays: number;
  reviewDays: number;
  correctionDays: number;
  reclamationDays: number;
}

export const sessionKeys = {
  all: ["sessions"] as const,
  detail: (id: number) => ["sessions", id] as const,
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
