"use client";
// src/components/reviewer/DossierRow.tsx
// The dense alternative to a card.
//
// Cards are better for scanning; rows are better for COMPARING and for
// getting through volume. A commission member with two hundred files wants
// to see thirty at once, not nine. Offering both is not indecision — they
// serve different moments in the same afternoon.

import { forwardRef } from "react";
import { Clock, PenLine, Lock, ArrowRight } from "lucide-react";
import type { PoolItem } from "@/lib/api/review";
import { waitingTone } from "./DossierCard";
import { OutcomeBadge } from "./OutcomeBadge";

export const DossierRow = forwardRef<HTMLDivElement, {
  item: PoolItem;
  mine: boolean;
  focused?: boolean;
  claiming?: boolean;
  /**
   * The session column.
   *
   * ⚠️ DECIDED BY THE PAGE, not here. A row does not know which scope it is
   * being shown in, and a component that infers its own context is wrong the
   * day it is reused somewhere else.
   *
   * True only in "Mes décisions" — the one scope that crosses sessions. In
   * the working queue every row would carry the same label.
   */
  showSession?: boolean;
  onOpen: () => void;
  onClaim?: () => void;
}>(function DossierRow(
  { item, mine, focused = false, claiming = false, showSession = false, onOpen, onClaim },
  ref
) {
  const tone = waitingTone(item.waitingDays);
  const claimedByOther = item.claimedBy !== null && !mine;
  const settled = !!item.myDecision;
  const claimable = item.claimedBy === null && !!onClaim && !settled;

  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onOpen}
      // Enter and Space open it, like any button — handled HERE on the
      // focused element rather than in the page's key handler, so it works
      // whether focus arrived by keyboard, by Tab, or by the arrow keys.
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onOpen(); }
      }}
      aria-label={`Dossier ${item.applicationId}, ${item.candidateFullName}`}
      className="group relative flex cursor-pointer items-center gap-4 px-5 py-3 transition-colors hover:bg-[var(--green-tint)]/45 focus-visible:outline-none"
      style={{ background: focused ? "var(--green-tint)" : undefined }}
    >
      <span className="absolute inset-y-0 left-0 w-1"
        style={{ background: settled ? "var(--line)" : tone.edge }} aria-hidden="true" />

      <span
        className="ml-1 h-2 w-2 flex-none rounded-full"
        style={{ background: mine ? "var(--green-600)" : "transparent",
                 boxShadow: mine ? undefined : "inset 0 0 0 1.5px var(--line)" }}
        aria-hidden="true"
      />

      <span className="min-w-0 flex-[2]">
        <span dir="auto" className="block truncate text-[13.5px] font-bold text-[var(--green-900)]">
          {item.candidateFullName}
        </span>
        <span className="font-mono text-[10.5px] text-[var(--muted-fg)]">
          n° {item.applicationId}
        </span>
      </span>

      <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-[var(--slate)] md:block">
        {item.categoryLabelFr}
      </span>

      <span className="hidden min-w-0 flex-1 truncate text-[12.5px] text-[var(--slate)] lg:block">
        {item.roundLabelFr}
      </span>

      {/* ⚠️ xl:block — one breakpoint later than the round. The row already
          carries five columns; the session is the least urgent of them and
          gives way first. */}
      {showSession && (
        <span className="hidden min-w-0 flex-1 truncate text-[12px] text-[var(--muted-fg)] xl:block">
          {item.sessionLabel ?? "—"}
        </span>
      )}

      <span className="flex flex-none items-center gap-1.5">
        {item.correctionCount > 0 && (
          <PenLine className="h-3 w-3 text-[var(--gold-700)]"
            aria-label="corrigé" />
        )}
        {claimedByOther && (
          <Lock className="h-3 w-3 text-[var(--muted-fg)]"
            aria-label={`Pris en charge par ${item.claimedByName ?? "un autre membre"}`} />
        )}
      </span>

      {settled ? (
        <OutcomeBadge decision={item.myDecision!} label={item.myDecisionLabelFr}
          at={item.myDecidedAt} />
      ) : (
        <span
          className="inline-flex flex-none items-center gap-1 rounded-full px-2 py-0.5 text-[10.5px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}
        >
          <Clock className="h-2.5 w-2.5" />
          {item.waitingDays === 0 ? "auj." : `${item.waitingDays} j`}
        </span>
      )}

      {claimable ? (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onClaim!(); }}
          disabled={claiming}
          className="flex-none rounded-lg bg-[var(--green-700)] px-2.5 py-1 text-[11px] font-bold text-white opacity-0 transition-opacity hover:bg-[var(--green-600)] focus-visible:opacity-100 group-hover:opacity-100 disabled:opacity-60"
        >
          {claiming ? "…" : "Prendre"}
        </button>
      ) : (
        <ArrowRight className="rtl-flip h-3.5 w-3.5 flex-none text-[var(--muted-fg)] transition-transform group-hover:translate-x-0.5" />
      )}
    </div>
  );
});
