// src/app/not-found.tsx
//
// A 404 on a government site is usually reached by someone following a link
// that has moved — from an old bookmark, a printed circular, an e-mail sent
// months ago. So this page does not apologise and stop: it says plainly that
// the address no longer exists, and offers THE THREE THINGS anyone is
// actually here for.
//
// The seal is the point. A stray page that looks like a framework error is a
// page that makes someone doubt the site itself.

import Link from "next/link";
import { ArrowRight, Search, FileText, Home } from "lucide-react";
import {
  Guilloche, OfficialSeal, MicroprintRule, TricolorRule,
} from "@/components/public/patterns";
import { routes } from "@/lib/routes";

export const metadata = {
  title: "Page introuvable — Accréditation presse",
};

const WAYS = [
  {
    href: routes.publicJournalists,
    Icon: Search,
    label: "Registre des journalistes accrédités",
    hint: "Vérifier qu'une personne est titulaire d'une carte en cours de validité.",
  },
  {
    href: routes.publicSessions,
    Icon: FileText,
    label: "Sessions de candidature",
    hint: "Consulter le calendrier et les conditions de dépôt.",
  },
  {
    href: routes.home,
    Icon: Home,
    label: "Accueil",
    hint: "Revenir à la page principale.",
  },
];

export default function NotFound() {
  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-white"
      style={{
        background:
          "radial-gradient(900px 460px at 50% -20%, rgba(255,215,0,.12), transparent 62%), radial-gradient(700px 420px at 85% 118%, rgba(0,169,92,.20), transparent 60%), linear-gradient(168deg, #08251a 0%, var(--green-900) 48%, #0d3a27 100%)",
      }}
    >
      <Guilloche
        className="pointer-events-none absolute -left-52 -top-56 h-[620px] w-[620px] text-white opacity-[0.055]"
        rings={50}
      />
      <Guilloche
        className="pointer-events-none absolute -bottom-64 -right-44 h-[460px] w-[460px] text-[var(--gold-500)] opacity-[0.05]"
        rings={34}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <span className="relative mx-auto flex h-[92px] w-[92px] items-center justify-center">
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,215,0,.18), transparent 70%)" }}
            aria-hidden="true"
          />
          <OfficialSeal
            className="seal-turn relative h-full w-full"
            color="var(--gold-500)"
            id="notfound-seal"
          />
        </span>

        {/* The code, set as a serial rather than shouted. A giant "404" is a
            developer's joke; this is a ministry. */}
        <p className="mt-7 font-mono text-[11px] uppercase tracking-[0.3em] text-white/35">
          Erreur 404
        </p>

        <h1 className="engraved-dark mt-4 text-[32px] font-extrabold leading-tight tracking-tight sm:text-[38px]">
          Cette page n&apos;existe pas
        </h1>
        <p dir="rtl" lang="ar" className="mt-2.5 text-[20px] font-semibold text-white/45">
          هذه الصفحة غير موجودة
        </p>

        <span className="foil-rule mx-auto mt-6 block h-px w-28 opacity-50" aria-hidden="true" />

        <p className="mx-auto mt-6 max-w-sm text-[14px] leading-relaxed text-white/55">
          L&apos;adresse demandée n&apos;existe pas ou a été déplacée. Si vous
          suivez un lien reçu par e-mail, il a peut-être expiré.
        </p>

        {/* the three things anyone is actually here for */}
        <ul className="mt-9 space-y-2.5 text-left">
          {WAYS.map((way) => (
            <li key={way.href}>
              <Link
                href={way.href}
                className="group flex items-center gap-4 rounded-2xl border border-white/12 bg-black/25 px-5 py-4 backdrop-blur-sm transition-all hover:border-[var(--gold-500)]/45 hover:bg-black/35"
              >
                <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/15">
                  <way.Icon className="h-4 w-4 text-[var(--gold-500)]" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13.5px] font-bold">{way.label}</span>
                  <span className="block text-[12px] leading-relaxed text-white/45">
                    {way.hint}
                  </span>
                </span>
                <ArrowRight className="h-4 w-4 flex-none text-white/35 transition-all group-hover:translate-x-0.5 group-hover:text-[var(--gold-500)]" />
              </Link>
            </li>
          ))}
        </ul>
      </div>

      <MicroprintRule
        className="absolute inset-x-0 bottom-3 text-center text-white opacity-[0.13]"
        repeat={16}
      />
      <TricolorRule className="absolute inset-x-0 bottom-0" />
    </main>
  );
}
