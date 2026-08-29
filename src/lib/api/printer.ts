// src/lib/api/printer.ts
//
// The producer's surface.
//
// ⚠️ NOTE WHAT IS ABSENT: any way to fetch a card PDF.
//
// A producer receives the production assets — photograph, verification QR,
// reference preview — and never the signed card. The Ministry's layout and
// its signature do not leave, which is what makes an outside contractor
// tenable at all.

import { apiFetch } from "./client";

export interface PrintableSession {
  sessionId: number;
  label: string | null;
  cardCount: number;
}

export interface PrintableCard {
  cardId: number;
  cardNumber: string;
  holderFullName: string;
  categoryLabelFr: string;
  specialisationFr?: string | null;
  institution?: string | null;
  issuedAt: string;
  expiresAt: string;
  sessionId?: number | null;
  sessionLabel?: string | null;
  /**
   * How many production runs have included this card.
   *
   * ⚠️ Shown BEFORE selection. Nothing blocks a reprint — a jam or a spent
   * ribbon is normal, and a permission gate on a contractor is a control that
   * gets worked around. A count at the point of decision is the control that
   * does not need one.
   */
  producedCount: number;
}

export interface PrintableHonourCard {
  cardId: number;
  cardNumber: string;
  holderFullName: string;
  categoryLabelFr: string;
  institution?: string | null;
  issuedAt: string;
  expiresAt: string;
  /** Shown before selection — nothing blocks a reprint. */
  producedCount: number;
}

export interface RunSummary {
  id: number;
  printedAt: string;
  actorName: string;
  sessionId?: number | null;
  sessionLabel?: string | null;
  /** ASSETS for a producer, PDF for an administrator. Never interchangeable. */
  kind: "ASSETS" | "PDF";
  cardCount: number;
}

export interface ArchiveResult {
  included: number;
  skipped: number;
}

// export const printerKeys = {
//   sessions: ["printer", "sessions"] as const,
//   cards: (sessionId: number) => ["printer", "cards", sessionId] as const,
//   history: ["printer", "history"] as const,
// };

export const printerKeys = {
  sessions: ["printer", "sessions"] as const,
  cards: (sessionId: number) => ["printer", "cards", sessionId] as const,
  honour: ["printer", "honour"] as const,
  history: ["printer", "history"] as const,
};

export function getPrintableSessions() {
  return apiFetch<PrintableSession[]>("/api/printer/sessions");
}

export function getPrintableCards(sessionId: number) {
  return apiFetch<PrintableCard[]>(`/api/printer/cards?sessionId=${sessionId}`);
}

export function getPrintableHonourCards() {
  return apiFetch<PrintableHonourCard[]>("/api/printer/honour-cards");
}

export function getPrintHistory(limit = 50) {
  return apiFetch<RunSummary[]>(`/api/printer/history?limit=${limit}`);
}

/* ── the archive ── */

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * The production assets, as a ZIP.
 *
 * ⚠️ Its own fetch rather than the one in cards.ts: that module is the
 * Ministry's surface and this one is the producer's, and a shared helper
 * between the two would be a route by which one could reach the other's
 * endpoints. They resemble each other; they are not the same thing.
 */
export async function downloadPrinterArchive(
  cardIds: number[],
  sessionId: number | null,
  token: string | null
): Promise<ArchiveResult> {
  const res = await fetch(`${BASE}/api/printer/archive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ cardIds, sessionId }),
  });

  if (!res.ok) {
    // The server's own message where it sent one — "Aucune des cartes
    // sélectionnées n'est valable pour la production" says more than a
    // generic failure, and it names a real state.
    let message = "errors.downloadFailed";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the key */ }
    throw new Error(message);
  }

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "cartes.zip";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);

  // ⚠️ Headers-only: the body is the file. These arrive as 0 unless the
  // backend sends Access-Control-Expose-Headers — which SecurityConfig now
  // does.
  return {
    included: Number(res.headers.get("X-Archive-Included") ?? 0),
    skipped: Number(res.headers.get("X-Archive-Skipped") ?? 0),
  };
}

/**
 * The honour cards' production assets.
 *
 * ⚠️ NO SESSION, because an honour card belongs to no cohort — it is granted
 * one at a time, on its own occasion.
 *
 * ⚠️ AND NO REFERENCE PDF in the archive: CardPdfService lays out a card from
 * a dossier, and these have none. What arrives is the photograph and the QR.
 */
export async function downloadHonourArchive(
  cardIds: number[],
  token: string | null
): Promise<ArchiveResult> {
  const res = await fetch(`${BASE}/api/printer/honour-archive`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ cardIds }),
  });

  if (!res.ok) {
    let message = "errors.downloadFailed";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the key */ }
    throw new Error(message);
  }

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "cartes-honneur.zip";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);

  return {
    included: Number(res.headers.get("X-Archive-Included") ?? 0),
    skipped: Number(res.headers.get("X-Archive-Skipped") ?? 0),
  };
}