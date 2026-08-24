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
