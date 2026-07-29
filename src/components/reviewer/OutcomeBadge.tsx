"use client";
// src/components/reviewer/OutcomeBadge.tsx
// The outcome of a decision, for the "Traités" list.
//
// A settled dossier needs a different signal from a waiting one: waiting time
// is meaningless once a decision exists, and what matters instead is WHAT was
// decided. So the treated list swaps the clock badge for this.

import { Check, X, PenLine } from "lucide-react";
import type { DecisionType } from "@/lib/api/review";

const TONES: Record<DecisionType, { bg: string; fg: string; Icon: React.ElementType }> = {
  APPROVE: { bg: "var(--green-tint)", fg: "var(--green-700)", Icon: Check },
  REJECT: { bg: "var(--red-tint)", fg: "var(--red-700)", Icon: X },
  REQUEST_CORRECTION: { bg: "var(--gold-tint)", fg: "var(--gold-700)", Icon: PenLine },
};

export function OutcomeBadge({
  decision,
  label,
  at,
  compact = false,
}: {
  decision: DecisionType;
  label?: string | null;
  at?: string | null;
  compact?: boolean;
}) {
  const tone = TONES[decision];
  if (!tone) return null;

  return (
    <span
      className="inline-flex flex-none items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold"
      style={{ background: tone.bg, color: tone.fg }}
      title={at ? `Décidé le ${new Date(at).toLocaleDateString("fr-FR")}` : undefined}
    >
      <tone.Icon className="h-2.5 w-2.5" />
      {compact ? null : (label ?? decision)}
    </span>
  );
}
