import type { ProblemDetail } from "@/lib/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export class ApiError extends Error {
  constructor(public readonly problem: ProblemDetail) {
    super(problem.detail ?? problem.title ?? `Erreur ${problem.status}`);
  }
}

interface AuthBridge {
  getToken: () => string | null;
  onSessionExpired: () => void;
}

let bridge: AuthBridge | null = null;

export function registerAuthBridge(b: AuthBridge) {
  bridge = b;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = bridge?.getToken() ?? null;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  if (!response.ok) {
    // Normalize both backend error shapes: ProblemDetail (400/401/409)
    // and the security handlers' {status, error, message} (401/403).
    let problem: ProblemDetail = { status: response.status };
    try {
      const body = await response.json();
      problem = {
        status: response.status,
        title: body.title ?? body.error,
        detail: body.detail ?? body.message,
        errors: body.errors,
      };
    } catch {
      /* non-JSON error body: keep the bare status */
    }

    // GLOBAL 401: a session existed but the backend no longer accepts it
    // (expired token, disabled account). Auth endpoints are exempt — a
    // failed login is a normal 401, not an expired session.
    if (
      problem.status === 401 &&
      token !== null &&
      !path.startsWith("/api/auth/")
    ) {
      bridge?.onSessionExpired();
    }

    throw new ApiError(problem);
  }

  return response.json() as Promise<T>;
}
