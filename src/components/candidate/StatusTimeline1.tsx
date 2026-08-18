"use client";
// src/components/candidate/StatusTimeline.tsx
// The application's history, drawn from status_history — every transition,
// who caused it, and any justification. This is the candidate's window into
// a process that is otherwise opaque to them, so it shows EVERYTHING
// recorded, including rejection reasons.

import { Check, Circle } from "lucide-react";
import type { TimelineEntry } from "@/lib/api/applications";
import { STATUS_KIND, type ApplicationStatus } from "@/lib/api/applications";

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function StatusTimeline({ entries }: { entries: TimelineEntry[] }) {
  if (entries.length === 0) return null;

  return (
    <ol className="relative space-y-6 pl-8">
      {/* the spine */}
      <span
        className="absolute left-[11px] top-2 bottom-2 w-px bg-[var(--line)]"
        aria-hidden="true"
      />

      {entries.map((entry, i) => {
        const isLatest = i === entries.length - 1;
        const kind = STATUS_KIND[entry.toStatus as ApplicationStatus] ?? "draft";

        return (
          <li key={i} className="relative">
            <span
              className="absolute -left-8 flex h-6 w-6 items-center justify-center rounded-full ring-4 ring-[var(--paper)]"
              style={{
                background: isLatest ? `var(--st-${kind}-bg)` : "#eef1ef",
                color: isLatest ? `var(--st-${kind}-fg)` : "var(--muted-fg)",
              }}
            >
              {isLatest ? <Circle className="h-2.5 w-2.5 fill-current" />
                        : <Check className="h-3 w-3" />}
            </span>

            <div className={isLatest ? "" : "opacity-70"}>
              <p className="text-[14px] font-bold text-[var(--green-900)]">
                {entry.toStatusLabelFr}
              </p>
              <p className="mt-0.5 font-mono text-[11.5px] text-[var(--muted-fg)]">
                {fmt(entry.at)}
              </p>
              {entry.justification && (
                <p
                  className="mt-2 rounded-lg border-l-2 px-3 py-2 text-[13px] leading-relaxed"
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
