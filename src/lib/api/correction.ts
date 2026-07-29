// src/lib/api/correction.ts
// Mirrors CorrectionController.
//
// As with the submission gate, the SERVER decides whether a resubmission is
// possible and says what is missing. `readyToResubmit` and `remainingFr` come
// from the same object — so the button and the explanation can never disagree.

import { apiFetch } from "./client";

export interface OutstandingItem {
  documentId: number;
  docType: string;
  docTypeLabelFr: string;
  observation?: string | null;
  /** True once this piece has been replaced. */
  answered: boolean;
}

export interface CorrectionState {
  inCorrection: boolean;
  deadline: string | null;          // yyyy-MM-dd
  daysRemaining: number;
  deadlinePassed: boolean;
  documents: OutstandingItem[];
  photoNeedsCorrection: boolean;
  photoObservation?: string | null;
  photoAnswered: boolean;
  readyToResubmit: boolean;
  /** What still stands between the candidate and resubmission, in French. */
  remainingFr: string[];
}

export const correctionKeys = {
  state: (applicationId: number) => ["correction", applicationId] as const,
};

export function getCorrectionState(applicationId: number) {
  return apiFetch<CorrectionState>(`/api/applications/${applicationId}/correction`);
}

export function replaceLink(
  applicationId: number,
  documentId: number,
  url: string
) {
  return apiFetch<unknown>(
    `/api/applications/${applicationId}/correction/documents/${documentId}/link`,
    { method: "PUT", body: JSON.stringify({ url }) }
  );
}

export function resubmitCorrection(applicationId: number) {
  return apiFetch<CorrectionState>(
    `/api/applications/${applicationId}/correction/resubmit`,
    { method: "POST" }
  );
}

/** Multipart, so it builds its own request — apiFetch would force JSON. */
export async function replaceDocument(
  applicationId: number,
  documentId: number,
  file: File,
  token: string | null
): Promise<unknown> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(
    `${base}/api/applications/${applicationId}/correction/documents/${documentId}`,
    {
      method: "POST",
      // No Content-Type: the browser must set the multipart boundary.
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: form,
    }
  );

  if (!res.ok) {
    let message = "Le remplacement a échoué.";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the default */ }
    throw new Error(message);
  }
  return res.json();
}
