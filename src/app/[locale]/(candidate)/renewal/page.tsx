"use client";
// src/app/[locale]/(candidate)/renewal/page.tsx

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowRight, Check, Clock, IdCard, Info, RefreshCw, AlertTriangle, Camera,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { Guilloche, OfficialSeal } from "@/components/public/patterns";
import { getRenewalContext, renewalKeys } from "@/lib/api/renewal";
import { startApplication, applicationKeys } from "@/lib/api/applications";
import { listCategories, catalogKeys } from "@/lib/api/sessions-public";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

export default function RenewalPage() {
  const t = useTranslations("renewal");
  const locale = useLocale();
  const format = useFormatter();
  const arabic = locale === "ar";

  const router = useRouter();
  const qc = useQueryClient();

  /**
   * ⚠️ null MEANS "NOT YET ANSWERED", NOT "NO".
   *
   * The employer question has three states, and conflating the first two is
   * what a pre-filled form does. Until the holder answers, neither branch is
   * shown — so confirming is a decision rather than an oversight.
   */
  const [sameEmployer, setSameEmployer] = useState<boolean | null>(null);
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const context = useQuery({
    queryKey: renewalKeys.context,
    queryFn: getRenewalContext,
  });
  const categories = useQuery({
    queryKey: catalogKeys.categories,
    queryFn: listCategories,
  });

  const e = context.data?.eligibility;

  const start = useMutation({
    mutationFn: () => startApplication({
      sessionId: e!.sessionId!,
      categoryId: categoryId!,
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      router.push(routes.candidate.application);
    },
    onError: (err) => toast.error(t("cannotStart"), {
      description: err instanceof ApiError
        ? (err.problem.detail ?? err.message)
        : t("tryAgain"),
    }),
  });

  const longDate = (iso?: string | null) =>
    iso ? format.dateTime(new Date(iso + "T00:00:00"), "long") : "—";

  if (context.isLoading || categories.isLoading) {
    return <Skeleton className="mx-auto h-96 max-w-3xl rounded-2xl" />;
  }

  /* ══ not eligible ══ */
  if (!e?.eligible) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <VerificationBanner />
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center sm:p-12">
          <RefreshCw className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {t("notAvailable")}
          </p>
          {/* ⚠️ The server's own sentence. It names the concrete situation —
              no session open, card already renewed, dossier already filed —
              which a generic message could not. */}
          <p dir="auto" className="mx-auto mt-2 max-w-md text-[13.5px] leading-relaxed text-[var(--slate)]">
            {e?.blockerFr ?? t("notAvailableBody")}
          </p>
          <Button className="mt-5 w-full sm:w-auto" variant="outline"
            onClick={() => router.push(routes.candidate.dashboard)}>
            {t("backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  const ready = categoryId !== null && sameEmployer !== null;

  return (
    <div className="mx-auto max-w-3xl space-y-6 pb-4">
      <VerificationBanner />

      {/* ══ the card being renewed ══ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.15), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <Guilloche
          className="pointer-events-none absolute -right-24 -top-28 h-[220px] w-[220px] text-white sm:h-[300px] sm:w-[300px]"
          rings={34}
          opacity={0.1}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:px-7 sm:pb-7 sm:pt-7">
          <div className="flex w-full min-w-0 items-start gap-4 sm:w-auto sm:flex-1">
            <span className="relative mt-1 hidden h-[54px] w-[54px] flex-none items-center justify-center sm:flex">
              <span className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true" />
              <OfficialSeal className="relative h-full w-full"
                color="var(--gold-500)" id="renewal-seal" />
            </span>

            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                {t("eyebrow")}
              </p>
              <h2 className="engraved-dark mt-2 text-[22px] font-extrabold leading-tight tracking-tight sm:text-[27px]">
                {t("title")}
              </h2>

              {/* ⚠️ THE CARD IS NAMED. A renewal notice that does not say
                  WHICH card reads as a circular — and a journalist who has
                  held several needs to know which one is being replaced. */}
              <p className="mt-3 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-[13px] text-white/70 sm:text-[13.5px]">
                <span>{t("yourCard")}</span>
                <span dir="ltr" className="font-mono font-bold text-white">
                  {e.cardNumber}
                </span>
              </p>
              <p className="mt-1 text-[13px] text-white/50">
                {e.lapsed
                  ? t("lapsedOn", { date: longDate(e.expiresAt) })
                  : t("expiresOn", { date: longDate(e.expiresAt) })}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-none items-center gap-3 rounded-xl border border-white/15 bg-black/25 px-4 py-3 sm:w-auto sm:flex-col sm:gap-0 sm:px-5 sm:py-3.5 sm:text-center">
            <Clock className="h-4 w-4 flex-none text-white/50 sm:hidden" />
            <p className="text-[12px] font-semibold text-white/70 sm:text-[10px] sm:font-bold sm:uppercase sm:tracking-[0.14em] sm:text-white/45">
              {t("deadline")}
            </p>
            <p className="ms-auto text-[13px] font-extrabold sm:ms-0 sm:mt-1.5 sm:text-[14px]">
              {longDate(e.sessionDeadline)}
            </p>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ⚠️ A LAPSED CARD IS SAID PLAINLY.
          The grace period is administrative, not a licence — a holder who
          reads it the other way works on an expired card and is stopped at a
          checkpoint. */}
      {e.lapsed && (
        <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          <span>{t.rich("lapsedWarning", { b: (c) => <b className="font-bold">{c}</b> })}</span>
        </p>
      )}

      {/* ══ what is asked, and what is not ══ */}
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
        <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
          <Info className="h-3 w-3 flex-none" />
          {t("whatIsAsked")}
        </p>

        {/* ⚠️ THE REASSURING HALF FIRST. What a renewal does NOT ask for is
            the news — a holder expecting to reproduce a birth certificate
            should learn otherwise before reading the list of what remains. */}
        <p className="mt-3 text-[13px] leading-relaxed text-[var(--slate)] sm:text-[13.5px]">
          {t("identityCarriedOver")}
        </p>

        <ul className="mt-4 space-y-2">
          {(["employment", "work", "outlet", "photo"] as const).map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] text-[var(--ink)]">
              <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[var(--green-500)]" />
              <span>{t(`asked.${item}`)}</span>
            </li>
          ))}
        </ul>

        {/* ⚠️ The photograph gets its own line, because it is the one a
            holder is most likely to think is already on file. It is — and
            that is exactly why it must be replaced. */}
        <p className="mt-4 flex items-start gap-2.5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
          <Camera className="mt-0.5 h-3.5 w-3.5 flex-none" />
          {t("photoNote")}
        </p>
      </div>

      {/* ══ the category ══ */}
      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
          {t("step1")}
        </p>
        <h3 className="mt-2 text-[16px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[17px]">
          {t("categoryQuestion")}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
          {t("categoryHint")}
        </p>

        <div className="mt-5 space-y-3">
          {categories.data?.map((c) => {
            const selected = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={selected}
                className="flex w-full items-start gap-3.5 rounded-xl border-2 p-4 text-start transition-all sm:gap-4 sm:p-5"
                style={{
                  borderColor: selected ? "var(--green-500)" : "var(--line)",
                  background: selected ? "var(--green-tint)" : "white",
                }}
              >
                <span
                  className="mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border-2"
                  style={{
                    borderColor: selected ? "var(--green-600)" : "var(--line)",
                    background: selected ? "var(--green-600)" : "transparent",
                  }}
                >
                  {selected && <Check className="h-3 w-3 text-white" />}
                </span>
                <span className="min-w-0 text-[14px] font-bold leading-snug text-[var(--green-900)]">
                  {arabic ? (c.labelAr ?? c.labelFr) : c.labelFr}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══ the employer question ══ */}
      {context.data?.previousInstitution && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
          <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            {t("step2")}
          </p>

          {/*
            ⚠️ A QUESTION, NOT A PRE-FILLED FIELD.

            The outlet could have been dropped into a text box already
            containing last cycle's answer — and a holder who changed employer
            in March would scroll past it, because a filled field reads as
            settled.

            Two buttons cannot be answered by inattention. And the answer is
            RECORDED: if the outlet turns out to be wrong, the dossier shows
            the holder affirmed it rather than merely failed to notice.

            This is how a bank asks whether your address has changed, and for
            the same reason: the institution needs the confirmation, not just
            the data.
          */}
          <h3 className="mt-2 text-[16px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[17px]">
            {t("employerQuestion")}
          </h3>

          <p dir="auto" className="user-text mt-3 rounded-xl border-s-[3px] border-[var(--green-500)] bg-[#fbfcfb] px-4 py-3 text-[14px] font-bold text-[var(--ink)]">
            {context.data.previousInstitution}
            {context.data.previousSpecialisationFr && (
              <span className="mt-0.5 block text-[12.5px] font-normal text-[var(--slate)]">
                {context.data.previousSpecialisationFr}
              </span>
            )}
          </p>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row">
            <Button
              variant={sameEmployer === true ? "default" : "outline"}
              className="w-full sm:flex-1"
              onClick={() => setSameEmployer(true)}
            >
              {sameEmployer === true && <Check className="h-4 w-4 flex-none" />}
              {t("stillThere")}
            </Button>
            <Button
              variant={sameEmployer === false ? "default" : "outline"}
              className="w-full sm:flex-1"
              onClick={() => setSameEmployer(false)}
            >
              {sameEmployer === false && <Check className="h-4 w-4 flex-none" />}
              {t("hasChanged")}
            </Button>
          </div>

          {/* ⚠️ "It has changed" does not ask for the new one HERE. The
              dossier's own employment card does that, with the closed list of
              specialisations and the validation that goes with it — a second
              form would be a second implementation of the same rules. */}
          {sameEmployer === false && (
            <p className="mt-3.5 flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {t("changedNote")}
            </p>
          )}
        </div>
      )}

      {/* ══ start ══ */}
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
        <Button variant="outline" className="w-full sm:w-auto"
          onClick={() => router.push(routes.candidate.dashboard)}>
          {t("cancel")}
        </Button>
        <Button
          className="w-full sm:w-auto"
          disabled={!ready || start.isPending}
          onClick={() => start.mutate()}
        >
          {start.isPending ? t("creating") : t("continue")}
          <ArrowRight className="rtl-flip h-4 w-4 flex-none" />
        </Button>
      </div>
    </div>
  );
}
