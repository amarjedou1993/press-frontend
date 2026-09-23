// src/lib/api/admin-stats.ts
//
// ⚠️ LES CHIFFRES SONT COMPTÉS EN BASE, PAS DANS LE NAVIGATEUR.
//
// Le tableau de bord téléchargeait le registre entier et le filtrait — ce qui
// marchait à six cents cartes, ne couvrait que la série A, et serait devenu
// l'écran le plus lent du système sans que rien ne le laisse voir.

import { apiFetch } from "./client";

export interface SeriesStats {
  /**
   * Toutes les cartes de cette série jamais délivrées.
   *
   * ⚠️ NON DÉDUCTIBLE DES AUTRES, et c'est pourquoi il est là.
   *
   * Une carte peut être en cours, ou expirée, ou retirée — et une carte
   * retirée qui a aussi dépassé sa date figure dans deux compteurs. Ils se
   * recouvrent par construction : chacun répond à sa propre question. Seul
   * un COUNT de la table répond à « combien en a-t-on délivré ».
   */
  total: number;
  /** Octroyées, valides, et pas au-delà de leur échéance. */
  inForce: number;
  /** En cours, et arrivant à échéance sous 90 jours. */
  lapsingSoon: number;
  suspended: number;
  revoked: number;
  expired: number;
}

export interface AdminStats {
  candidacy: SeriesStats;
  honour: SeriesStats;
  institutional: SeriesStats;
  institutionsActive: number;
  institutionsTotal: number;
  /** ⚠️ Le seul chiffre de l'écran qui soit le tour de quelqu'un. */
  institutionalAwaitingGrant: number;
   /**
   * Demandes d'enregistrement confirmées, en attente d'examen.
   *
   * ⚠️ Distinct de institutionalAwaitingGrant : celle-ci attend qu'un corps
   * soit admis, celle-là qu'un corps déjà admis voie ses fiches octroyées.
   */
  institutionRequestsPending: number;
}

export const statsKeys = {
  admin: ["admin", "stats"] as const,
};

export function getAdminStats() {
  return apiFetch<AdminStats>("/api/admin/stats");
}