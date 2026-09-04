"use client";
// src/components/candidate/StatusTimeline.tsx
// The application's history, drawn from status_history — every transition,
// when it happened, and any justification. This is the candidate's window
// into a process that is otherwise opaque to them, so it shows EVERYTHING
// recorded, including rejection reasons.
//
// ⚠️ The status comes from the ENUM, not from statusLabelFr. The catalogue
// holds all nine in both languages, so a timeline reads in the reader's own
// even though the backend sends a French label alongside.

import { useFormatter, useTranslations } from "next-intl";
import { Check, Circle } from "lucide-react";
import type { TimelineEntry } from "@/lib/api/applications";
import { STATUS_KIND, type ApplicationStatus } from "@/lib/api/applications";

export function StatusTimeline({ entries }: { entries: TimelineEntry[] }) {
  const t = useTranslations("applicationStatus");
  const format = useFormatter();

  if (entries.length === 0) return null;

  return (
    // ps-8: the spine sits at the reading edge, so the whole list indents
    // from the left in French and from the right in Arabic.
    //
    // ⚠️ Kept at 8 even on a phone. The indent is what makes this read as a
    // sequence rather than a stack of paragraphs, and the justification
    // blocks below already wrap rather than overflow.
    <ol className="relative space-y-5 ps-8 sm:space-y-6">
      {/*
        The spine.
        ⚠️ 11.5px, not 11. The node is 24px wide starting at the list's own
        edge, so its centre is at 12 — a 1px rule at 11 sits half a pixel off,
        which is exactly the kind of thing that looks like a rendering fault
        rather than a decision.
      */}
      <span
        className="absolute bottom-2 start-[11.5px] top-2 w-px bg-[var(--line)]"
        aria-hidden="true"
      />

      {entries.map((entry, i) => {
        const isLatest = i === entries.length - 1;
        const kind = STATUS_KIND[entry.toStatus as ApplicationStatus] ?? "draft";

        return (
          <li key={i} className="relative">
            <span
              className="absolute -start-8 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[var(--paper)]"
              style={{
                background: isLatest ? `var(--st-${kind}-bg)` : "#eef1ef",
                color: isLatest ? `var(--st-${kind}-fg)` : "var(--muted-fg)",
              }}
            >
              {isLatest ? <Circle className="h-2.5 w-2.5 fill-current" />
                        : <Check className="h-3 w-3" />}
            </span>

            <div className={`min-w-0 ${isLatest ? "" : "opacity-70"}`}>
              <p className="text-[13.5px] font-bold leading-snug text-[var(--green-900)] sm:text-[14px]">
                {t(entry.toStatus)}
              </p>
              {/*
                The timestamp keeps the mono face in both languages: a list of
                dates should align down the column, and proportional digits
                make each line start somewhere different.

                ⚠️ leading-snug because a "full" date wraps to two lines on a
                375px screen — "vendredi 3 septembre 2026 à 14:32" does not fit
                in 340px of monospace. Wrapped at the default leading it read
                as two separate entries.
              */}
              <p dir="ltr"
                className="mt-0.5 font-mono text-[11px] leading-snug text-[var(--muted-fg)] rtl:text-end sm:text-[11.5px]">
                {format.dateTime(new Date(entry.at), "full")}
              </p>
              {entry.justification && (
                /*
                 * ⚠️ dir="auto" — a commission member wrote this in French or
                 * in Arabic, and the system never translates an
                 * administrative act.
                 *
                 * ⚠️ AND break-words, WHICH IS NOT COSMETIC HERE.
                 *
                 * whitespace-pre-wrap preserves the line breaks a reviewer
                 * typed, but it does nothing for a single long token — and a
                 * justification is exactly where someone pastes a URL to the
                 * document they are objecting to. Without this, that URL runs
                 * past the panel and off a 375px screen, taking the end of
                 * the sentence with it.
                 *
                 * This is the text a rejected candidate reads to decide
                 * whether to object. It has to be legible in full.
                 */
                <p
                  dir="auto"
                  className="user-text mt-2 whitespace-pre-wrap break-words rounded-lg border-s-2 px-3 py-2 text-[12.5px] leading-relaxed sm:text-[13px]"
                  style={{
                    borderColor: `var(--st-${kind}-fg)`,
                    background: `var(--st-${kind}-bg)`,
                    color: "var(--ink)",
                  }}
                >
                  {entry.justification}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
