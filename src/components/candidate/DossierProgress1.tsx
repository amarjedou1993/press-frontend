"use client";

import { Check, FileEdit, Send, Gavel, IdCard } from "lucide-react";
import type { ApplicationStatus } from "@/lib/api/applications";

const STAGES = [
  { key: "prepare", label: "Préparation", ar: "الإعداد", Icon: FileEdit },
  { key: "submitted", label: "Déposé", ar: "مودع", Icon: Send },
  { key: "review", label: "Examen", ar: "الدراسة", Icon: Gavel },
  { key: "decision", label: "Décision", ar: "القرار", Icon: IdCard },
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
  const { index: current, rejected } = stageOf(status);

  return (
    <div className="flex items-start">
      {STAGES.map((stage, i) => {
        const done = i < current;
        const active = i === current;
        const isBadEnding = active && rejected;

        return (
          <div key={stage.key} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center text-center">
              <span
                className={[
                  "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors",
                  done
                    ? "border-[var(--green-500)] bg-[var(--green-500)] text-white"
                    : isBadEnding
                      ? "border-[var(--red-500)] bg-[var(--red-500)] text-white"
                      : active
                        ? "border-[var(--gold-500)] bg-[var(--gold-500)] text-[var(--green-900)] shadow-[0_0_0_5px_rgba(255,215,0,.22)]"
                        : "border-white/25 bg-transparent text-white/40",
                ].join(" ")}
              >
                {done ? <Check className="h-4 w-4" /> : <stage.Icon className="h-4 w-4" />}
              </span>
              <span
                className={[
                  "mt-2.5 text-[11.5px] font-bold",
                  active
                    ? isBadEnding ? "text-[var(--red-500)]" : "text-[var(--gold-500)]"
                    : done ? "text-white" : "text-white/40",
                ].join(" ")}
              >
                {stage.label}
              </span>
              <span dir="rtl" className={`text-[10px] ${active ? "text-white/70" : "text-white/35"}`}>
                {stage.ar}
              </span>
            </div>

            {i < STAGES.length - 1 && (
              <span
                className={`mt-5 h-0.5 flex-1 ${i < current ? "bg-[var(--green-500)]" : "bg-white/15"}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
