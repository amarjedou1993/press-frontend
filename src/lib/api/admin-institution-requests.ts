// src/lib/api/admin-institution-requests.ts
//
// ⚠️ TROIS ESPACES DE NOMS VOISINS, ET ILS RÉPONDENT À TROIS QUESTIONS.
//
//   /api/admin/institution-requests  ← ici : qui demande à être admis
//   /api/admin/institutions          ← admin-institutions.ts : quels corps existent
//   /api/admin/institutional         ← admin-institutional.ts : ce qu'ils ont déposé
//
// Une demande n'est pas une institution, et une institution n'est pas son
// registre. Les modules portent le nom de ce qu'ils font.

import { apiFetch } from "./client";

export type InstitutionRequestStatus =
  | "SUBMITTED"
  | "PENDING_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED";

export interface InstitutionRequestResponse {
  id: number;
  proposedNameFr: string;
  proposedNameAr: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone?: string | null;
  status: InstitutionRequestStatus;
  createdAt: string;
  verifiedAt?: string | null;
  decidedAt?: string | null;
  decidedByName?: string | null;
  decisionReason?: string | null;
  institutionId?: number | null;
  /**
   * Institutions déjà enregistrées dont le nom recoupe celui proposé.
   *
   * ⚠️ SIGNALÉES, PAS BLOQUANTES. Le risque réel de l'inscription libre est
   * l'usurpation : quelqu'un se présentant comme un corps déjà enregistré.
   * Refuser sur une ressemblance de nom écarterait des corps légitimes aux
   * noms voisins ; l'afficher met la question sous les yeux de qui décide.
   */
  similarInstitutions: string[];
}

export interface ApproveBody {
  code: string;
  nameFr: string;
  nameAr: string;
}

export const institutionRequestKeys = {
  all: ["admin", "institution-requests"] as const,
  pending: ["admin", "institution-requests", "pending"] as const,
};

export function listInstitutionRequests(status?: InstitutionRequestStatus) {
  const query = status ? `?status=${status}` : "";
  return apiFetch<InstitutionRequestResponse[]>(
    `/api/admin/institution-requests${query}`);
}

export function getInstitutionRequest(id: number) {
  return apiFetch<InstitutionRequestResponse>(`/api/admin/institution-requests/${id}`);
}

export function approveInstitutionRequest(id: number, body: ApproveBody) {
  return apiFetch<InstitutionRequestResponse>(
    `/api/admin/institution-requests/${id}/approve`, {
      method: "POST",
      body: JSON.stringify(body),
    });
}

export function rejectInstitutionRequest(id: number, reason: string) {
  return apiFetch<InstitutionRequestResponse>(
    `/api/admin/institution-requests/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
}

/**
 * L'adresse de la lettre officielle.
 *
 * ⚠️ PAS UNE URL POUR UN <iframe src> NU : l'endpoint est authentifié, et un
 * navigateur n'attache pas l'en-tête Authorization à une ressource intégrée.
 * Le composant la récupère et tient une URL d'objet — voir RequestLetter.
 */
export const institutionLetterPath = (id: number) =>
  `/api/admin/institution-requests/${id}/letter`;
