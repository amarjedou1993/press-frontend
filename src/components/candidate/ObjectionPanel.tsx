"use client";
// src/components/candidate/ObjectionPanel.tsx
// The candidate's last recourse.
//
// A reclamation may be filed ONCE, and only during the session's reclamation
// phase. Someone who spends it on a poorly argued objection has spent it —
// there is no second attempt and no third examination. The screen is built
// around that fact:
//
// · THE CONTESTED DECISION IS SHOWN WHILE THEY WRITE. You cannot argue against
//   a refusal you cannot see, and asking someone to remember the motif from a
//   previous screen is how vague objections get written.
//
// · THE GROUND CARRIES ITS EXPLANATION. Each option says what it is FOR, so
//   the candidate picks the heading that matches their situation rather than
//   the one whose words they recognise.
//
// · THE ARGUMENT HAS A VISIBLE MINIMUM. Thirty characters is not a formality:
//   a second reviewer re-examining an entire dossier needs to know what is
//   disputed, and "pas d'accord" tells them nothing.
//
// · THE CONFIRMATION SAYS IT IS THE ONLY ONE. Twice.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Gavel, Clock, AlertTriangle, Check, Scale, Send, Lock, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getObjectionEligibility, getObjectionReasons, getFiledObjection,
  fileObjection, objectionKeys, MIN_ARGUMENT_LENGTH,
} from "@/lib/api/objection";
import { applicationKeys } from "@/lib/api/applications";
import { ApiError } from "@/lib/api/client";

function longFr(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function deadlineTone(days: number) {
  if (days <= 2) return { bg: "var(--red-tint)", fg: "var(--red-700)", edge: "var(--red-500)" };
  if (days <= 5) return { bg: "var(--gold-tint)", fg: "var(--gold-700)", edge: "var(--gold-500)" };
  return { bg: "var(--green-tint)", fg: "var(--green-700)", edge: "var(--green-500)" };
}

export function ObjectionPanel({
  applicationId,
  /** Only rendered on a rejection — the parent decides. */
  visible,
}: {
  applicationId: number;
  visible: boolean;
}) {
  const qc = useQueryClient();

  const [reasonId, setReasonId] = useState<number | null>(null);
  const [argument, setArgument] = useState("");
  const [error, setError] = useState<string>();
  const [confirming, setConfirming] = useState(false);

  const eligibility = useQuery({
    queryKey: objectionKeys.eligibility(applicationId),
    queryFn: () => getObjectionEligibility(applicationId),
    enabled: visible,
  });

  const reasons = useQuery({
    queryKey: objectionKeys.reasons(applicationId),
    queryFn: () => getObjectionReasons(applicationId),
    enabled: visible && eligibility.data?.canObject === true,
  });

  const filed = useQuery({
    queryKey: objectionKeys.filed(applicationId),
    queryFn: () => getFiledObjection(applicationId),
    enabled: visible && eligibility.data?.alreadyFiled === true,
  });

  const submit = useMutation({
    mutationFn: () => fileObjection(applicationId, {
      reasonId: reasonId!,
      argument: argument.trim(),
    }),
    onSuccess: (next) => {
      qc.setQueryData(objectionKeys.eligibility(applicationId), next);
      qc.invalidateQueries({ queryKey: objectionKeys.filed(applicationId) });
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
      setConfirming(false);
      toast.success("Réclamation enregistrée", {
        description: "Elle sera examinée par un autre membre de la commission.",
      });
    },
    onError: (e) => {
      setConfirming(false);
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.");
    },
  });

  if (!visible) return null;
  if (eligibility.isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;
  if (!eligibility.data) return null;

  const e = eligibility.data;

  /* ══ already filed — show what was said ══ */
  if (e.alreadyFiled) {
    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--gold-500)]/50 bg-white">
        <div className="flex items-start gap-4 bg-[var(--gold-tint)] px-6 py-5">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--gold-700)]">
            <Gavel className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]/75">
              Réclamation déposée
            </p>
            <p className="mt-1 text-[16px] font-extrabold text-[var(--gold-700)]">
              Votre contestation a été enregistrée
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--gold-700)]">
              Elle est examinée par un membre de la commission différent de celui
              ayant rendu la décision contestée. Vous serez informé par e-mail.
            </p>
          </div>
        </div>

        {filed.data && (
          <div className="space-y-4 px-6 py-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                Motif invoqué
              </p>
              <p className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                {filed.data.reasonLabelFr}
              </p>
              {filed.data.reasonLabelAr && (
                <p dir="rtl" className="text-[12.5px] text-[var(--muted-fg)]">
                  {filed.data.reasonLabelAr}
                </p>
              )}
            </div>

            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                Votre exposé
              </p>
              <blockquote className="mt-2 whitespace-pre-wrap rounded-r-xl border-l-[3px] border-[var(--gold-700)] bg-[#fbfcfb] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]">
                {filed.data.argument}
              </blockquote>
            </div>

            {filed.data.createdAt && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--muted-fg)]">
                <Clock className="h-3 w-3" />
                Déposée le{" "}
                {new Date(filed.data.createdAt).toLocaleDateString("fr-FR", {
                  day: "numeric", month: "long", year: "numeric",
                  hour: "2-digit", minute: "2-digit",
                })}
              </p>
            )}
          </div>
        )}
      </section>
    );
  }

  /* ══ cannot be filed — say why ══ */
  if (!e.canObject) {
    return (
      <section className="flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-white p-6">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#eef1ef]">
          <Lock className="h-4 w-4 text-[var(--muted-fg)]" />
        </span>
        <div>
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            Réclamation non disponible
          </p>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--slate)]">
            {e.blockedReasonFr ?? "Aucune réclamation ne peut être déposée pour ce dossier."}
          </p>
        </div>
      </section>
    );
  }

  /* ══ the form ══ */
  const tone = deadlineTone(e.daysRemaining);
  const length = argument.trim().length;
  const tooShort = length < MIN_ARGUMENT_LENGTH;
  const ready = reasonId !== null && !tooShort;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border-2 bg-white"
        style={{ borderColor: tone.edge }}>

        {/* ── the window ── */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-5"
          style={{ background: tone.bg }}>
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
            style={{ background: tone.edge }}>
            <Scale className="h-5 w-5 text-white" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: tone.fg, opacity: 0.75 }}>
              Droit de réclamation
            </p>
            <p className="mt-0.5 text-[16px] font-extrabold" style={{ color: tone.fg }}>
              Vous pouvez contester cette décision
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: tone.fg }}>
              Votre réclamation sera examinée par un membre de la commission
              <b> différent</b> de celui ayant rendu la décision.
              {e.deadline && (
                <> À déposer avant le <b>{longFr(e.deadline)}</b>.</>
              )}
            </p>
          </div>

          <div className="flex-none rounded-xl bg-white/70 px-4 py-2.5 text-center">
            <p className="text-[20px] font-extrabold leading-none" style={{ color: tone.fg }}>
              {e.daysRemaining}
            </p>
            <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: tone.fg, opacity: 0.7 }}>
              jour{e.daysRemaining > 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* ── the decision being contested, in view while they write ── */}
        {e.contestedJustification && (
          <div className="border-b border-[var(--line)] px-6 py-5">
            <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--red-700)]">
              <FileText className="h-3 w-3" />
              Décision contestée
              {e.contestedGroundLabelFr && (
                <span className="rounded-full bg-[var(--red-tint)] px-2 py-0.5 text-[10px] normal-case tracking-normal">
                  {e.contestedGroundLabelFr}
                </span>
              )}
            </p>
            <blockquote className="mt-2 whitespace-pre-wrap rounded-r-xl border-l-[3px] border-[var(--red-500)] bg-[var(--red-tint)] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]">
              {e.contestedJustification}
            </blockquote>
          </div>
        )}

        {/* ── the ground ── */}
        <div className="px-6 py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            Sur quel motif contestez-vous ?
          </p>

          <div className="mt-3 space-y-2">
            {reasons.data?.map((r) => {
              const selected = reasonId === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setReasonId(r.id); setError(undefined); }}
                  aria-pressed={selected}
                  className="flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-colors"
                  style={{
                    borderColor: selected ? "var(--green-500)" : "var(--line)",
                    background: selected ? "var(--green-tint)" : "white",
                  }}
                >
                  <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: selected ? "var(--green-600)" : "var(--line)",
                      background: selected ? "var(--green-600)" : "transparent",
                    }}>
                    {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                  </span>

                  <span className="min-w-0">
                    <span className="block text-[13.5px] font-bold text-[var(--green-900)]">
                      {r.labelFr}
                    </span>
                    <span dir="rtl" className="block text-[12px] text-[var(--muted-fg)]">
                      {r.labelAr}
                    </span>
                    {r.hintFr && (
                      <span className="mt-1 block text-[12px] leading-snug text-[var(--slate)]">
                        {r.hintFr}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── the argument ── */}
        <div className="border-t border-[var(--line)] px-6 py-5">
          <label htmlFor="objection-argument"
            className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            Exposez votre contestation
          </label>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--slate)]">
            Le membre de la commission qui réexaminera votre dossier lira ce
            texte. Soyez précis : indiquez ce que vous contestez et pourquoi.
          </p>

          <Textarea
            id="objection-argument"
            rows={6}
            className="mt-3"
            value={argument}
            onChange={(ev) => { setArgument(ev.target.value); setError(undefined); }}
            placeholder="Exemple : mon attestation de travail du 12 mars couvre bien les douze derniers mois, alors que la décision indique une activité irrégulière…"
            aria-invalid={!!error}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11.5px] font-mono"
              style={{ color: tooShort ? "var(--muted-fg)" : "var(--green-700)" }}>
              {length} / {MIN_ARGUMENT_LENGTH} caractères minimum
            </p>
            {!tooShort && (
              <p className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--green-700)]">
                <Check className="h-3 w-3" /> longueur suffisante
              </p>
            )}
          </div>

          {error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium text-[var(--red-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {error}
            </p>
          )}
        </div>

        {/* ── submit ── */}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
          <p className="flex flex-1 items-start gap-2 text-[12.5px] leading-relaxed text-[var(--slate)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />
            Le règlement ne prévoit <b>qu&apos;une seule réclamation</b> par
            dossier. Relisez votre exposé avant de l&apos;envoyer.
          </p>

          <Button size="sm" disabled={!ready || submit.isPending}
            onClick={() => setConfirming(true)}>
            <Send className="h-4 w-4" />
            Déposer ma réclamation
          </Button>
        </div>
      </section>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Déposer votre réclamation ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle sera transmise à un membre de la commission différent de
              celui ayant rendu la décision contestée.
              <br />
              <span className="mt-2 block font-medium text-[var(--red-500)]">
                C&apos;est votre unique réclamation pour ce dossier. Après cet
                envoi, vous ne pourrez plus la modifier ni en déposer une autre.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Relire mon exposé</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit.mutate()}
              disabled={submit.isPending}>
              {submit.isPending ? "Envoi…" : "Confirmer le dépôt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
