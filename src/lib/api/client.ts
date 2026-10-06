import type { ProblemDetail } from "@/lib/types";

/*
 * ═══════════════════════════════════════════════════════════════════════
 * ⚠️ DEUX ADRESSES POUR LA MÊME API, SELON QUI APPELLE.
 *
 * Le NAVIGATEUR appelle l'adresse publique (NEXT_PUBLIC_API_URL), inscrite
 * dans le code au moment du build : c'est la seule qu'il puisse joindre.
 *
 * Le SERVEUR Next.js — rendu des pages publiques, rafraîchissement après une
 * nouvelle session — tourne dans le même réseau Docker que l'application. Lui
 * faire appeler l'adresse publique le ferait sortir du conteneur, traverser
 * le reverse proxy du MTNIMA et revenir : un détour qui échoue si le
 * conteneur ne résout pas le domaine public, et qui fait passer par le proxy
 * des appels qui n'ont rien à y faire.
 *
 * API_INTERNAL_URL (http://backend:8080 dans le manifeste) n'a pas le
 * préfixe NEXT_PUBLIC_ : Next.js ne l'inscrit donc jamais dans le code du
 * navigateur, et elle n'existe que côté serveur. Absente — en développement —
 * le serveur retombe sur l'adresse publique, comme avant.
 * ═══════════════════════════════════════════════════════════════════════
 */
const PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

const BASE_URL =
  typeof window === "undefined"
    ? process.env.API_INTERNAL_URL ?? PUBLIC_API_URL
    : PUBLIC_API_URL;

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

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

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

  // 204 No Content, or any empty body: there is nothing to parse.
  // Calling response.json() here throws and turns a SUCCESS into an error —
  // which is exactly what made a working delete report "Suppression
  // impossible".
  if (
    response.status === 204 ||
    response.headers.get("content-length") === "0"
  ) {
    return undefined as T;
  }

  const text = await response.text();

  if (!text) {
    return undefined as T;
  }

  return JSON.parse(text) as T;
}