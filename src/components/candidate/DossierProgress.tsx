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
            <div className="flex min-w-0 flex-1 flex-col items-center px-0.5 text-center">
              {/*
                ⚠️ 32px BELOW sm, AND THE OLD 40 DID NOT FIT.

                Four stages share the width; each stage's label column and the
                connector beside it each took half of a quarter. At 375px that
                is about 35px per column — and a 40px circle marked flex-none
                simply overflowed it, so the four markers overlapped their
                neighbours' labels.
              */}
              <span
                className={[
                  "flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 transition-colors sm:h-10 sm:w-10",
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
                {done ? <Check className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      : <stage.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />}
              </span>

              {/* ONE label. The Arabic beneath the French was ornament for a
                  French reader; once the page exists in Arabic it is noise —
                  and at 10px, unreadable noise. */}
              <span
                className={[
                  "mt-2 text-[10px] font-bold leading-tight sm:mt-2.5 sm:text-[11.5px]",
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
              /*
                No physical direction here: the connector is a flex sibling,
                so it sits between the same two stages whichever way the
                container flows.

                ⚠️ BUT IT NO LONGER TAKES HALF THE ROOM ON A PHONE.

                As flex-1 it claimed as much width as the label beside it —
                twenty-eight pixels of rule at the cost of twenty-eight
                pixels of "Préparation". A connector says "and then"; it does
                not need to be long to say it, and the label does need to be
                readable.

                mt-4 to meet the smaller circle's centre; mt-5 for the larger.
              */
              <span
                className={`mt-4 h-0.5 w-2 flex-none sm:mt-5 sm:w-auto sm:flex-1 ${i < current ? "bg-[var(--green-500)]" : "bg-white/15"}`}
                aria-hidden="true"
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
