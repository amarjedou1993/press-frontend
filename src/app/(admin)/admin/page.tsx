"use client";
// src/app/(admin)/admin/page.tsx — admin home with live counts.
//
// A dashboard's job is to answer "is there anything I need to do?" before the
// administrator has clicked anything. So the tiles carry numbers, and anything
// actually WAITING gets its own line above them — a count buried in a tile is
// a count nobody acts on.

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarDays, Users, IdCard, ArrowRight, AlertTriangle, Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listSessions, sessionKeys, PHASE_LABELS } from "@/lib/api/sessions";
import { listReviewers, reviewerKeys } from "@/lib/api/admin";
import { getIssuable, getRegistry, cardKeys } from "@/lib/api/cards";
import { routes } from "@/lib/routes";

export default function AdminHomePage() {
  const router = useRouter();

  const sessions = useQuery({ queryKey: sessionKeys.all, queryFn: listSessions });
  const reviewers = useQuery({ queryKey: reviewerKeys.all, queryFn: listReviewers });
  const issuable = useQuery({ queryKey: cardKeys.issuable, queryFn: getIssuable });
  const registry = useQuery({ queryKey: cardKeys.registry, queryFn: getRegistry });

  const activeSession = sessions.data?.find(
    (s) => s.status !== "CLOSED" && s.status !== "PLANNED");
  const activeReviewers = reviewers.data?.filter((r) => r.enabled).length ?? 0;

  // A dossier with a blocker cannot be issued today, so it is not "waiting" in
  // the sense that matters — but it does need attention, separately.
  const ready = issuable.data?.filter((i) => !i.blockerFr) ?? [];
  const blocked = issuable.data?.filter((i) => i.blockerFr) ?? [];
  const issued = registry.data?.length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ══ hero ══ */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 text-white"
        style={{
          background:
            "radial-gradient(600px 300px at 92% -25%, rgba(255,215,0,.16), transparent 60%), linear-gradient(160deg, var(--green-900), #0e3d29)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
          aria-hidden="true"
        />
        <div className="relative z-10">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold-500)]">
            Administration HAPA
          </p>
          <h2 className="mt-2 text-2xl font-extrabold">Tableau de bord</h2>
          <p className="mt-2 max-w-xl text-sm text-white/70">
            Gérez les sessions de candidature, la commission d&apos;examen et
            l&apos;édition des cartes de presse.
          </p>
          {activeSession && (
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1.5 text-xs font-semibold ring-1 ring-white/20">
              <span className="h-2 w-2 rounded-full bg-[var(--gold-500)]" />
              Session #{activeSession.id} — {PHASE_LABELS[activeSession.status]}
            </div>
          )}
        </div>
      </div>

      {/* ══ what needs doing ══
          Above the tiles, because a number inside a card is something you
          notice; a line across the page is something you act on. */}
      {ready.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border-2 border-[var(--green-500)] bg-[var(--green-tint)] px-5 py-4">
          <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--green-600)]">
            <IdCard className="h-5 w-5 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold text-[var(--green-700)]">
              {ready.length} carte{ready.length > 1 ? "s" : ""} à éditer
            </p>
            <p className="text-[12.5px] text-[var(--green-700)]">
              Candidature{ready.length > 1 ? "s" : ""} acceptée
              {ready.length > 1 ? "s" : ""} par la commission, en attente
              d&apos;édition.
            </p>
          </div>
          <Button size="sm" onClick={() => router.push(routes.admin.cards)}>
            Éditer <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {blocked.length > 0 && (
        <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-[var(--gold-500)]/50 bg-[var(--gold-tint)] px-5 py-4">
          <AlertTriangle className="h-5 w-5 flex-none text-[var(--gold-700)]" />
          <div className="min-w-0 flex-1">
            <p className="text-[13.5px] font-extrabold text-[var(--gold-700)]">
              {blocked.length} candidature{blocked.length > 1 ? "s" : ""} acceptée
              {blocked.length > 1 ? "s" : ""} ne peut{blocked.length > 1 ? "vent" : ""} pas
              donner lieu à une carte
            </p>
            <p className="text-[12.5px] text-[var(--gold-700)]">
              Photographie, spécialité ou organe de presse manquant. Le détail
              figure sur la page des cartes.
            </p>
          </div>
          <Button size="sm" variant="outline"
            className="border-[var(--gold-700)]/30 text-[var(--gold-700)]"
            onClick={() => router.push(routes.admin.cards)}>
            Voir <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      )}

      {/* ══ tiles ══ */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="group cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => router.push(routes.admin.sessions)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">
              Sessions
            </CardTitle>
            <CalendarDays className="h-4 w-4 text-[var(--green-600)]" />
          </CardHeader>
          <CardContent>
            {sessions.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-extrabold text-[var(--green-900)]">
                {sessions.data?.length ?? 0}
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--slate)]">
              Ouvrir et piloter les sessions de candidature.
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--green-700)]">
              Gérer <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardContent>
        </Card>

        <Card className="group cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => router.push(routes.admin.reviewers)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">
              Réviseurs
            </CardTitle>
            <Users className="h-4 w-4 text-[var(--green-600)]" />
          </CardHeader>
          <CardContent>
            {reviewers.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-extrabold text-[var(--green-900)]">
                {activeReviewers}
                <span className="ml-1 text-sm font-semibold text-[var(--slate)]">
                  / {reviewers.data?.length ?? 0}
                </span>
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--slate)]">
              Membres actifs de la commission d&apos;examen.
            </p>

            {/* Worth surfacing here rather than discovering it in week 5: a
                reclamation must be examined by someone OTHER than its
                rejecter, so a single-member commission cannot honour the
                objection right at all. */}
            {!reviewers.isLoading && activeReviewers < 2 && (
              <p className="mt-2 rounded-lg bg-[var(--gold-tint)] px-2.5 py-1.5 text-[11.5px] leading-snug text-[var(--gold-700)]">
                Au moins deux membres sont nécessaires : une réclamation doit
                être examinée par un autre membre que l&apos;auteur de la
                décision contestée.
              </p>
            )}

            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--green-700)]">
              Gérer <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardContent>
        </Card>

        {/* ── live since week 6 ── */}
        <Card className="group cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => router.push(routes.admin.cards)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">
              Cartes de presse
            </CardTitle>
            <IdCard className="h-4 w-4 text-[var(--green-600)]" />
          </CardHeader>
          <CardContent>
            {registry.isLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <p className="text-3xl font-extrabold text-[var(--green-900)]">
                {issued}
                {ready.length > 0 && (
                  <span className="ml-1 text-sm font-semibold text-[var(--green-700)]">
                    +{ready.length}
                  </span>
                )}
              </p>
            )}
            <p className="mt-1 text-xs text-[var(--slate)]">
              {ready.length > 0
                ? `${issued} éditée${issued > 1 ? "s" : ""}, ${ready.length} en attente.`
                : `Éditées et enregistrées au registre.`}
            </p>

            {!registry.isLoading && ready.length === 0 && blocked.length === 0 && issued > 0 && (
              <p className="mt-2 inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--green-700)]">
                <Check className="h-3 w-3" /> Aucune carte en attente
              </p>
            )}

            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--green-700)]">
              Gérer <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
