// src/lib/api/public.ts
//
// The read-only namespace: no token, no personal data.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface PublicSession {
  id: number;
  /**
   * What kind of cycle this is.
   *
   * ⚠️ WITHOUT IT A RENEWAL RENDERS AS A CANDIDATURE.
   *
   * The page compares `s.type === "RENEWAL"`. Absent from the payload the
   * comparison is false everywhere — and the public page invites strangers to
   * file a dossier only card holders may file, with a button that sends them
   * to create an account.
   *
   * A silent false, on the one screen nobody signs in to check.
   */
  type: "CANDIDACY" | "RENEWAL";
  startDate: string;
  receivingEnd: string;
}

export interface PublicCategory {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
}

/** التخصص — what a journalist actually does, printed on the card. */
export interface PublicSpecialisation {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
}

/**
 * ⚠️ ERRORS RETURN [], THEY NEVER THROW.
 *
 * These feed the public pages, which are server-rendered. A backend that is
 * down must give a page with an empty list and a note, not a 500 — the home
 * page is the first thing anyone sees, and it should degrade rather than
 * disappear.
 *
 * ⚠️ `next: { revalidate }` only applies on the SERVER. Called from a client
 * component — as the honour card dialog does — the option is ignored and the
 * browser fetches every time. Harmless for two reference lists of a dozen
 * rows, and worth knowing rather than assuming a cache that is not there.
 */
async function getJson<T>(path: string, revalidate: number, label: string): Promise<T[]> {
  const url = `${BASE_URL}${path}`;
  try {
    const res = await fetch(url, { next: { revalidate } });
    if (!res.ok) {
      console.error(
        `[public-api] ${label}: ${res.status} ${res.statusText} — ${url}` +
          (res.status === 401 || res.status === 403
            ? "  → the endpoint is not whitelisted in SecurityConfig"
            : "")
      );
      return [];
    }
    return (await res.json()) as T[];
  } catch (e) {
    console.error(`[public-api] ${label}: unreachable — ${url}`, e);
    return [];
  }
}

/** Open sessions — the backend returns RECEIVING only. */
export function fetchOpenSessions(): Promise<PublicSession[]> {
  return getJson<PublicSession>("/api/public/sessions", 60, "sessions");
}

/** Press-card categories (seeded reference data). */
export function fetchCategories(): Promise<PublicCategory[]> {
  return getJson<PublicCategory>("/api/public/categories", 3600, "categories");
}

/**
 * Specialisations (seeded reference data).
 *
 * A different vocabulary from the category: one answers "under what status do
 * you apply", the other "what do you actually do". A candidate picks from both
 * independently, and so does the Ministry when granting an honour card.
 */
export function fetchSpecialisations(): Promise<PublicSpecialisation[]> {
  return getJson<PublicSpecialisation>(
      "/api/public/specialisations", 3600, "specialisations");
}