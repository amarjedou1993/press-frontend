"use client";
// src/components/admin/InstitutionalStaffFilters.tsx

import { Search } from "lucide-react";

export type StaffScope = "all" | "awaiting" | "granted" | "blocked";

export interface StaffFilterState {
  scope: StaffScope;
  search: string;
}

export const DEFAULT_STAFF_FILTERS: StaffFilterState = {
  /**
   * ⚠️ "awaiting", NOT "all".
   *
   * The Ministry opens this screen to grant. A roll of two hundred where a
   * hundred and ninety are already granted makes the ten that need work the
   * hardest thing on the page — and the default should be the reason someone
   * came.
   *
   * "Toutes" is one click away for the case where they are looking something
   * up instead.
   */
  scope: "awaiting",
  search: "",
};

/**
 * The scopes an administrator actually works in.
 *
 * ⚠️ THREE STATES, AND ONLY ONE IS ACTIONABLE.
 *
 * Granted is done. Blocked is waiting on the institution — a missing identity
 * number, a duplicate — and the Ministry can only report it. Awaiting is the
 * work.
 *
 * Separating blocked from awaiting is the point: folded together, ten rows
 * that cannot be granted sit among ninety that can, and "select all" quietly
 * means "select ninety".
 */
export function InstitutionalStaffFilters({
  value, onChange, counts,
}: {
  value: StaffFilterState;
  onChange: (next: StaffFilterState) => void;
  counts: Record<StaffScope, number>;
}) {
  const SCOPES: Array<{ key: StaffScope; label: string }> = [
    { key: "awaiting", label: "En attente" },
    { key: "granted", label: "Octroyées" },
    { key: "blocked", label: "Bloquées" },
    { key: "all", label: "Toutes" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex flex-wrap rounded-xl bg-[#f2f5f3] p-1">
        {SCOPES.map((scope) => {
          const selected = value.scope === scope.key;
          /* ⚠️ A scope with nothing in it is HIDDEN, not shown empty.
             "Bloquées 0" is a tab that teaches an administrator to ignore
             tabs — and the day one appears, its arrival is the signal. */
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
          placeholder="Nom, NNI, n° de carte…"
          aria-label="Rechercher un agent"
          className="h-10 w-full rounded-xl border border-[var(--line)] bg-white ps-10 pe-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 sm:w-64"
        />
      </div>
    </div>
  );
}
