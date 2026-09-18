// src/lib/api/pv.ts
//
// Les procès-verbaux — le relevé signé de qui a été accrédité.
//
// ⚠️ TROIS SÉRIES, TROIS PORTÉES, ET CE N'EST PAS UNE INCOHÉRENCE.
//
// Une candidature appartient à une SESSION : la commission l'a examinée, et
// son acte est borné par elle. Une carte d'honneur et une carte
// institutionnelle n'appartiennent à aucune cohorte — elles sont octroyées au
// fil de l'eau, et seule une PÉRIODE les délimite.
//
// Demander des dates pour une session laisserait produire un PV à cheval sur
// deux cohortes : un document qu'aucune commission ne pourrait signer.

import { apiFetch } from "./client";
import { download } from "./cards";

export interface CommissionerOption {
  id: number;
  fullName: string;
}

export const pvKeys = {
  commissioners: ["admin", "pv", "commissioners"] as const,
};

/**
 * Les réviseurs actifs, comme SUGGESTION.
 *
 * ⚠️ Le système enregistre des décisions, pas des séances. Un réviseur qui a
 * tranché trois dossiers depuis chez lui n'a pas siégé ; un membre présent
 * toute la journée qui n'a rien signé n'apparaîtrait nulle part.
 *
 * L'écran les coche ; l'administrateur décoche les absents et ajoute qui le
 * système ne connaît pas. C'est lui qui sait qui était dans la salle.
 */
export function getCommissioners() {
  return apiFetch<CommissionerOption[]>("/api/admin/pv/commissioners");
}

/** Le PV d'une session — signé par la commission ET le Ministère. */
export function downloadSessionPv(sessionId: number, commissioners: string[],
                                  token: string | null) {
  return download(`/api/admin/pv/session/${sessionId}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ commissioners }),
  }, token, "proces-verbal-session.docx");
}

/**
 * Le PV des cartes d'honneur sur une période.
 *
 * ⚠️ AUCUN MEMBRE DE COMMISSION N'EST TRANSMIS, et le serveur les ignorerait.
 * Une carte d'honneur est octroyée par le Ministère sans examen : un bloc de
 * signature de la commission sur ce document serait un faux.
 */
export function downloadHonourPv(from: string, to: string, token: string | null) {
  return download("/api/admin/pv/honour", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to }),
  }, token, "proces-verbal-cartes-honneur.docx");
}

/** Le PV des cartes institutionnelles sur une période. */
export function downloadInstitutionalPv(from: string, to: string, token: string | null) {
  return download("/api/admin/pv/institutional", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ from, to }),
  }, token, "proces-verbal-cartes-institutionnelles.docx");
}