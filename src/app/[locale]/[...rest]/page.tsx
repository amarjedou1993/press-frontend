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

// import { notFound } from "next/navigation";
// import { setRequestLocale } from "next-intl/server";
// import { routing } from "@/i18n/routing";

// /** Prerendered per locale, like every other page in this tree. */
// export function generateStaticParams() {
//   return routing.locales.map((locale) => ({ locale, rest: [] as string[] }));
// }

// export default async function CatchAllPage({
//   params,
// }: {
//   params: Promise<{ locale: string; rest?: string[] }>;
// }) {
//   const { locale } = await params;

//   // Without this the 404 renders in the default locale rather than the one
//   // in the URL — /fr/nonsense would answer in Arabic.
//   setRequestLocale(locale);

//   notFound();
// }

// src/app/[locale]/[...rest]/page.tsx
//
// Anything under a valid locale that matches no real route.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ IT EXISTS ONLY SO A 404 KEEPS ITS LOCALE.
//
// Without this segment, /fr/nonsense falls to the ROOT not-found — outside
// [locale], where there is no request locale, so the page cannot be
// translated and the header and footer disappear. With it, an unmatched path
// still renders the localised 404 inside the public chrome.
// ───────────────────────────────────────────────────────────────────────

import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";

/**
 * ⚠️ EMPTY, AND THAT IS THE WHOLE POINT.
 *
 * It previously returned `{ locale, rest: [] }` for each locale — which asks
 * Next to prerender "/ar" and "/fr" AS THIS CATCH-ALL. A catch-all requires
 * at least one segment, so those paths do not match it and the build fails:
 *
 *     The provided export path '/ar' doesn't match the '/[locale]/[...rest]' page.
 *
 * At RUNTIME the same confusion is worse and quieter: the catch-all claims
 * the bare locale route, and /fr answers 404 while every file is in the right
 * place and every guard passes.
 *
 * There is nothing here to prerender. An unmatched path is, by definition,
 * not knowable ahead of time — so the list is empty and the segment renders
 * on demand.
 *
 * Returning [] rather than deleting the function matters: WITHOUT it, the
 * segment inherits the parent layout's generateStaticParams, and the bug
 * comes straight back.
 */
export function generateStaticParams() {
  return [];
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

  // ⚠️ notFound() THROWS. Nothing may follow it, and nothing should: this
  // segment renders no markup of its own. What the reader sees is
  // src/app/[locale]/not-found.tsx, which carries the seal and the three ways
  // out — and which Next reaches precisely because this call throws.
  notFound();
}
