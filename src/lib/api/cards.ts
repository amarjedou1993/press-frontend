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

  /** Times the assets were exported for production. Not printCount. */
  archiveCount?: number | null;

  /**
   * La session qui a produit cette carte.
   *
   * ⚠️ Les cartes sont éditées et renouvelées par COHORTES — tous les
   * accrédités d'une session partagent leur date d'expiration — donc c'est
   * l'unité dans laquelle l'autorité imprime et exporte.
   */
  sessionId?: number | null;
  /** « Session du 12 mars 2026 » — composée côté serveur, une seule fois. */
  sessionLabel?: string | null;
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

/** What an archive download reports back. */
export interface ArchiveResult {
  included: number;
  skipped: number;
}

/** INTERLEAVED for an office duplex; SEQUENTIAL for a card printer. */
export type PageLayout = "INTERLEAVED" | "SEQUENTIAL" | "SHARED_BACK";

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
                        fallbackName: string): Promise<Response> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (!res.ok) {
    // The server's own message when it sent one — "Ces cartes n'ont pas
    // toutes la même date d'expiration…" says far more than a generic
    // failure, and that one is the difference between a puzzled
    // administrator and a corrected selection.
    let message = "errors.downloadFailed";
    try {
      const body = await res.json();
      message = body.detail ?? body.message ?? message;
    } catch { /* keep the key */ }
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

  // ⚠️ Returned so a caller can read its own headers. The archive needs the
  // included/skipped counts, and the body is a binary file with nowhere to
  // put them.
  return res;
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

/**
 * The register as a workbook.
 *
 * ⚠️ The session filter travels to the SERVER, as a path rather than a query:
 * /export/session/{id} already existed. Filtering after the workbook is built
 * would mean downloading two hundred rows to keep forty.
 */
export function downloadRegistry(token: string | null, sessionId?: number | null) {
  const path = sessionId
    ? `/api/admin/cards/export/session/${sessionId}`
    : "/api/admin/cards/export";

  // The fallback name distinguishes the exports. Three workbooks all called
  // "registre-cartes.xlsx" in a Downloads folder is how the wrong one goes to
  // the printer. The server sends a better name still — with the date — and
  // download() prefers it.
  const fallback = sessionId
    ? `cartes-session-${sessionId}.xlsx`
    : "registre-cartes.xlsx";

  return download(path, { method: "GET" }, token, fallback);
}

/**
 * The production archive: one folder per card, with its photograph, its
 * verification QR and a reference PDF.
 *
 * ⚠️ NOT a print run. It increments archive_count, not print_count — a
 * designer collecting material is a different act from a batch going to the
 * card printer, and one number cannot answer both questions.
 */
export async function downloadArchive(
  cardIds: number[],
  token: string | null
): Promise<ArchiveResult> {
  const res = await download("/api/admin/cards/archive", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ cardIds }),
  }, token, "cartes.zip");

  // The counts live only in the headers — the body is the file itself.
  //
  // ⚠️ These arrive as 0 unless the backend sends Access-Control-Expose-Headers.
  // If a batch you know succeeded reports "0 exported", that header is
  // missing server-side, not this code.
  return {
    included: Number(res.headers.get("X-Archive-Included") ?? 0),
    skipped: Number(res.headers.get("X-Archive-Skipped") ?? 0),
  };
}