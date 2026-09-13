// src/lib/api/admin-institutions.ts
//
// ⚠️ THE MINISTRY'S REGISTER OF BODIES — not their staff rolls.
//
// Two adjacent namespaces, and they answer different questions:
//
//   /api/admin/institutions   ← here: which bodies exist, and their accounts
//   /api/admin/institutional  ← admin-institutional.ts: what they have filed
//
// One letter apart in the Java class names, which is why the TypeScript
// modules are named for what they do rather than for the controllers.

import { apiFetch } from "./client";

export interface InstitutionResponse {
  id: number;
  code: string;
  nameFr: string;
  nameAr: string;
  active: boolean;
  /**
   * ⚠️ NULL WHEN NO ACCOUNT HAS BEEN ISSUED — and a body without one cannot
   * file anything. The screen must say so rather than implying it is ready.
   */
  accountId?: number | null;
  accountEmail?: string | null;
  accountEnabled: boolean;
  staffFiled: number;
  staffGranted: number;
}

export interface InstitutionBody {
  code: string;
  nameFr: string;
  nameAr: string;
}

export interface AccountBody {
  email: string;
  password: string;
}

export const institutionRegistryKeys = {
  all: ["admin", "institutions"] as const,
};

export function listInstitutions() {
  return apiFetch<InstitutionResponse[]>("/api/admin/institutions");
}

export function createInstitution(body: InstitutionBody) {
  return apiFetch<InstitutionResponse>("/api/admin/institutions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateInstitution(id: number, body: InstitutionBody) {
  return apiFetch<InstitutionResponse>(`/api/admin/institutions/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function setInstitutionActive(id: number, active: boolean) {
  return apiFetch<InstitutionResponse>(
    `/api/admin/institutions/${id}/active?active=${active}`, { method: "POST" });
}

export function createInstitutionAccount(id: number, body: AccountBody) {
  return apiFetch<InstitutionResponse>(`/api/admin/institutions/${id}/account`, {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function resetInstitutionPassword(id: number, password: string) {
  return apiFetch<void>(`/api/admin/institutions/${id}/account/password`, {
    method: "POST",
    body: JSON.stringify({ password }),
  });
}

export function setInstitutionAccountEnabled(id: number, enabled: boolean) {
  return apiFetch<InstitutionResponse>(
    `/api/admin/institutions/${id}/account/enabled?enabled=${enabled}`,
    { method: "POST" });
}
