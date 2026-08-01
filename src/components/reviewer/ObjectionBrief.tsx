"use client";
// src/components/reviewer/ObjectionBrief.tsx
// The reviewer's brief on a reclamation.
//
// On this round the reviewer's task is not "examine a dossier" but "decide
// whether a colleague's refusal was right". That is a different question, and
// the screen has to frame it — so the two documents sit SIDE BY SIDE: the
// decision that was rendered, and the contestation against it.
//
// A reviewer who sees only the objection is re-examining in the dark. One who
// sees only the rejection has no idea what is disputed. Both, adjacent, is the
// whole point.
//
// The author of the contested decision is NAMED, for two reasons: it makes the
// different-reviewer rule visible rather than merely enforced, and a second
// reviewer should know whose judgement they are being asked to weigh.

import { Gavel, FileText, User, Clock, ArrowRight, Scale } from "lucide-react";
import type { ObjectionSummary } from "@/lib/api/review";

export function ObjectionBrief({ objection }: { objection: ObjectionSummary }) {
  return (
    <section className="overflow-hidden rounded-2xl border-2 border-[var(--gold-500)] bg-white">
      {/* ── the framing ── */}
      <div className="flex items-start gap-4 bg-[var(--gold-tint)] px-6 py-5">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--gold-700)]">
          <Gavel className="h-5 w-5 text-white" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]/75">
            Examen de la réclamation
          </p>
          <p className="mt-1 text-[16px] font-extrabold text-[var(--gold-700)]">
            Le candidat conteste la décision rendue
          </p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--gold-700)]">
            Votre décision est définitive : elle confirmera le rejet ou
            l&apos;annulera. Aucun troisième examen n&apos;est prévu.
          </p>
        </div>

        {objection.filedAt && (
          <p className="flex flex-none items-center gap-1.5 rounded-lg bg-white/70 px-3 py-2 text-[11.5px] font-semibold text-[var(--gold-700)]">
            <Clock className="h-3 w-3" />
            {new Date(objection.filedAt).toLocaleDateString("fr-FR")}
          </p>
        )}
      </div>

      {/* ── the two documents, adjacent ── */}
      <div className="grid divide-y divide-[var(--line)] lg:grid-cols-2 lg:divide-x lg:divide-y-0">

        {/* the decision under challenge */}
        <div className="px-6 py-5">
          <p className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--red-700)]">
            <FileText className="h-3 w-3" />
            Décision contestée
            {objection.contestedGroundLabelFr && (
              <span className="rounded-full bg-[var(--red-tint)] px-2 py-0.5 text-[10px] normal-case tracking-normal">
                {objection.contestedGroundLabelFr}
              </span>
            )}
          </p>

          <blockquote className="mt-3 whitespace-pre-wrap rounded-r-xl border-l-[3px] border-[var(--red-500)] bg-[var(--red-tint)] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]">
            {objection.contestedJustification ?? "—"}
          </blockquote>

          {objection.contestedByName && (
            <p className="mt-3 flex items-center gap-1.5 text-[12px] text-[var(--muted-fg)]">
              <User className="h-3 w-3" />
              Rendue par <b className="font-semibold">{objection.contestedByName}</b>
            </p>
          )}
        </div>

        {/* what the candidate says against it */}
        <div className="px-6 py-5">
          <p className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold-700)]">
            <Scale className="h-3 w-3" />
            Contestation du candidat
            {objection.reasonLabelFr && (
              <span className="rounded-full bg-[var(--gold-tint)] px-2 py-0.5 text-[10px] normal-case tracking-normal">
                {objection.reasonLabelFr}
              </span>
            )}
          </p>

          <blockquote className="mt-3 whitespace-pre-wrap rounded-r-xl border-l-[3px] border-[var(--gold-700)] bg-[var(--gold-tint)] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]">
            {objection.argument}
          </blockquote>

          {objection.reasonLabelAr && (
            <p dir="rtl" className="mt-3 text-[12px] text-[var(--muted-fg)]">
              {objection.reasonLabelAr}
            </p>
          )}
        </div>
      </div>

      {/* ── what is being asked ── */}
      <div className="flex items-start gap-3 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
        <ArrowRight className="mt-0.5 h-4 w-4 flex-none text-[var(--green-600)]" />
        <p className="text-[13px] leading-relaxed text-[var(--slate)]">
          Réexaminez le dossier à la lumière de cette contestation.{" "}
          <b className="font-semibold text-[var(--ink)]">Accepter</b> annule le
          rejet et ouvre l&apos;édition de la carte ;{" "}
          <b className="font-semibold text-[var(--ink)]">rejeter</b> le confirme
          définitivement.
        </p>
      </div>
    </section>
  );
}
