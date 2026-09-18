// src/lib/api/institutional.ts

import { apiFetch } from "./client";

export interface InstitutionResponse {
  id: number;
  code: string;
  nameFr: string;
  nameAr: string;
}

export interface FilingResponse {
  id: number;
  fullName: string;
  identityNumber: string;
  birthdate?: string | null;
  birthplace?: string | null;
  jobTitle?: string | null;
  categoryId?: number | null;
  specialisationId?: number | null;
  hasPhoto: boolean;
  /**
   * ⚠️ THE LINE BETWEEN A FILING AND A CARD.
   *
   * False: the Ministry has not granted. The institution may still edit or
   * withdraw, and there is no number to show.
   *
   * True: a credential exists, and nothing in this space may change it —
   * except the photograph, which is printed rather than signed.
   */
  granted: boolean;
    /** True when this filing replaces a card the holder already carries. */
  renewal: boolean;
  /** The number being replaced — null for a first filing. */
  renewedFromCardNumber?: string | null;
  cardNumber?: string | null;
  expiresAt?: string | null;
  status: string;
  filedAt: string;
}

export interface ImportRowResponse {
  rowNumber: number;
  fullName: string;
  identityNumber: string;
  jobTitle?: string | null;
  categoryLabelFr?: string | null;
  hasPhoto: boolean;
  errorFr?: string | null;
  warningFr?: string | null;
}

export interface RowOutcome {
  rowNumber: number;
  fullName: string;
  filed: boolean;
  cardId?: number | null;
  photoAttached: boolean;
  failureFr?: string | null;
}

export interface ImportResult {
  requested: number;
  filed: number;
  failed: number;
  photosAttached: number;
  outcomes: RowOutcome[];
  /** ⚠️ The parser's refusals. Without a preview step this is the only
   *  moment the institution sees them. */
  rejected: ImportRowResponse[];
}

export interface FilingBody {
  fullName: string;
  identityNumber: string;
  birthdate?: string | null;
  birthplace?: string | null;
  jobTitle?: string | null;
  categoryId?: number | null;
  specialisationId?: number | null;
}

export const institutionKeys = {
  me: ["institution", "me"] as const,
  staff: ["institution", "staff"] as const,
};

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export function getInstitution() {
  return apiFetch<InstitutionResponse>("/api/institution/me");
}

export function listStaff() {
  return apiFetch<FilingResponse[]>("/api/institution/staff");
}

export function fileStaff(body: FilingBody) {
  return apiFetch<FilingResponse>("/api/institution/staff", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateStaff(id: number, body: FilingBody) {
  return apiFetch<FilingResponse>(`/api/institution/staff/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function withdrawStaff(id: number) {
  return apiFetch<void>(`/api/institution/staff/${id}`, { method: "DELETE" });
}

/**
 * The photograph — multipart, so it builds its own request.
 *
 * ⚠️ NO Content-Type header: the browser must set the multipart boundary.
 */
export async function uploadStaffPhoto(id: number, file: File, token: string | null) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}/api/institution/staff/${id}/photo`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = "errors.uploadFailed";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the key */ }
    throw new Error(message);
  }
  return res.json() as Promise<FilingResponse>;
}

/**
 * File a whole roll from one archive.
 *
 * ⚠️ ONE CALL, unlike the honour import's preview-then-commit. That one
 * grants cards and takes a number per row; this one only files, and a filing
 * is deletable — the result reports what was created and what was refused.
 */
export async function importStaff(file: File, token: string | null) {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${BASE}/api/institution/staff/import`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) {
    let message = "L'archive n'a pas pu être lue.";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the fallback */ }
    throw new Error(message);
  }
  return res.json() as Promise<ImportResult>;
}

export async function downloadStaffTemplate(token: string | null) {
  const res = await fetch(`${BASE}/api/institution/staff/import/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error("Le modèle n'a pas pu être téléchargé.");

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "modele-agents.xlsx";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

/** The photograph, on an authenticated endpoint — see InstitutionalPhoto. */
export const staffPhotoPath = (id: number) =>
  `/api/institution/staff/${id}/photo`;
