"use client";
// src/app/(reviewer)/reviewer/[id]/page.tsx
// The examination screen — where an accreditation is decided.
//
// Everything the commission needs is on ONE page, from ONE request:
// identity and photograph, every document previewable in place, the
// completeness breakdown, prior decisions, and the decision panel. A
// reviewer assembling this from four screens will not read it all, and a
// partial view is how a decision gets taken on incomplete information.
//
// ───────────────────────────────────────────────────────────────────────
// A RECLAMATION IS NOT AN ORDINARY REVIEW, and the screen now says so.
//
// Previously the two looked identical — same green field, same heading. But
// they are different acts:
//
//   In a first review, a member examines a dossier.
//   In a reclamation, a member judges whether a COLLEAGUE'S REFUSAL was
//   right — knowing the colleague cannot respond, and that this is the
//   candidate's ONE chance. V1.3 §J bars the original decider from it for
//   exactly that reason.
//
// A gold field, the scales in place of the round marker, and one sentence
// stating what is being decided. ObjectionBrief still carries the substance;
// this carries the weight.
// ───────────────────────────────────────────────────────────────────────

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Clock, AlertTriangle, Hand, CheckCircle2, Scale,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { CandidateIdentityCard } from "@/components/reviewer/CandidateIdentityCard";
import { DocumentInspector } from "@/components/reviewer/DocumentInspector";
import { DecisionPanel } from "@/components/reviewer/DecisionPanel";
import { DecisionHistory } from "@/components/reviewer/DecisionHistory";
import { ObjectionBrief } from "@/components/reviewer/ObjectionBrief";
import { RequirementChecklist } from "@/components/candidate/RequirementChecklist";
import { getExamination, reviewKeys } from "@/lib/api/review";
import { STATUS_KIND, type ApplicationStatus } from "@/lib/api/applications";
import { routes } from "@/lib/routes";
import { Guilloche } from "@/components/public/patterns";

export default function ExaminationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { id } = use(params);
  const applicationId = Number(id);

  const examination = useQuery({
    queryKey: reviewKeys.examination(applicationId),
    queryFn: () => getExamination(applicationId),
  });

  if (examination.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-6">
        <Skeleton className="h-36 w-full rounded-2xl" />
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  if (examination.isError || !examination.data) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-[var(--line)] bg-white p-12 text-center">
        <AlertTriangle className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
        <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
          Dossier introuvable
        </p>
        <p className="mt-2 text-[13.5px] text-[var(--slate)]">
          Ce dossier n&apos;existe pas, ou n&apos;a pas encore été soumis.
        </p>
        <Button className="mt-5" variant="outline"
          onClick={() => router.push(routes.reviewer.home)}>
          Retour à la file
        </Button>
      </div>
    );
  }

  const e = examination.data;
  const kind = STATUS_KIND[e.status as ApplicationStatus] ?? "review";
  const decided = !["UNDER_REVIEW", "UNDER_FINAL_REVIEW", "UNDER_RECLAMATION"]
    .includes(e.status);

  /* A reclamation is a different act from a first review: the member judges a
     colleague's refusal, not a dossier — and the colleague cannot answer
     back. The screen should not look identical. */
  const contesting = e.status === "UNDER_RECLAMATION";

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      {/* ── header ── */}
      <section
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
        style={{
          background: contesting
            ? "radial-gradient(760px 360px at 88% -28%, rgba(255,215,0,.28), transparent 60%), linear-gradient(158deg, #3a2d08 0%, #2f2607 58%, #221b05 100%)"
            : "radial-gradient(700px 340px at 90% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true" />
         <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-20 -top-24 h-[300px] w-[300px] text-white"
          rings={34}
          opacity={0.16}
        />
        <div className="relative z-10 p-7">
          <button
            type="button"
            onClick={() => router.push(routes.reviewer.home)}
            className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-white/60 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à la file
          </button>

          <div className="mt-4 flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
                {contesting && <Scale className="h-4 w-4 flex-none" />}
                {e.currentRoundLabelFr}
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <h2 className="text-[26px] font-extrabold leading-tight">
                  {e.candidate.fullName}
                </h2>
                <span className="font-mono text-[11.5px] text-white/40">
                  dossier n° {e.applicationId}
                </span>
              </div>
              {e.submittedAt && (
                <p className="mt-2 flex items-center gap-1.5 text-[13px] text-white/60">
                  <Clock className="h-3.5 w-3.5" />
                  Soumis le{" "}
                  {new Date(e.submittedAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </div>

            <div className="flex flex-col items-end gap-2">
              <span className="rounded-full px-4 py-1.5 text-[12px] font-extrabold"
                style={{ background: `var(--st-${kind}-bg)`, color: `var(--st-${kind}-fg)` }}>
                {e.statusLabelFr}
              </span>
              {e.claimedBy && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-black/25 px-3 py-1 text-[11.5px] font-semibold text-white/70">
                  <Hand className="h-3 w-3" />
                  {e.claimedByMe ? "Pris en charge par vous" : e.claimedByName}
                </span>
              )}
            </div>
          </div>

          {/* WHAT IS ACTUALLY BEING DECIDED, when it is not the obvious thing.
              A member arriving at a reclamation is judging a colleague's
              refusal, and the colleague cannot answer back. */}
          {contesting && (
            <p className="mt-6 max-w-2xl rounded-xl bg-black/25 px-5 py-3.5 text-[13px] leading-relaxed text-white/70">
              Ce candidat conteste un rejet. Vous n&apos;examinez pas seulement
              son dossier : vous vous prononcez sur le bien-fondé de la décision
              rendue par un autre membre de la commission.{" "}
              <b className="font-semibold text-white/90">
                C&apos;est le seul recours dont dispose le candidat.
              </b>
            </p>
          )}
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* already decided */}
      {decided && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-white p-5">
          <CheckCircle2 className="mt-0.5 h-5 w-5 flex-none text-[var(--green-600)]" />
          <div>
            <p className="text-[14px] font-extrabold text-[var(--green-900)]">
              Ce dossier a été décidé
            </p>
            <p className="mt-1 text-[13px] leading-relaxed text-[var(--slate)]">
              Statut actuel : {e.statusLabelFr}. Il reste consultable, mais
              aucune nouvelle décision ne peut être enregistrée pour cette phase.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        {/* ── the evidence ── */}
        <div className="space-y-6">
          {/* On a reclamation this is the FRAMING for everything below it:
              the question is not "is this dossier sound" but "was a
              colleague's refusal right". It goes first for that reason. */}
          {e.objection && <ObjectionBrief objection={e.objection} />}

          <CandidateIdentityCard
            applicationId={e.applicationId}
            candidate={e.candidate}
            photoNeedsCorrection={e.photoNeedsCorrection}
            photoObservation={e.photoObservation}
          />

          <DocumentInspector
            applicationId={e.applicationId}
            documents={e.documents}
          />

          <DecisionHistory entries={e.history} />
        </div>

        {/* ── judgement ── */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          {!decided && <DecisionPanel examination={e} />}

          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                Exigences de la catégorie
              </p>
              <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-[var(--slate)]">
              Vérification automatique effectuée à la soumission. Elle ne
              préjuge pas de la qualité des pièces, qui relève de votre examen.
            </p>
            <div className="mt-4">
              {/* editable={false}: this is a verification report here, not an
                  invitation to submit anything. */}
              <RequirementChecklist readiness={e.completeness} editable={false} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
