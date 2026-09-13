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

/**
 * One institution's card, as the producer reads it.
 *
 * ⚠️ IT CARRIES ITS BODY, and that is the difference from an honour card.
 *
 * An honour card belongs to no cohort — granted one at a time, on its own
 * occasion, so a flat list is the honest shape. An institution's cards are a
 * batch: collected together, by one body, in one envelope. A run for one
 * agency and a run for another are two physical batches, and the producer
 * picks the body before selecting — exactly as they pick the session for an
 * ordinary card.
 */
export interface PrintableInstitutionalCard {
  cardId: number;
  cardNumber: string;
  holderFullName: string;
  /**
   * Printed on nothing. It is what tells a producer which of two people with
   * one name is which.
   */
  jobTitle?: string | null;
  categoryLabelFr: string;
  institutionId: number;
  institutionNameFr: string;
  issuedAt: string;
  expiresAt: string;
  /** Shown before selection — nothing blocks a reprint. */
  producedCount: number;
}

/** One body's producible cards, as the endpoint groups them. */
export interface PrintableInstitutionGroup {
  institutionId: number;
  institutionNameFr: string;
  cards: PrintableInstitutionalCard[];
}

/**
 * One production run.
 *
 * ⚠️ THIS INTERFACE WAS DECLARED TWICE, AND THE HISTORY SCREEN PAID FOR IT.
 *
 * The second declaration — added while the institutional types were pasted in
 * — carried no `series`. TypeScript takes the LAST one, so `run.series` did
 * not exist, every chip fell back to its default, and three series rendered
 * as "Session" on every row of the printer's history.
 *
 * It compiled, and it type-checked. A duplicate interface is not an error in
 * TypeScript: the later declaration simply wins, silently.
 */
export interface RunSummary {
  id: number;
  printedAt: string;
  actorName: string;
  sessionId?: number | null;
  sessionLabel?: string | null;
  /** ASSETS for a producer, PDF for an administrator. Never interchangeable. */
  kind: "ASSETS" | "PDF";
  /**
   * ⚠️ WHICH SERIES, and it is not the same question as `kind`.
   *
   * `kind` says HOW the cards left — assets to a producer, a signed PDF to
   * the Ministry. `series` says WHAT they were. A run of honour cards and a
   * run of institutional cards are both ASSETS, and without this the history
   * shows them identically: a producer asked in January what they made in
   * November could not say.
   *
   * Derived server-side from which column of print_run_cards is set, never
   * stored on the run — the series is already on the card each row points at.
   */
  series: "CARD" | "HONOUR" | "INSTITUTIONAL";
  cardCount: number;
}

export interface ArchiveResult {
  included: number;
  skipped: number;
}

export const printerKeys = {
  sessions: ["printer", "sessions"] as const,
  cards: (sessionId: number) => ["printer", "cards", sessionId] as const,
  honour: ["printer", "honour"] as const,
  institutional: ["printer", "institutional"] as const,
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

/**
 * Producible institutional cards, GROUPED BY BODY.
 *
 * ⚠️ The grouping comes from the server rather than being done here: it is
 * the same question findProducible answers — which cards may be made — and
 * the body is part of that answer, not a presentation choice.
 */
export function getPrintableInstitutionalCards() {
  return apiFetch<PrintableInstitutionGroup[]>("/api/printer/institutional-cards");
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

/**
 * The institutional cards' production assets.
 *
 * ⚠️ A LINE-FOR-LINE COPY OF downloadHonourArchive, deliberately — only the
 * path and the fallback filename differ. A FIX TO ONE BELONGS IN THE OTHER,
 * and the two headers below are the part that would silently break: they are
 * readable only because SecurityConfig exposes them, and without that every
 * download reports nothing included and nothing skipped.
 */
export async function downloadInstitutionalArchive(
  cardIds: number[],
  token: string | null
): Promise<ArchiveResult> {
  const res = await fetch(`${BASE}/api/printer/institutional-archive`, {
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
  const filename = match?.[1] ?? "cartes-institutionnelles.zip";

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