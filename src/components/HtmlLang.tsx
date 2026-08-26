"use client";

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
