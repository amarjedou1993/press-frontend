// src/lib/api/institution-requests.ts
//
// Institutions apply; the Ministry decides.
//
// ⚠️ NO TOKEN ON EITHER CALL. An applicant has no account — that is the point
// — so these endpoints sit under /api/auth, which SecurityConfig leaves open.

import { apiFetch } from "./client";

export interface InstitutionRequestForm {
  proposedNameFr: string;
  proposedNameAr: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  password: string;
  locale: string;
}

export interface SubmittedResponse {
  email: string;
}

export interface ConfirmedResponse {
  /** True when the link had already been used. */
  alreadyConfirmed: boolean;
}

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/**
 * Submit a request, with its formal letter.
 *
 * ⚠️ MULTIPART, AND ITS OWN FETCH.
 *
 * apiFetch sets a JSON content type, which would break the upload silently:
 * the browser must set the multipart boundary itself. The same reason
 * uploadHonourPhoto bypasses it.
 *
 * ⚠️ AND THE LETTER TRAVELS WITH THE FORM, not in a second request. A request
 * without its evidence is a request the Ministry cannot examine, and a
 * two-step submission would leave a window where exactly that exists.
 */
export async function submitInstitutionRequest(
  form: InstitutionRequestForm,
  letter: File,
): Promise<SubmittedResponse> {
  const body = new FormData();
  Object.entries(form).forEach(([key, value]) => body.append(key, value ?? ""));
  body.append("letter", letter);

  const res = await fetch(`${BASE}/api/auth/institution-requests`, {
    method: "POST",
    // NO Content-Type: the browser sets the boundary.
    body,
  });

  if (!res.ok) {
    /*
     * ⚠️ THE PROBLEM OBJECT IS THROWN WHOLE, not flattened to a sentence.
     *
     * The page needs three things from it: 409 to place a duplicate address
     * beside its field, `errors` to place the server's field messages, and
     * `detail` for everything else. A string would lose all three.
     */
    let problem: unknown = { status: res.status };
    try { problem = { ...(await res.json()), status: res.status }; } catch { /* keep it */ }
    throw problem;
  }

  return res.json();
}

/** Consume the confirmation link. */
export function confirmInstitutionRequest(token: string) {
  return apiFetch<ConfirmedResponse>("/api/auth/institution-requests/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}
