// src/app/(public)/page.tsx  →  /
// The real landing page, replacing the redirect-to-login. Server component +
// ISR: it shows live session status pulled from the API, but costs the
// backend one request per minute no matter the traffic.

import Link from "next/link";
import {
  ArrowRight, ShieldCheck, Languages, FileCheck2, CalendarClock, UserPlus,
} from "lucide-react";
import { fetchOpenSessions } from "@/lib/api/public";
import { routes } from "@/lib/routes";

export const revalidate = 60;

export const metadata = {
  title: "HAPA — Accréditation presse",
  description:
    "Demandez votre carte de presse auprès de la Haute Autorité de la Presse et de l'Audiovisuel (HAPA), République Islamique de Mauritanie.",
};

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default async function LandingPage() {
  const sessions = await fetchOpenSessions();
  const open = sessions.length > 0;

  return (
    <>
      {/* ── Hero ── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(900px 460px at 85% -15%, rgba(255,215,0,.14), transparent 60%), radial-gradient(700px 500px at -10% 115%, rgba(0,169,92,.22), transparent 55%), linear-gradient(168deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 mx-auto grid max-w-5xl gap-10 px-5 py-20 lg:grid-cols-[1.15fr_1fr] lg:items-center">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              République Islamique de Mauritanie
            </p>
            <h1 className="mt-4 text-[40px] font-extrabold leading-[1.08] xl:text-[46px]">
              La carte de presse<br />
              <span className="text-[var(--gold-500)]">officielle</span> de la Mauritanie
            </h1>
            <p className="mt-5 max-w-xl text-[15.5px] leading-relaxed text-white/70">
              La Haute Autorité de la Presse et de l&apos;Audiovisuel délivre la
              carte de presse aux journalistes exerçant en Mauritanie. Déposez
              votre demande en ligne et suivez son avancement à chaque étape.
            </p>

            {/* Live session status */}
            <div className="mt-7 inline-flex flex-wrap items-center gap-3 rounded-xl bg-black/20 px-4 py-3 ring-1 ring-white/15">
              <span
                className={`h-2 w-2 rounded-full ${open ? "animate-pulse bg-[var(--green-500)]" : "bg-white/30"}`}
                aria-hidden="true"
              />
              <span className="text-[13px] font-semibold">
                {open
                  ? `Candidatures ouvertes jusqu'au ${fmtLong(sessions[0].receivingEnd)}`
                  : "Aucune session ouverte actuellement"}
              </span>
              <Link
                href={routes.publicSessions}
                className="text-[13px] font-bold text-[var(--gold-500)] underline underline-offset-4 hover:text-white"
              >
                Voir les sessions
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href={routes.auth.register}
                className="inline-flex items-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-bold text-[var(--green-900)] transition-transform hover:-translate-y-px"
              >
                <UserPlus className="h-4 w-4" /> Créer un compte
              </Link>
              <Link
                href={routes.auth.login}
                className="inline-flex items-center gap-2 rounded-lg border border-white/30 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
              >
                Se connecter
              </Link>
            </div>
          </div>

          {/* Press-card specimen */}
          <div className="hidden justify-self-center lg:block">
            <div
              className="relative aspect-[1.586] w-[380px] -rotate-3 overflow-hidden rounded-2xl bg-white p-5"
              style={{ boxShadow: "0 40px 80px -24px rgba(0,0,0,.55)" }}
              role="img"
              aria-label="Carte de presse — spécimen"
            >
              <div className="flex items-start justify-between gap-3 border-b-2 border-[var(--green-500)] pb-2">
                <div>
                  <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--green-700)]">HAPA</p>
                  <p className="mt-0.5 max-w-[150px] text-[6.5px] font-semibold uppercase leading-[1.4] tracking-[0.08em] text-[var(--muted-fg)]">
                    Haute Autorité de la Presse et de l&apos;Audiovisuel
                  </p>
                </div>
                <p dir="rtl" className="text-right text-[10px] leading-snug text-[var(--green-700)]">
                  السلطة العليا للصحافة<br />والسمعيات البصرية
                </p>
              </div>
              <div className="h-px w-full bg-[var(--gold-500)]/70" aria-hidden="true" />
              <div className="mt-3 flex gap-4">
                <div className="flex h-[84px] w-[68px] flex-none items-center justify-center rounded-lg border border-[var(--green-500)]/30 bg-[var(--green-tint)]">
                  <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)"
                    strokeWidth="1.6" opacity="0.55" strokeLinecap="round" aria-hidden="true">
                    <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <div className="flex items-baseline justify-between gap-3">
                    <b className="text-[13.5px] font-extrabold tracking-[0.05em] text-[var(--green-900)]">
                      CARTE DE PRESSE
                    </b>
                    <span dir="rtl" className="text-[12px] font-semibold text-[var(--green-900)]">
                      بطاقة صحفية
                    </span>
                  </div>
                  <dl className="mt-2.5 space-y-1.5">
                    {[["Nom", "—————————"], ["N°", "HAPA-2026-000000"], ["Validité", "12 / 2027"]].map(([l, v]) => (
                      <div key={l} className="flex items-baseline gap-2">
                        <dt className="w-14 flex-none text-[7.5px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]/80">{l}</dt>
                        <dd className="font-mono text-[9.5px] text-[var(--ink)]/85">{v}</dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
              <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
                <i className="flex-1 bg-[var(--green-500)]" />
                <i className="flex-1 bg-[var(--gold-500)]" />
                <i className="flex-1 bg-[var(--red-500)]" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="mx-auto max-w-5xl px-5 py-16">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
          Comment ça marche
        </h2>
        <div className="mt-6 grid gap-4 md:grid-cols-4">
          {[
            { Icon: CalendarClock, t: "Une session s'ouvre", d: "La HAPA ouvre une session de candidature et en annonce les dates." },
            { Icon: UserPlus, t: "Vous déposez", d: "Créez votre compte et soumettez votre dossier avec les pièces requises." },
            { Icon: FileCheck2, t: "La commission examine", d: "Votre dossier est étudié ; une correction peut vous être demandée." },
            { Icon: ShieldCheck, t: "Votre carte est éditée", d: "En cas d'acceptation, votre carte bilingue est délivrée par la HAPA." },
          ].map(({ Icon, t, d }, i) => (
            <div key={t} className="rounded-xl border border-[var(--line)] bg-white p-5">
              <div className="flex items-center gap-2.5">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--green-tint)] text-[11px] font-extrabold text-[var(--green-700)]">
                  {i + 1}
                </span>
                <Icon className="h-4 w-4 text-[var(--green-600)]" />
              </div>
              <p className="mt-3 text-sm font-bold text-[var(--green-900)]">{t}</p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--slate)]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Assurances ── */}
      <section className="border-y border-[var(--line)] bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap justify-between gap-8 px-5 py-10">
          {[
            { Icon: ShieldCheck, t: "Données sécurisées", d: "Vos informations sont traitées par la HAPA seule." },
            { Icon: Languages, t: "Bilingue FR · AR", d: "La carte et le service sont disponibles en deux langues." },
            { Icon: FileCheck2, t: "Registre officiel", d: "Chaque carte délivrée est vérifiable auprès de la HAPA." },
          ].map(({ Icon, t, d }) => (
            <div key={t} className="flex max-w-xs items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 flex-none text-[var(--green-600)]" />
              <div>
                <p className="text-sm font-bold text-[var(--green-900)]">{t}</p>
                <p className="mt-0.5 text-[13px] text-[var(--slate)]">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="mx-auto max-w-5xl px-5 py-16 text-center">
        <h2 className="text-2xl font-extrabold text-[var(--green-900)]">
          Prêt à déposer votre demande ?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--slate)]">
          Créez votre compte dès maintenant. Vous serez informé par e-mail à
          chaque étape de votre dossier.
        </p>
        <Link
          href={routes.auth.register}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--green-700)] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[var(--green-600)]"
        >
          Créer mon compte <ArrowRight className="h-4 w-4" />
        </Link>
      </section>
    </>
  );
}
