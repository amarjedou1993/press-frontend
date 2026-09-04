"use client";
// src/components/candidate/ObjectionPanel.tsx
//
// The candidate's one recourse against a rejection.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ TWO PIECES OF FREE TEXT MEET ON THIS SCREEN, IN EITHER LANGUAGE.
//
// The DECISION being contested — written by a commission member — and the
// candidate's own ARGUMENT. Neither is translated: a member writes in the
// language they use, and a candidate answers in theirs. They may not match.
//
// Both carry dir="auto". A French refusal quoted inside an Arabic page, or an
// Arabic argument echoed back in a French one, must still read correctly:
// this is the document a second member will judge.
// ───────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
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
import { useFieldError } from "@/lib/useFieldError";

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
  const t = useTranslations("objection");
  const tb = useTranslations("objectionBlocked");
  const locale = useLocale();
  const format = useFormatter();
  const resolve = useFieldError();
  const qc = useQueryClient();
  const arabic = locale === "ar";

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
      toast.success(t("filedTitle"), { description: t("filedToast") });
    },
    onError: (e) => {
      setConfirming(false);
      // ⚠️ resolve(): the service now throws KEYS —
      // "objectionBlocked.ALREADY_FILED", "validation.argumentTooShort".
      // Without this the candidate reads the key itself.
      setError(resolve(
        e instanceof ApiError ? (e.problem.detail ?? e.message) : t("tryAgain")));
    },
  });

  if (!visible) return null;
  if (eligibility.isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;
  if (!eligibility.data) return null;

  const e = eligibility.data;

  /** The deadline, in the reader's own locale — never the server's string. */
  const deadlineText = e.deadline
    ? format.dateTime(new Date(e.deadline + "T00:00:00"), "long")
    : "";

  /* ══ already filed — show what was said ══ */
  if (e.alreadyFiled) {
    const reasonLabel = arabic
      ? (filed.data?.reasonLabelAr ?? filed.data?.reasonLabelFr)
      : filed.data?.reasonLabelFr;

    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--gold-500)]/50 bg-white">
        <div className="flex items-start gap-3.5 bg-[var(--gold-tint)] px-5 py-4 sm:gap-4 sm:px-6 sm:py-5">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--gold-700)] sm:h-11 sm:w-11">
            <Gavel className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]/75">
              {t("filedEyebrow")}
            </p>
            <p className="mt-1 text-[15px] font-extrabold leading-snug text-[var(--gold-700)] sm:text-[16px]">
              {t("filedTitle")}
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--gold-700)] sm:text-[13px]">
              {t("filedBody")}
            </p>
          </div>
        </div>

        {filed.data && (
          <div className="space-y-4 px-5 py-4 sm:px-6 sm:py-5">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                {t("groundInvoked")}
              </p>
              {/* ONE label — the reader's. The other was ornament. */}
              <p className="mt-1 text-[14px] font-semibold text-[var(--ink)]">
                {reasonLabel}
              </p>
            </div>

            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                {t("yourStatement")}
              </p>
              {/* dir="auto": the candidate wrote this in their own language. */}
              <blockquote
                dir="auto"
                className="user-text mt-2 whitespace-pre-wrap break-words rounded-e-xl border-s-[3px] border-[var(--gold-700)] bg-[#fbfcfb] px-3.5 py-3 text-[13px] leading-[1.7] text-[var(--ink)] sm:px-4 sm:text-[13.5px]"
              >
                {filed.data.argument}
              </blockquote>
            </div>

            {filed.data.createdAt && (
              <p className="flex items-center gap-1.5 text-[12px] text-[var(--muted-fg)]">
                <Clock className="h-3 w-3 flex-none" />
                {t("filedOn", {
                  date: format.dateTime(new Date(filed.data.createdAt), "full"),
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
    /**
     * ⚠️ FROM THE CODE, NOT THE SENTENCE.
     *
     * The server sends both. Its DEADLINE_PASSED sentence embeds a date it
     * formatted in French — useless to an Arabic page, which composes its own
     * from `deadline`. The other four codes ignore the parameter.
     */
    const blocked = e.blockedReason && tb.has(e.blockedReason)
      ? tb(e.blockedReason, { deadline: deadlineText })
      : t("notAvailableBody");

    return (
      <section className="flex items-start gap-3.5 rounded-2xl border border-[var(--line)] bg-white p-5 sm:gap-4 sm:p-6">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#eef1ef]">
          <Lock className="h-4 w-4 text-[var(--muted-fg)]" />
        </span>
        <div className="min-w-0">
          <p className="text-[13.5px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[14px]">
            {t("notAvailable")}
          </p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--slate)] sm:text-[13.5px]">
            {blocked}
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

  const contestedGround = arabic
    ? (e.contestedGroundLabelAr ?? e.contestedGroundLabelFr)
    : e.contestedGroundLabelFr;

  return (
    <>
      <section className="overflow-hidden rounded-2xl border-2 bg-white"
        style={{ borderColor: tone.edge }}>

        {/*
          ── the window ──

          ⚠️ THE ICON AND THE TEXT ARE ONE GROUP, AND THAT IS THE FIX.

          As three siblings in a flex row, the countdown held its width and
          the message shrank to about 130px on a 375px screen — "Vous pouvez
          contester cette décision" over four lines beside a number, on the
          panel explaining someone's only recourse.

          Grouped, the countdown has nothing to sit beside below sm and drops
          to its own full-width band. It reads as a header rule rather than a
          badge, which is what a deadline actually is here.
        */}
        <div className="flex flex-wrap items-center gap-3.5 px-5 py-4 sm:gap-4 sm:px-6 sm:py-5"
          style={{ background: tone.bg }}>

          <div className="flex w-full min-w-0 items-start gap-3.5 sm:w-auto sm:flex-1 sm:gap-4">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl sm:h-11 sm:w-11"
              style={{ background: tone.edge }}>
              <Scale className="h-5 w-5 text-white" />
            </span>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
                style={{ color: tone.fg, opacity: 0.75 }}>
                {t("eyebrow")}
              </p>
              <p className="mt-0.5 text-[15px] font-extrabold leading-snug sm:text-[16px]"
                style={{ color: tone.fg }}>
                {t("youMayContest")}
              </p>
              <p className="mt-1.5 text-[12.5px] leading-relaxed sm:text-[13px]"
                style={{ color: tone.fg }}>
                {/* THE GUARANTEE, emphasised by the catalogue rather than the
                    component: a different member examines it. */}
                {t.rich("differentMember", { b: (c) => <b>{c}</b> })}
                {e.deadline && (
                  <>
                    {" "}
                    {t.rich("fileBefore", {
                      b: (c) => <b>{c}</b>,
                      date: deadlineText,
                    })}
                  </>
                )}
              </p>
            </div>
          </div>

          {/* A full-width band on a phone, a compact block from sm. */}
          <div className="flex w-full items-center justify-center gap-2 rounded-xl bg-white/70 px-4 py-2 sm:w-auto sm:flex-none sm:flex-col sm:gap-0 sm:py-2.5 sm:text-center">
            <p className="font-mono text-[20px] font-extrabold leading-none"
              style={{ color: tone.fg }}>
              {e.daysRemaining}
            </p>
            <p className="text-[9.5px] font-bold uppercase tracking-[0.12em] sm:mt-1"
              style={{ color: tone.fg, opacity: 0.7 }}>
              {t("days", { count: e.daysRemaining })}
            </p>
          </div>
        </div>

        {/* ── the decision being contested, in view while they write ── */}
        {e.contestedJustification && (
          <div className="border-b border-[var(--line)] px-5 py-4 sm:px-6 sm:py-5">
            <p className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--red-700)]">
              <FileText className="h-3 w-3 flex-none" />
              {t("contestedDecision")}
              {contestedGround && (
                <span className="rounded-full bg-[var(--red-tint)] px-2 py-0.5 text-[10px] normal-case tracking-normal">
                  {contestedGround}
                </span>
              )}
            </p>
            {/* ⚠️ dir="auto": the member who refused wrote this, in whichever
                language they use. */}
            <blockquote
              dir="auto"
              /* ⚠️ break-words. whitespace-pre-wrap keeps the line breaks the
                 member typed but does nothing for one long token — and a
                 refusal is exactly where someone cites a URL. This is the
                 text the objection argues against; it cannot be the text that
                 runs off the screen. */
              className="user-text mt-2 whitespace-pre-wrap break-words rounded-e-xl border-s-[3px] border-[var(--red-500)] bg-[var(--red-tint)] px-3.5 py-3 text-[13px] leading-[1.7] text-[var(--ink)] sm:px-4 sm:text-[13.5px]"
            >
              {e.contestedJustification}
            </blockquote>
          </div>
        )}

        {/* ── the ground ── */}
        <div className="px-5 py-4 sm:px-6 sm:py-5">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            {t("onWhatGround")}
          </p>

          <div className="mt-3 space-y-2">
            {reasons.data?.map((r) => {
              const selected = reasonId === r.id;
              const label = arabic ? (r.labelAr ?? r.labelFr) : r.labelFr;
              const hint = arabic ? (r.hintAr ?? r.hintFr) : r.hintFr;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => { setReasonId(r.id); setError(undefined); }}
                  aria-pressed={selected}
                  className="flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-start transition-colors"
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
                      {label}
                    </span>
                    {hint && (
                      <span className="mt-1 block text-[12px] leading-snug text-[var(--slate)]">
                        {hint}
                      </span>
                    )}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ── the argument ── */}
        <div className="border-t border-[var(--line)] px-5 py-4 sm:px-6 sm:py-5">
          <label htmlFor="objection-argument"
            className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            {t("setOutYourCase")}
          </label>
          <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--slate)]">
            {t("setOutHint")}
          </p>

          {/* dir="auto": the candidate writes in their own language, and the
              field must follow what they type rather than the page. */}
          <Textarea
            id="objection-argument"
            rows={6}
            dir="auto"
            className="mt-3"
            value={argument}
            onChange={(ev) => { setArgument(ev.target.value); setError(undefined); }}
            placeholder={t("argumentPlaceholder")}
            aria-invalid={!!error}
          />

          <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
            <p dir="ltr" className="font-mono text-[11.5px] rtl:text-end"
              style={{ color: tooShort ? "var(--muted-fg)" : "var(--green-700)" }}>
              {t("charCount", { length, min: MIN_ARGUMENT_LENGTH })}
            </p>
            {!tooShort && (
              <p className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--green-700)]">
                <Check className="h-3 w-3 flex-none" /> {t("longEnough")}
              </p>
            )}
          </div>

          {error && (
            <p dir="auto" className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium leading-relaxed text-[var(--red-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {/* min-w-0 so a long sentence wraps rather than pushing the
                  icon out of the panel. */}
              <span className="min-w-0 break-words">{error}</span>
            </p>
          )}
        </div>

        {/* ── submit ── */}
        {/* ⚠️ The warning takes the full width below sm and the button its
            own line. Side by side at 375px the sentence had about 120px —
            and "vous ne pourrez déposer qu'une seule réclamation" is the
            thing to read before pressing, not after. */}
        <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-4 sm:gap-4 sm:px-6">
          <p className="flex w-full min-w-0 items-start gap-2 text-[12.5px] leading-relaxed text-[var(--slate)] sm:w-auto sm:flex-1">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />
            <span className="min-w-0">{t.rich("onlyOne", { b: (c) => <b>{c}</b> })}</span>
          </p>

          <Button size="sm" className="w-full sm:w-auto sm:flex-none"
            disabled={!ready || submit.isPending}
            onClick={() => setConfirming(true)}>
            <Send className="h-4 w-4 flex-none" />
            {t("fileObjection")}
          </Button>
        </div>
      </section>

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* ⚠️ OUTSIDE the description. AlertDialogDescription renders a <p>,
              and nesting a block element in it makes the browser close the
              <p> early — the server and client trees then diverge. It is also
              a WARNING rather than a description: this is the candidate's
              only recourse. */}
          <p className="text-[13px] font-medium leading-relaxed text-[var(--red-500)]">
            {t("confirmWarning")}
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">
              {t("rereadMyCase")}
            </AlertDialogCancel>
            <AlertDialogAction className="w-full sm:w-auto"
              onClick={() => submit.mutate()}
              disabled={submit.isPending}>
              {submit.isPending ? t("sending") : t("confirmFile")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
