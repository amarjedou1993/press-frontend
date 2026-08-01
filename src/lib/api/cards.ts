// src/lib/api/cards.ts
// Mirrors AdminCardController.
//
// Note `blockerFr` on IssuableItem: the server says WHY a dossier cannot yet
// produce a card — a missing photograph, an absent specialisation — before a
// batch of two hundred is launched. Discovering it inside a failure list is
// too late to be useful.

import { apiFetch } from "./client";

export interface IssuableItem {
  applicationId: number;
  candidateFullName: string;
  categoryLabelFr: string;
  identityNumber: string;
  hasPhoto: boolean;
  /** Non-null when the card cannot be issued. */
  blockerFr?: string | null;
}

export interface CardItem {
  cardId: number;
  cardNumber: string;
  holderFullName: string;
  categoryLabelFr: string;
  issuedAt: string;
  expiresAt: string;
  status: "VALID" | "SUSPENDED" | "REVOKED" | "EXPIRED";
  statusLabelFr: string;
  expired: boolean;
  printCount: number;
}

export interface IssueOutcome {
  applicationId: number;
  candidateFullName: string;
  issued: boolean;
  cardNumber?: string | null;
  failureReason?: string | null;
}

export interface BatchResult {
  requested: number;
  issued: number;
  failed: number;
  outcomes: IssueOutcome[];
}

/** INTERLEAVED for an office duplex; SEQUENTIAL for a card printer. */
export type PageLayout = "INTERLEAVED" | "SEQUENTIAL";

export const cardKeys = {
  issuable: ["cards", "issuable"] as const,
  registry: ["cards", "registry"] as const,
};

export function getIssuable() {
  return apiFetch<IssuableItem[]>("/api/admin/cards/issuable");
}

export function getRegistry() {
  return apiFetch<CardItem[]>("/api/admin/cards");
}

export function issueCards(applicationIds: number[]) {
  return apiFetch<BatchResult>("/api/admin/cards/issue", {
    method: "POST",
    body: JSON.stringify({ applicationIds }),
  });
}

/* ── downloads ──
   These return files, so they bypass apiFetch and fetch blobs directly. */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

async function download(path: string, init: RequestInit, token: string | null,
                        fallbackName: string) {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    let message = "Le téléchargement a échoué.";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the default */ }
    throw new Error(message);
  }

  // The filename comes from Content-Disposition when the server sets one —
  // it knows the card number and the layout; the browser does not.
  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? fallbackName;

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

export function downloadCardPdf(cardId: number, cardNumber: string, token: string | null) {
  return download(`/api/admin/cards/${cardId}/pdf`, { method: "GET" }, token,
    `carte-${cardNumber}.pdf`);
}

export function downloadBatchPdf(cardIds: number[], layout: PageLayout,
                                 token: string | null) {
  return download("/api/admin/cards/print", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardIds, layout }),
  }, token, "cartes.pdf");
}

export function downloadRegistry(token: string | null) {
  return download("/api/admin/cards/export", { method: "GET" }, token,
    "registre-cartes.xlsx");
}
