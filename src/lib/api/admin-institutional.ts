// src/lib/api/admin-institutional.ts
//
// ⚠️ THE ROLLS, NOT THE BODIES.
//
//   /api/admin/institutions   ← admin-institutions.ts: which bodies exist
//   /api/admin/institutional  ← here: what they have filed, and granting it

import { apiFetch } from "./client";

export interface AdminCardResponse {
  id: number;
  institutionId: number;
  institutionNameFr: string;
  fullName: string;
  identityNumber: string;
  birthdate?: string | null;
  birthplace?: string | null;
  jobTitle?: string | null;
  categoryLabelFr?: string | null;
  specialisationLabelFr?: string | null;
  hasPhoto: boolean;
  granted: boolean;
  cardNumber?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  status: string;
  statusLabelFr: string;
  expired: boolean;
  /**
   * ⚠️ THE SERVER DECIDES, AND SAYS WHY.
   *
   * A filing with no identity cannot be signed; one whose holder already
   * carries a live card would duplicate it. The screen could work both out —
   * and then the rule would live in two places, only one of which is
   * consulted at the moment of granting.
   */
  grantable: boolean;
  cannotGrantReasonFr?: string | null;
  filedAt: string;
}

export interface AdminInstitutionSummary {
  id: number;
  code: string;
  nameFr: string;
  nameAr: string;
  active: boolean;
  awaitingGrant: number;
}

export interface GrantOutcome {
  id: number;
  fullName: string;
  granted: boolean;
  cardNumber?: string | null;
  failureFr?: string | null;
}

export interface GrantBatchResult {
  requested: number;
  granted: number;
  failed: number;
  outcomes: GrantOutcome[];
}

export const institutionalKeys = {
  institutions: ["admin", "institutional", "institutions"] as const,
  awaiting: ["admin", "institutional", "awaiting"] as const,
  staff: (institutionId: number) =>
    ["admin", "institutional", "staff", institutionId] as const,
};

export function listInstitutionSummaries() {
  return apiFetch<AdminInstitutionSummary[]>("/api/admin/institutional/institutions");
}

/** Everything awaiting a grant, across every body, oldest first. */
export function listAwaiting() {
  return apiFetch<AdminCardResponse[]>("/api/admin/institutional/awaiting");
}

/** One body's whole roll — filed and granted alike. */
export function listInstitutionStaff(institutionId: number) {
  return apiFetch<AdminCardResponse[]>(
    `/api/admin/institutional/institutions/${institutionId}/staff`);
}

export function grantOne(id: number, expiresAt: string) {
  return apiFetch<AdminCardResponse>(`/api/admin/institutional/${id}/grant`, {
    method: "POST",
    body: JSON.stringify({ expiresAt }),
  });
}

/**
 * Grant a selection.
 *
 * ⚠️ ONE EXPIRY FOR THE WHOLE BATCH. An institution's staff are accredited
 * together and lapse together — the same reasoning that puts an ordinary
 * card's expiry on its session rather than on its issuance date.
 */
export function grantMany(ids: number[], expiresAt: string) {
  return apiFetch<GrantBatchResult>("/api/admin/institutional/grant", {
    method: "POST",
    body: JSON.stringify({ ids, expiresAt }),
  });
}
