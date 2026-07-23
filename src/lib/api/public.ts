// src/lib/api/public.ts
// SERVER-SIDE fetching for the public pages. Deliberately separate from
// lib/api/client.ts: that module lives in the browser (it injects the auth
// token from the Zustand store and handles the global 401). These calls run
// on the SERVER, carry no credentials, and are cached by Next.
//
// `revalidate` is the ISR window: the page is rendered once, served from
// cache to everyone, and re-rendered at most every N seconds. The backend
// sees one request per window regardless of traffic — which is exactly what
// a public page linked from a press release needs.

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

/** Open sessions (backend returns RECEIVING only). Empty on failure — a
 *  public page must degrade gracefully, never crash on a backend hiccup. */
export async function fetchOpenSessions(): Promise<PublicSession[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/public/sessions`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicSession[];
  } catch {
    return [];
  }
}

/** Press-card categories (seeded reference data — changes almost never). */
export async function fetchCategories(): Promise<PublicCategory[]> {
  try {
    const res = await fetch(`${BASE_URL}/api/public/categories`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    return (await res.json()) as PublicCategory[];
  } catch {
    return [];
  }
}
