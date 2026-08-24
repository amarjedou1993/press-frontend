import { apiFetch } from "./client";

export interface MyCard {
  cardNumber: string;
  categoryLabelFr?: string | null;
  categoryLabelAr?: string | null;
  specialisationFr?: string | null;
  specialisationAr?: string | null;
  institution?: string | null;
  issuedAt: string;
  expiresAt: string;
  status: "VALID" | "SUSPENDED" | "REVOKED" | "EXPIRED";
  statusLabelFr: string;
  statusLabelAr?: string | null;

  /**
   * When the status last changed — an ISO timestamp.
   *
   * ⚠️ NOT the same as issuedAt. A withdrawal notice dated the day the card
   * was printed reads as though the Ministry revoked it on issue.
   *
   * Null for a lapsed card: nobody acted on it, it reached its date.
   */
  statusChangedAt?: string | null;

  expired: boolean;
  usable: boolean;
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
// export function getMyCard() {
//   return apiFetch<MyCard | undefined>("/api/me/card");
// }

export async function getMyCard() {
  const card = await apiFetch<MyCard | undefined>("/api/me/card");
  return card ?? null;
}
