// src/lib/api/honour.ts
//
// Honour cards — granted by the Ministry, examined by nobody.

import { apiFetch } from "./client";

export interface HonourCardResponse {
  id: number;
  cardNumber: string;
  fullName: string;
  identityNumber: string;
  birthdate?: string | null;
  birthplace?: string | null;
  categoryId?: number | null;
  categoryLabelFr?: string | null;
  specialisationId?: number | null;
  specialisationLabelFr?: string | null;
  institution?: string | null;
  hasPhoto: boolean;
  issuedAt: string;
  expiresAt: string;
  status: "VALID" | "SUSPENDED" | "REVOKED" | "EXPIRED";
  statusLabelFr: string;
  statusReason?: string | null;
  statusChangedAt?: string | null;
  expired: boolean;
  grantedByName: string;
  grantReason: string;

  /**
   * Whether this card's details may still be edited, and why not.
   *
   * ⚠️ THE SERVER DECIDES. Once the card has been produced, editing it would
   * make the record and the plastic disagree — the signature would then verify
   * the new name against a card showing the old one, and a scan would report a
   * mismatch on a credential the Ministry itself issued.
   */
  produced: boolean;
  cannotEditReasonFr?: string | null;
}

export interface GrantBody {
  fullName: string;
  identityNumber: string;
  birthdate?: string | null;
  birthplace?: string | null;
  categoryId?: number | null;
  specialisationId?: number | null;
  institution?: string | null;
  expiresAt: string;
  grantReason: string;
}

export const honourKeys = {
  all: ["honour-cards"] as const,
  one: (id: number) => ["honour-cards", id] as const,
};

export function listHonourCards() {
  return apiFetch<HonourCardResponse[]>("/api/admin/honour-cards");
}

export function grantHonourCard(body: GrantBody) {
  return apiFetch<HonourCardResponse>("/api/admin/honour-cards", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateHonourCard(id: number, body: GrantBody) {
  return apiFetch<HonourCardResponse>(`/api/admin/honour-cards/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function setHonourCardStatus(
  id: number,
  status: "VALID" | "SUSPENDED" | "REVOKED",
  reason?: string
) {
  return apiFetch<HonourCardResponse>(`/api/admin/honour-cards/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status, reason }),
  });
}

/**
 * The photograph.
 *
 * ⚠️ Its own request rather than apiFetch's, because multipart needs the
 * browser to set its own boundary — a JSON content-type header would break
 * the upload silently.
 */
export async function uploadHonourPhoto(
  id: number,
  file: File,
  token: string | null
): Promise<HonourCardResponse> {
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${base}/api/admin/honour-cards/${id}/photo`, {
    method: "POST",
    // NO Content-Type: the browser must set the multipart boundary.
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
