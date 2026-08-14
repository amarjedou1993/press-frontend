import { apiFetch } from "./client";

/* ══ shared shapes ══ */

export type ProposalStatus = "PENDING" | "EXECUTED" | "DECLINED" | "WITHDRAWN";

export interface RevocationGroundOption {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
  hintFr?: string | null;
  /** True where proposing suspends the card immediately. */
  warrantsImmediateSuspension: boolean;
}

export interface ProposalResponse {
  id: number;

  cardId: number;
  cardNumber: string;
  holderFullName: string;
  cardStatus?: string | null;
  cardStatusLabelFr?: string | null;

  groundId: number;
  groundCode?: string | null;
  groundLabelFr: string;
  groundLabelAr?: string | null;
  warrantsImmediateSuspension: boolean;
  statement: string;

  proposedById: number;
  proposedByName: string;
  proposedAt?: string | null;

  status: ProposalStatus;
  statusLabelFr: string;
  decidedByName?: string | null;
  decidedAt?: string | null;
  decidedNote?: string | null;
}

export interface CardStatusResponse {
  cardId: number;
  cardNumber: string;
  status: string;
  statusLabelFr: string;
  usable: boolean;
  statusReason?: string | null;
  statusChangedAt?: string | null;
}

export interface CardHistoryEntry {
  fromStatus?: string | null;
  toStatus: string;
  toStatusLabelFr: string;
  reason: string;
  actorName: string;
  /** Set only on a revocation — this is what shows BOTH hands. */
  proposedByName?: string | null;
  at?: string | null;
}

export const lifecycleKeys = {
  grounds: ["revocation", "grounds"] as const,
  pending: ["revocation", "pending"] as const,
  pendingCount: ["revocation", "pending", "count"] as const,
  mine: ["revocation", "mine"] as const,
  history: (cardId: number) => ["card", cardId, "history"] as const,
  proposals: (cardId: number) => ["card", cardId, "revocations"] as const,
};

/** The service's own minimum — mirrored so the counter agrees with it. */
export const MIN_STATEMENT_LENGTH = 40;

/* ══ the commission proposes ══ */

export function getRevocationGrounds() {
  return apiFetch<RevocationGroundOption[]>("/api/reviewer/revocations/grounds");
}

export function proposeRevocation(body: {
  cardId: number;
  groundId: number;
  statement: string;
}) {
  return apiFetch<ProposalResponse>("/api/reviewer/revocations", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function withdrawProposal(proposalId: number) {
  return apiFetch<ProposalResponse>(
    `/api/reviewer/revocations/${proposalId}/withdraw`,
    { method: "POST" }
  );
}

export function getMyProposals() {
  return apiFetch<ProposalResponse[]>("/api/reviewer/revocations/mine");
}

/* ══ the Authority decides ══ */

export function getPendingProposals() {
  return apiFetch<ProposalResponse[]>("/api/admin/cards/revocations/pending");
}

export function getPendingCount() {
  return apiFetch<number>("/api/admin/cards/revocations/pending/count");
}

export function executeRevocation(proposalId: number, note?: string) {
  return apiFetch<CardStatusResponse>(
    `/api/admin/cards/revocations/${proposalId}/execute`,
    { method: "POST", body: JSON.stringify({ note: note ?? null }) }
  );
}

export function declineRevocation(proposalId: number, reason: string) {
  return apiFetch<ProposalResponse>(
    `/api/admin/cards/revocations/${proposalId}/decline`,
    { method: "POST", body: JSON.stringify({ reason }) }
  );
}

/* ══ suspension — the Authority alone ══ */

export function suspendCard(cardId: number, reason: string) {
  return apiFetch<CardStatusResponse>(`/api/admin/cards/${cardId}/suspend`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

export function reinstateCard(cardId: number, reason: string) {
  return apiFetch<CardStatusResponse>(`/api/admin/cards/${cardId}/reinstate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
}

/* ══ a card's whole life ══ */

export function getCardHistory(cardId: number) {
  return apiFetch<CardHistoryEntry[]>(`/api/admin/cards/${cardId}/history`);
}

export function getCardProposals(cardId: number) {
  return apiFetch<ProposalResponse[]>(`/api/admin/cards/${cardId}/revocations`);
}
