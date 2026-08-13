// src/lib/api/my-card.ts
// A journalist's own card.
//
// The candidate space could tell a holder their card had been issued but not
// what its NUMBER was — no endpoint returned it. A press card number is
// something its holder is asked for; withholding it from the one person
// entitled to it was an oversight.

import { apiFetch } from "./client";

export interface MyCard {
  cardNumber: string;
  categoryLabelFr?: string | null;
  categoryLabelAr?: string | null;
  specialisationFr?: string | null;
  institution?: string | null;
  issuedAt: string;
  expiresAt: string;
  status: "VALID" | "SUSPENDED" | "REVOKED" | "EXPIRED";
  statusLabelFr: string;
  expired: boolean;
  usable: boolean;
  /** Set when the card is not in force — the holder is owed the reason. */
  statusReason?: string | null;
}

export const myCardKeys = {
  card: ["me", "card"] as const,
};

/**
 * Returns undefined when the caller holds no card.
 *
 * The endpoint answers 204, which apiFetch resolves to undefined — having no
 * card yet is a normal state for a candidate, not an error.
 */
export function getMyCard() {
  return apiFetch<MyCard | undefined>("/api/me/card");
}
