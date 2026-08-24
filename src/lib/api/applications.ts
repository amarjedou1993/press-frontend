import { apiFetch } from "./client";

/* ── the nine states ── */
export type ApplicationStatus =
  | "DRAFT" | "UNDER_REVIEW" | "CORRECTION_REQUESTED" | "UNDER_FINAL_REVIEW"
  | "ACCEPTED" | "REJECTED" | "UNDER_RECLAMATION" | "FINAL_REJECTION" | "CARD_ISSUED";

export type DocumentType = "CONTRACT" | "WORK_CERTIFICATE" | "WEBSITE" | "WORK_LINK";

/**
 * Why a dossier cannot be submitted.
 *
 * ⚠️ THESE MUST MATCH SubmissionGate.Reason EXACTLY — the frontend keys its
 * `blockers` catalogue off the constant, so a name that drifts shows the
 * candidate a raw enum name instead of a sentence.
 *
 * Verify against the Java enum after any change there:
 *   Select-String -Path src\main\java -Pattern "enum Reason" -Context 0,15
 */
export type BlockerReason =
  | "SESSION_NOT_RECEIVING"
  | "DEADLINE_PASSED"
  | "PROFILE_INCOMPLETE"
  | "EMAIL_NOT_VERIFIED"
  | "DOCUMENTS_INCOMPLETE"
  | "PHOTO_MISSING"
  | "SPECIALISATION_MISSING"
  | "INSTITUTION_MISSING";

export interface ApplicationResponse {
  id: number;
  sessionId: number;
  categoryId: number;
  status: ApplicationStatus;
  /** Kept for logs and older call sites — screens read the enum instead. */
  statusLabelFr: string;
  correctionCount: number;
  submittedAt?: string | null;
  createdAt: string;
  editable: boolean;
  specialisationId?: number | null;
  institution?: string | null;
}

export interface DocumentResponse {
  id: number;
  docType: DocumentType;
  docTypeLabelFr: string;
  /** Added when the document catalogue went bilingual. */
  docTypeLabelAr?: string | null;
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

/**
 * One reason the dossier cannot go.
 *
 * ⚠️ THE SCREEN READS `reason`, NOT THE SENTENCES.
 *
 * The two messages exist for logs and for anything that cannot translate.
 * DEADLINE_PASSED's server sentence embeds a date formatted in French — which
 * is precisely why a bilingual page must not use it: `deadline` travels
 * separately, as a plain yyyy-MM-dd, and the page formats it in the reader's
 * own locale.
 */
export interface BlockerResponse {
  reason: BlockerReason;
  messageFr: string;
  messageAr?: string | null;
  /** Only DEADLINE_PASSED carries one. yyyy-MM-dd. */
  deadline?: string | null;
}

export interface ReadinessResponse {
  canSubmit: boolean;
  blockers: BlockerResponse[];
  documentsComplete: boolean;
  mandatory: RequirementResponse[];
  alternativeGroups: AlternativeGroupResponse[];
  missingFr: string[];
  missingAr?: string[] | null;
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
    // ⚠️ A KEY when the server sends one — the caller resolves it.
    let message = "errors.uploadFailed";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the key */ }
    throw new Error(message);
  }
  return res.json();
}

/** Documents are fetched by id, never by stored path. */
export function documentFileUrl(applicationId: number, documentId: number) {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  return `${base}/api/applications/${applicationId}/documents/${documentId}/file`;
}

/* ── visual grouping ── */

/**
 * ⚠️ STATUS_LABELS IS GONE.
 *
 * It was a fourth copy of the nine status names, French only. Screens read
 * the `applicationStatus` catalogue now, which has all nine in both
 * languages:
 *
 *   const ts = useTranslations("applicationStatus");
 *   ts(application.status)
 *
 * If a call site still imports it, that call site is showing French in an
 * Arabic page.
 */

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