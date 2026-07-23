// src/lib/api/public.ts
// SERVER-SIDE fetching for the public pages: no credentials, cached by Next.
//
// These helpers degrade gracefully — a backend hiccup must never crash a
// public page — but they no longer degrade SILENTLY. An unreachable or
// rejecting API now logs to the server console with the status, because a
// swallowed 401 is indistinguishable from "no sessions" and that cost us an
// afternoon.

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface PublicSession {
  id: number;
  startDate: string;
  receivingEnd: string;
}

export interface PublicCategory {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
}

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
