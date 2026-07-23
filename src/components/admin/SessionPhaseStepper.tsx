"use client";
// src/components/admin/SessionPhaseStepper.tsx
// The five-phase progression, rendered as a stepper. Past phases are solid
// green, the current one is gold and pulsing, future ones are outlined.
// Each step carries its boundary date so the whole calendar is legible at
// a glance.

import { Check } from "lucide-react";
import type { SessionResponse } from "@/lib/api/sessions";

const ORDER = ["PLANNED", "RECEIVING", "REVIEW", "CORRECTION", "RECLAMATION", "CLOSED"] as const;

const STEPS = [
  { key: "RECEIVING", label: "Réception", dateKey: "receivingEnd" },
  { key: "REVIEW", label: "Examen", dateKey: "reviewEnd" },
  { key: "CORRECTION", label: "Correction", dateKey: "correctionEnd" },
  { key: "RECLAMATION", label: "Réclamation", dateKey: "reclamationEnd" },
] as const;

function fmtShort(iso?: string) {
  if (!iso) return "";
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short",
  });
}

export function SessionPhaseStepper({ session }: { session: SessionResponse }) {
  const currentIdx = ORDER.indexOf(session.status);

  return (
    <div className="flex items-start">
      {STEPS.map((step, i) => {
        const stepIdx = ORDER.indexOf(step.key);
        const done = currentIdx > stepIdx;
        const active = currentIdx === stepIdx;
        const dateValue = session[step.dateKey as keyof SessionResponse] as string;

        return (
          <div key={step.key} className="flex flex-1 items-start">
            <div className="flex flex-1 flex-col items-center text-center">
              <span
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-full border-2 text-[12px] font-bold transition-colors",
                  done ? "border-[var(--green-500)] bg-[var(--green-500)] text-white"
                    : active ? "border-[var(--gold-500)] bg-[var(--gold-500)] text-[var(--green-900)] shadow-[0_0_0_4px_rgba(255,215,0,.25)]"
                    : "border-white/30 bg-transparent text-white/50",
                ].join(" ")}
              >
                {done ? <Check className="h-4 w-4" /> : i + 1}
              </span>
              <span
                className={[
                  "mt-2 text-[11px] font-bold",
                  active ? "text-[var(--gold-500)]" : done ? "text-white" : "text-white/45",
                ].join(" ")}
              >
                {step.label}
              </span>
              <span className={`font-mono text-[10px] ${active ? "text-white/80" : "text-white/40"}`}>
                {fmtShort(dateValue)}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <span
                className={`mt-4 h-0.5 flex-1 ${currentIdx > stepIdx ? "bg-[var(--green-500)]" : "bg-white/20"}`}
                aria-hidden="true"
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
