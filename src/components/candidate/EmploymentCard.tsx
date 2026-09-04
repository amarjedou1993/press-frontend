"use client";

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Check, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { apiFetch, ApiError } from "@/lib/api/client";
import { applicationKeys } from "@/lib/api/applications";
import { useFieldError } from "@/lib/useFieldError";

interface Specialisation {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
}

const specialisationKeys = { all: ["public", "specialisations"] as const };

function listSpecialisations() {
  return apiFetch<Specialisation[]>("/api/public/specialisations");
}

function saveEmployment(
  applicationId: number,
  body: { specialisationId: number; institution: string }
) {
  return apiFetch<unknown>(`/api/applications/${applicationId}/employment`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function EmploymentCard({
  applicationId,
  editable,
  currentSpecialisationId,
  currentInstitution,
}: {
  applicationId: number;
  editable: boolean;
  currentSpecialisationId?: number | null;
  currentInstitution?: string | null;
}) {
  const t = useTranslations("employment");
  const locale = useLocale();
  const resolve = useFieldError();
  const qc = useQueryClient();
  const arabic = locale === "ar";

  const [specialisationId, setSpecialisationId] = useState<number | null>(
    currentSpecialisationId ?? null
  );
  const [institution, setInstitution] = useState(currentInstitution ?? "");
  const [error, setError] = useState<string>();

  useEffect(() => {
    setSpecialisationId(currentSpecialisationId ?? null);
    setInstitution(currentInstitution ?? "");
  }, [currentSpecialisationId, currentInstitution]);

  const specialisations = useQuery({
    queryKey: specialisationKeys.all,
    queryFn: listSpecialisations,
  });

  const save = useMutation({
    mutationFn: () => saveEmployment(applicationId, {
      specialisationId: specialisationId!,
      institution: institution.trim(),
    }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
      qc.invalidateQueries({ queryKey: applicationKeys.readiness(applicationId) });
      toast.success(t("savedTitle"), { description: t("savedBody") });
    },
    // onError: (e) =>
    //   setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : t("tryAgain")),
        onError: (e) =>
      // ⚠️ resolve(): the backend now sends KEYS
      // ("blockers.INSTITUTION_MISSING"), not sentences. Without this a
      // candidate would read the key itself on screen.
      setError(resolve(
        e instanceof ApiError ? (e.problem.detail ?? e.message) : t("tryAgain"))),
  });

  function submit() {
    setError(undefined);
    if (!specialisationId) { setError(t("selectSpecialisation")); return; }
    if (!institution.trim()) { setError(t("enterInstitution")); return; }
    save.mutate();
  }

  const chosen = specialisations.data?.find((s) => s.id === specialisationId);
  const complete = !!specialisationId && !!institution.trim();

  if (specialisations.isLoading) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      {/* ⚠️ flex-wrap: the "complet" badge and the heading competed for a
          303px row at 375px, and the heading lost. Allowed to wrap, the badge
          drops below rather than squeezing the title into three words a
          line. */}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <Briefcase className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[14px]">
            {t("title")}
          </p>
          <p className="text-[12px] leading-snug text-[var(--slate)]">{t("subtitle")}</p>
        </div>

        {complete && (
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green-700)]">
            <Check className="h-3 w-3" /> {t("complete")}
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!error && !specialisationId}>
          <FieldLabel htmlFor="specialisation">{t("specialisation")}</FieldLabel>
          <select
            id="specialisation"
            value={specialisationId ?? ""}
            disabled={!editable}
            onChange={(e) => {
              setSpecialisationId(e.target.value ? Number(e.target.value) : null);
              setError(undefined);
            }}
            /* ⚠️ h-10 below sm. A native select is the one control a phone
               renders itself — the height here is only the tap target, and
               36px is under the 44 a thumb needs. It costs nothing on a
               desktop to make it 40. */
            className="h-10 w-full rounded-lg border border-[var(--line)] bg-white px-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 disabled:opacity-60 sm:h-9 sm:text-[13px]"
          >
            <option value="">{t("choose")}</option>
            {/* ONE language in the list. The pairing belonged in the preview
                below, which shows the card; a dropdown is a control. */}
            {specialisations.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {arabic ? s.labelAr : s.labelFr}
              </option>
            ))}
          </select>
          <FieldDescription>{t("specialisationHint")}</FieldDescription>
        </Field>

        <Field data-invalid={!!error && !institution.trim()}>
          <FieldLabel htmlFor="institution">{t("institution")}</FieldLabel>
          {/* ⚠️ dir="auto": an outlet writes its own name in its own script.
              «Al Akhbar» and «الأخبار» are both correct, and the field must
              follow what is typed rather than the page. */}
          <Input
            id="institution"
            dir="auto"
            value={institution}
            disabled={!editable}
            onChange={(e) => { setInstitution(e.target.value); setError(undefined); }}
            placeholder={t("institutionPlaceholder")}
            maxLength={200}
          />
          <FieldDescription>{t("institutionHint")}</FieldDescription>
        </Field>
      </div>

      {/* ══ what will actually be printed ══
          ARABIC IN BOTH LANGUAGES — see the note at the top of the file. */}
      {complete && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-3.5 sm:p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            <IdCard className="h-3 w-3 flex-none" /> {t("asPrinted")}
          </p>

          {/* One dir on the container rather than on every cell: this block
              is a fragment of the card, and the card is an RTL document. */}
          <dl dir="rtl" lang="ar" className="mt-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between gap-3 sm:gap-4">
              <dt className="flex-none text-[12.5px] font-semibold text-[var(--slate)]">
                التخصص :
              </dt>
              <dd className="min-w-0 flex-1 truncate text-start text-[13.5px] font-bold text-[var(--ink)]">
                {chosen?.labelAr}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3 sm:gap-4">
              <dt className="flex-none text-[12.5px] font-semibold text-[var(--slate)]">
                المؤسسة :
              </dt>
              {/* The outlet name as typed — it may be Latin even here, and
                  the card prints it as given. */}
              <dd dir="auto" className="min-w-0 flex-1 truncate text-start text-[13.5px] font-bold text-[var(--ink)]">
                {institution.trim()}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {error && (
        /* dir="auto" and break-words: this may be a server sentence in either
           language, and it must wrap rather than run past the panel. */
        <p dir="auto" className="mt-3 break-words rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium leading-relaxed text-[var(--red-700)]">
          {error}
        </p>
      )}

      {editable && (
        /* ⚠️ Full width below sm. A lone button at the far corner is the
           hardest place on a phone to reach, and this is the action that
           records where someone works. */
        <div className="mt-5 flex border-t border-[var(--line)] pt-4 sm:justify-end">
          <Button className="w-full sm:w-auto" onClick={submit} disabled={save.isPending}>
            {save.isPending ? t("saving") : t("save")}
          </Button>
        </div>
      )}
    </div>
  );
}
