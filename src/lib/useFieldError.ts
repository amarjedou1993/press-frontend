// src/lib/useFieldError.ts
//
// Resolve a validation KEY, or pass a finished sentence through unchanged.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ WHY THIS EXISTS, AND WHY IT IS SHARED.
//
// Errors reach a field from two places. Client validators and Zod schemas
// emit KEYS — "validation.email", "blockers.INSTITUTION_MISSING" — because
// they run before a locale is known. The SERVER sometimes emits a finished
// sentence, already in the caller's language.
//
// Checking whether the key exists lets both work through one prop, so no call
// site has to know where its error came from.
//
// It was written inline in AuthShell first. Four components need it now, and
// four copies of a rule is how the rule stops being the same rule.
// ───────────────────────────────────────────────────────────────────────

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
