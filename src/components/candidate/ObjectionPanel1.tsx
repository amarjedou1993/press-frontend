"use client";


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
  const locale = useLocale();
  const format = useFormatter();
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
      setError(e instanceof ApiError
        ? (e.problem.detail ?? e.message)
        : t("tryAgain"));
    },
  });

  if (!visible) return null;
  if (eligibility.isLoading) return <Skeleton className="h-56 w-full rounded-2xl" />;
  if (!eligibility.data) return null;

  const e = eligibility.data;

  /* ══ already filed — show what was said ══ */
  if (e.alreadyFiled) {
    const reasonLabel = arabic
      ? (filed.data?.reasonLabelAr ?? filed.data?.reasonLabelFr)
      : filed.data?.reasonLabelFr;

    return (
      <section className="overflow-hidden rounded-2xl border border-[var(--gold-500)]/50 bg-white">
        <div className="flex items-start gap-4 bg-[var(--gold-tint)] px-6 py-5">
          <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--gold-700)]">
            <Gavel className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]/75">
              {t("filedEyebrow")}
            </p>
            <p className="mt-1 text-[16px] font-extrabold text-[var(--gold-700)]">
              {t("filedTitle")}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--gold-700)]">
              {t("filedBody")}
            </p>
          </div>
        </div>

        {filed.data && (
          <div className="space-y-4 px-6 py-5">
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
                className="user-text mt-2 whitespace-pre-wrap rounded-e-xl border-s-[3px] border-[var(--gold-700)] bg-[#fbfcfb] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]"
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
    // The backend's reason if it speaks the reader's language, else a plain
    // catalogue sentence. Never a French phrase under an Arabic heading.
    const blocked = arabic
      ? (e.blockedReasonAr ?? t("notAvailableBody"))
      : (e.blockedReasonFr ?? t("notAvailableBody"));

    return (
      <section className="flex items-start gap-4 rounded-2xl border border-[var(--line)] bg-white p-6">
        <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[#eef1ef]">
          <Lock className="h-4 w-4 text-[var(--muted-fg)]" />
        </span>
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            {t("notAvailable")}
          </p>
          <p dir="auto" className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--slate)]">
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
              {t("eyebrow")}
            </p>
            <p className="mt-0.5 text-[16px] font-extrabold" style={{ color: tone.fg }}>
              {t("youMayContest")}
            </p>
            <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: tone.fg }}>
              {/* THE GUARANTEE, emphasised by the catalogue rather than the
                  component: a different member examines it. */}
              {t.rich("differentMember", { b: (c) => <b>{c}</b> })}
              {e.deadline && (
                <>
                  {" "}
                  {t.rich("fileBefore", {
                    b: (c) => <b>{c}</b>,
                    date: format.dateTime(
                      new Date(e.deadline + "T00:00:00"), "long"),
                  })}
                </>
              )}
            </p>
          </div>

          <div className="flex-none rounded-xl bg-white/70 px-4 py-2.5 text-center">
            <p className="font-mono text-[20px] font-extrabold leading-none"
              style={{ color: tone.fg }}>
              {e.daysRemaining}
            </p>
            <p className="mt-1 text-[9.5px] font-bold uppercase tracking-[0.12em]"
              style={{ color: tone.fg, opacity: 0.7 }}>
              {t("days", { count: e.daysRemaining })}
            </p>
          </div>
        </div>

        {/* ── the decision being contested, in view while they write ── */}
        {e.contestedJustification && (
          <div className="border-b border-[var(--line)] px-6 py-5">
            <p className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--red-700)]">
              <FileText className="h-3 w-3 flex-none" />
              {t("contestedDecision")}
              {(arabic ? e.contestedGroundLabelAr : e.contestedGroundLabelFr) && (
                <span className="rounded-full bg-[var(--red-tint)] px-2 py-0.5 text-[10px] normal-case tracking-normal">
                  {arabic
                    ? (e.contestedGroundLabelAr ?? e.contestedGroundLabelFr)
                    : e.contestedGroundLabelFr}
                </span>
              )}
            </p>
            {/* ⚠️ dir="auto": the member who refused wrote this, in whichever
                language they use. */}
            <blockquote
              dir="auto"
              className="user-text mt-2 whitespace-pre-wrap rounded-e-xl border-s-[3px] border-[var(--red-500)] bg-[var(--red-tint)] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]"
            >
              {e.contestedJustification}
            </blockquote>
          </div>
        )}

        {/* ── the ground ── */}
        <div className="px-6 py-5">
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
        <div className="border-t border-[var(--line)] px-6 py-5">
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
            <p dir="ltr" className="font-mono text-[11.5px]"
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
            <p dir="auto" className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium text-[var(--red-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {error}
            </p>
          )}
        </div>

        {/* ── submit ── */}
        <div className="flex flex-wrap items-center gap-4 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
          <p className="flex min-w-0 flex-1 items-start gap-2 text-[12.5px] leading-relaxed text-[var(--slate)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />
            <span>{t.rich("onlyOne", { b: (c) => <b>{c}</b> })}</span>
          </p>

          <Button size="sm" className="flex-none" disabled={!ready || submit.isPending}
            onClick={() => setConfirming(true)}>
            <Send className="h-4 w-4" />
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
              and the previous version nested a <span className="block"> in
              it — the browser closes the <p> at the block element and the
              trees diverge. It is also a WARNING rather than a description:
              this is the candidate's only recourse. */}
          <p className="text-[13px] font-medium leading-relaxed text-[var(--red-500)]">
            {t("confirmWarning")}
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("rereadMyCase")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => submit.mutate()}
              disabled={submit.isPending}>
              {submit.isPending ? t("sending") : t("confirmFile")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
