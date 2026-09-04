// src/lib/api/honour-import.ts
//
// Bulk honour card grants, from a spreadsheet.
//
// ⚠️ THE FILE IS POSTED TWICE, and the administrator picks it once.
//
// The browser holds the File between the preview and the confirmation and
// sends it again — so the double upload is over the wire, not a second trip
// to the file picker. The server re-parses because that second parse is the
// CHECK: it verifies the file still describes the set that was confirmed
// before a single card number is taken.

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface ImportRow {
  rowNumber: number;
  fullName: string;
  identityNumber: string;
  birthdate?: string | null;
  birthplace?: string | null;
  categoryId?: number | null;
  categoryLabelFr?: string | null;
  specialisationId?: number | null;
  specialisationLabelFr?: string | null;
  institution?: string | null;
  expiresAt?: string | null;
  grantReason: string;
  hasPhoto: boolean;
  /** Non-null when the row cannot be granted. */
  errorFr?: string | null;
  /** Non-blocking — a missing photograph lands here, not in errorFr. */
  warningFr?: string | null;
}

export interface ImportPreview {
  totalRows: number;
  validRows: number;
  rowsWithPhoto: number;
  rejectedRows: number;
  rows: ImportRow[];
  /** Problems with the archive itself, not with any one row. */
  fileErrorsFr: string[];
}

export interface RowOutcome {
  rowNumber: number;
  fullName: string;
  granted: boolean;
  cardNumber?: string | null;
  photoAttached: boolean;
  failureFr?: string | null;
}

export interface CommitResult {
  requested: number;
  granted: number;
  failed: number;
  photosAttached: number;
  outcomes: RowOutcome[];
}

const IMPORT_BASE = `${BASE}/api/admin/honour-cards/import`;

/** Shared error handling — the server sends a French sentence in `detail`. */
async function readError(res: Response, fallback: string): Promise<never> {
  let message = fallback;
  try {
    const body = await res.json();
    message = body.detail ?? body.message ?? fallback;
  } catch {
    /* keep the fallback */
  }
  throw new Error(message);
}

/**
 * Read the archive and report what would happen.
 *
 * ⚠️ NOTHING IS WRITTEN. Can be re-run as often as the administrator likes
 * while they fix their file.
 */
export async function previewHonourImport(
  file: File,
  token: string | null
): Promise<ImportPreview> {
  const form = new FormData();
  form.append("file", file);

  const res = await fetch(`${IMPORT_BASE}/preview`, {
    method: "POST",
    // NO Content-Type: the browser must set the multipart boundary.
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) return readError(res, "L'archive n'a pas pu être lue.");
  return res.json();
}

/**
 * Grant the confirmed rows.
 *
 * ⚠️ identityNumbers is what the administrator SAW. The server refuses if the
 * file no longer describes exactly that set — edited between the steps, a
 * different file chosen, or one of these people granted a card by a colleague
 * in the meantime.
 */
export async function commitHonourImport(
  file: File,
  identityNumbers: string[],
  token: string | null
): Promise<CommitResult> {
  const form = new FormData();
  form.append("file", file);
  // A repeated form field, which Spring binds to List<String>.
  identityNumbers.forEach((n) => form.append("identityNumbers", n));

  const res = await fetch(`${IMPORT_BASE}/commit`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });

  if (!res.ok) return readError(res, "L'import n'a pas pu être effectué.");
  return res.json();
}

/**
 * The blank workbook.
 *
 * ⚠️ Without it the first import fails on column order, and nothing tells the
 * administrator what the columns should be.
 */
export async function downloadHonourTemplate(token: string | null): Promise<void> {
  const res = await fetch(`${IMPORT_BASE}/template`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!res.ok) return readError(res, "Le modèle n'a pas pu être téléchargé.");

  const disposition = res.headers.get("content-disposition") ?? "";
  const match = disposition.match(/filename="?([^"]+)"?/);
  const filename = match?.[1] ?? "modele-cartes-honneur.xlsx";

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
