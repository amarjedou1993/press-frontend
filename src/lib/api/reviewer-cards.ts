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

  /**
   * La session qui a produit cette carte.
   *
   * ⚠️ Les cartes sont éditées par COHORTES — tous les accrédités d'une
   * session partagent leur date d'expiration, et les décisions qui les
   * fondent ont été prises en une fois. Relire une session est une tâche
   * réelle pour un membre ; relire « toutes les cartes » n'en est pas une.
   */
  sessionId?: number | null;
  /** « Session du 12 mars 2026 » — composée côté serveur. */
  sessionLabel?: string | null;
}

export const reviewerCardKeys = {
  all: ["reviewer", "cards"] as const,
};

export function getReviewerCards() {
  return apiFetch<ReviewerCard[]>("/api/reviewer/cards");
}