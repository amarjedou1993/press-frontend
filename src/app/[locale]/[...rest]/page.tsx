// src/app/[locale]/[...rest]/page.tsx
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ THIS FILE EXISTS SO THAT [locale]/not-found.tsx IS EVER REACHED.
//
// Next resolves the route tree BEFORE rendering. An unmatched URL such as
// /ar/nonsense matches no page in the tree, so it never enters the [locale]
// segment at all — and falls through to the ROOT not-found, bypassing the
// localised one entirely. That is why a carefully written 404 sat unused
// while the browser showed Next's default.
//
// A catch-all segment matches whatever is left over, which brings the request
// INSIDE [locale]. From there, calling notFound() renders the page we
// actually wrote, in the right language, with the header and footer around it.
//
// It has the LOWEST routing priority in Next: a real page, a dynamic segment,
// even another catch-all nested deeper all win over it. So it only ever
// catches what nothing else did.
// ───────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { routing } from "@/i18n/routing";

/** Prerendered per locale, like every other page in this tree. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale, rest: [] as string[] }));
}

export default async function CatchAllPage({
  params,
}: {
  params: Promise<{ locale: string; rest?: string[] }>;
}) {
  const { locale } = await params;

  // Without this the 404 renders in the default locale rather than the one
  // in the URL — /fr/nonsense would answer in Arabic.
  setRequestLocale(locale);

  notFound();
}
