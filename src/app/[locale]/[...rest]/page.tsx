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
