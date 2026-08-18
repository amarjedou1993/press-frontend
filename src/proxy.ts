// src/proxy.ts
//
// ───────────────────────────────────────────────────────────────────────
// ONE RULE: every route carries a locale.
//
// An earlier version excluded /admin and /reviewer, on the reasoning that
// those spaces are French. That boundary produced three faults in one
// afternoon:
//
//   · a member signing in landed on /fr/reviewer, which did not exist
//   · AppShell threw "No intl context found" outside the [locale] tree
//   · the RTL direction leaked into a French interface and mirrored it
//
// All three were the same fault: a rule with an exception, and components
// obliged to know which side of it they were on.
//
// ───────────────────────────────────────────────────────────────────────
// AND THE AUTHORITY'S SPACES REDIRECT RATHER THAN RENDER.
//
// Their text is French until the strings are extracted. /ar/admin therefore
// becomes /fr/admin — it does not render French under an Arabic URL.
//
// A CSS guard was the alternative: let the page render and pin its direction.
// That corrects a symptom. A page whose address says Arabic and whose content
// is French is a page whose URL lies, and whoever bookmarks or forwards it
// passes the lie on.
//
// The redirect is 307 — temporary — so no browser or proxy caches it once the
// guard is lifted. Lifting it is one deletion: this block, and STAFF_LOCALE.
// ───────────────────────────────────────────────────────────────────────

import createMiddleware from "next-intl/middleware";
import { NextRequest, NextResponse } from "next/server";
import { routing, STAFF_LOCALE } from "./i18n/routing";

const handleI18n = createMiddleware(routing);

/** A staff path carrying a locale prefix — /ar/admin, /fr/reviewer/12. */
const PREFIXED_STAFF = /^\/([a-z]{2})\/(admin|reviewer)(\/|$)/;

/** A staff path with no prefix — an old bookmark, a logout redirect. */
const BARE_STAFF = /^\/(admin|reviewer)(\/|$)/;

export default function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── the Authority's spaces are French, and their URLs say so ──

  const prefixed = pathname.match(PREFIXED_STAFF);
  if (prefixed && prefixed[1] !== STAFF_LOCALE) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.replace(`/${prefixed[1]}/`, `/${STAFF_LOCALE}/`);
    return NextResponse.redirect(url, 307);
  }

  // Straight to French rather than through the cookie: a stored /admin
  // bookmark should not land in Arabic and bounce.
  if (BARE_STAFF.test(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = `/${STAFF_LOCALE}${pathname}`;
    return NextResponse.redirect(url, 307);
  }

  // ── everything else: normal locale routing ──

  const response = handleI18n(request);

  // The root layout renders <html> but sits ABOVE the [locale] segment, so it
  // cannot read the locale from params. This header is how `lang` and `dir`
  // reach it — and `dir` on <html> is the only place that mirrors the whole
  // document, scrollbars and form controls included.
  const locale =
    response.headers.get("x-middleware-request-x-next-intl-locale")
    ?? routing.locales.find(
      (l) => pathname === `/${l}` || pathname.startsWith(`/${l}/`)
    )
    ?? routing.defaultLocale;

  response.headers.set("x-locale", locale);
  return response;
}

export const config = {
  // Everything except Next's internals, the API proxy and static files.
  // The file-extension exclusion matters: without it /logo.png would be
  // redirected to /ar/logo.png and 404.
  matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"],
};
