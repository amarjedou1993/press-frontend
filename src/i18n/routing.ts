// src/i18n/routing.ts
// Which locales exist, and how they appear in the URL.
//
// ───────────────────────────────────────────────────────────────────────
// THE LOCALE LIVES IN THE PATH — /ar/journalistes, /fr/admin/cards.
//
// Because a LINK is how this system is used: a ministry forwards the register
// to a department, a journalist sends the verification page to an editor.
// With the locale in a cookie, that link opens in the RECIPIENT's last choice
// — wrong about half the time, and silently.
//
// EVERY route is localised, the Authority's spaces included. One navigation
// rule across the whole application, and translating them later costs no
// migration.
//
// ARABIC IS THE DEFAULT. It is the official language, and the public pages
// serve the widest audience — an agent verifying a card at a checkpoint is
// the least likely person in this system to prefer French.
// ───────────────────────────────────────────────────────────────────────

import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "fr"],
  defaultLocale: "ar",
  localePrefix: "always",

  // The stored preference survives a session. A candidate who registered in
  // French returns to their dossier in French.
  localeCookie: {
    name: "MCACRP_LOCALE",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  },
});

export type Locale = (typeof routing.locales)[number];

/**
 * The Authority's own spaces are French until their strings are extracted.
 *
 * ⚠️ TEMPORARY. The proxy redirects /ar/admin to /fr/admin on the strength of
 * this constant. When the admin and reviewer catalogues exist, DELETE THIS
 * and the two redirect blocks in proxy.ts — nothing else references it.
 */
export const STAFF_LOCALE: Locale = "fr";

/** RTL is a property of the locale, asked in enough places to name once. */
export function isRtl(locale: string): boolean {
  return locale === "ar";
}

export function dirOf(locale: string): "rtl" | "ltr" {
  return isRtl(locale) ? "rtl" : "ltr";
}

/** What the switcher shows — each language named in ITSELF, never translated. */
export const LOCALE_NAMES: Record<Locale, { native: string; short: string }> = {
  ar: { native: "العربية", short: "ع" },
  fr: { native: "Français", short: "FR" },
};
