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
