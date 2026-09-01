"use client";
// src/components/reviewer/DossierCard.tsx
// One dossier in the grid.
//
// THREE THINGS EARN THEIR PLACE HERE.
//
// 1. AN URGENCY EDGE. A coloured rule down the left, keyed to waiting time.
//    A reviewer scanning a page of twenty sees the red ones without reading
//    a word — which is the point of a grid over a list.
//
// 2. CLAIM WITHOUT LEAVING. Taking a file used to mean open → claim → back.
//    Over an afternoon's queue that is a real tax, so unclaimed cards carry
//    the action directly. Opening the file to read it first remains the
//    default; this is the shortcut, not the only path.
//
// 3. KEYBOARD REACHABILITY. The card is focusable and responds to Enter, so
//    the grid can be worked through without a mouse.
//
// Still no photograph: each would be a separate authenticated request, so a
// page of 24 cards would fire 24 of them. The medallion carries the rhythm;
// the real photograph is on the examination screen, large enough to judge.

import { forwardRef } from "react";
import {
  Clock, Hand, ArrowRight, PenLine, Lock, Layers, Scale, CalendarRange,
} from "lucide-react";
import type { PoolItem } from "@/lib/api/review";
import { OutcomeBadge } from "./OutcomeBadge";

function initials(fullName: string) {
  return fullName.split(/\s+/).filter(Boolean).slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "").join("");
}

/** Waiting time drives the colour — the queue's conscience, made visible. */
export function waitingTone(days: number) {
  if (days >= 7)
    return { edge: "var(--red-500)", bg: "var(--red-tint)", fg: "var(--red-700)" };
  if (days >= 3)
    return { edge: "var(--gold-500)", bg: "var(--gold-tint)", fg: "var(--gold-700)" };
  return { edge: "var(--green-500)", bg: "#eef1ef", fg: "var(--muted-fg)" };
}

export const DossierCard = forwardRef<HTMLDivElement, {
  item: PoolItem;
  mine: boolean;
  focused?: boolean;
  claiming?: boolean;
  /**
   * The session line.
   *
   * ⚠️ DECIDED BY THE PAGE, not here. A card does not know which scope it is
   * being shown in, and a component that infers its own context is wrong the
   * day it is reused somewhere else.
   *
   * True only in "Mes décisions" — the one scope that crosses sessions. In
   * the working queue every card would carry the same label.
   */
  showSession?: boolean;
  onOpen: () => void;
  onClaim?: () => void;
}>(function DossierCard(
  { item, mine, focused = false, claiming = false, showSession = false, onOpen, onClaim },
  ref
) {
  const tone = waitingTone(item.waitingDays);
  const claimedByOther = item.claimedBy !== null && !mine;
  const claimable = item.claimedBy === null && !!onClaim && !item.myDecision;
  // Once a file is settled, WAITING TIME is meaningless and the OUTCOME is
  // the only thing worth showing. The card swaps one for the other.
  const settled = !!item.myDecision;

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
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      aria-label={`Dossier ${item.applicationId}, ${item.candidateFullName}`}
      className="group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-26px_rgba(11,46,31,.5)] focus-visible:outline-none"
      style={{
        borderColor: focused
          ? "var(--green-600)"
          : mine ? "var(--green-500)" : "var(--line)",
        boxShadow: focused ? "0 0 0 3px rgba(0,169,92,.18)" : undefined,
      }}
    >
      {/* ── urgency edge ── */}
      <span
        className="absolute inset-y-0 left-0 w-1"
        style={{ background: settled ? "var(--line)" : tone.edge }}
        aria-hidden="true"
      />

      {/* ── security-print wash, very faint ── */}
      <span
        className="pointer-events-none absolute inset-0 opacity-[0.025]"
        style={{ backgroundImage: "repeating-linear-gradient(115deg,#0b2e1f 0 1px,transparent 1px 9px)" }}
        aria-hidden="true"
      />

      <div className="relative p-5 pl-6">
        {/* ── header ── */}
        <div className="flex items-start gap-3">
          <span
            className="flex h-11 w-11 flex-none items-center justify-center rounded-xl text-[14px] font-extrabold shadow-sm"
            style={{
              background: mine ? "var(--green-600)" : "var(--green-tint)",
              color: mine ? "#fff" : "var(--green-700)",
            }}
            aria-hidden="true"
          >
            {initials(item.candidateFullName)}
          </span>

          <div className="min-w-0 flex-1">
            <p dir="auto" className="truncate text-[14.5px] font-extrabold leading-tight text-[var(--green-900)]">
              {item.candidateFullName}
            </p>
            <p className="mt-0.5 font-mono text-[11px] text-[var(--muted-fg)]">
              n° {item.applicationId}
            </p>
          </div>

          {settled ? (
            <OutcomeBadge
              decision={item.myDecision!}
              label={item.myDecisionLabelFr}
              at={item.myDecidedAt}
            />
          ) : (
            <span
              className="inline-flex flex-none items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold"
              style={{ background: tone.bg, color: tone.fg }}
              title={`En attente depuis ${item.waitingDays} jour(s)`}
            >
              <Clock className="h-2.5 w-2.5" />
              {item.waitingDays === 0 ? "auj." : `${item.waitingDays} j`}
            </span>
          )}
        </div>

        {/* ── facts ── */}
        <dl className="mt-4 space-y-1.5 border-t border-[var(--line)] pt-3.5">
          <div className="flex items-baseline gap-2">
            <dt className="flex-none">
              <Layers className="h-3 w-3 text-[var(--green-600)]" aria-hidden="true" />
              <span className="sr-only">Catégorie</span>
            </dt>
            <dd className="truncate text-[12.5px] text-[var(--slate)]">
              {item.categoryLabelFr}
            </dd>
          </div>
          <div className="flex items-baseline gap-2">
            <dt className="flex-none">
              <Scale className="h-3 w-3 text-[var(--green-600)]" aria-hidden="true" />
              <span className="sr-only">Phase</span>
            </dt>
            <dd className="truncate text-[12.5px] text-[var(--slate)]">
              {item.roundLabelFr}
            </dd>
          </div>

          {/* The session, only where it varies from one card to the next. */}
          {showSession && item.sessionLabel && (
            <div className="flex items-baseline gap-2">
              <dt className="flex-none">
                <CalendarRange className="h-3 w-3 text-[var(--green-600)]" aria-hidden="true" />
                <span className="sr-only">Session</span>
              </dt>
              <dd className="truncate text-[12px] text-[var(--muted-fg)]">
                {item.sessionLabel}
              </dd>
            </div>
          )}
        </dl>

        {/* ── badges ── */}
        {(item.correctionCount > 0 || mine || claimedByOther) && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {item.correctionCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--gold-700)]">
                <PenLine className="h-2.5 w-2.5" /> corrigé
              </span>
            )}
            {mine && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--green-700)]">
                <Hand className="h-2.5 w-2.5" /> à vous
              </span>
            )}
            {claimedByOther && (
              <span
                className="inline-flex max-w-full items-center gap-1 truncate rounded-full px-2 py-0.5 text-[10px] font-bold"
                style={{ background: "#eef1ef", color: "var(--muted-fg)" }}
                title={`Pris en charge par ${item.claimedByName ?? "un autre membre"}`}
              >
                <Lock className="h-2.5 w-2.5 flex-none" />
                <span dir="auto" className="truncate">
                  {item.claimedByName ?? "pris en charge"}
                </span>
              </span>
            )}
          </div>
        )}
      </div>

      {/* ── actions ── */}
      <div className="relative mt-auto flex items-center gap-2 border-t border-[var(--line)] px-5 py-3 pl-6">
        <span className="inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--green-700)]">
          {settled ? "Consulter" : mine ? "Reprendre" : claimedByOther ? "Consulter" : "Examiner"}
          <ArrowRight className="rtl-flip h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        </span>

        {settled && item.myDecidedAt && (
          <span className="ms-auto font-mono text-[10.5px] text-[var(--muted-fg)]">
            {new Date(item.myDecidedAt).toLocaleDateString("fr-FR")}
          </span>
        )}

        {claimable && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onClaim!(); }}
            disabled={claiming}
            className="ms-auto inline-flex items-center gap-1.5 rounded-lg bg-[var(--green-700)] px-2.5 py-1.5 text-[11.5px] font-bold text-white transition-colors hover:bg-[var(--green-600)] disabled:opacity-60"
          >
            <Hand className="h-3 w-3" />
            {claiming ? "…" : "Prendre"}
          </button>
        )}
      </div>
    </div>
  );
});
