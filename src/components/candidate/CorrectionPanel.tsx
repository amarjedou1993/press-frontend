"use client";
// src/components/candidate/CorrectionPanel.tsx
// The candidate's answer to the commission.
//
// This is the most consequential screen in the candidate space: getting it
// wrong costs someone their accreditation for a year, and the single
// correction round is already spent by the time they arrive here.
//
// So it does three things a plain "upload files" screen would not:
//
// 1. THE DEADLINE IS UNMISSABLE, and coloured by urgency. Past it, the
//    dossier is rejected automatically — that consequence is stated in
//    words, not implied by a date.
//
// 2. EACH PIECE CARRIES ITS OBSERVATION. The candidate must see WHAT was
//    wrong, beside the piece it was wrong with — otherwise they re-upload
//    the same bad scan.
//
// 3. RESUBMISSION IS GATED BY THE SERVER. `readyToResubmit` and
//    `remainingFr` come from the same object, so the button and the
//    explanation cannot disagree — and a partial answer can never be sent,
//    because it would land on a reviewer with no round left to ask again.

import { useState } from "react";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle, Check, Clock, Camera, FileText, Link2, Send, ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReplaceDocumentDialog } from "./ReplaceDocumentDialog";
import {
  getCorrectionState, resubmitCorrection, correctionKeys,
  type OutstandingItem,
} from "@/lib/api/correction";
import { applicationKeys } from "@/lib/api/applications";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

const LINK_TYPES = new Set(["WEBSITE", "WORK_LINK"]);

function deadlineTone(days: number, passed: boolean) {
  if (passed) return { bg: "var(--red-tint)", fg: "var(--red-700)", edge: "var(--red-500)" };
  if (days <= 2) return { bg: "var(--red-tint)", fg: "var(--red-700)", edge: "var(--red-500)" };
  if (days <= 5) return { bg: "var(--gold-tint)", fg: "var(--gold-700)", edge: "var(--gold-500)" };
  return { bg: "var(--green-tint)", fg: "var(--green-700)", edge: "var(--green-500)" };
}

function longFr(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export function CorrectionPanel({ applicationId }: { applicationId: number }) {
  const qc = useQueryClient();
  const [replacing, setReplacing] = useState<OutstandingItem | null>(null);
  const [confirmResubmit, setConfirmResubmit] = useState(false);

  const state = useQuery({
    queryKey: correctionKeys.state(applicationId),
    queryFn: () => getCorrectionState(applicationId),
  });

  const resubmit = useMutation({
    mutationFn: () => resubmitCorrection(applicationId),
    onSuccess: (next) => {
      qc.setQueryData(correctionKeys.state(applicationId), next);
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      qc.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
      setConfirmResubmit(false);
      toast.success("Corrections déposées", {
        description: "Votre dossier retourne devant la commission pour examen final.",
      });
    },
    onError: (e) => {
      setConfirmResubmit(false);
      toast.error("Envoi impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      });
    },
  });

  if (state.isLoading) return <Skeleton className="h-72 w-full rounded-2xl" />;
  if (!state.data?.inCorrection) return null;

  const s = state.data;
  const tone = deadlineTone(s.daysRemaining, s.deadlinePassed);
  const answered = s.documents.filter((d) => d.answered).length
    + (s.photoNeedsCorrection && s.photoAnswered ? 1 : 0);
  const total = s.documents.length + (s.photoNeedsCorrection ? 1 : 0);

  return (
    <>
      <div className="overflow-hidden rounded-2xl border-2 bg-white"
        style={{ borderColor: tone.edge }}>

        {/* ── the deadline, stated with its consequence ── */}
        <div className="flex flex-wrap items-center gap-4 px-6 py-4"
          style={{ background: tone.bg }}>
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
            style={{ background: tone.edge }}>
            <Clock className="h-5 w-5 text-white" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: tone.fg, opacity: 0.75 }}>
              Corrections demandées
            </p>
            {s.deadlinePassed ? (
              <p className="mt-0.5 text-[15px] font-extrabold" style={{ color: tone.fg }}>
                Le délai de correction est expiré
              </p>
            ) : (
              <p className="mt-0.5 text-[15px] font-extrabold" style={{ color: tone.fg }}>
                {s.daysRemaining === 0
                  ? "Dernier jour pour répondre"
                  : `${s.daysRemaining} jour${s.daysRemaining > 1 ? "s" : ""} pour répondre`}
                {s.deadline && (
                  <span className="ml-2 text-[13px] font-semibold opacity-80">
                    — jusqu&apos;au {longFr(s.deadline)}
                  </span>
                )}
              </p>
            )}
            <p className="mt-1 text-[12.5px] leading-relaxed" style={{ color: tone.fg }}>
              {s.deadlinePassed
                ? "Votre dossier va être examiné en l'état par la commission."
                : "Passé ce délai et sans réponse de votre part, votre dossier sera rejeté pour dossier incomplet."}
            </p>
          </div>

          {total > 0 && (
            <div className="flex-none rounded-xl bg-white/70 px-4 py-2.5 text-center">
              <p className="text-[20px] font-extrabold leading-none" style={{ color: tone.fg }}>
                {answered}<span className="text-[13px] opacity-60">/{total}</span>
              </p>
              <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
                style={{ color: tone.fg, opacity: 0.7 }}>
                corrigées
              </p>
            </div>
          )}
        </div>

        {/* ── the pieces ── */}
        <div className="divide-y divide-[var(--line)]">
          {s.documents.map((item) => {
            const isLink = LINK_TYPES.has(item.docType);
            return (
              <div key={item.documentId} className="flex items-start gap-4 px-6 py-4">
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                  style={{
                    background: item.answered ? "var(--green-500)" : "var(--gold-tint)",
                    color: item.answered ? "#fff" : "var(--gold-700)",
                  }}>
                  {item.answered ? <Check className="h-4 w-4" />
                    : isLink ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                    {item.docTypeLabelFr}
                  </p>
                  {item.observation && (
                    <p className="mt-1 rounded-lg bg-[var(--gold-tint)] px-3 py-1.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                      {item.observation}
                    </p>
                  )}
                  {item.answered && (
                    <p className="mt-1 text-[12px] font-semibold text-[var(--green-700)]">
                      Nouvelle version déposée.
                    </p>
                  )}
                </div>

                {!s.deadlinePassed && (
                  <Button
                    variant={item.answered ? "outline" : "default"}
                    size="sm"
                    className="flex-none"
                    onClick={() => setReplacing(item)}
                  >
                    {item.answered ? "Remplacer à nouveau" : "Remplacer"}
                  </Button>
                )}
              </div>
            );
          })}

          {/* ── the photograph lives on the profile, so it links there ── */}
          {s.photoNeedsCorrection && (
            <div className="flex items-start gap-4 px-6 py-4">
              <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                style={{
                  background: s.photoAnswered ? "var(--green-500)" : "var(--gold-tint)",
                  color: s.photoAnswered ? "#fff" : "var(--gold-700)",
                }}>
                {s.photoAnswered ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                  Photographie d&apos;identité
                </p>
                {s.photoObservation && (
                  <p className="mt-1 rounded-lg bg-[var(--gold-tint)] px-3 py-1.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                    {s.photoObservation}
                  </p>
                )}
                <p className="mt-1 text-[12px] text-[var(--slate)]">
                  {s.photoAnswered
                    ? "Nouvelle photographie enregistrée."
                    : "Votre photographie se modifie depuis votre profil."}
                </p>
              </div>

              {!s.deadlinePassed && (
                <Link href={routes.candidate.profile} className="flex-none">
                  <Button variant={s.photoAnswered ? "outline" : "default"} size="sm">
                    {s.photoAnswered ? "Modifier" : "Aller au profil"}
                    <ArrowRight className="h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── resubmission ── */}
        {!s.deadlinePassed && (
          <div className="border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
            {s.readyToResubmit ? (
              <div className="flex flex-wrap items-center gap-4">
                <p className="flex flex-1 items-center gap-2 text-[13.5px] font-semibold text-[var(--green-700)]">
                  <Check className="h-4 w-4 flex-none" />
                  Toutes les corrections ont été déposées.
                </p>
                <Button size="sm" onClick={() => setConfirmResubmit(true)}>
                  <Send className="h-4 w-4" />
                  Renvoyer à la commission
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[var(--gold-700)]" />
                <div>
                  <p className="text-[13px] font-semibold text-[var(--gold-700)]">
                    Il reste à corriger : {s.remainingFr.join(", ")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--slate)]">
                    Votre dossier ne peut être renvoyé qu&apos;une fois toutes les
                    pièces signalées remplacées.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ReplaceDocumentDialog
        applicationId={applicationId}
        item={replacing}
        open={!!replacing}
        onOpenChange={(o) => !o && setReplacing(null)}
      />

      <AlertDialog open={confirmResubmit} onOpenChange={setConfirmResubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Renvoyer votre dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Vos corrections seront transmises à la commission pour examen final.
              <br />
              <span className="mt-2 block font-medium text-[var(--red-500)]">
                Le règlement ne prévoit qu&apos;une seule correction : après cet
                envoi, vous ne pourrez plus modifier vos pièces.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => resubmit.mutate()}
              disabled={resubmit.isPending}>
              {resubmit.isPending ? "Envoi…" : "Confirmer l'envoi"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
