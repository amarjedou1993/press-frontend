"use client";
// src/app/(admin)/admin/sessions/page.tsx
// Two zones, by design:
//   · ACTIVE sessions (anything not CLOSED) → prominent cards at the top,
//     each with the phase stepper and its transition control.
//   · CLOSED sessions → the archive DataTable below (search + sort + pages).
// An admin's attention belongs on what's live; history is lookup material.

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import {
  Plus, ChevronRight, CalendarDays, CheckCircle2, Archive, CalendarClock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionPhaseStepper } from "@/components/admin/SessionPhaseStepper";
import {
  listSessions, advanceSessionPhase, sessionKeys,
  PHASE_LABELS, type SessionResponse,
} from "@/lib/api/sessions";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

function fmt(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
  });
}
function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}
export default function SessionsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const [confirming, setConfirming] = useState<SessionResponse | null>(null);

  const { data: sessions, isLoading } = useQuery({
    queryKey: sessionKeys.all,
    queryFn: listSessions,
  });

  const active = useMemo(
    () => (sessions ?? []).filter((s) => s.status !== "CLOSED"),
    [sessions]
  );
  const archived = useMemo(
    () => (sessions ?? []).filter((s) => s.status === "CLOSED"),
    [sessions]
  );

  const advance = useMutation({
    mutationFn: (id: number) => advanceSessionPhase(id),
    onSuccess: (updated) => {
      qc.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success("Phase avancée", {
        description: `La session #${updated.id} est maintenant en phase « ${PHASE_LABELS[updated.status]} ».`,
      });
    },
    onError: (e) =>
      toast.error("Transition impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      }),
    onSettled: () => setConfirming(null),
  });

  /* ── Archive table columns ── */
  const columns: ColumnDef<SessionResponse>[] = [
    {
      accessorKey: "id",
      header: "N°",
      size: 80,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[var(--muted-fg)]">#{row.original.id}</span>
      ),
    },
    {
      accessorKey: "startDate",
      header: "Début",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{fmt(row.original.startDate)}</span>
      ),
    },
    {
      accessorKey: "reclamationEnd",
      header: "Fin",
      cell: ({ row }) => (
        <span className="text-sm font-medium">{fmt(row.original.reclamationEnd)}</span>
      ),
    },
    {
      accessorKey: "totalDays",
      header: "Durée",
      size: 110,
      cell: ({ row }) => <Badge variant="secondary">{row.original.totalDays} jours</Badge>,
    },
    {
      id: "status",
      header: "Statut",
      size: 140,
      enableSorting: false,
      cell: () => (
        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--st-accepted-bg)] px-2.5 py-1 text-[11px] font-bold text-[var(--st-accepted-fg)]">
          <CheckCircle2 className="h-3 w-3" /> Clôturée
        </span>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--green-900)]">Sessions</h2>
          <p className="mt-1 text-sm text-[var(--slate)]">
            Pilotez les sessions de candidature et leurs phases.
          </p>
        </div>
        <Button onClick={() => router.push(routes.admin.newSession)}>
          <Plus className="h-4 w-4" /> Nouvelle session
        </Button>
      </div>

      {/* ── ACTIVE ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-4 w-4 text-[var(--green-600)]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            Session en cours
          </h3>
        </div>

        {isLoading && <Skeleton className="h-56 w-full rounded-2xl" />}

        {!isLoading && active.length === 0 && (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
            <CalendarDays className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--ink)]">
              Aucune session active
            </p>
            <p className="mt-1 text-xs text-[var(--slate)]">
              Créez une session pour ouvrir les candidatures.
            </p>
            <Button className="mt-5" onClick={() => router.push(routes.admin.newSession)}>
              <Plus className="h-4 w-4" /> Nouvelle session
            </Button>
          </div>
        )}

        {active.map((s) => {
          // All computed server-side: the client never re-derives dates.
          //
          // NOTE the LOOSE null checks (!= null, not !== null). The backend
          // runs jackson.default-property-inclusion=non_null, so a null field
          // is OMITTED from the JSON entirely — it arrives as `undefined`,
          // which a strict !== null check lets through. That produced
          // "NaN jour restant" on a freshly created (PLANNED) session.
          const remaining = s.daysRemainingInPhase;
          const allotted = s.allottedDaysInPhase;
          const hasCountdown = typeof remaining === "number";
          const overdue = hasCountdown && remaining < 0;
          const dueToday = remaining === 0;
          const notStarted = s.status === "PLANNED";
          return (
            <div
              key={s.id}
              className="fade-up relative overflow-hidden rounded-2xl p-7 text-white shadow-lg"
              style={{
                background:
                  "radial-gradient(700px 340px at 92% -25%, rgba(255,215,0,.16), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
              }}
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.05]"
                style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
                aria-hidden="true"
              />
              <div className="relative z-10 space-y-6">
                {/* Head row */}
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono text-xs text-white/50">#{s.id}</span>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-500)] px-3 py-1 text-[11px] font-extrabold text-[var(--green-900)]">
                        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--green-900)]" />
                        {PHASE_LABELS[s.status]}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-2xl font-extrabold">
                      Session du {fmtLong(s.startDate)}
                    </h3>
                    <p className="mt-1 text-sm text-white/65">
                      {s.totalDays} jours · se termine le {fmtLong(s.reclamationEnd)}
                    </p>
                  </div>
                  {notStarted ? (
                    <div className="min-w-[132px] rounded-xl bg-white/[0.08] px-4 py-3 text-center ring-1 ring-inset ring-white/15">
                      <p className="text-[13px] font-extrabold leading-tight">
                        Non démarrée
                      </p>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
                        début prévu le {fmt(s.startDate)}
                      </p>
                    </div>
                  ) : hasCountdown ? (
                    <div
                      className="min-w-[132px] rounded-xl px-4 py-3 text-center ring-1"
                      style={{
                        background: overdue ? "rgba(208,28,31,.18)" : "rgba(255,255,255,.10)",
                        boxShadow: `inset 0 0 0 1px ${overdue ? "rgba(208,28,31,.45)" : "rgba(255,255,255,.15)"}`,
                      }}
                      title={`Phase « ${PHASE_LABELS[s.status]} » : ${allotted} jours alloués, ouverte le ${fmtLong(s.phaseStartedAt)}, fin prévue le ${s.currentPhaseEnd ? fmtLong(s.currentPhaseEnd) : "—"}`}
                    >
                      <p className="text-2xl font-extrabold leading-none">
                        {dueToday ? "Aujourd'hui" : Math.abs(remaining ?? 0)}
                      </p>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-white/70">
                        {dueToday
                          ? "dernier jour de la phase"
                          : overdue
                            ? `jour${Math.abs(remaining) > 1 ? "s" : ""} de retard`
                            : `jour${remaining > 1 ? "s" : ""} restant${remaining > 1 ? "s" : ""}`}
                      </p>
                      {allotted != null && !dueToday && (
                        <p className="mt-1.5 border-t border-white/15 pt-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-white/45">
                          sur {allotted} jours alloués
                        </p>
                      )}
                    </div>
                  ) : null}
                </div>

                {/* Phase stepper */}
                <div className="rounded-xl bg-black/15 px-5 py-5">
                  <SessionPhaseStepper session={s} />
                </div>

                {/* Action */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="max-w-md text-xs text-white/55">
                    Les phases se clôturent <b className="font-semibold text-white/75">manuellement</b>.
                    Chaque phase conserve sa durée allouée : ouvrir une phase en
                    avance décale le calendrier, sans jamais raccourcir la phase.
                  </p>
                  {s.nextPhase && (
                    <Button
                      onClick={() => setConfirming(s)}
                      className="bg-white text-[var(--green-900)] hover:bg-white/90"
                    >
                      Passer à : {PHASE_LABELS[s.nextPhase as SessionResponse["status"]]}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ── ARCHIVE ── */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Archive className="h-4 w-4 text-[var(--muted-fg)]" />
          <h3 className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--slate)]">
            Sessions clôturées
          </h3>
        </div>
        <DataTable
          columns={columns}
          data={archived}
          isLoading={isLoading}
          searchPlaceholder="Rechercher une session…"
          emptyState={
            <div>
              <Archive className="mx-auto h-8 w-8 text-[var(--muted-fg)]" />
              <p className="mt-3 text-sm font-semibold text-[var(--ink)]">
                Aucune session clôturée
              </p>
              <p className="mt-1 text-xs text-[var(--slate)]">
                Les sessions terminées apparaîtront ici.
              </p>
            </div>
          }
        />
      </section>

      {/* Transition confirmation */}
      <AlertDialog open={!!confirming} onOpenChange={(o) => !o && setConfirming(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Avancer la phase de la session ?</AlertDialogTitle>
            <AlertDialogDescription>
              La session <b>#{confirming?.id}</b> passera de la phase{" "}
              <b>« {confirming && PHASE_LABELS[confirming.status]} »</b> à{" "}
              <b>
                « {confirming?.nextPhase &&
                    PHASE_LABELS[confirming.nextPhase as SessionResponse["status"]]} »
              </b>.
              <br />
              <span className="mt-2 block font-medium text-[var(--red-500)]">
                Cette action est irréversible : une phase clôturée ne peut pas être rouverte.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirming && advance.mutate(confirming.id)}
              disabled={advance.isPending}
            >
              {advance.isPending ? "Transition…" : "Confirmer la transition"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
