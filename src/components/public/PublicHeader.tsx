// src/components/public/PublicHeader.tsx
//
// ───────────────────────────────────────────────────────────────────────
// THE MASTHEAD STAYS BILINGUAL. EVERYTHING BELOW IT DOES NOT.
//
// «République Islamique de Mauritanie · الجمهورية الإسلامية الموريتانية» is
// how the state identifies itself on a passport, a letterhead, a border post.
// It carries both languages because the state has two — not because a reader
// needs the translation. Dropping one because the interface happens to be
// Arabic would be like printing a flag in one colour.
//
// The navigation, the buttons and the ribbon are FUNCTIONAL text, and
// functional text has one job. The reader has already chosen their language,
// and the switcher is right there if they chose wrong.
//
// ⚠️ THE EMBLEM LOCKUP LEADS IN THE READER'S LANGUAGE. In French the Latin
// block comes first and the Arabic sits behind a rule; in Arabic the order
// reverses. The document mirrors itself under dir="rtl", so this is a matter
// of which block is written first — not of positioning.

import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, CalendarCheck2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { OfficialSeal, MicroprintRule, TricolorRule } from "./patterns";
import { fetchOpenSessions } from "@/lib/api/public";
import { routes } from "@/lib/routes";

export async function PublicHeader() {
  const locale = await getLocale();
  const t = await getTranslations("nav");
  const th = await getTranslations("header");

  const sessions = await fetchOpenSessions();
  const open = sessions.length > 0;
  const arabic = locale === "ar";

  /**
   * The deposit deadline, in the reader's calendar conventions.
   *
   * "ar" rather than a country-qualified tag: Mauritanian Arabic uses Western
   * digits, and ar-MR would introduce eastern ones on some platforms. The
   * printed card uses Western digits, and a date on screen should match it.
   */
  const fmtShort = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(arabic ? "ar" : "fr-FR", {
      day: "numeric",
      month: "long",
    });

  const NAV = [
    { label: t("home"), href: routes.home },
    { label: t("sessions"), href: routes.publicSessions },
    { label: t("journalists"), href: routes.publicJournalists },
  ];

  /* ── the two halves of the emblem lockup ── */

  const latinBlock = (
    <span className="leading-none">
      <span className="gold-foil block text-[19px] font-extrabold tracking-[0.16em]">
        RIM
      </span>
      <span className="engraved-light mt-1.5 block max-w-[220px] text-[8px] font-bold uppercase leading-[1.55] tracking-[0.12em] text-[var(--green-900)]/65">
        République
        <br />
        Islamique de Mauritanie
      </span>
    </span>
  );

  const arabicBlock = (
    <span
      dir="rtl"
      lang="ar"
      className="block text-[11px] font-semibold leading-[1.7] text-[var(--green-700)]/65"
    >
      الجمهورية
      <br />
      الإسلامية الموريتانية
    </span>
  );

  return (
    <header className="sticky top-0 z-40 shadow-[0_10px_30px_-24px_rgba(11,46,31,.5)]">
      {/* ── 1. state strip ──
          Both languages, always. This is the coat of arms, not a sentence. */}
      {/* <div className="relative bg-[#071f16]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-[7px]">
          <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/45">
            République Islamique de Mauritanie
          </p>
          <p
            dir="rtl"
            lang="ar"
            className="hidden text-[11px] font-semibold text-white/40 sm:block"
          >
            الجمهورية الإسلامية الموريتانية
          </p>
        </div>
        <span className="foil-rule absolute inset-x-0 bottom-0 h-px opacity-50" aria-hidden="true" />
      </div> */}

      {/* ── 1. state strip ──
          Both languages, always — this is the coat of arms, not a sentence.
          But the READER'S OWN leads: it sits at the reading edge, the other
          at the far edge. Under dir="rtl" the container mirrors, so the order
          in the markup is what decides which is which. */}
      <div className="relative bg-[#071f16]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-[7px]">
          {arabic ? (
            <>
              <p
                dir="rtl"
                lang="ar"
                className="text-[11px] font-semibold text-white/45"
              >
                الجمهورية الإسلامية الموريتانية
              </p>
              <p
                dir="ltr"
                lang="fr"
                className="hidden text-[9px] font-bold uppercase tracking-[0.24em] text-white/40 sm:block"
              >
                République Islamique de Mauritanie
              </p>
            </>
          ) : (
            <>
              <p className="text-[9px] font-bold uppercase tracking-[0.24em] text-white/45">
                République Islamique de Mauritanie
              </p>
              <p
                dir="rtl"
                lang="ar"
                className="hidden text-[11px] font-semibold text-white/40 sm:block"
              >
                الجمهورية الإسلامية الموريتانية
              </p>
            </>
          )}
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

            {/* The reader's own language leads; the other follows the rule. */}
            {arabic ? arabicBlock : latinBlock}

            <span className="ms-1 hidden self-stretch border-s border-[var(--line)] ps-4 md:block">
              {arabic ? latinBlock : arabicBlock}
            </span>
          </Link>

          {/* navigation */}
          <nav className="flex items-center gap-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative hidden px-3.5 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:text-[var(--green-900)] after:absolute after:inset-x-3.5 after:bottom-0 after:h-[2px] after:origin-[inline-start] after:scale-x-0 after:rounded-full after:bg-[var(--gold-500)] after:transition-transform after:duration-300 hover:after:scale-x-100 sm:block"
              >
                {item.label}
              </Link>
            ))}

            <span className="mx-2 hidden h-6 w-px bg-[var(--line)] sm:block" aria-hidden="true" />

            <Link
              href={routes.auth.login}
              className="rounded-lg px-3.5 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
            >
              {t("login")}
            </Link>

            <LocaleSwitcher variant="light" />

            <Link
              href={routes.auth.register}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-4 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(0,107,60,.9)] transition-all hover:-translate-y-px"
              style={{ background: "linear-gradient(140deg, var(--green-600), var(--green-700) 60%, #05502c)" }}
            >
              <span className="relative z-10">{t("register")}</span>
              {/* rtl-flip: an arrow that means "onward" must point the way
                  the reader travels. */}
              <ArrowRight className="rtl-flip relative z-10 h-3.5 w-3.5" />
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
            <CalendarCheck2 className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
            {open ? (
              /* The date is embedded in the phrase rather than appended:
                 Arabic and French put it in different places, and a
                 placeholder lets each catalogue decide. */
              th.rich("sessionOpen", {
                date: fmtShort(sessions[0].receivingEnd),
                b: (chunks) => <b className="font-extrabold">{chunks}</b>,
              })
            ) : (
              <span className="text-[var(--slate)]">{th("sessionClosed")}</span>
            )}
          </p>
          <Link
            href={routes.publicSessions}
            className="group inline-flex items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-[var(--green-700)] transition-colors hover:text-[var(--green-900)]"
          >
            {th("consult")}
            <ArrowRight className="rtl-flip h-3 w-3" />
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
