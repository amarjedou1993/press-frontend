"use client";
// src/app/(admin)/admin/page.tsx — admin home with live counts.

import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Users, IdCard, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { listSessions, sessionKeys, PHASE_LABELS } from "@/lib/api/sessions";
import { listReviewers, reviewerKeys } from "@/lib/api/admin";
import { routes } from "@/lib/routes";

export default function AdminHomePage() {
  const router = useRouter();
  const sessions = useQuery({ queryKey: sessionKeys.all, queryFn: listSessions });
  const reviewers = useQuery({ queryKey: reviewerKeys.all, queryFn: listReviewers });

  const activeSession = sessions.data?.find((s) => s.status !== "CLOSED" && s.status !== "PLANNED");
  const activeReviewers = reviewers.data?.filter((r) => r.enabled).length ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Hero */}
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

      {/* Tiles */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="group cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => router.push(routes.admin.sessions)}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">Sessions</CardTitle>
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
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">Réviseurs</CardTitle>
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
            <span className="mt-3 inline-flex items-center gap-1 text-xs font-bold text-[var(--green-700)]">
              Gérer <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </span>
          </CardContent>
        </Card>

        <Card className="opacity-70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">Cartes</CardTitle>
            <IdCard className="h-4 w-4 text-[var(--muted-fg)]" />
          </CardHeader>
          <CardContent>
            <Badge variant="secondary">Semaine 6</Badge>
            <p className="mt-2 text-xs text-[var(--slate)]">
              Génération des cartes et export de la liste.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
