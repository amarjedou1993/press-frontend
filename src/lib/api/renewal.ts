// src/lib/api/renewal.ts
//
// ⚠️ ONE ENDPOINT, AND THAT IS THE POINT.
//
// Everything after "yes, renew me" is the ordinary candidature path: the same
// startApplication, the same dossier, the same commission, the same card. This
// module only answers "may I, and on what card" — and carries what the
// previous dossier said, so the holder can confirm it rather than retype it.

import { apiFetch } from "./client";

export interface RenewalEligibility {
  eligible: boolean;
  /** The card being renewed, when there is one. */
  cardId?: number | null;
  cardNumber?: string | null;
  expiresAt?: string | null;
  /** True when the card has lapsed but is still inside the grace period. */
  lapsed: boolean;
  /** The open renewal session, when there is one. */
  sessionId?: number | null;
  sessionDeadline?: string | null;
  /**
   * Null when eligible; otherwise why not.
   *
   * ⚠️ A FRENCH SENTENCE FROM THE SERVER, not a key — like
   * NotEligibleForRenewalException's messages. That is a known gap, shared
   * with InvalidFileException: both will pass through untranslated into an
   * Arabic screen, and both belong on the same list.
   */
  blockerFr?: string | null;
}

export interface RenewalContext {
  eligibility: RenewalEligibility;
  /**
   * What the previous dossier said.
   *
   * ⚠️ SUPPLIED SO THE HOLDER CAN CONFIRM IT, not so a form arrives filled
   * in. The screen asks "do you still work for X?" with two buttons — a
   * pre-filled text box invites scrolling past, and whether the employer has
   * changed is the one fact a renewal exists to establish.
   */
  previousSpecialisationId?: number | null;
  previousSpecialisationFr?: string | null;
  previousInstitution?: string | null;
}

export const renewalKeys = {
  context: ["renewal", "context"] as const,
};

export function getRenewalContext() {
  return apiFetch<RenewalContext>("/api/renewal/context");
}
