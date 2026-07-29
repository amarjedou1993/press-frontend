// src/lib/api/review.ts
// Mirrors ReviewController + ReviewDtos.
//
// Note `AvailableActions`: the SERVER decides what the reviewer may do, and
// the UI renders that decision. In particular `canRejectAsIncomplete`
// encodes a legal duty — no rejection for incompleteness without a prior
// correction request — and re-implementing that in TypeScript would create a
// second copy of the rule, free to drift from the one that actually binds.

import { apiFetch } from "./client";
import type { ReadinessResponse } from "./applications";

/* ── the vocabulary ── */

export type DecisionType = "APPROVE" | "REJECT" | "REQUEST_CORRECTION";
export type ReviewRoundName = "INITIAL" | "FINAL" | "RECLAMATION";
export type RejectionGroundName =
  | "INCOMPLETE_FILE" | "INELIGIBLE" | "FRAUDULENT_DOCUMENT"
  | "WRONG_CATEGORY" | "OTHER";

/* ── responses ── */

export interface PoolItem {
  applicationId: number;
  candidateFullName: string;
  categoryLabelFr: string;
  status: string;
  statusLabelFr: string;
  roundLabelFr: string;
  submittedAt: string | null;
  waitingDays: number;
  claimedBy: number | null;
  claimedByName: string | null;
  claimedAt: string | null;
  correctionCount: number;
   /** What THIS reviewer decided, if anything. */
  myDecision?: DecisionType | null;
  myDecisionLabelFr?: string | null;
  myDecidedAt?: string | null;
}

export interface CandidateIdentity {
  userId: number;
  fullName: string;
  email: string;
  phone?: string | null;
  nni?: string | null;
  passportNo?: string | null;
  birthdate?: string | null;
  birthplace?: string | null;
  hasPhoto: boolean;
  photoAgeing: boolean;
}

export interface ReviewDocument {
  id: number;
  docType: string;
  docTypeLabelFr: string;
  kind: "FILE" | "LINK";
  url?: string | null;
  needsCorrection: boolean;
  observation?: string | null;
  version: number;
  uploadedAt: string;
}

export interface DecisionHistoryEntry {
  decision: DecisionType;
  decisionLabelFr: string;
  round: ReviewRoundName;
  roundLabelFr: string;
  rejectionGround?: string | null;
  rejectionGroundLabelFr?: string | null;
  justification?: string | null;
  reviewerName: string;
  at: string;
}

export interface AvailableActions {
  canClaim: boolean;
  canRelease: boolean;
  canDecide: boolean;
  canRequestCorrection: boolean;
  canRejectAsIncomplete: boolean;
  correctionUnavailableReason?: string | null;
  incompleteRejectionUnavailableReason?: string | null;
}

export interface Examination {
  applicationId: number;
  status: string;
  statusLabelFr: string;
  currentRound?: ReviewRoundName | null;
  currentRoundLabelFr: string;
  submittedAt: string | null;
  correctionCount: number;
  maxCorrectionRounds: number;
  photoNeedsCorrection: boolean;
  photoObservation?: string | null;
  claimedBy: number | null;
  claimedByName: string | null;
  claimedAt: string | null;
  claimedByMe: boolean;
  candidate: CandidateIdentity;
  documents: ReviewDocument[];
  completeness: ReadinessResponse;
  history: DecisionHistoryEntry[];
  actions: AvailableActions;
}

export interface RejectionGroundOption {
  value: RejectionGroundName;
  labelFr: string;
  descriptionFr: string;
  requiresPriorCorrection: boolean;
  availableNow: boolean;
}

/* ── query keys ── */

export const reviewKeys = {
  pool: ["review", "pool"] as const,
  myFiles: ["review", "my-files"] as const,
  myDecided: ["review", "my-decided"] as const,      // ← ADD
  all: ["review", "all"] as const,                    // ← ADD
  examination: (id: number) => ["review", "examination", id] as const,
  grounds: (id: number) => ["review", "grounds", id] as const,
};

/* ── endpoints ── */

export function getPool() {
  return apiFetch<PoolItem[]>("/api/reviewer/pool");
}

export function getMyFiles() {
  return apiFetch<PoolItem[]>("/api/reviewer/my-files");
}

/** What this reviewer has already decided. */
export function getMyDecided() {
  return apiFetch<PoolItem[]>("/api/reviewer/my-decided");
}

/** Every submitted dossier — the session's whole picture. */
export function getAllDossiers() {
  return apiFetch<PoolItem[]>("/api/reviewer/all");
}

export function getExamination(id: number) {
  return apiFetch<Examination>(`/api/reviewer/${id}`);
}

export function getRejectionGrounds(id: number) {
  return apiFetch<RejectionGroundOption[]>(`/api/reviewer/${id}/rejection-grounds`);
}

export function claimApplication(id: number) {
  return apiFetch<Examination>(`/api/reviewer/${id}/claim`, { method: "POST" });
}

export function releaseApplication(id: number) {
  return apiFetch<Examination>(`/api/reviewer/${id}/release`, { method: "POST" });
}

export function approveApplication(id: number, note?: string) {
  return apiFetch<Examination>(`/api/reviewer/${id}/approve`, {
    method: "POST",
    body: JSON.stringify({ note: note ?? null }),
  });
}


export function rejectApplication(
  id: number,
  ground: RejectionGroundName,
  justification: string
) {
  return apiFetch<Examination>(`/api/reviewer/${id}/reject`, {
    method: "POST",
    body: JSON.stringify({ ground, justification }),
  });
}

export interface DocumentFlagInput {
  documentId: number;
  observation: string;
}

export function requestCorrection(
  id: number,
  body: {
    summary: string;
    documents: DocumentFlagInput[];
    photoNeedsCorrection: boolean;
    photoObservation?: string | null;
  }
) {
  return apiFetch<Examination>(`/api/reviewer/${id}/request-correction`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/* ── protected file paths (fetched with the token, never as a bare src) ── */

export const reviewerPhotoPath = (id: number) => `/api/reviewer/${id}/photo`;
export const reviewerDocumentPath = (id: number, documentId: number) =>
  `/api/reviewer/${id}/documents/${documentId}/file`;
