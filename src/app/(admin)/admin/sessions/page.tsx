"use client";
// src/app/(admin)/admin/sessions/page.tsx
//
// ───────────────────────────────────────────────────────────────────────
// SESSIONS ARE A SEQUENCE, NOT A COLLECTION.
//
// One runs at a time; the others are the record of cycles already closed.
// The page is built as that sequence — the current cycle in full, the closed
// ones as a chronological register beneath it.
//
// THREE THINGS CHANGED.
//
// 1. THE HEADER WAS A BARE <h2>. Every other admin screen opens with a hero
//    carrying the seal and the count. This one announced itself in 14px grey
//    and then showed a gradient card — the page's own title was quieter than
//    its content.
//
// 2. ⚠️ THE ARCHIVE'S "STATUT" COLUMN ALWAYS SAID "CLÔTURÉE". It could not
//    say anything else: the table is filtered to closed sessions. A column
//    whose value never varies is a column that costs width and returns
//    nothing.
//
// 3. THE ARCHIVE WAS A DATATABLE — with search, sorting and pagination, for
//    a list that will hold two to four rows a year. Machinery without a
//    purpose. It is now a chronological register showing each closed cycle's
//    span, which is what someone consulting it actually wants.
//
// The ACTIVE SESSION CARD is untouched. It works, and it has been tuned.
// ───────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, CalendarClock, CalendarDays, Archive, ChevronRight, BarChart3,
  AlertTriangle, ArrowUpRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SessionPhaseStepper } from "@/components/admin/SessionPhaseStepper";
import { Guilloche, OfficialSeal, MicroprintRule } from "@/components/public/patterns";
import {
  listSessions, advanceSessionPhase, sessionKeys, PHASE_LABELS,
  type SessionResponse,
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
/** The year a cycle belongs to — how a register is grouped. */
function yearOf(iso: string) {
  return new Date(iso + "T00:00:00").getFullYear();
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
    () => (sessions ?? [])
      .filter((s) => s.status === "CLOSED")
      .sort((a, b) => b.startDate.localeCompare(a.startDate)),
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

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-4">

      {/* ══════════════════════════════════════════════════════════
          THE HERO — the page announces itself like the others.
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.13), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-20 -top-24 h-[300px] w-[300px] text-white"
          rings={34}
          opacity={0.16}
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 px-7 pb-7 pt-7">
          <div className="flex min-w-0 flex-1 items-start gap-5">
            <span className="relative mt-1 flex h-[54px] w-[54px] flex-none items-center justify-center">
              <span className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true" />
              <OfficialSeal className="relative h-full w-full"
                color="var(--gold-500)" id="sessions-seal" />
            </span>

            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                Cycles d&apos;accréditation
              </p>
              <h2 className="engraved-dark mt-2 text-[27px] font-extrabold leading-none tracking-tight">
                Sessions de candidature
              </h2>
              <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-white/50">
                Une session à la fois. Elle court sur quatre phases, et toutes
                les cartes qu&apos;elle produit portent la même échéance.
              </p>
            </div>
          </div>

          <div className="flex flex-none items-end gap-3">
            <div className="rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center">
              <p className="font-mono text-[28px] font-extrabold leading-none">
                {isLoading ? "—" : (sessions?.length ?? 0)}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                au total
              </p>
            </div>

            <button
              type="button"
              onClick={() => router.push(routes.admin.newSession)}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)]
                         shadow-[0_8px_24px_-10px_rgba(255,215,0,.7)] transition-all
                         hover:bg-[#ffe14d] hover:shadow-[0_10px_28px_-10px_rgba(255,215,0,.85)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-900)]"
            >
              <Plus className="h-4 w-4" />
              Nouvelle session
            </button>
          </div>
        </div>

        <MicroprintRule
          className="relative z-10 pb-1 text-center text-white opacity-[0.12]"
          repeat={16}
        />
        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE CURRENT CYCLE — card untouched
          ══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <CalendarClock className="h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
            Session en cours
          </h3>
          <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
        </div>

        {isLoading && <Skeleton className="h-56 w-full rounded-2xl" />}

        {!isLoading && active.length === 0 && (
          <div className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
            <Guilloche
              className="pointer-events-none absolute left-1/2 top-1/2 h-[280px] w-[280px] -translate-x-1/2 -translate-y-1/2 text-[var(--green-900)]"
              rings={26}
              opacity={0.06}
            />
            <div className="relative">
              <CalendarDays className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-50" />
              <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
                Aucune session en cours
              </p>
              <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
                Les journalistes ne peuvent déposer de candidature qu&apos;une
                fois une session ouverte.
              </p>
              <Button className="mt-5" onClick={() => router.push(routes.admin.newSession)}>
                <Plus className="h-4 w-4" /> Ouvrir une session
              </Button>
            </div>
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
                  <div className="min-w-0">
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
                    <div className="min-w-[132px] flex-none rounded-xl bg-white/[0.08] px-4 py-3 text-center ring-1 ring-inset ring-white/15">
                      <p className="text-[13px] font-extrabold leading-tight">
                        Non démarrée
                      </p>
                      <p className="mt-1.5 text-[10px] font-bold uppercase tracking-wider text-white/55">
                        début prévu le {fmt(s.startDate)}
                      </p>
                    </div>
                  ) : hasCountdown ? (
                    <div
                      className="min-w-[132px] flex-none rounded-xl px-4 py-3 text-center ring-1"
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
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <p className="min-w-0 max-w-md text-xs leading-relaxed text-white/55">
                    Les phases se clôturent <b className="font-semibold text-white/75">manuellement</b>.
                    Chaque phase conserve sa durée allouée : ouvrir une phase en
                    avance décale le calendrier, sans jamais raccourcir la phase.
                  </p>

                  <div className="flex flex-none flex-wrap items-center gap-2.5">
                    {/* SECONDARY — visible at rest, not only on hover. A ghost
                        button on a dark gradient is a button nobody finds:
                        the ring is what makes it readable as an affordance
                        before the pointer arrives. */}
                    <button
                      type="button"
                      onClick={() => router.push(routes.admin.sessionResults(s.id))}
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-white/[0.07] px-4 text-[13px] font-bold text-white/85
                                 ring-1 ring-inset ring-white/20 transition-all
                                 hover:bg-white/[0.14] hover:text-white hover:ring-white/35
                                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-500)]"
                    >
                      <BarChart3 className="h-4 w-4" />
                      Résultats
                    </button>

                    {/* PRIMARY — gold, because advancing a phase is the one
                        consequential act on this card and it should carry the
                        colour the eye already goes to. White would read as
                        "confirm"; gold reads as "this is the decision". */}
                    {s.nextPhase && (
                      <button
                        type="button"
                        onClick={() => setConfirming(s)}
                        className="group inline-flex h-10 items-center gap-2 rounded-xl bg-[var(--gold-500)] px-4 text-[13px] font-extrabold text-[var(--green-900)]
                                   shadow-[0_6px_20px_-8px_rgba(255,215,0,.6)] transition-all
                                   hover:bg-[#ffe14d] hover:shadow-[0_8px_26px_-8px_rgba(255,215,0,.75)]
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-900)]"
                      >
                        Passer à : {PHASE_LABELS[s.nextPhase as SessionResponse["status"]]}
                        <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE REGISTER OF CLOSED CYCLES

          Was a DataTable with search, sorting and pagination — for a list
          that holds two to four rows a year. And its "Statut" column always
          read "Clôturée", because only closed sessions are here: a column
          whose value cannot vary costs width and returns nothing.

          It is now what someone consulting it wants: each cycle, its span,
          and the way into its results.
          ══════════════════════════════════════════════════════════ */}
      <section className="space-y-4">
        <div className="flex items-center gap-3 px-1">
          <Archive className="h-3.5 w-3.5 flex-none text-[var(--muted-fg)]" />
          <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--slate)]">
            Cycles clôturés
          </h3>
          <span className="foil-rule h-px flex-1 opacity-30" aria-hidden="true" />
          {archived.length > 0 && (
            <span className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
              {archived.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <Skeleton className="h-32 w-full rounded-2xl" />
        ) : archived.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
            <Archive className="mx-auto h-8 w-8 text-[var(--muted-fg)] opacity-45" />
            <p className="mt-3.5 text-[14px] font-extrabold text-[var(--green-900)]">
              Aucun cycle clôturé
            </p>
            <p className="mt-1.5 text-[13px] text-[var(--slate)]">
              Les sessions terminées formeront ici le registre des cycles
              d&apos;accréditation.
            </p>
          </div>
        ) : (
          <ul className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            {archived.map((s, i) => {
              // The year is printed only when it changes — a register groups
              // itself, and repeating "2026" on every line is noise.
              const showYear = i === 0
                || yearOf(s.startDate) !== yearOf(archived[i - 1].startDate);
              return (
                <li key={s.id}>
                  {showYear && (
                    <div className="flex items-center gap-3 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2">
                      <span className="font-mono text-[11px] font-bold tracking-[0.14em] text-[var(--green-700)]">
                        {yearOf(s.startDate)}
                      </span>
                      <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => router.push(routes.admin.sessionResults(s.id))}
                    className="group flex w-full flex-wrap items-center gap-4 border-b border-[var(--line)] px-5 py-4 text-left transition-colors last:border-b-0 hover:bg-[#fbfcfb]"
                  >
                    {/* the span, as a measure — a closed cycle is a period */}
                    <span className="flex-none">
                      <span className="block font-mono text-[11px] text-[var(--muted-fg)]">
                        #{s.id}
                      </span>
                      <span
                        className="mt-1.5 block h-[3px] w-14 rounded-full"
                        style={{ background: "linear-gradient(90deg, var(--green-500), var(--gold-500))" }}
                        aria-hidden="true"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-extrabold text-[var(--green-900)]">
                        Session du {fmtLong(s.startDate)}
                      </span>
                      <span className="mt-0.5 block text-[12.5px] text-[var(--slate)]">
                        close le {fmtLong(s.reclamationEnd)} · {s.totalDays} jours
                        {s.cardExpiryDate && (
                          <> · cartes valables jusqu&apos;au {fmt(s.cardExpiryDate)}</>
                        )}
                      </span>
                    </span>

                    <span className="inline-flex flex-none items-center gap-1.5 text-[12.5px] font-bold text-[var(--green-700)]">
                      Résultats
                      <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* ══ Transition confirmation ══

          A phase advance looks like a calendar action and is not: leaving the
          correction phase REJECTS every dossier still awaiting its candidate's
          answer. That is correct — the window closed, the file is incomplete —
          but it ends accreditations, and it is taken by someone who believes
          they are moving a date forward.

          So the dialog states the count before the question is answered. It
          does not change the outcome; it changes whether the administrator
          chose it. */}
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
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* OUTSIDE the description, deliberately. This is not a description
              of the action — it is a warning about a consequence the action's
              name does not carry, and it belongs in its own block rather than
              nested in a paragraph. It also avoids putting a <div> inside the
              <p> that AlertDialogDescription renders. */}
          {confirming?.status === "CORRECTION" &&
           (confirming.awaitingCorrection ?? 0) > 0 && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[var(--red-500)]/40 bg-[var(--red-tint)] p-3.5">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[var(--red-700)]" />
              <p className="text-[13px] leading-relaxed text-[var(--red-700)]">
                <b>
                  {confirming.awaitingCorrection} dossier
                  {confirming.awaitingCorrection > 1 ? "s" : ""} n&apos;
                  {confirming.awaitingCorrection > 1 ? "ont" : "a"} pas encore
                  reçu les corrections demandées.
                </b>{" "}
                En avançant maintenant,{" "}
                {confirming.awaitingCorrection > 1
                  ? "ils seront rejetés" : "il sera rejeté"}{" "}
                automatiquement, la demande de correction restée sans réponse
                tenant lieu de motif.{" "}
                {confirming.awaitingCorrection > 1
                  ? "Ces candidats pourront" : "Ce candidat pourra"}{" "}
                former une réclamation.
              </p>
            </div>
          )}

          <p className="text-[13px] font-medium text-[var(--red-500)]">
            Cette action est irréversible : une phase clôturée ne peut pas être
            rouverte.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => confirming && advance.mutate(confirming.id)}
              disabled={advance.isPending}
              className={
                confirming?.status === "CORRECTION" &&
                (confirming.awaitingCorrection ?? 0) > 0
                  ? "bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
                  : undefined
              }
            >
              {advance.isPending
                ? "Transition…"
                : confirming?.status === "CORRECTION" &&
                  (confirming.awaitingCorrection ?? 0) > 0
                  ? `Avancer et rejeter ${confirming.awaitingCorrection} dossier${
                      confirming.awaitingCorrection > 1 ? "s" : ""}`
                  : "Confirmer la transition"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
