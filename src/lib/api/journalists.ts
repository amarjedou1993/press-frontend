export interface PublicJournalist {
  fullName: string;
  categoryLabelFr?: string | null;
  categoryLabelAr?: string | null;
  specialisationFr?: string | null;
  specialisationAr?: string | null;
  institution?: string | null;
  cardNumber: string;
  expiresAt: string;
}

export interface RegistrySnapshot {
  /** A register without a date is a rumour. */
  compiledAt: string;
  total: number;
  journalists: PublicJournalist[];
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Fetched WITHOUT apiFetch: that helper attaches a bearer token and redirects
 * on 401, neither of which belongs on a page a member of the public reads.
 */
export async function getPublicRegistry(): Promise<RegistrySnapshot> {
  const res = await fetch(`${BASE}/api/public/journalists`, { cache: "no-store" });
  if (!res.ok) throw new Error("Le registre n'a pas pu être consulté.");
  return res.json();
}
