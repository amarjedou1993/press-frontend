"use client";
// src/components/HtmlLang.tsx
//
// Keeps <html lang> and <html dir> in step with the active locale.
//
// ⚠️ WHY THIS IS NEEDED. The root layout reads the locale from a header, which
// is correct for the FIRST paint — the document arrives with the right
// direction and no flash. But a root layout is SHARED across client
// navigations: moving from /ar/journalistes to /fr/journalistes reuses it, so
// the header is never read again and <html dir> keeps its old value. Content
// changes; direction does not.
//
// This runs inside the [locale] tree, where a locale change IS a re-render,
// and writes the two attributes directly.
//
// It renders nothing. The server still sets the attributes for the initial
// document, so this only ever corrects them on a later switch.
//
// No staff special case: the proxy redirects /ar/admin to /fr/admin, so a
// staff route is served as French and this simply follows.

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { dirOf } from "@/i18n/routing";

export function HtmlLang() {
  const locale = useLocale();

  useEffect(() => {
    const html = document.documentElement;
    html.lang = locale;
    html.dir = dirOf(locale);
  }, [locale]);

  return null;
}
