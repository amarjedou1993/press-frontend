"use client";
// src/components/reviewer/PoolStats.tsx
// The shape of the queue at a glance.
//
// A count alone ("47 en attente") does not tell a commission member how bad
// things are. The DISTRIBUTION does: forty files all submitted yesterday is
// a calm morning; forty with a dozen past a week is a problem that needs a
// decision about priorities. So the bar shows the mix, and the numbers
// beneath it name the parts.

import { Clock, AlertTriangle, TrendingUp } from "lucide-react";
import type { PoolItem } from "@/lib/api/review";

interface Band {
  key: "fresh" | "ageing" | "late";
  label: string;
  color: string;
  tint: string;
  ink: string;
}

const BANDS: Band[] = [
  { key: "fresh",  label: "moins de 3 j", color: "var(--green-500)", tint: "var(--green-tint)", ink: "var(--green-700)" },
  { key: "ageing", label: "3 à 6 j",      color: "var(--gold-500)",  tint: "var(--gold-tint)",  ink: "var(--gold-700)" },
  { key: "late",   label: "7 j et plus",  color: "var(--red-500)",   tint: "var(--red-tint)",   ink: "var(--red-700)" },
];

function bandOf(days: number): Band["key"] {
  if (days >= 7) return "late";
  if (days >= 3) return "ageing";
  return "fresh";
}

export function PoolStats({
  items,
  onFocusBand,
}: {
  items: PoolItem[];
  /** Clicking a band narrows the grid to it — the stat becomes a filter. */
  onFocusBand?: (band: Band["key"] | null) => void;
}) {
  if (items.length === 0) return null;

  const counts = { fresh: 0, ageing: 0, late: 0 };
  let totalDays = 0;
  let oldest = 0;

  for (const item of items) {
    counts[bandOf(item.waitingDays)] += 1;
    totalDays += item.waitingDays;
    oldest = Math.max(oldest, item.waitingDays);
  }

  const average = Math.round(totalDays / items.length);

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 px-5 py-4">
        {/* ── headline numbers ── */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-fg)]">
            En attente
          </p>
          <p className="mt-0.5 text-[24px] font-extrabold leading-none text-[var(--green-900)]">
            {items.length}
          </p>
        </div>

        <div className="h-9 w-px bg-[var(--line)]" aria-hidden="true" />

        <div>
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-fg)]">
            <TrendingUp className="h-2.5 w-2.5" /> Attente moyenne
          </p>
          <p className="mt-0.5 text-[24px] font-extrabold leading-none text-[var(--green-900)]">
            {average}
            <span className="ml-1 text-[13px] font-bold text-[var(--slate)]">j</span>
          </p>
        </div>

        <div className="h-9 w-px bg-[var(--line)]" aria-hidden="true" />

        <div>
          <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--muted-fg)]">
            <Clock className="h-2.5 w-2.5" /> Le plus ancien
          </p>
          <p
            className="mt-0.5 text-[24px] font-extrabold leading-none"
            style={{ color: oldest >= 7 ? "var(--red-500)" : "var(--green-900)" }}
          >
            {oldest}
            <span className="ml-1 text-[13px] font-bold text-[var(--slate)]">j</span>
          </p>
        </div>

        {counts.late > 0 && (
          <p className="ml-auto flex items-center gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-semibold text-[var(--red-700)]">
            <AlertTriangle className="h-3.5 w-3.5 flex-none" />
            {counts.late} dossier{counts.late > 1 ? "s" : ""} au-delà d&apos;une semaine
          </p>
        )}
      </div>

      {/* ── the mix ── */}
      <div className="px-5 pb-4">
        <div className="flex h-2 overflow-hidden rounded-full bg-[#eef1ef]">
          {BANDS.map((band) => {
            const value = counts[band.key];
            if (value === 0) return null;
            return (
              <button
                key={band.key}
                type="button"
                onClick={() => onFocusBand?.(band.key)}
                title={`${value} — ${band.label}`}
                aria-label={`${value} dossiers ${band.label}`}
                style={{
                  width: `${(value / items.length) * 100}%`,
                  background: band.color,
                }}
                className="transition-opacity hover:opacity-80"
              />
            );
          })}
        </div>

        <div className="mt-2.5 flex flex-wrap gap-x-5 gap-y-1">
          {BANDS.map((band) => (
            <span key={band.key} className="flex items-center gap-1.5 text-[11.5px]">
              <span className="h-2 w-2 rounded-full" style={{ background: band.color }} />
              <span className="font-bold" style={{ color: band.ink }}>
                {counts[band.key]}
              </span>
              <span className="text-[var(--muted-fg)]">{band.label}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
