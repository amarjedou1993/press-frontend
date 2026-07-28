"use client";
// src/components/reviewer/DecisionHistory.tsx
// What has already been decided, and by whom.
//
// It matters most on a FINAL or RECLAMATION round: the reviewer needs to see
// what the previous examination concluded and on what ground — particularly
// in a reclamation, where by law a DIFFERENT member re-examines a rejection
// and must know exactly what they are re-examining.

import { Check, X, PenLine, User } from "lucide-react";
import type { DecisionHistoryEntry } from "@/lib/api/review";

const ICONS = {
  APPROVE: Check,
  REJECT: X,
  REQUEST_CORRECTION: PenLine,
} as const;

const TONES = {
  APPROVE: { bg: "var(--green-tint)", fg: "var(--green-700)", ring: "var(--green-500)" },
  REJECT: { bg: "var(--red-tint)", fg: "var(--red-700)", ring: "var(--red-500)" },
  REQUEST_CORRECTION: { bg: "var(--gold-tint)", fg: "var(--gold-700)", ring: "var(--gold-500)" },
} as const;

export function DecisionHistory({ entries }: { entries: DecisionHistoryEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
          Décisions antérieures
        </p>
        <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
      </div>

      <ol className="mt-4 space-y-4">
        {entries.map((entry, i) => {
          const Icon = ICONS[entry.decision];
          const tone = TONES[entry.decision];

          return (
            <li key={i}
              className="rounded-xl border p-4"
              style={{ borderColor: tone.ring, background: tone.bg }}
            >
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-lg"
                  style={{ background: tone.ring, color: "#fff" }}>
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="text-[13.5px] font-extrabold" style={{ color: tone.fg }}>
                  {entry.decisionLabelFr}
                </span>
                <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10.5px] font-bold"
                  style={{ color: tone.fg }}>
                  {entry.roundLabelFr}
                </span>
                {entry.rejectionGroundLabelFr && (
                  <span className="rounded-full bg-white/70 px-2 py-0.5 text-[10.5px] font-bold"
                    style={{ color: tone.fg }}>
                    {entry.rejectionGroundLabelFr}
                  </span>
                )}
              </div>

              {entry.justification && (
                <p className="mt-2.5 whitespace-pre-wrap rounded-lg bg-white/60 px-3 py-2 text-[13px] leading-relaxed text-[var(--ink)]">
                  {entry.justification}
                </p>
              )}

              <p className="mt-2.5 flex items-center gap-1.5 text-[11.5px]"
                style={{ color: tone.fg }}>
                <User className="h-3 w-3" />
                {entry.reviewerName}
                <span className="opacity-60">·</span>
                <span className="font-mono">
                  {new Date(entry.at).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                    hour: "2-digit", minute: "2-digit",
                  })}
                </span>
              </p>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
