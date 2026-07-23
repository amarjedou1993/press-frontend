// src/components/public/PublicFooter.tsx
// The colophon — how an official document ends.
//
// Composition:
//   · a centred EMBLEM LOCKUP: the seal flanked by foil rules, the authority's
//     name in gold foil, and the Arabic name beneath at display size
//   · three columns of substance (identity · accréditation · contact)
//   · a GIANT WORDMARK watermark bleeding off the bottom edge
//   · engraved guilloche, a woven band, and a microprint edge
// Server component: zero client JS.

import Link from "next/link";
import { Mail, MapPin, ArrowUpRight, ShieldCheck } from "lucide-react";
import { routes } from "@/lib/routes";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule,
} from "./patterns";

export function PublicFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 overflow-hidden text-white">
      <TricolorRule />
      <div
        className="relative"
        style={{
          background:
            "radial-gradient(900px 420px at 50% -12%, rgba(255,215,0,.12), transparent 62%), radial-gradient(700px 380px at 88% 110%, rgba(0,169,92,.16), transparent 60%), linear-gradient(168deg, var(--green-900) 0%, #071f16 100%)",
        }}
      >
        {/* engraving, two scales */}
        <Guilloche className="pointer-events-none absolute -left-48 -top-40 h-[620px] w-[620px] text-white opacity-[0.05]" rings={48} />
        <Guilloche className="pointer-events-none absolute -bottom-56 right-0 h-[420px] w-[420px] text-[var(--gold-500)] opacity-[0.045]" rings={32} />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        {/* ── giant watermark ── */}
        <span
          className="pointer-events-none absolute inset-x-0 -bottom-8 select-none text-center text-[clamp(90px,20vw,240px)] font-extrabold leading-none tracking-[-0.03em] text-white opacity-[0.028]"
          aria-hidden="true"
        >
          HAPA
        </span>

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-16">
          {/* ══ emblem lockup ══ */}
          <div className="flex flex-col items-center text-center">
            <div className="flex w-full max-w-2xl items-center gap-5">
              <span className="foil-rule h-px flex-1 opacity-40" aria-hidden="true" />
              <span className="relative flex h-[76px] w-[76px] flex-none items-center justify-center">
                <span
                  className="absolute inset-0 rounded-full"
                  style={{ background: "radial-gradient(circle, rgba(255,215,0,.18), transparent 70%)" }}
                  aria-hidden="true"
                />
                <OfficialSeal className="relative h-full w-full" color="var(--gold-500)" id="footer-seal" />
              </span>
              <span className="foil-rule h-px flex-1 opacity-40" aria-hidden="true" />
            </div>

            <p className="gold-foil mt-6 text-[13px] font-extrabold uppercase leading-[1.7] tracking-[0.28em]">
              Haute Autorité de la Presse
              <br />
              et de l&apos;Audiovisuel
            </p>

            <p dir="rtl" className="mt-4 text-[19px] font-semibold leading-[1.9] text-white/45">
              السلطة العليا للصحافة والسمعيات البصرية
            </p>

            <p className="mx-auto mt-6 max-w-lg text-[12.5px] leading-relaxed text-white/35">
              Autorité de régulation chargée de la délivrance de la carte de
              presse aux journalistes exerçant en République Islamique de
              Mauritanie.
            </p>
          </div>

          {/* ══ columns ══ */}
          <div className="mt-16 grid gap-12 border-t border-white/10 pt-12 md:grid-cols-3 md:gap-10">
            {/* accréditation */}
            <nav>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--gold-500)]">
                Accréditation
              </p>
              <span className="foil-rule mt-3 block h-px w-12 opacity-60" aria-hidden="true" />
              <ul className="mt-6 space-y-3.5 text-[13px]">
                {[
                  { label: "Sessions ouvertes", href: routes.publicSessions },
                  { label: "Déposer une demande", href: routes.auth.register },
                  { label: "Espace candidat", href: routes.auth.login },
                ].map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-white/55 transition-colors hover:text-white"
                    >
                      <span className="relative">
                        {l.label}
                        <span className="absolute inset-x-0 -bottom-0.5 h-px origin-left scale-x-0 bg-[var(--gold-500)] transition-transform duration-300 group-hover:scale-x-100" />
                      </span>
                      <ArrowUpRight className="h-3 w-3 -translate-y-px opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
                <li>
                  <span className="inline-flex items-center gap-2 text-white/25">
                    Journalistes accrédités
                    <span className="rounded-full border border-white/15 px-1.5 py-px text-[8.5px] font-bold uppercase">
                      Bientôt
                    </span>
                  </span>
                </li>
              </ul>
            </nav>

            {/* contact */}
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--gold-500)]">
                Contact
              </p>
              <span className="foil-rule mt-3 block h-px w-12 opacity-60" aria-hidden="true" />
              <ul className="mt-6 space-y-4 text-[13px] text-white/55">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-500)]/70" />
                  <span className="leading-relaxed">
                    Nouakchott
                    <br />
                    <span className="text-white/30">République Islamique de Mauritanie</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-500)]/70" />
                  <span className="leading-relaxed text-white/40">
                    Pour toute question relative à votre dossier, utilisez votre
                    espace candidat.
                  </span>
                </li>
              </ul>
            </div>

            {/* assurance */}
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--gold-500)]">
                Sécurité
              </p>
              <span className="foil-rule mt-3 block h-px w-12 opacity-60" aria-hidden="true" />
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--green-500)]" />
                <p className="text-[12.5px] leading-relaxed text-white/45">
                  Vos informations sont traitées exclusivement par la HAPA, dans
                  le cadre de l&apos;instruction de votre demande
                  d&apos;accréditation.
                </p>
              </div>
            </div>
          </div>

          {/* ══ colophon ══ */}
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-[11.5px] text-white/30">
              © {year} Haute Autorité de la Presse et de l&apos;Audiovisuel — Tous
              droits réservés.
            </p>
            <div className="flex items-center gap-3">
              <TricolorRule className="w-10 rounded-full opacity-70" thin />
              <p className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/25">
                Accréditation presse · V1
              </p>
            </div>
          </div>
        </div>

        <GuillocheBand
          className="pointer-events-none absolute inset-x-0 bottom-5 h-16 text-white opacity-[0.06]"
          lines={8}
        />
        <MicroprintRule
          className="relative z-10 pb-2 text-center text-white opacity-[0.13]"
          repeat={16}
        />
      </div>
    </footer>
  );
}
