// src/components/public/PublicFooter.tsx
//
// ───────────────────────────────────────────────────────────────────────
// THE MINISTRY LOCKUP STAYS BILINGUAL; THE COLUMNS DO NOT.
//
// The ministry's name in both languages is a SIGNATURE — the same object as
// the masthead, and the same reason for carrying two languages: the state has
// two, not the reader.
//
// But «Accréditation», «Contact», «Sécurité» and their links are functional
// text. The reader has chosen a language, and doubling every label would cost
// a line each for nobody's benefit.
//
// WHAT REVERSES: the reader's own language sits on top, in gold foil; the
// other follows beneath, quieter. In French the Latin leads; in Arabic the
// Arabic does.
// ───────────────────────────────────────────────────────────────────────

import { getLocale, getTranslations } from "next-intl/server";
import { Mail, MapPin, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule,
} from "./patterns";
import { routes } from "@/lib/routes";

export async function PublicFooter() {
  const locale = await getLocale();
  const t = await getTranslations("footer");
  const nav = await getTranslations("nav");

  const year = new Date().getFullYear();
  const arabic = locale === "ar";

  /* ── the two halves of the signature ── */

  const latinName = (
    <p
      dir="ltr"
      lang="fr"
      className="gold-foil text-[13px] font-extrabold uppercase leading-[1.7] tracking-[0.28em]"
    >
      Ministère de la Culture, des Arts,
      <br />
      de la Communication
      <br />
      et des Relations avec le Parlement
    </p>
  );

  const arabicName = (
    <p
      dir="rtl"
      lang="ar"
      className="text-[19px] font-semibold leading-[1.9] text-white/45"
    >
      وزارة الثقافة والفنون والاتصال والعلاقات مع البرلمان
    </p>
  );

  /**
   * Arabic in gold foil when it leads.
   *
   * ⚠️ NOT the same element with a swapped class: gold-foil carries a letter
   * spacing that would pull Arabic letterforms apart. The leading Arabic gets
   * the foil gradient and no tracking.
   */
  const arabicNameLeading = (
    <p
      dir="rtl"
      lang="ar"
      className="gold-foil text-[21px] font-bold leading-[1.9]"
      style={{ letterSpacing: 0 }}
    >
      وزارة الثقافة والفنون والاتصال والعلاقات مع البرلمان
    </p>
  );

  const latinNameFollowing = (
    <p
      dir="ltr"
      lang="fr"
      className="text-[11.5px] font-bold uppercase leading-[1.8] tracking-[0.2em] text-white/45"
    >
      Ministère de la Culture, des Arts, de la Communication
      <br />
      et des Relations avec le Parlement
    </p>
  );

  const ACCREDITATION = [
    { label: nav("journalists"), href: routes.publicJournalists },
    { label: t("openSessions"), href: routes.publicSessions },
    { label: t("apply"), href: routes.auth.register },
    { label: t("candidateSpace"), href: routes.auth.login },
  ];

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
        {/* engraving, two scales.
            rtl-mirror keeps the COMPOSITION rather than the coordinates: the
            large rosette belongs at the reading edge, the gold one opposite,
            whichever direction that is. */}
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -left-48 -top-40 h-[620px] w-[620px] text-white opacity-[0.05]"
          rings={48}
        />
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -bottom-56 right-0 h-[420px] w-[420px] text-[var(--gold-500)] opacity-[0.045]"
          rings={32}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        {/* ── giant watermark ──
            RIM in both directions: it is the state's initials, not a word to
            be read. */}
        <span
          className="pointer-events-none absolute inset-x-0 -bottom-8 select-none text-center text-[clamp(90px,20vw,240px)] font-extrabold leading-none tracking-[-0.03em] text-white opacity-[0.028]"
          aria-hidden="true"
        >
          RIM
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

            {/* The reader's own language leads. */}
            <div className="mt-6">{arabic ? arabicNameLeading : latinName}</div>
            <div className="mt-4">{arabic ? latinNameFollowing : arabicName}</div>

            <p className="mx-auto mt-6 max-w-lg text-[12.5px] leading-relaxed text-white/35">
              {t("mission")}
            </p>
          </div>

          {/* ══ columns ══ */}
          <div className="mt-16 grid gap-12 border-t border-white/10 pt-12 md:grid-cols-3 md:gap-10">
            {/* accréditation */}
            <nav className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--gold-500)]">
                {t("accreditation")}
              </p>
              <span className="foil-rule mt-3 block h-px w-12 opacity-60" aria-hidden="true" />

              <ul className="mt-6 space-y-3.5 text-[13px]">
                {ACCREDITATION.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="group inline-flex items-center gap-1.5 text-white/55 transition-colors hover:text-white"
                    >
                      <span className="relative">
                        {l.label}
                        {/* origin-[inline-start]: the underline grows from
                            where the reading begins. */}
                        <span className="absolute inset-x-0 -bottom-0.5 h-px origin-[inline-start] scale-x-0 bg-[var(--gold-500)] transition-transform duration-300 group-hover:scale-x-100" />
                      </span>
                      <ArrowUpRight className="rtl-flip h-3 w-3 -translate-y-px opacity-0 transition-opacity group-hover:opacity-100" />
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* contact */}
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--gold-500)]">
                {t("contact")}
              </p>
              <span className="foil-rule mt-3 block h-px w-12 opacity-60" aria-hidden="true" />
              <ul className="mt-6 space-y-4 text-[13px] text-white/55">
                <li className="flex items-start gap-2.5">
                  <MapPin className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-500)]/70" />
                  <span className="leading-relaxed">
                    {t("city")}
                    <br />
                    <span className="text-white/30">{t("country")}</span>
                  </span>
                </li>
                <li className="flex items-start gap-2.5">
                  <Mail className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-500)]/70" />
                  <span className="leading-relaxed text-white/40">
                    {t("contactNote")}
                  </span>
                </li>
              </ul>
            </div>

            {/* assurance */}
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.22em] text-[var(--gold-500)]">
                {t("security")}
              </p>
              <span className="foil-rule mt-3 block h-px w-12 opacity-60" aria-hidden="true" />
              <div className="mt-6 flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.04] p-4">
                <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--green-500)]" />
                <p className="text-[12.5px] leading-relaxed text-white/45">
                  {t("securityNote")}
                </p>
              </div>
            </div>
          </div>

          {/* ══ colophon ══ */}
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
            <p className="text-[11.5px] text-white/30">
              {t("copyright", { year })}
            </p>
            <div className="flex items-center gap-3">
              <TricolorRule className="w-10 rounded-full opacity-70" thin />
              {/* Latin and mono in both languages: this is a colophon mark,
                  the printer's line at the foot of a page. */}
              <p
                dir="ltr"
                className="font-mono text-[9.5px] uppercase tracking-[0.2em] text-white/25"
              >
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
