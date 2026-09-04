"use client";
// src/components/admin/HonourFilters.tsx

import { Search, LayoutGrid, Rows3 } from "lucide-react";

export type HonourScope = "all" | "active" | "noPhoto" | "stopped";
export type HonourDensity = "grid" | "list";

export interface HonourFilterState {
  scope: HonourScope;
  search: string;
}

export const DEFAULT_HONOUR_FILTERS: HonourFilterState = {
  scope: "all",
  search: "",
};

/**
 * The register's controls.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ FOUR SCOPES, AND NOTHING ELSE.
 *
 * The reviewer's pool carries category, round, urgency and a sort control,
 * because a commission member works a queue of two hundred dossiers with real
 * competing priorities.
 *
 * Honour cards are exceptional grants, not a cohort. Filtering forty of them
 * by specialisation is a control nobody reaches for, and every control that
 * is never used makes the ones that matter harder to find.
 *
 * "Sans photo" is the one that earns its place: after an import it is the
 * actionable set, and it is what an administrator opens this page to work
 * through.
 * ───────────────────────────────────────────────────────────────────────
 */
export function HonourFilters({
  value, onChange, counts, density, onDensityChange,
}: {
  value: HonourFilterState;
  onChange: (next: HonourFilterState) => void;
  counts: Record<HonourScope, number>;
  density: HonourDensity;
  onDensityChange: (density: HonourDensity) => void;
}) {
  const SCOPES: Array<{ key: HonourScope; label: string }> = [
    { key: "all", label: "Toutes" },
    { key: "active", label: "En cours" },
    { key: "noPhoto", label: "Sans photo" },
    { key: "stopped", label: "Arrêtées" },
  ];

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="inline-flex flex-wrap rounded-xl bg-[#f2f5f3] p-1">
        {SCOPES.map((scope) => {
          const selected = value.scope === scope.key;
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
              {/* ⚠️ The count sits on the tab, so the administrator sees how
                  many cards are waiting for a photograph without selecting
                  the tab to find out. */}
              <span className="ms-1.5 font-mono text-[10.5px] opacity-60">
                {counts[scope.key]}
              </span>
            </button>
          );
        })}
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-fg)]" />
        <input
          type="search"
          value={value.search}
          onChange={(e) => onChange({ ...value, search: e.target.value })}
          placeholder="Nom, n° de carte, organe…"
          aria-label="Rechercher une carte"
          className="h-10 w-full rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 sm:w-64"
        />
      </div>

      {/* ⚠️ TWO VIEWS, and they serve different moments.
          The grid shows FACES — which is how an administrator checks that
          forty imported photographs are the right forty. The list shows
          reasons and status, which is how they read the register. */}
      <div className="ms-auto inline-flex rounded-xl bg-[#f2f5f3] p-1">
        {([
          { key: "grid" as const, Icon: LayoutGrid, label: "Grille" },
          { key: "list" as const, Icon: Rows3, label: "Liste" },
        ]).map((option) => {
          const selected = density === option.key;
          return (
            <button
              key={option.key}
              type="button"
              onClick={() => onDensityChange(option.key)}
              aria-pressed={selected}
              aria-label={option.label}
              title={option.label}
              className="rounded-lg p-2 transition-all"
              style={selected
                ? { background: "#fff", color: "var(--green-900)",
                    boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                : { color: "var(--muted-fg)" }}
            >
              <option.Icon className="h-4 w-4" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
