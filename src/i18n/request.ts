// src/i18n/request.ts
// The server-side message loader.

import { getRequestConfig } from "next-intl/server";
import { hasLocale } from "next-intl";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;

  // An unknown locale falls back rather than throwing: a stale bookmark to
  // /en/journalistes should show the register, not an error page.
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,

    // Dates and numbers are formatted from ONE place, so a date never appears
    // in two shapes on the same screen.
    formats: {
      dateTime: {
        short: { day: "numeric", month: "short", year: "numeric" },
        long: { day: "numeric", month: "long", year: "numeric" },
        full: {
          day: "numeric", month: "long", year: "numeric",
          hour: "2-digit", minute: "2-digit",
        },
      },
      number: {
        // Western digits in both languages — the printed card uses them, and
        // a card number read on screen must match the one in the hand.
        plain: { useGrouping: false },
      },
    },

    // A missing key must not blank a page. In development it is loud; in
    // production it renders the key so the gap is visible but harmless.
    onError() {},
    getMessageFallback({ key, namespace }) {
      const path = [namespace, key].filter(Boolean).join(".");
      if (process.env.NODE_ENV === "development") {
        console.warn(`[i18n] clé manquante : ${path}`);
      }
      return path;
    },
  };
});
