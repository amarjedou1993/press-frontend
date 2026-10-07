import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/** Paths whose content depends on session state. */
// const PUBLIC_PATHS = ["/", "/sessions"];
/**
 * Paths whose content depends on session state.
 *
 * ⚠️ ONE PER LOCALE, and that is why this list is not two entries.
 *
 * Every route lives under /[locale]. There is no page at "/" — purging it
 * clears a route that does not exist, and the Arabic and French versions are
 * separately cached documents. Missing one leaves half the public site stale
 * while the other half updates, which is harder to notice than both being
 * stale.
 */
const PUBLIC_PATHS = [
  "/fr", "/ar",
  "/fr/sessions", "/ar/sessions",
  "/fr/journalistes", "/ar/journalistes",
];

export async function POST(request: NextRequest) {
  const expected = process.env.REVALIDATE_TOKEN;

  if (!expected) {
    console.error("[revalidate] REVALIDATE_TOKEN is not configured");
    return NextResponse.json(
      { revalidated: false, reason: "not-configured" },
      { status: 500 }
    );
  }

  const provided = request.headers.get("x-revalidate-token");
  if (provided !== expected) {
    console.warn("[revalidate] rejected: bad or missing token");
    return NextResponse.json(
      { revalidated: false, reason: "unauthorized" },
      { status: 401 }
    );
  }

  // Optional: a specific path, otherwise every session-dependent page.
  let paths = PUBLIC_PATHS;
  try {
    const body = await request.json();
    if (typeof body?.path === "string") paths = [body.path];
  } catch {
    /* no body — purge the default set */
  }

  paths.forEach((p) => revalidatePath(p));
  console.info(`[revalidate] purged: ${paths.join(", ")}`);

  return NextResponse.json({
    revalidated: true,
    paths,
    at: new Date().toISOString(),
  });
}

/** Convenience for a manual check from a browser or curl. */
export async function GET() {
  return NextResponse.json({
    endpoint: "POST with header X-Revalidate-Token to purge the public cache",
    paths: PUBLIC_PATHS,
  });
}
