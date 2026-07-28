"use client";
// src/app/(candidate)/dashboard/page.tsx
// Answers one question above all: what should I do now?
//
// So the hero is state-dependent, carries the institutional identity, and
// shows the dossier's stage as a stepper. The press card appears as the
// thing being worked towards — motivation, not decoration.

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, CalendarClock, FileText, User, AlertCircle, Clock, Check,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { DossierProgress } from "@/components/candidate/DossierProgress";
import { listMyApplications, applicationKeys, STATUS_KIND } from "@/lib/api/applications";
import { listOpenSessions, catalogKeys } from "@/lib/api/sessions-public";
import { getMe, accountKeys } from "@/lib/api/account";
import { routes } from "@/lib/routes";

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function daysUntil(iso: string) {
  const end = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86_400_000);
}

export default function DashboardPage() {
  const me = useQuery({ queryKey: accountKeys.me, queryFn: getMe });
  const applications = useQuery({ queryKey: applicationKeys.all, queryFn: listMyApplications });
  const sessions = useQuery({ queryKey: catalogKeys.openSessions, queryFn: listOpenSessions });

  const loading = me.isLoading || applications.isLoading || sessions.isLoading;
  const current = applications.data?.[0];
  const openSession = sessions.data?.[0];
  const left = openSession ? daysUntil(openSession.receivingEnd) : null;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {loading ? (
        <Skeleton className="h-64 w-full rounded-2xl" />
      ) : (
        <section
          className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
          style={{
            background:
              "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
          }}
        >
          {/* security print */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
            aria-hidden="true"
          />
          {/* engraved rosette */}
          <svg className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 opacity-[0.06]"
            viewBox="0 0 400 400" fill="none" aria-hidden="true">
            <g stroke="#fff" strokeWidth="0.6">
              {Array.from({ length: 30 }).map((_, i) => (
                <ellipse key={i} cx="200" cy="200" rx="180" ry="62"
                  transform={`rotate(${(i * 180) / 30} 200 200)`} />
              ))}
            </g>
          </svg>

          <div className="relative z-10 p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0">
                <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
                  Ma demande de carte de presse
                </p>

                {current ? (
                  <>
                    <div className="mt-2.5 flex flex-wrap items-center gap-3">
                      <h2 className="text-[26px] font-extrabold leading-tight">
                        {current.statusLabelFr}
                      </h2>
                      <span className="font-mono text-[11.5px] text-white/40">
                        n° {current.id}
                      </span>
                    </div>
                    <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
                      {current.status === "DRAFT"
                        ? "Votre dossier est en préparation. Complétez les pièces demandées puis soumettez-le à la commission."
                        : current.status === "CORRECTION_REQUESTED"
                          ? "La commission demande des corrections. Consultez les observations et remplacez les pièces signalées."
                          : "Votre dossier suit son instruction. Vous serez informé par e-mail à chaque étape."}
                    </p>
                  </>
                ) : openSession ? (
                  <>
                    <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
                      Une session est ouverte
                    </h2>
                    <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
                      Vous pouvez déposer votre demande jusqu&apos;au{" "}
                      <b className="font-semibold text-white">
                        {fmtLong(openSession.receivingEnd)}
                      </b>.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
                      Aucune session ouverte
                    </h2>
                    <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
                      Vous serez informé par e-mail dès l&apos;ouverture de la
                      prochaine session de candidature.
                    </p>
                  </>
                )}
              </div>

              {/* countdown, only while it matters */}
              {!current && openSession && left !== null && (
                <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-4 text-center">
                  <p className="text-[30px] font-extrabold leading-none">
                    {left > 0 ? left : 0}
                  </p>
                  <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                    jour{left > 1 ? "s" : ""} restant{left > 1 ? "s" : ""}
                  </p>
                </div>
              )}
            </div>

            {/* stage stepper */}
            {current && (
              <div className="mt-7 rounded-xl bg-black/20 px-5 py-5">
                <DossierProgress status={current.status} />
              </div>
            )}

            {/* action */}
            <div className="mt-7">
              {current ? (
                <Link
                  href={routes.candidate.application}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-bold text-[var(--green-900)] transition-transform hover:-translate-y-0.5"
                >
                  {current.status === "DRAFT"
                    ? "Compléter mon dossier"
                    : current.status === "CORRECTION_REQUESTED"
                      ? "Corriger mon dossier"
                      : "Suivre mon dossier"}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : openSession ? (
                <Link
                  href={routes.candidate.newApplication}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 text-[14px] font-bold text-[var(--green-900)] transition-transform hover:-translate-y-0.5"
                >
                  Déposer ma demande
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : null}
            </div>
          </div>

          {/* national baseline */}
          <div className="flex h-1.5" aria-hidden="true">
            <i className="flex-1 bg-[var(--green-500)]" />
            <i className="flex-1 bg-[var(--gold-500)]" />
            <i className="flex-1 bg-[var(--red-500)]" />
          </div>
        </section>
      )}

      {/* ── preparation cards ── */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={routes.candidate.profile}
          className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_36px_-24px_rgba(11,46,31,.4)]"
        >
          <div className="flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-tint)]">
              <User className="h-[18px] w-[18px] text-[var(--green-700)]" />
            </span>
            {me.data && (
              me.data.profileComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green-700)]">
                  <Check className="h-3 w-3" /> Complet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
                  <AlertCircle className="h-3 w-3" /> À compléter
                </span>
              )
            )}
          </div>
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Mon profil
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
            Identité (NNI ou passeport), date et lieu de naissance — requis
            avant toute soumission.
          </p>
          <span className="mt-4 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--green-700)]">
            Compléter
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-tint)]">
            <FileText className="h-[18px] w-[18px] text-[var(--green-700)]" />
          </span>
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Pièces à préparer
          </p>
          <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
            Les pièces requises dépendent de votre catégorie. Elles vous seront
            indiquées lors du dépôt — vous pourrez les ajouter une par une.
          </p>
          <p className="mt-4 font-mono text-[11.5px] text-[var(--muted-fg)]">
            PDF · JPEG · PNG — 10 Mo max
          </p>
        </div>
      </div>

      {/* ── history ── */}
      {applications.data && applications.data.length > 1 && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              Mes demandes précédentes
            </p>
            <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
          </div>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {applications.data.slice(1).map((a) => (
              <li key={a.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                    Dossier n° {a.id}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted-fg)]">
                    <Clock className="h-3 w-3" />
                    {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className="rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{
                    background: `var(--st-${STATUS_KIND[a.status]}-bg)`,
                    color: `var(--st-${STATUS_KIND[a.status]}-fg)`,
                  }}
                >
                  {a.statusLabelFr}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
