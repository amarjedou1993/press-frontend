"use client";
// src/components/institution/StaffFilters.tsx

import { useTranslations } from "next-intl";
import { Search } from "lucide-react";

export type RollScope = "all" | "noPhoto" | "awaiting" | "granted";

export interface RollFilterState {
  scope: RollScope;
  search: string;
}

export const DEFAULT_ROLL_FILTERS: RollFilterState = {
  /**
   * ⚠️ "all", UNLIKE THE MINISTRY'S SCREEN.
   *
   * The Ministry opens its version to grant, so it defaults to the work.
   *
   * An institution opens this to see its roll — who is filed, who has a card.
   * Defaulting to "sans photo" would answer a question they had not asked,
   * and hide the ninety people who are fine.
   *
   * The count in the hero is what points at the work.
   */
  scope: "all",
  search: "",
};

/**
 * The institution's own scopes.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ NO "BLOCKED" HERE, AND THAT IS NOT AN OMISSION.
 *
 * The Ministry's screen separates blocked from awaiting because it decides
 * between them. An institution cannot: a filing refused for a duplicate
 * identity looks to them exactly like one that simply has not been reached
 * yet, and both mean "the Ministry has it".
 *
 * What an institution CAN act on is a missing photograph — the only thing on
 * this screen that is theirs to fix, and the only thing standing between a
 * granted card and a produced one.
 * ───────────────────────────────────────────────────────────────────────
 */
export function StaffFilters({
  value, onChange, counts,
}: {
  value: RollFilterState;
  onChange: (next: RollFilterState) => void;
  counts: Record<RollScope, number>;
}) {
  const t = useTranslations("institution");

  const SCOPES: Array<{ key: RollScope; label: string }> = [
    { key: "all", label: t("scopeAll") },
    { key: "noPhoto", label: t("scopeNoPhoto") },
    { key: "awaiting", label: t("scopeAwaiting") },
    { key: "granted", label: t("scopeGranted") },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex flex-wrap rounded-xl bg-[#f2f5f3] p-1">
        {SCOPES.map((scope) => {
          const selected = value.scope === scope.key;
          /* A scope with nothing in it is hidden — except "all", which is the
             way back, and the selected one, which must not vanish underfoot. */
          if (counts[scope.key] === 0 && scope.key !== "all" && !selected) {
            return null;
          }
          return (
            <button
              key={scope.key}
              type="button"
              onClick={() => onChange({ ...value, scope: scope.key })}
              aria-pressed={selected}
              className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-all"
              style={selected
                ? { background: "#fff", color: "var(--green-900)",
                    boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                : { color: "var(--slate)" }}
            >
              {scope.label}
              <span className="ms-1.5 font-mono text-[10.5px] opacity-60">
                {counts[scope.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-fg)]" />
        <input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder={t("searchPlaceholder")}
          aria-label={t("searchPlaceholder")}
          className="h-10 w-full rounded-xl border border-[var(--line)] bg-white ps-10 pe-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 sm:w-64"
        />
      </div>
    </div>
  );
}
