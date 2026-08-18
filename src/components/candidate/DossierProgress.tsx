"use client";
// src/components/candidate/DossierProgress.tsx
//
// Where a dossier stands, in four stages.
//
// ⚠️ THIS ONE GENUINELY REVERSES. A progress rail is a sentence about time —
// first this, then that — so it reads left-to-right in French and
// right-to-left in Arabic. Flex handles it: `flex` follows `dir`, so the
// stages reorder themselves and the connector lines land between the right
// pairs without a single physical property.
//
// (Contrast the progress RING in RequirementChecklist, which is a gauge and
// fills clockwise in both directions.)

import { useTranslations } from "next-intl";
import { Check, FileEdit, Send, Gavel, IdCard } from "lucide-react";
import type { ApplicationStatus } from "@/lib/api/applications";

const STAGES = [
  { key: "prepare", Icon: FileEdit },
  { key: "submitted", Icon: Send },
  { key: "review", Icon: Gavel },
  { key: "decision", Icon: IdCard },
] as const;

/** Which stage a given state sits in (0-based), and whether it ended badly. */
function stageOf(status: ApplicationStatus): { index: number; rejected: boolean } {
  switch (status) {
    case "DRAFT":
      return { index: 0, rejected: false };
    case "CORRECTION_REQUESTED":
      return { index: 1, rejected: false };   // back in the candidate's hands
    case "UNDER_REVIEW":
    case "UNDER_FINAL_REVIEW":
    case "UNDER_RECLAMATION":
      return { index: 2, rejected: false };
    case "ACCEPTED":
    case "CARD_ISSUED":
      return { index: 3, rejected: false };
    case "REJECTED":
    case "FINAL_REJECTION":
      return { index: 3, rejected: true };
  }
}

export function DossierProgress({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("progress");
  const { index: current, rejected } = stageOf(status);

  return (
    <ol className="flex items-start">
      {STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        const isBadEnding = active && rejected;

        return (
          <li key={stage.key} className="flex flex-1 items-start">
            <div className="flex min-w-0 flex-1 flex-col items-center text-center">
              <span
                className={[
                  "flex h-10 w-10 flex-none items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-[var(--green-500)] bg-[var(--green-500)] text-white"
                    : isBadEnding
                      ? "border-[var(--red-500)] bg-[var(--red-500)] text-white"
                      : active
                        ? "border-[var(--gold-500)] bg-[var(--gold-500)] text-[var(--green-900)] shadow-[0_0_0_5px_rgba(255,215,0,.22)]"
                        : "border-white/25 bg-transparent text-white/40",
                ].join(" ")}
                // The current stage is the one a screen reader should announce.
                aria-current={active ? "step" : undefined}
              >
                {done ? <Check className="h-4 w-4" /> : <stage.Icon className="h-4 w-4" />}
              </span>

              {/* ONE label. The Arabic beneath the French was ornament for a
                  French reader; once the page exists in Arabic it is noise —
                  and at 10px, unreadable noise. */}
              <span
                className={[
                  "mt-2.5 text-[11.5px] font-bold leading-tight",
                  active
                    ? isBadEnding ? "text-[var(--red-500)]" : "text-[var(--gold-500)]"
                    : done ? "text-white" : "text-white/40",
                ].join(" ")}
              >
                {/* The last stage says what actually happened: "Décision" is
                    the stage, but a refusal is not a decision pending. */}
                {i === 3 && rejected ? t("refused") : t(stage.key)}
              </span>
            </div>

            {i < STAGES.length - 1 && (
              // No physical direction here: the connector is a flex sibling,
              // so it sits between the same two stages whichever way the
              // container flows.
              <span
                className={`mt-5 h-0.5 flex-1 ${i < current ? "bg-[var(--green-500)]" : "bg-white/15"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
