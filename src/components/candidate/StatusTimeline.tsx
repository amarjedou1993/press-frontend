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
    <ol className="relative space-y-6 ps-8">
      {/* the spine */}
      <span
        className="absolute bottom-2 start-[11px] top-2 w-px bg-[var(--line)]"
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
              <p className="text-[14px] font-bold text-[var(--green-900)]">
                {t(entry.toStatus)}
              </p>
              {/* The timestamp keeps the mono face in both languages: a list
                  of dates should align down the column, and proportional
                  digits make each line start somewhere different. */}
              <p dir="ltr" className="mt-0.5 font-mono text-[11.5px] text-[var(--muted-fg)] rtl:text-end">
                {format.dateTime(new Date(entry.at), "full")}
              </p>
              {entry.justification && (
                /* ⚠️ dir="auto" — a commission member wrote this in French or
                   in Arabic, and the system never translates an
                   administrative act. */
                <p
                  dir="auto"
                  className="user-text mt-2 whitespace-pre-wrap rounded-lg border-s-2 px-3 py-2 text-[13px] leading-relaxed"
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
