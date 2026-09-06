// src/app/[locale]/layout.tsx
//
// ⚠️ THIS IS NOW THE ROOT LAYOUT. app/layout.tsx is deleted.
//
// Next treats app/[locale]/layout.tsx as the root when no app/layout.tsx
// exists, which is the arrangement next-intl documents — and the reason its
// own examples have no file at app/layout.tsx.

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Inter, Cairo, IBM_Plex_Mono } from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
import { routing, dirOf } from "@/i18n/routing";
import "../globals.css";

/**
 * Inter — the Latin face.
 *
 * Chosen over a more characterful grotesque because this is an
 * administrative interface read at small sizes: form labels, table cells,
 * status pills. Inter's large x-height and open apertures hold up at 11px in
 * a way a condensed face does not.
 *
 * Its FIGURES matter as much. The dashboard, the register and the session
 * results are full of numbers that change while you look at them — Inter's
 * tabular numerals keep a column of counts from shifting.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  // Variable font: one file covers every weight the interface uses.
  weight: ["400", "500", "600", "700", "800", "900"],
});

/**
 * Cairo — the Arabic face.
 *
 * Geometric rather than naskh, which pairs far better with Inter than a
 * traditional face would: both have an even colour and an upright axis, so a
 * bilingual line does not read as two typefaces arguing.
 *
 * `display: "swap"` deliberately. On a weak connection the register must
 * render its text in a fallback rather than showing nothing — this page is
 * consulted at checkpoints, not at desks.
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Machine values: NNI, card numbers, identifiers.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MCACRP — Accréditation Presse",
  description:
    "Dépôt et suivi des demandes de carte de presse — Ministère de la Culture, "
    + "des Arts, de la Communication et des Relations avec le Parlement",
};

/** Both locales are prerendered — neither is a second-class page. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

/**
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ lang AND dir ARE RENDERED, NOT APPLIED AFTERWARDS.
 *
 * They used to be set by a client component in a useEffect. That meant the
 * prerendered HTML carried neither — so an Arabic page arrived left-to-right
 * and flipped once JavaScript ran. A visible reflow on load, on a site
 * consulted over weak connections at checkpoints.
 *
 * ⚠️ AND WITH JS SLOW OR BLOCKED, RTL NEVER APPLIED AT ALL: the public
 * register of accredited journalists would render Arabic left-to-right.
 *
 * It was also why almost every rule in globals.css was inert. Nearly all of
 * them are written `html[dir="rtl"] …` — the Arabic body face, the looser
 * line-height, the neutralised letter-spacing, the mirrored dialog close
 * button. None could match during the server render, and CSS applied after
 * hydration is CSS applied late.
 *
 * The locale is known at BUILD time: generateStaticParams returns both and
 * setRequestLocale is called below. Nothing here ever needed the browser.
 *
 * ⚠️ suppressHydrationWarning is gone with the effect. There is no longer a
 * mismatch to suppress, and leaving it would hide the next real one.
 * ───────────────────────────────────────────────────────────────────────
 */
export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // An unknown locale is a 404, not a silent fallback: /en/journalistes
  // should not quietly serve Arabic under an English URL.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Required for static rendering — without it every page becomes dynamic,
  // and the public pages must stay fast on a weak connection.
  setRequestLocale(locale);

  return (
    <html
      lang={locale}
      dir={dirOf(locale)}
      className={`${inter.variable} ${cairo.variable} ${plexMono.variable}`}
    >
      <body className="font-sans antialiased">
        <NextIntlClientProvider>
          <QueryProvider>{children}</QueryProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
