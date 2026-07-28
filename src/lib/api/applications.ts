// src/lib/api/applications.ts
// Mirrors ApplicationController + ProfileController.
//
// The readiness object is the important one: the backend returns the FULL
// checklist (every condition, met or not, with French explanations), so the
// wizard renders the server's verdict rather than re-implementing the rules.
// One source of truth for "can this be submitted".

import { apiFetch } from "./client";

/* ── the nine states ── */
export type ApplicationStatus =
  | "DRAFT" | "UNDER_REVIEW" | "CORRECTION_REQUESTED" | "UNDER_FINAL_REVIEW"
  | "ACCEPTED" | "REJECTED" | "UNDER_RECLAMATION" | "FINAL_REJECTION" | "CARD_ISSUED";

export type DocumentType = "CONTRACT" | "WORK_CERTIFICATE" | "WEBSITE" | "WORK_LINK";

export type BlockerReason =
  | "SESSION_NOT_RECEIVING" | "DEADLINE_PASSED" | "PROFILE_INCOMPLETE"
  | "EMAIL_NOT_VERIFIED" | "DOCUMENTS_INCOMPLETE";

export interface ApplicationResponse {
  id: number;
  sessionId: number;
  categoryId: number;
  status: ApplicationStatus;
  statusLabelFr: string;
  correctionCount: number;
  submittedAt?: string | null;
  createdAt: string;
  editable: boolean;
}

export interface DocumentResponse {
  id: number;
  docType: DocumentType;
  docTypeLabelFr: string;
  kind: "FILE" | "LINK";
  url?: string | null;
  needsCorrection: boolean;
  observation?: string | null;
  version: number;
  uploadedAt: string;
}

export interface TimelineEntry {
  fromStatus?: string | null;
  toStatus: string;
  toStatusLabelFr: string;
  justification?: string | null;
  at: string;
}

export interface RequirementResponse {
  docType: DocumentType;
  labelFr: string;
  labelAr: string;
  isFile: boolean;
  required: number;
  provided: number;
  satisfied: boolean;
}

export interface AlternativeGroupResponse {
  groupNumber: number;
  satisfied: boolean;
  options: RequirementResponse[];
}

export interface BlockerResponse {
  reason: BlockerReason;
  message: string;
}

export interface ReadinessResponse {
  canSubmit: boolean;
  blockers: BlockerResponse[];
  documentsComplete: boolean;
  mandatory: RequirementResponse[];
  alternativeGroups: AlternativeGroupResponse[];
  missingFr: string[];
}

export interface ApplicationDetailResponse {
  application: ApplicationResponse;
  documents: DocumentResponse[];
  timeline: TimelineEntry[];
  readiness: ReadinessResponse;
}

/* ── query keys ── */
export const applicationKeys = {
  all: ["applications"] as const,
  detail: (id: number) => ["applications", id] as const,
  readiness: (id: number) => ["applications", id, "readiness"] as const,
};

/* ── endpoints ── */

export function listMyApplications() {
  return apiFetch<ApplicationResponse[]>("/api/applications");
}

export function getApplication(id: number) {
  return apiFetch<ApplicationDetailResponse>(`/api/applications/${id}`);
}

export function getReadiness(id: number) {
  return apiFetch<ReadinessResponse>(`/api/applications/${id}/readiness`);
}

export function startApplication(body: { sessionId: number; categoryId: number }) {
  return apiFetch<ApplicationResponse>("/api/applications", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function attachLink(id: number, body: { docType: DocumentType; url: string }) {
  return apiFetch<DocumentResponse>(`/api/applications/${id}/links`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function removeDocument(applicationId: number, documentId: number) {
  return apiFetch<void>(`/api/applications/${applicationId}/documents/${documentId}`, {
    method: "DELETE",
  });
}

export function submitApplication(id: number) {
  return apiFetch<ApplicationResponse>(`/api/applications/${id}/submit`, {
    method: "POST",
  });
}

/**
 * File upload needs multipart, which apiFetch's JSON content-type would
 * break — so this one call builds its own request. The auth bridge is not
 * available here, so the token comes from the store directly.
 */
export async function uploadDocument(
  applicationId: number,
  docType: DocumentType,
  file: File,
  token: string | null
): Promise<DocumentResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  const form = new FormData();
  form.append("docType", docType);
  form.append("file", file);

  const res = await fetch(`${base}/api/applications/${applicationId}/documents`, {
    method: "POST",
    // NO Content-Type header: the browser must set the multipart boundary.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = "Le téléversement a échoué.";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the default */ }
    throw new Error(message);
  }
  return res.json();
}

/** Documents are fetched by id, never by stored path. */
export function documentFileUrl(applicationId: number, documentId: number) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return `${base}/api/applications/${applicationId}/documents/${documentId}/file`;
}

/* ── French labels ── */

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Brouillon",
  UNDER_REVIEW: "En cours d'examen",
  CORRECTION_REQUESTED: "Correction demandée",
  UNDER_FINAL_REVIEW: "Examen final",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
  UNDER_RECLAMATION: "Réclamation en cours",
  FINAL_REJECTION: "Rejet définitif",
  CARD_ISSUED: "Carte éditée",
};

/** 9 states → 5 visual kinds (the palette semantics from globals.css). */
export type StatusKind = "draft" | "review" | "correction" | "accepted" | "rejected";

export const STATUS_KIND: Record<ApplicationStatus, StatusKind> = {
  DRAFT: "draft",
  UNDER_REVIEW: "review",
  UNDER_FINAL_REVIEW: "review",
  UNDER_RECLAMATION: "review",
  CORRECTION_REQUESTED: "correction",
  ACCEPTED: "accepted",
  CARD_ISSUED: "accepted",
  REJECTED: "rejected",
  FINAL_REJECTION: "rejected",
};
