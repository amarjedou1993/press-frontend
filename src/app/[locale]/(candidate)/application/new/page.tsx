"use client";
// src/app/[locale]/(candidate)/candidat/nouvelle-candidature/page.tsx

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CalendarClock } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { listOpenSessions, listCategories, catalogKeys } from "@/lib/api/sessions-public";
import { startApplication, applicationKeys } from "@/lib/api/applications";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

export default function NewApplicationPage() {
  const t = useTranslations("newApplication");
  const locale = useLocale();
  const format = useFormatter();
  const arabic = locale === "ar";

  const router = useRouter();
  const qc = useQueryClient();
  const [categoryId, setCategoryId] = useState<number | null>(null);

  const sessions = useQuery({ queryKey: catalogKeys.openSessions, queryFn: listOpenSessions });
  const categories = useQuery({ queryKey: catalogKeys.categories, queryFn: listCategories });

  const session = sessions.data?.[0];

  const start = useMutation({
    mutationFn: () =>
      startApplication({ sessionId: session!.id, categoryId: categoryId! }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.all });
      router.push(routes.candidate.application);
    },
    onError: (e) =>
      toast.error(t("cannotStart"), {
        description: e instanceof ApiError
          ? (e.problem.detail ?? e.message)
          : t("tryAgain"),
      }),
  });

  const fmtDate = (iso: string) =>
    format.dateTime(new Date(iso + "T00:00:00"), "long");

  if (sessions.isLoading || categories.isLoading) {
    return <Skeleton className="mx-auto h-96 max-w-3xl rounded-2xl" />;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-8 text-center sm:p-12">
          <CalendarClock className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {t("noSessionTitle")}
          </p>
          <p className="mt-2 text-[13.5px] leading-relaxed text-[var(--slate)]">
            {t("noSessionBody")}
          </p>
          <Button className="mt-5 w-full sm:w-auto" variant="outline"
            onClick={() => router.push(routes.candidate.dashboard)}>
            {t("backToDashboard")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <VerificationBanner />

      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <Button variant="ghost" size="icon" className="flex-none" aria-label={t("back")}
          onClick={() => router.push(routes.candidate.dashboard)}>
          {/* rtl-flip: "back" is the direction the reader came from, which
              is the right in an Arabic page. */}
          <ArrowLeft className="rtl-flip h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold leading-tight text-[var(--green-900)] sm:text-xl">
            {t("title")}
          </h2>
          {/* The deadline, and it is the one fact worth the space: it decides
              whether the candidate has this evening or a fortnight. */}
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--slate)] sm:text-[13.5px]">
            {t("openUntil", { date: fmtDate(session.receivingEnd) })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
          {t("step")}
        </p>
        <h3 className="mt-2 text-[16px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[17px]">
          {t("question")}
        </h3>
        <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--slate)] sm:text-[13.5px]">
          {t("questionHint")}
        </p>

        <div className="mt-6 space-y-3">
          {categories.data?.map((c) => {
            const selected = categoryId === c.id;
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={selected}
                /*
                 * ⚠️ p-4 below sm, and the nesting is why.
                 *
                 * p-5 inside the panel's p-7 left about 250px for a category
                 * name on a 375px screen — and "Journaliste professionnel de
                 * l'audiovisuel" then wrapped to three lines inside a button
                 * that is already a large tap target.
                 *
                 * The button stays comfortably tappable either way: 44px is
                 * the floor, and a padded row of text clears it easily.
                 */
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
                {/* ONE label — the reader's. The stacked pair was ornament
                    for a French reader; an Arabic one now sees Arabic. */}
                <span className="min-w-0">
                  <span className="block text-[14px] font-bold leading-snug text-[var(--green-900)] sm:text-[14.5px]">
                    {arabic ? (c.labelAr ?? c.labelFr) : c.labelFr}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        {/*
         * ⚠️ STACKED BELOW sm, WITH THE PRIMARY ACTION LAST.
         *
         * Two buttons on a row at 375px sat at the far edge — the corner
         * hardest to reach one-handed, on the screen most of these candidates
         * will use. Full width and stacked puts "Continuer" at the bottom,
         * where a thumb already rests.
         *
         * flex-col rather than flex-col-reverse: the reading order and the
         * tab order stay Annuler then Continuer, which is what a screen
         * reader will announce.
         */}
        <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto"
            onClick={() => router.push(routes.candidate.dashboard)}>
            {t("cancel")}
          </Button>
          <Button
            className="w-full sm:w-auto"
            disabled={!categoryId || start.isPending}
            onClick={() => start.mutate()}
          >
            {start.isPending ? t("creating") : t("continue")}
            <ArrowRight className="rtl-flip h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
