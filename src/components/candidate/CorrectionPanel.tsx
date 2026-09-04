"use client";
// src/components/candidate/CorrectionPanel.tsx
//
// The correction round: what the commission flagged, how long is left, and
// what happens if the candidate does nothing.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ THE OBSERVATIONS ARE FREE TEXT, IN AN UNKNOWN LANGUAGE.
//
// «document illisible» or «الوثيقة غير مقروءة» — a commission member writes
// whichever they use, and the system never translates it. Every observation
// therefore carries dir="auto".
//
// ⚠️ AND `remainingFr` IS NO LONGER USED.
//
// The backend composed a French list of what is left. But `s.documents`
// already carries each item's docType and whether it was answered, so the
// list is DERIVED HERE and reads in the reader's language. One less French
// string crossing the wire, and one less thing to keep in step.
// ───────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  AlertTriangle, Check, Clock, Camera, FileText, Link2, Send, ArrowRight,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
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

export function CorrectionPanel({ applicationId }: { applicationId: number }) {
  const t = useTranslations("correction");
  const td = useTranslations("documentType");
  const format = useFormatter();
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
      toast.success(t("sentTitle"), { description: t("sentBody") });
    },
    onError: (e) => {
      setConfirmResubmit(false);
      toast.error(t("sendFailed"), {
        description: e instanceof ApiError
          ? (e.problem.detail ?? e.message)
          : t("tryAgain"),
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

  /* What is still outstanding, in the reader's language.
     Derived from the same data the rows above render, rather than taken from
     the backend's pre-composed French list. */
  const remaining = [
    ...s.documents.filter((d) => !d.answered).map((d) => td(d.docType)),
    ...(s.photoNeedsCorrection && !s.photoAnswered ? [t("photo")] : []),
  ];

  const oneCorrectionWarning =
    t("oneCorrectionOnly");

  return (
    <>
      <div className="overflow-hidden rounded-2xl border-2 bg-white"
        style={{ borderColor: tone.edge }}>

        {/* ── the deadline, stated with its consequence ── */}
        {/*
          ⚠️ THE ICON AND THE TEXT ARE ONE GROUP.

          As three siblings the counter held its width and the message shrank
          to about 118px at 375px — a deadline and its consequence in a column
          three words wide. Grouped, the counter has nothing to sit beside
          below sm and takes its own full-width band.
        */}
        <div className="flex flex-wrap items-center gap-3.5 px-5 py-4 sm:gap-4 sm:px-6"
          style={{ background: tone.bg }}>

          <div className="flex w-full min-w-0 items-start gap-3.5 sm:w-auto sm:flex-1 sm:items-center sm:gap-4">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl sm:h-11 sm:w-11"
            style={{ background: tone.edge }}>
            <Clock className="h-5 w-5 text-white" />
          </span>

          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: tone.fg, opacity: 0.75 }}>
              {t("eyebrow")}
            </p>

            {s.deadlinePassed ? (
              <p className="mt-0.5 text-[14.5px] font-extrabold leading-snug sm:text-[15px]"
                style={{ color: tone.fg }}>
                {t("expired")}
              </p>
            ) : (
              <p className="mt-0.5 text-[14.5px] font-extrabold leading-snug sm:text-[15px]"
                style={{ color: tone.fg }}>
                {s.daysRemaining === 0
                  ? t("lastDay")
                  : t("daysToAnswer", { count: s.daysRemaining })}
                {s.deadline && (
                  <span className="ms-2 text-[13px] font-semibold opacity-80">
                    {t("until", {
                      date: format.dateTime(
                        new Date(s.deadline + "T00:00:00"), "long"),
                    })}
                  </span>
                )}
              </p>
            )}

            {/* ⚠️ THE CONSEQUENCE, NAMED. A deadline without its effect is a
                date; with it, it is a warning. */}
            <p className="mt-1 text-[12px] leading-relaxed sm:text-[12.5px]"
              style={{ color: tone.fg }}>
              {s.deadlinePassed ? t("expiredBody") : t("consequence")}
            </p>
          </div>
          </div>

          {total > 0 && (
            <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-2 sm:w-auto sm:flex-none sm:flex-col sm:gap-0 sm:py-2.5 sm:text-center">
              {/* dir="ltr" on the ratio: "2/3" reads the same in both
                  languages, and mirroring it would say 3/2. */}
              <p dir="ltr" className="font-mono text-[20px] font-extrabold leading-none"
                style={{ color: tone.fg }}>
                {answered}<span className="text-[13px] opacity-60">/{total}</span>
              </p>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] sm:mt-1"
                style={{ color: tone.fg, opacity: 0.7 }}>
                {t("corrected")}
              </p>
            </div>
          )}
        </div>

        {/* ── the pieces ── */}
        <div className="divide-y divide-[var(--line)]">
          {s.documents.map((item) => {
            const isLink = LINK_TYPES.has(item.docType);
            return (
              /* ⚠️ flex-wrap, and the button takes its own line below sm.
                 Beside a 100px button the observation column was 115px — and
                 the observation is the reason the piece was flagged, which is
                 the one thing this row exists to say. */
              <div key={item.documentId} className="flex flex-wrap items-start gap-x-3.5 gap-y-3 px-5 py-4 sm:gap-x-4 sm:px-6">
                <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                  style={{
                    background: item.answered ? "var(--green-500)" : "var(--gold-tint)",
                    color: item.answered ? "#fff" : "var(--gold-700)",
                  }}>
                  {item.answered ? <Check className="h-4 w-4" />
                    : isLink ? <Link2 className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                </span>

                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold leading-snug text-[var(--green-900)] sm:text-[13.5px]">
                    {td(item.docType)}
                  </p>
                  {item.observation && (
                    /* ⚠️ dir="auto": the member wrote this in French or in
                       Arabic, and it is never translated.
                       ⚠️ break-words: an observation is where a link gets
                       cited, and this is the instruction being followed. */
                    <p dir="auto"
                      className="user-text mt-1 break-words rounded-lg bg-[var(--gold-tint)] px-3 py-1.5 text-[12px] leading-relaxed text-[var(--gold-700)] sm:text-[12.5px]">
                      {item.observation}
                    </p>
                  )}
                  {item.answered && (
                    <p className="mt-1 text-[12px] font-semibold text-[var(--green-700)]">
                      {t("newVersionFiled")}
                    </p>
                  )}
                </div>

                {!s.deadlinePassed && (
                  <Button
                    variant={item.answered ? "outline" : "default"}
                    size="sm"
                    className="w-full sm:w-auto sm:flex-none"
                    onClick={() => setReplacing(item)}
                  >
                    {item.answered ? t("replaceAgain") : t("replace")}
                  </Button>
                )}
              </div>
            );
          })}

          {/* ── the photograph lives on the profile, so it links there ── */}
          {s.photoNeedsCorrection && (
            <div className="flex flex-wrap items-start gap-x-3.5 gap-y-3 px-5 py-4 sm:gap-x-4 sm:px-6">
              <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                style={{
                  background: s.photoAnswered ? "var(--green-500)" : "var(--gold-tint)",
                  color: s.photoAnswered ? "#fff" : "var(--gold-700)",
                }}>
                {s.photoAnswered ? <Check className="h-4 w-4" /> : <Camera className="h-4 w-4" />}
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                  {t("photo")}
                </p>
                {s.photoObservation && (
                  <p dir="auto"
                    className="user-text mt-1 break-words rounded-lg bg-[var(--gold-tint)] px-3 py-1.5 text-[12px] leading-relaxed text-[var(--gold-700)] sm:text-[12.5px]">
                    {s.photoObservation}
                  </p>
                )}
                <p className="mt-1 text-[12px] text-[var(--slate)]">
                  {s.photoAnswered ? t("photoReplaced") : t("photoOnProfile")}
                </p>
              </div>

              {!s.deadlinePassed && (
                <Link href={routes.candidate.profile} className="w-full sm:w-auto sm:flex-none">
                  <Button className="w-full sm:w-auto"
                    variant={s.photoAnswered ? "outline" : "default"} size="sm">
                    {s.photoAnswered ? t("photoEdit") : t("photoGo")}
                    <ArrowRight className="rtl-flip h-3 w-3" />
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* ── resubmission ── */}
        {!s.deadlinePassed && (
          <div className="border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-4 sm:px-6">
            {s.readyToResubmit ? (
              <div className="flex flex-wrap items-center gap-3 sm:gap-4">
                <p className="flex w-full min-w-0 items-center gap-2 text-[13px] font-semibold text-[var(--green-700)] sm:w-auto sm:flex-1 sm:text-[13.5px]">
                  <Check className="h-4 w-4 flex-none" />
                  {t("allCorrected")}
                </p>
                <Button size="sm" className="w-full sm:w-auto sm:flex-none"
                  onClick={() => setConfirmResubmit(true)}>
                  <Send className="h-4 w-4" />
                  {t("resubmit")}
                </Button>
              </div>
            ) : (
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[var(--gold-700)]" />
                <div className="min-w-0">
                  <p className="text-[12.5px] font-semibold leading-relaxed text-[var(--gold-700)] sm:text-[13px]">
                    {t("stillToCorrect", { list: remaining.join(t("listSeparator")) })}
                  </p>
                  <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--slate)] sm:text-[12.5px]">
                    {t("allBeforeResubmit")}
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
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* ⚠️ OUTSIDE the description, and not merely for tidiness:
              AlertDialogDescription renders a <p>, and the previous version
              nested a <span className="block"> inside it. It is also a
              WARNING rather than a description — the rule that there is only
              ever one correction round, which the action's name does not
              carry. */}
          <p className="text-[13px] font-medium leading-relaxed text-[var(--red-500)]">
            {oneCorrectionWarning}
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto"
              onClick={() => resubmit.mutate()}
              disabled={resubmit.isPending}>
              {resubmit.isPending ? t("sending") : t("confirmSend")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
