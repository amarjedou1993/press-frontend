"use client";
// src/app/[locale]/(candidate)/application/new/page.tsx
//
// Choosing a category — the one decision that shapes everything after it,
// since the required documents follow from it.

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
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
          <CalendarClock className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {t("noSessionTitle")}
          </p>
          <p className="mt-2 text-[13.5px] text-[var(--slate)]">
            {t("noSessionBody")}
          </p>
          <Button className="mt-5" variant="outline"
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

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label={t("back")}
          onClick={() => router.push(routes.candidate.dashboard)}>
          {/* rtl-flip: "back" is the direction the reader came from, which
              is the right in an Arabic page. */}
          <ArrowLeft className="rtl-flip h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-xl font-extrabold text-[var(--green-900)]">
            {t("title")}
          </h2>
          <p className="text-[13.5px] text-[var(--slate)]">
            {t("openUntil", { date: fmtDate(session.receivingEnd) })}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
          {t("step")}
        </p>
        <h3 className="mt-2 text-[17px] font-extrabold text-[var(--green-900)]">
          {t("question")}
        </h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--slate)]">
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
                className="flex w-full items-start gap-4 rounded-xl border-2 p-5 text-start transition-all"
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
                  <span className="block text-[14.5px] font-bold text-[var(--green-900)]">
                    {arabic ? (c.labelAr ?? c.labelFr) : c.labelFr}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="outline"
            onClick={() => router.push(routes.candidate.dashboard)}>
            {t("cancel")}
          </Button>
          <Button
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
