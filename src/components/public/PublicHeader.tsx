// src/components/public/PublicHeader.tsx
// The masthead of an official publication.
//
// Four tiers:
//   1. state strip — the Republic, both languages, on a foil rule
//   2. masthead — the seal as emblem, the wordmark in gold foil, the
//      authority's name in both scripts, navigation, primary action
//   3. LIVE STATUS RIBBON — reads the open session from the API, so the
//      masthead reports the state of the institution rather than decorating
//   4. microprint seam + the national rule
//
// Async server component: the fetch is cached by Next (ISR), so this costs
// the backend one request per minute across the whole site.

import Link from "next/link";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { routes } from "@/lib/routes";
import { fetchOpenSessions } from "@/lib/api/public";
import { OfficialSeal, MicroprintRule, TricolorRule } from "./patterns";

const NAV = [
  { label: "Accueil", href: routes.home },
  { label: "Sessions", href: routes.publicSessions },
  { label: "Journalistes accrédités", href: routes.publicJournalists, soon: true },
];

function fmtShort(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long",
  });
}

export async function PublicHeader() {
  const sessions = await fetchOpenSessions();
  const open = sessions.length > 0;

  return (
    <header className="sticky top-0 z-40 shadow-[0_10px_30px_-24px_rgba(11,46,31,.5)]">
      {/* ── 1. state strip ── */}
      <div className="relative bg-[#071f16]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-[7px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/45">
            République Islamique de Mauritanie
          </p>
          <p dir="rtl" className="hidden text-[11px] font-semibold text-white/40 sm:block">
            الجمهورية الإسلامية الموريتانية
          </p>
        </div>
        <span className="foil-rule absolute inset-x-0 bottom-0 h-px opacity-50" aria-hidden="true" />
      </div>

      {/* ── 2. masthead ── */}
      <div
        className="border-b border-[var(--line)] backdrop-blur-md"
        style={{
          background:
            "radial-gradient(600px 120px at 12% 0%, rgba(0,169,92,.05), transparent 70%), rgba(255,255,255,.94)",
        }}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-6 px-6 py-3.5">
          {/* emblem lockup */}
          <Link href={routes.home} className="group flex items-center gap-4">
            <span className="relative flex h-[52px] w-[52px] flex-none items-center justify-center">
              {/* gold halo */}
              <span
                className="absolute inset-0 rounded-full opacity-70 transition-opacity group-hover:opacity-100"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.22), transparent 68%)" }}
                aria-hidden="true"
              />
              <OfficialSeal
                className="seal-turn relative h-full w-full"
                color="var(--green-700)"
                id="header-seal"
              />
            </span>

            <span className="leading-none">
              <span className="gold-foil block text-[19px] font-extrabold tracking-[0.16em]">
                HAPA
              </span>
              <span className="engraved-light mt-1.5 block max-w-[220px] text-[8px] font-bold uppercase leading-[1.55] tracking-[0.12em] text-[var(--green-900)]/65">
                Haute Autorité de la Presse
                <br />
                et de l&apos;Audiovisuel
              </span>
            </span>

            <span className="ml-1 hidden self-stretch border-l border-[var(--line)] pl-4 md:block">
              <span
                dir="rtl"
                className="block text-[11px] font-semibold leading-[1.6] text-[var(--green-700)]/65"
              >
                السلطة العليا
                <br />
                للصحافة والسمعيات البصرية
              </span>
            </span>
          </Link>

          {/* navigation */}
          <nav className="flex items-center gap-1">
            {NAV.map((item) =>
              item.soon ? (
                <span
                  key={item.label}
                  className="hidden cursor-not-allowed items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-[var(--muted-fg)] xl:inline-flex"
                  title="Bientôt disponible"
                >
                  {item.label}
                  <span className="rounded-full border border-[var(--line)] px-1.5 py-px text-[8.5px] font-bold uppercase tracking-wide">
                    Bientôt
                  </span>
                </span>
              ) : (
                <Link
                  key={item.label}
                  href={item.href}
                  className="relative hidden px-3.5 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:text-[var(--green-900)] after:absolute after:inset-x-3.5 after:bottom-0 after:h-[2px] after:origin-left after:scale-x-0 after:rounded-full after:bg-[var(--gold-500)] after:transition-transform after:duration-300 hover:after:scale-x-100 sm:block"
                >
                  {item.label}
                </Link>
              )
            )}

            <span className="mx-2 hidden h-6 w-px bg-[var(--line)] sm:block" aria-hidden="true" />

            <Link
              href={routes.auth.login}
              className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
            >
              Connexion
            </Link>
            <Link
              href={routes.auth.register}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(0,107,60,.9)] transition-all hover:-translate-y-px"
              style={{ background: "linear-gradient(140deg, var(--green-600), var(--green-700) 60%, #05502c)" }}
            >
              <span className="relative z-10">Déposer une demande</span>
              <ArrowRight className="relative z-10 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
              <span
                className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
                aria-hidden="true"
              />
            </Link>
          </nav>
        </div>
      </div>

      {/* ── 3. live status ribbon ── */}
      <div
        className="border-b"
        style={{
          borderColor: open ? "rgba(0,169,92,.25)" : "var(--line)",
          background: open
            ? "linear-gradient(90deg, var(--green-tint), rgba(255,246,209,.5) 55%, var(--green-tint))"
            : "#f4f6f5",
        }}
      >
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-4 gap-y-1 px-6 py-2">
          <p className="flex items-center gap-2.5 text-[12px] font-semibold text-[var(--green-900)]">
            <span
              className={`h-1.5 w-1.5 rounded-full ${open ? "bg-[var(--green-500)] shadow-[0_0_0_3px_rgba(0,169,92,.2)] motion-safe:animate-pulse" : "bg-[var(--muted-fg)]"}`}
              aria-hidden="true"
            />
            <CalendarCheck2 className="h-3.5 w-3.5 text-[var(--green-700)]" />
            {open ? (
              <>
                Session ouverte — dépôts jusqu&apos;au{" "}
                <b className="font-extrabold">{fmtShort(sessions[0].receivingEnd)}</b>
              </>
            ) : (
              <span className="text-[var(--slate)]">
                Aucune session de candidature ouverte actuellement
              </span>
            )}
          </p>
          <Link
            href={routes.publicSessions}
            className="group inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-[var(--green-700)] transition-colors hover:text-[var(--green-900)]"
          >
            Consulter
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>

      {/* ── 4. seam ── */}
      <MicroprintRule
        className="bg-white py-[3px] text-center text-[var(--green-700)] opacity-20"
        repeat={16}
      />
      <TricolorRule thin />
    </header>
  );
}
