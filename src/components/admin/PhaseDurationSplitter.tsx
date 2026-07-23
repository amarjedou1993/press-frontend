"use client";
// src/components/admin/PhaseDurationSplitter.tsx
// APPLICATION-LAYER component (the 20% tier): composes shadcn Inputs but the
// live phase-date derivation is HAPA domain logic.
//
// The admin enters a start date + four per-phase day counts. This mirrors
// the backend's math (start + receivingDays -> receivingEnd, then +reviewDays,
// etc.) and previews the derived calendar live, so what they submit is exactly
// what the server will compute — no surprises after save.

import { useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export interface PhaseDurations {
  startDate: string;         // yyyy-mm-dd
  receivingDays: number;
  reviewDays: number;
  correctionDays: number;
  reclamationDays: number;
}

const PHASES = [
  { key: "receivingDays", label: "Réception des dossiers", hint: "Dépôt des candidatures" },
  { key: "reviewDays", label: "Examen", hint: "Étude par la commission" },
  { key: "correctionDays", label: "Correction", hint: "Corrections demandées" },
  { key: "reclamationDays", label: "Réclamation", hint: "Recours des candidats" },
] as const;

function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function fmt(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });
}

export function PhaseDurationSplitter({
  value,
  onChange,
}: {
  value: PhaseDurations;
  onChange: (next: PhaseDurations) => void;
}) {
  // Derive the four boundary dates cumulatively — the same order the backend uses.
  const derived = useMemo(() => {
    const receivingEnd = addDays(value.startDate, value.receivingDays);
    const reviewEnd = addDays(receivingEnd, value.reviewDays);
    const correctionEnd = addDays(reviewEnd, value.correctionDays);
    const reclamationEnd = addDays(correctionEnd, value.reclamationDays);
    return { receivingEnd, reviewEnd, correctionEnd, reclamationEnd };
  }, [value]);

  const total =
    value.receivingDays + value.reviewDays + value.correctionDays + value.reclamationDays;

  const boundaryFor: Record<string, string> = {
    receivingDays: derived.receivingEnd,
    reviewDays: derived.reviewEnd,
    correctionDays: derived.correctionEnd,
    reclamationDays: derived.reclamationEnd,
  };

  function setDays(key: keyof PhaseDurations, raw: string) {
    const n = Math.max(0, parseInt(raw || "0", 10) || 0);
    onChange({ ...value, [key]: n });
  }

  return (
    <div className="space-y-6">
      {/* Start date */}
      <div className="space-y-2">
        <Label htmlFor="startDate">Date de début de la session</Label>
        <Input
          id="startDate"
          type="date"
          value={value.startDate}
          onChange={(e) => onChange({ ...value, startDate: e.target.value })}
          className="max-w-xs"
        />
      </div>

      {/* Phase rows: day input + derived end date */}
      <div className="rounded-xl border border-[var(--line)] overflow-hidden">
        <div className="grid grid-cols-[1fr_120px_180px] items-center gap-3 bg-[var(--green-tint)] px-4 py-2.5 text-[11px] font-bold uppercase tracking-wider text-[var(--green-700)]">
          <span>Phase</span>
          <span>Durée (jours)</span>
          <span>Se termine le</span>
        </div>
        {PHASES.map((phase, i) => (
          <div
            key={phase.key}
            className={`grid grid-cols-[1fr_120px_180px] items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-[var(--line)]" : ""}`}
          >
            <div>
              <p className="text-sm font-semibold text-[var(--ink)]">{phase.label}</p>
              <p className="text-xs text-[var(--slate)]">{phase.hint}</p>
            </div>
            <Input
              type="number"
              min={1}
              value={value[phase.key] || ""}
              onChange={(e) => setDays(phase.key, e.target.value)}
              aria-label={`Durée en jours : ${phase.label}`}
            />
            <span className="font-mono text-[13px] text-[var(--green-900)]">
              {fmt(boundaryFor[phase.key])}
            </span>
          </div>
        ))}
      </div>

      {/* Total summary */}
      <div className="flex items-center justify-between rounded-xl bg-[var(--green-900)] px-5 py-4 text-white">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--gold-500)]">
            Durée totale de la session
          </p>
          <p className="text-xs text-white/60">
            Du {fmt(value.startDate)} au {fmt(derived.reclamationEnd)}
          </p>
        </div>
        <p className="text-3xl font-extrabold">
          {total} <span className="text-base font-semibold text-white/70">jours</span>
        </p>
      </div>
    </div>
  );
}
