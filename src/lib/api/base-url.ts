const DEV_FALLBACK = "http://localhost:8080";

/** Backend address for code that runs on the Next.js server (SSR, server components). */
export function serverApiBaseUrl(): string {
    return process.env.API_INTERNAL_URL
        || process.env.NEXT_PUBLIC_API_URL
        || DEV_FALLBACK;
}