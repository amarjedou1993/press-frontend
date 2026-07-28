"use client";
// src/app/(candidate)/application/new/page.tsx
// Step one of the wizard: pick a category. That choice determines which
// pieces are required, so it comes first and creates the DRAFT — from then
// on everything is saved as it happens, and a dropped connection costs
// nothing. (Draft creation is idempotent server-side: returning here resumes
// rather than erroring.)

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { listOpenSessions, listCategories, catalogKeys } from "@/lib/api/sessions-public";
import { startApplication, applicationKeys } from "@/lib/api/applications";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function NewApplicationPage() {
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
      toast.error("Impossible de commencer", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      }),
  });

  if (sessions.isLoading || categories.isLoading) {
    return <Skeleton className="mx-auto h-96 max-w-3xl rounded-2xl" />;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
          <CalendarClock className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucune session ouverte
          </p>
          <p className="mt-2 text-[13.5px] text-[var(--slate)]">
            Vous ne pouvez pas déposer de demande pour le moment.
          </p>
          <Button className="mt-5" variant="outline"
            onClick={() => router.push(routes.candidate.dashboard)}>
            Retour au tableau de bord
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <VerificationBanner />

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" aria-label="Retour"
          onClick={() => router.push(routes.candidate.dashboard)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--green-900)]">
            Nouvelle demande de carte de presse
          </h2>
          <p className="text-[13.5px] text-[var(--slate)]">
            Dépôt ouvert jusqu&apos;au {fmtLong(session.receivingEnd)}
          </p>
        </div>
      </div>

      <div className="rounded-2xl border border-[var(--line)] bg-white p-7">
        <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
          Étape 1 sur 2 — votre catégorie
        </p>
        <h3 className="mt-2 text-[17px] font-extrabold text-[var(--green-900)]">
          À quel titre exercez-vous&nbsp;?
        </h3>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--slate)]">
          Votre catégorie détermine les pièces justificatives qui vous seront
          demandées. Vous pourrez la modifier tant que votre dossier n&apos;est
          pas soumis.
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
                className="flex w-full items-start gap-4 rounded-xl border-2 p-5 text-left transition-all"
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
                <span className="min-w-0">
                  <span className="block text-[14.5px] font-bold text-[var(--green-900)]">
                    {c.labelFr}
                  </span>
                  <span dir="rtl" className="mt-0.5 block text-[13px] text-[var(--slate)]">
                    {c.labelAr}
                  </span>
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <Button variant="outline"
            onClick={() => router.push(routes.candidate.dashboard)}>
            Annuler
          </Button>
          <Button
            disabled={!categoryId || start.isPending}
            onClick={() => start.mutate()}
          >
            {start.isPending ? "Création…" : "Continuer"}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
