"use client";
// src/components/reviewer/PoolFilters.tsx
// Narrowing a session's dossiers down to the one to open next.
//
// TWO ADDITIONS OVER A PLAIN FILTER BAR.
//
// 1. ACTIVE FILTERS ARE SHOWN AS REMOVABLE CHIPS. A select that reads
//    "Presse écrite" tells you what is selected only if you look at it; a
//    chip row tells you why the count dropped, and lets you undo ONE
//    condition instead of resetting everything.
//
// 2. A DENSITY TOGGLE. Cards for scanning, rows for volume — the same
//    afternoon needs both.

import { Search, X, LayoutGrid, Rows3, SlidersHorizontal } from "lucide-react";

export type Scope = "pool" | "mine" | "all";
export type SortKey = "waiting_desc" | "waiting_asc" | "name_asc" | "name_desc";
export type Density = "grid" | "list";
export type UrgencyBand = "" | "fresh" | "ageing" | "late";

export interface PoolFilterState {
  scope: Scope;
  search: string;
  category: string;
  round: string;
  urgency: UrgencyBand;
  sort: SortKey;
}

export const DEFAULT_FILTERS: PoolFilterState = {
  scope: "pool",
  search: "",
  category: "",
  round: "",
  urgency: "",
  sort: "waiting_desc",
};

const SCOPES: { key: Scope; label: string }[] = [
  { key: "pool", label: "File commune" },
  { key: "mine", label: "Mes dossiers" },
  { key: "all", label: "Tous" },
];

const SORTS: { key: SortKey; label: string }[] = [
  { key: "waiting_desc", label: "Attente la plus longue" },
  { key: "waiting_asc", label: "Plus récents d'abord" },
  { key: "name_asc", label: "Nom (A → Z)" },
  { key: "name_desc", label: "Nom (Z → A)" },
];

const URGENCY_LABELS: Record<Exclude<UrgencyBand, "">, string> = {
  fresh: "Moins de 3 jours",
  ageing: "3 à 6 jours",
  late: "7 jours et plus",
};

export function PoolFilters({
  value,
  onChange,
  categories,
  rounds,
  counts,
  density,
  onDensityChange,
}: {
  value: PoolFilterState;
  onChange: (next: PoolFilterState) => void;
  categories: string[];
  rounds: string[];
  counts: { pool: number; mine: number; all: number };
  density: Density;
  onDensityChange: (d: Density) => void;
}) {
  const set = <K extends keyof PoolFilterState>(key: K, v: PoolFilterState[K]) =>
    onChange({ ...value, [key]: v });

  const chips: { key: keyof PoolFilterState; label: string }[] = [];
  if (value.search.trim()) chips.push({ key: "search", label: `« ${value.search.trim()} »` });
  if (value.category) chips.push({ key: "category", label: value.category });
  if (value.round) chips.push({ key: "round", label: value.round });
  if (value.urgency) chips.push({ key: "urgency", label: URGENCY_LABELS[value.urgency] });

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white">
      {/* ── scope + density ── */}
      <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-4 py-3">
        <div className="inline-flex rounded-xl bg-[#f2f5f3] p-1">
          {SCOPES.map((s) => {
            const selected = value.scope === s.key;
            return (
              <button
                key={s.key}
                type="button"
                onClick={() => set("scope", s.key)}
                aria-pressed={selected}
                className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-all"
                style={
                  selected
                    ? { background: "#fff", color: "var(--green-900)",
                        boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                    : { color: "var(--slate)" }
                }
              >
                {s.label}
                <span className="ml-1.5 font-mono text-[10.5px] opacity-60">
                  {counts[s.key]}
                </span>
              </button>
            );
          })}
        </div>

        <div className="ml-auto inline-flex rounded-xl bg-[#f2f5f3] p-1">
          {([
            { key: "grid" as const, Icon: LayoutGrid, label: "Affichage en grille" },
            { key: "list" as const, Icon: Rows3, label: "Affichage en liste" },
          ]).map(({ key, Icon, label }) => {
            const selected = density === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => onDensityChange(key)}
                aria-pressed={selected}
                aria-label={label}
                title={label}
                className="rounded-lg p-1.5 transition-all"
                style={
                  selected
                    ? { background: "#fff", color: "var(--green-900)",
                        boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                    : { color: "var(--muted-fg)" }
                }
              >
                <Icon className="h-4 w-4" />
              </button>
            );
          })}
        </div>
      </div>

      {/* ── the filters ── */}
      <div className="grid gap-2.5 px-4 py-3 sm:grid-cols-2 lg:grid-cols-5">
        <div className="relative sm:col-span-2 lg:col-span-2">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
          <input
            type="search"
            value={value.search}
            onChange={(e) => set("search", e.target.value)}
            placeholder="Nom ou n° de dossier…"
            aria-label="Rechercher un candidat"
            className="h-9 w-full rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none transition-colors placeholder:text-[var(--muted-fg)] focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
          />
        </div>

        <Select value={value.category} onChange={(v) => set("category", v)}
          label="Filtrer par catégorie" placeholder="Toutes catégories"
          options={categories} />

        <Select value={value.round} onChange={(v) => set("round", v)}
          label="Filtrer par phase" placeholder="Toutes phases"
          options={rounds} />

        <select
          value={value.sort}
          onChange={(e) => set("sort", e.target.value as SortKey)}
          aria-label="Trier"
          className="h-9 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
        >
          {SORTS.map((s) => <option key={s.key} value={s.key}>{s.label}</option>)}
        </select>
      </div>

      {/* ── active filters, each removable on its own ── */}
      {chips.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-[var(--line)] px-4 py-2.5">
          <span className="inline-flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)]">
            <SlidersHorizontal className="h-3 w-3" /> Filtres actifs
          </span>

          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => set(chip.key, "" as never)}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--green-tint)] py-1 pl-2.5 pr-1.5 text-[11.5px] font-semibold text-[var(--green-700)] transition-colors hover:bg-[var(--green-500)]/25"
            >
              {chip.label}
              <X className="h-3 w-3" />
            </button>
          ))}

          <button
            type="button"
            onClick={() =>
              onChange({ ...DEFAULT_FILTERS, scope: value.scope, sort: value.sort })}
            className="ml-1 text-[11.5px] font-semibold text-[var(--muted-fg)] underline underline-offset-2 hover:text-[var(--ink)]"
          >
            tout effacer
          </button>
        </div>
      )}
    </div>
  );
}

function Select({
  value, onChange, label, placeholder, options,
}: {
  value: string;
  onChange: (v: string) => void;
  label: string;
  placeholder: string;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="h-9 rounded-lg border bg-white px-3 text-[13px] outline-none transition-colors focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
      style={{ borderColor: value ? "var(--green-500)" : "var(--line)" }}
    >
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}
