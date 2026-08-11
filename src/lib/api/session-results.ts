// src/lib/api/session-results.ts
// What a session produced, and what it still needs.

import { apiFetch } from "./client";

export interface CategoryTally {
  labelFr: string;
  submitted: number;
  accepted: number;
  rejected: number;
  cardsIssued: number;
}

export interface SessionResults {
  sessionId: number;
  status: string;
  statusLabelFr: string;
  closed: boolean;

  startDate: string;
  receivingEnd: string;
  reviewEnd: string;
  correctionEnd: string;
  reclamationEnd: string;
  cardExpiryDate?: string | null;

  started: number;
  submitted: number;
  inProgress: number;
  accepted: number;
  rejected: number;
  cardsIssued: number;

  objectionsFiled: number;
  objectionsUpheld: number;
  objectionsDismissed: number;

  unclaimed: number;
  awaitingCorrection: number;
  acceptedWithoutCard: number;
  blockedFromCard: number;

  byCategory: CategoryTally[];
}

export type Outcome = "DRAFT" | "PENDING" | "ACCEPTED" | "REJECTED";

export interface CandidateOutcome {
  applicationId: number;
  fullName: string;
  categoryLabelFr: string;
  specialisationFr?: string | null;
  institution?: string | null;
  status: string;
  statusLabelFr: string;
  outcome: Outcome;
  submittedAt?: string | null;
  objected: boolean;
  cardNumber?: string | null;
  cardStatus?: string | null;
}

export const resultsKeys = {
  results: (id: number) => ["session", id, "results"] as const,
  candidates: (id: number) => ["session", id, "candidates"] as const,
};

export function getSessionResults(sessionId: number) {
  return apiFetch<SessionResults>(`/api/admin/sessions/${sessionId}/results`);
}

export function getSessionCandidates(sessionId: number) {
  return apiFetch<CandidateOutcome[]>(`/api/admin/sessions/${sessionId}/candidates`);
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export async function downloadSessionResults(sessionId: number, token: string | null) {
  const res = await fetch(`${BASE}/api/admin/sessions/${sessionId}/export`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("L'export a échoué.");

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `session-${sessionId}-resultats.xlsx`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
