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
      <span className="gold-foil block text-[17px] font-extrabold tracking-[0.16em] sm:text-[19px]">
        RIM
      </span>
      {/* ⚠️ Hidden below sm. Two lines of 8px small-caps is unreadable on a
          phone and takes 140px from a 375px row — the emblem still identifies
          the state; the sub-line only spells it out. */}
      <span className="engraved-light mt-1.5 hidden max-w-[220px] text-[8px] font-bold uppercase leading-[1.55] tracking-[0.12em] text-[var(--green-900)]/65 sm:block">
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
          Both languages, always — this is the coat of arms, not a sentence.
          But the READER'S OWN leads: it sits at the reading edge, the other
          at the far edge. Under dir="rtl" the container mirrors, so the order
          in the markup is what decides which is which. */}
      <div className="relative bg-[#071f16]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-[7px] sm:px-6">
          {arabic ? (
            <>
              <p
                dir="rtl"
                lang="ar"
                className="text-[10.5px] font-semibold text-white/45 sm:text-[11px]"
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
              <p className="text-[8.5px] font-bold uppercase tracking-[0.2em] text-white/45 sm:text-[9px] sm:tracking-[0.24em]">
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
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:gap-6 sm:px-6 sm:py-3.5">
          {/* emblem lockup */}
          <Link href={routes.home} className="group flex min-w-0 items-center gap-2.5 sm:gap-4">
            {/* ⚠️ 40px below sm, 52 above. The seal is the one thing that must
                stay — it identifies the authority — but at full size it takes
                a seventh of a phone's width. */}
            <span className="relative flex h-10 w-10 flex-none items-center justify-center sm:h-[52px] sm:w-[52px]">
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

          {/* actions */}
          <nav className="flex flex-none items-center gap-1">
            {/* ⚠️ The three destinations move to their own row below sm — see
                the band underneath. Hiding them here and nowhere else left a
                phone with no navigation at all. */}
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative hidden px-3.5 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:text-[var(--green-900)] after:absolute after:inset-x-3.5 after:bottom-0 after:h-[2px] after:origin-[inline-start] after:scale-x-0 after:rounded-full after:bg-[var(--gold-500)] after:transition-transform after:duration-300 hover:after:scale-x-100 md:block"
              >
                {item.label}
              </Link>
            ))}

            <span className="mx-2 hidden h-6 w-px bg-[var(--line)] md:block" aria-hidden="true" />

            <Link
              href={routes.auth.login}
              className="rounded-lg px-2.5 py-2 text-[12.5px] font-semibold text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)] sm:px-3.5 sm:text-[13px]"
            >
              {t("login")}
            </Link>

            <LocaleSwitcher variant="light" />

            {/* ⚠️ The label goes below sm; the arrow stays. A green pill with
                an arrow is unmistakably the primary action, and the word costs
                a hundred pixels a phone does not have. */}
            <Link
              href={routes.auth.register}
              aria-label={t("register")}
              className="group relative inline-flex items-center gap-1.5 overflow-hidden rounded-lg px-3 py-2.5 text-[13px] font-bold text-white shadow-[0_10px_24px_-12px_rgba(0,107,60,.9)] transition-all hover:-translate-y-px sm:px-4"
              style={{ background: "linear-gradient(140deg, var(--green-600), var(--green-700) 60%, #05502c)" }}
            >
              <span className="relative z-10 hidden sm:inline">{t("register")}</span>
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

        {/* ── 2b. the destinations, on a phone ──
            ⚠️ THEY WERE SIMPLY HIDDEN BEFORE, which left a mobile visitor
            with no way to reach /sessions or /journalistes at all — the
            register button and the language switcher were the whole of the
            navigation.

            A row of three fits comfortably; a hamburger for three links is
            a menu hiding a menu. */}
        <div className="border-t border-[var(--line)] md:hidden">
          <div className="mx-auto flex max-w-6xl items-center gap-1 px-2 py-1">
            {NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 rounded-lg px-2 py-2 text-center text-[12.5px] font-semibold text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
              >
                {item.label}
              </Link>
            ))}
          </div>
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
        {/* ⚠️ No justify-between: with the link conditional, it would push the
            sentence to the far edge whenever no session is open. The link
            takes ms-auto instead — logical, so it sits at the trailing edge in
            both languages. */}
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-4 gap-y-1 px-4 py-2 sm:px-6">
          <p className="flex items-center gap-2 text-[11.5px] font-semibold text-[var(--green-900)] sm:gap-2.5 sm:text-[12px]">
            <span
              className={`h-1.5 w-1.5 flex-none rounded-full ${open ? "bg-[var(--green-500)] shadow-[0_0_0_3px_rgba(0,169,92,.2)] motion-safe:animate-pulse" : "bg-[var(--muted-fg)]"}`}
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

          {/* ⚠️ Only when a session is open.
              The sessions page shows an empty list otherwise — so the link
              would invite someone to a page that repeats what the ribbon just
              said. A link that leads nowhere useful teaches people to stop
              following them.

              Hidden below sm as well: on a phone the sentence already wraps
              to two lines, and the destination is one tap away in the row
              above. */}
          {open && (
            <Link
              href={routes.publicSessions}
              className="group ms-auto hidden items-center gap-1 text-[11.5px] font-bold uppercase tracking-wider text-[var(--green-700)] transition-colors hover:text-[var(--green-900)] sm:inline-flex"
            >
              {th("consult")}
              <ArrowRight className="rtl-flip h-3 w-3" />
            </Link>
          )}
        </div>
      </div>

      {/* ── 4. seam ── */}
      <MicroprintRule
        className="hidden bg-white py-[3px] text-center text-[var(--green-700)] opacity-20 sm:block"
        repeat={16}
      />
      <TricolorRule thin />
    </header>
  );
}
