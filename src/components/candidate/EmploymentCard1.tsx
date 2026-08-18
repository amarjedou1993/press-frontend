"use client";

import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Briefcase, Check, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { apiFetch, ApiError } from "@/lib/api/client";
import { applicationKeys } from "@/lib/api/applications";

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
  const qc = useQueryClient();

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
      toast.success("Informations enregistrées", {
        description: "Elles figureront sur votre carte de presse.",
      });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  function submit() {
    setError(undefined);
    if (!specialisationId) { setError("Sélectionnez votre spécialité."); return; }
    if (!institution.trim()) {
      setError("Indiquez l'organe de presse pour lequel vous exercez.");
      return;
    }
    save.mutate();
  }

  const chosen = specialisations.data?.find((s) => s.id === specialisationId);
  const complete = !!specialisationId && !!institution.trim();

  if (specialisations.isLoading) {
    return <Skeleton className="h-56 w-full rounded-2xl" />;
  }

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <Briefcase className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            Votre exercice professionnel
          </p>
          <p className="text-[12px] text-[var(--slate)]">
            Ces informations figureront sur votre carte
          </p>
        </div>
        {complete && (
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green-700)]">
            <Check className="h-3 w-3" /> Complet
          </span>
        )}
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <Field data-invalid={!!error && !specialisationId}>
          <FieldLabel htmlFor="specialisation">Spécialité</FieldLabel>
          <select
            id="specialisation"
            value={specialisationId ?? ""}
            disabled={!editable}
            onChange={(e) => {
              setSpecialisationId(e.target.value ? Number(e.target.value) : null);
              setError(undefined);
            }}
            className="h-9 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 disabled:opacity-60"
          >
            <option value="">Sélectionnez…</option>
            {specialisations.data?.map((s) => (
              <option key={s.id} value={s.id}>
                {s.labelFr} — {s.labelAr}
              </option>
            ))}
          </select>
          <FieldDescription>
            Imprimée sur la carte sous « التخصص ».
          </FieldDescription>
        </Field>

        <Field data-invalid={!!error && !institution.trim()}>
          <FieldLabel htmlFor="institution">Organe de presse</FieldLabel>
          <Input
            id="institution"
            value={institution}
            disabled={!editable}
            onChange={(e) => { setInstitution(e.target.value); setError(undefined); }}
            placeholder="Mauri News, Agence Mauritanienne d'Information…"
            maxLength={200}
          />
          <FieldDescription>
            Imprimé sur la carte sous « المؤسسة ».
          </FieldDescription>
        </Field>
      </div>

      {/* ── what will actually be printed ── */}
      {complete && (
        <div className="mt-4 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4">
          <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            <IdCard className="h-3 w-3" /> Tel qu&apos;imprimé sur la carte
          </p>
          <dl className="mt-2.5 space-y-1.5">
            <div className="flex items-baseline justify-between gap-4">
              <dt dir="rtl" className="text-[12.5px] font-semibold text-[var(--slate)]">
                : التخصص
              </dt>
              <dd dir="rtl" className="flex-1 text-right text-[13.5px] font-bold text-[var(--ink)]">
                {chosen?.labelAr}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-4">
              <dt dir="rtl" className="text-[12.5px] font-semibold text-[var(--slate)]">
                : المؤسسة
              </dt>
              <dd dir="rtl" className="flex-1 truncate text-right text-[13.5px] font-bold text-[var(--ink)]">
                {institution.trim()}
              </dd>
            </div>
          </dl>
        </div>
      )}

      {error && (
        <p className="mt-3 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium text-[var(--red-700)]">
          {error}
        </p>
      )}

      {editable && (
        <div className="mt-5 flex justify-end border-t border-[var(--line)] pt-4">
          <Button onClick={submit} disabled={save.isPending}>
            {save.isPending ? "Enregistrement…" : "Enregistrer"}
          </Button>
        </div>
      )}
    </div>
  );
}
