// src/app/api/revalidate/route.ts
// On-demand ISR purge, called by the BACKEND when session state changes.
//
// Why this exists: the public pages are cached (revalidate: 60) so that a
// press release linking to /sessions costs the backend one request per minute
// instead of thousands. The price is staleness — up to a minute, or until the
// next build if the page was pre-rendered. That is unacceptable exactly when
// it matters most: the moment a session opens and journalists are refreshing.
//
// So the backend tells us the instant something changes, and we drop the
// cached render. Best of both: cached by default, live when it counts.
//
// Auth: a shared secret in the X-Revalidate-Token header. This endpoint can
// only invalidate a cache — it exposes no data and mutates nothing — but it
// is public, so an unauthenticated caller could otherwise force cache misses.

import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";

/** Paths whose content depends on session state. */
const PUBLIC_PATHS = ["/", "/sessions"];

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
