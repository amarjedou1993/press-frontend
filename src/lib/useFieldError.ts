"use client";

import { useTranslations } from "next-intl";

export function useFieldError() {
  // Root namespace, so a dotted key resolves wherever it was defined.
  const t = useTranslations();

  return (error?: string | null) => {
    if (!error) return undefined;
    return t.has(error) ? t(error) : error;
  };
}
