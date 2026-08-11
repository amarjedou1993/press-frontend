// src/lib/api/reviewer-cards.ts
// Issued cards, as the commission reads them.
//
// `cannotProposeReasonFr` comes from the SERVER — the same principle as the
// submission gate. The button and its explanation are one decision, so they
// cannot disagree about whether a member may act.

import { apiFetch } from "./client";

export interface ReviewerCard {
  cardId: number;
  cardNumber: string;
  holderFullName: string;
  categoryLabelFr: string;
  specialisationFr?: string | null;
  institution?: string | null;
  issuedAt: string;
  expiresAt: string;
  status: "VALID" | "SUSPENDED" | "REVOKED" | "EXPIRED";
  statusLabelFr: string;
  expired: boolean;
  proposalPending: boolean;
  proposedByMe: boolean;
  /** Null when a proposal may be filed; otherwise why it may not. */
  cannotProposeReasonFr?: string | null;
}

export const reviewerCardKeys = {
  all: ["reviewer", "cards"] as const,
};

export function getReviewerCards() {
  return apiFetch<ReviewerCard[]>("/api/reviewer/cards");
}
