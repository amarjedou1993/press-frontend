"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Building2, Briefcase, ShieldCheck, X, Info, QrCode,
  LayoutList, Users2,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule, Overline,
} from "@/components/public/patterns";
import { getPublicRegistry, type PublicJournalist } from "@/lib/api/journalists";
import {
  ARABIC_ALPHABET, LATIN_ALPHABET, scriptOf, initialOf, normalise,
  groupByInitial, type Script,
} from "@/lib/registry-index";
import { routes } from "@/lib/routes";

export default function PublicRegistryPage() {
  const locale = useLocale();
  const t = useTranslations("registry");
  const arabic = locale === "ar";

  const [search, setSearch] = useState("");
  const [view, setView] = useState<"name" | "outlet">("name");

  const registry = useQuery({
    queryKey: ["public", "journalists"],
    queryFn: getPublicRegistry,
    staleTime: 5 * 60 * 1000,
  });

  const all = registry.data?.journalists ?? [];

  /** The reader's script leads; the other follows in its own section. */
  const primary: Script = arabic ? "arabic" : "latin";
  const secondary: Script = arabic ? "latin" : "arabic";

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    return isNaN(d.getTime()) ? "—" : d.toLocaleDateString(arabic ? "ar" : "fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });
  };

  /** The label a journalist's specialisation carries, in the reader's language. */
  const specOf = (j: PublicJournalist) =>
    (arabic ? j.specialisationAr : j.specialisationFr) ?? j.specialisationFr;
  const catOf = (j: PublicJournalist) =>
    (arabic ? j.categoryLabelAr : j.categoryLabelFr) ?? j.categoryLabelFr;

  const results = useMemo(() => {
    const term = normalise(search.trim());
    if (!term) return [];
    return all.filter((j) =>
      normalise(j.fullName).includes(term)
      || normalise(j.institution ?? "").includes(term)
      || normalise(j.cardNumber).includes(term)
      || normalise(j.specialisationFr ?? "").includes(term)
      || normalise(j.specialisationAr ?? "").includes(term));
  }, [all, search]);

  const searching = search.trim().length > 0;

  const primaryGroups = useMemo(
    () => groupByInitial(all, (j) => j.fullName, primary),
    [all, primary]
  );
  const secondaryGroups = useMemo(
    () => groupByInitial(all, (j) => j.fullName, secondary),
    [all, secondary]
  );

  const lettersPresent = useMemo(
    () => new Set(primaryGroups.map(([letter]) => letter)),
    [primaryGroups]
  );

  const rail = primary === "arabic" ? ARABIC_ALPHABET : LATIN_ALPHABET;

  const byInstitution = useMemo(() => {
    const map = new Map<string, PublicJournalist[]>();
    for (const j of all) {
      const key = j.institution?.trim() || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(j);
    }
    return [...map.entries()].sort((a, b) =>
      b[1].length - a[1].length || a[0].localeCompare(b[0], locale));
  }, [all, locale]);

  const totalLetters = primaryGroups.length + secondaryGroups.length;

  return (
    <>
      {/* ══ THE REGISTER'S HEAD ══ */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(800px 380px at 82% -30%, rgba(255,215,0,.12), transparent 62%), linear-gradient(166deg, #08251a, var(--green-900) 70%)",
        }}
      >
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] text-white opacity-[0.055]"
          rings={44}
        />
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -bottom-52 -left-40 h-[420px] w-[420px] text-[var(--gold-500)] opacity-[0.045]"
          rings={32}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-5xl px-6 py-16">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
              <i className="h-3.5 w-1.5 rounded-full bg-[var(--green-500)]" />
              <i className="h-3.5 w-1.5 rounded-full bg-[var(--gold-500)]" />
              <i className="h-3.5 w-1.5 rounded-full bg-[var(--red-500)]" />
            </span>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/55">
              {t("eyebrow")}
            </p>
          </div>

          <div className="mt-6 flex items-end justify-between gap-8">
            <h1 className="min-w-0 text-[clamp(32px,5vw,52px)] font-extrabold leading-[1.02] tracking-[-0.02em]">
              {t.rich("title", { br: () => <br /> })}
            </h1>
            {/* The other language, as the section's signature — it swaps. */}
            <p
              dir={arabic ? "ltr" : "rtl"}
              lang={arabic ? "fr" : "ar"}
              className="hidden flex-none pb-2 text-[17px] font-semibold text-white/40 sm:block"
            >
              {t("titleOther")}
            </p>
          </div>

          <p className="mt-5 max-w-2xl text-[15px] leading-[1.75] text-white/65">
            {t("lede")}
          </p>

          {/* ── the field: the page's centre of gravity ── */}
          <div className="relative mt-9 max-w-2xl">
            <Search className="field-icon-start pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--green-900)]/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("searchPlaceholder")}
              aria-label={t("searchLabel")}
              className="h-14 w-full rounded-2xl bg-white ps-14 pe-12 text-[15.5px] text-[var(--ink)] shadow-[0_20px_50px_-26px_rgba(0,0,0,.8)] outline-none
                         placeholder:text-[var(--muted-fg)]
                         focus-visible:ring-4 focus-visible:ring-[var(--gold-500)]/45"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                aria-label={t("clearSearch")}
                className="absolute end-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-[#f2f5f3] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!registry.isLoading && (
            <p className="mt-4 font-mono text-[11px] uppercase tracking-[0.14em] text-white/35">
              {t("compiled", {
                count: registry.data?.total ?? 0,
                date: fmtDate(registry.data?.compiledAt),
              })}
            </p>
          )}
        </div>

        <GuillocheBand
          className="pointer-events-none absolute inset-x-0 bottom-0 h-16 text-white opacity-[0.08]"
          lines={7}
        />
        <TricolorRule className="absolute inset-x-0 bottom-0" />
      </section>

      <MicroprintRule
        className="border-b border-[var(--line)] bg-white py-1.5 text-[var(--green-700)] opacity-30"
        repeat={14}
      />

      {/* ══ THE ROLL ══ */}
      <section className="mx-auto max-w-5xl px-6 py-14">

        {registry.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}

        {registry.isError && (
          <p className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center text-[14px] text-[var(--slate)]">
            {t("unavailable")}
          </p>
        )}

        {/* ── search results ── */}
        {!registry.isLoading && searching && (
          <>
            <Overline index="01">{t("results", { count: results.length })}</Overline>

            <div className="mt-8">
              {results.length === 0 ? (
                <EmptyResult t={t} />
              ) : (
                <ul className="space-y-3">
                  {results.map((j) => (
                    <RegisterEntry
                      key={j.cardNumber}
                      journalist={j}
                      spec={specOf(j)}
                      category={catOf(j)}
                      validUntil={fmtDate(j.expiresAt)}
                      t={t}
                    />
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* ── browse ── */}
        {!registry.isLoading && !searching && all.length > 0 && (
          <>
            <Overline index="01">{t("browseOverline")}</Overline>

            <div className="mb-7 mt-8 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-inset ring-[var(--line)]">
                {([
                  { key: "name" as const, label: t("byName"), Icon: LayoutList },
                  { key: "outlet" as const, label: t("byOutlet"), Icon: Users2 },
                ]).map((tab) => {
                  const selected = view === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setView(tab.key)}
                      aria-pressed={selected}
                      className="inline-flex items-center gap-2 rounded-lg px-4 py-2 text-[12.5px] font-bold transition-all"
                      style={selected
                        ? { background: "var(--green-900)", color: "#fff",
                            boxShadow: "0 6px 16px -10px rgba(11,46,31,.9)" }
                        : { color: "var(--slate)" }}
                    >
                      <tab.Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-fg)]">
                {view === "name"
                  ? t("letters", { count: totalLetters })
                  : t("outlets", { count: byInstitution.length })}
              </p>
            </div>

            {view === "name" ? (
              <>
                {/* ── the alphabet rail ──
                    In the READER'S script. Sticky, so it stays reachable
                    however far down the roll you are; letters with no entry
                    are dimmed rather than hidden, because their absence is
                    itself information. */}
                <nav
                  aria-label={t("indexLabel")}
                  className="sticky top-4 z-20 -mx-2 mb-8 rounded-2xl border border-[var(--line)] bg-white/85 px-2 py-2 backdrop-blur-md"
                >
                  <ul className="flex flex-wrap justify-center gap-0.5">
                    {rail.map((letter) => {
                      const present = lettersPresent.has(letter);
                      return (
                        <li key={letter}>
                          {present ? (
                            <a
                              href={`#lettre-${encodeURIComponent(letter)}`}
                              className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-extrabold text-[var(--green-700)] transition-all hover:bg-[var(--green-900)] hover:text-white"
                            >
                              {letter}
                            </a>
                          ) : (
                            <span
                              aria-hidden="true"
                              className="flex h-7 w-7 items-center justify-center text-[12px] font-semibold text-[var(--muted-fg)]/35"
                            >
                              {letter}
                            </span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </nav>

                <div className="space-y-10">
                  {primaryGroups.map(([letter, members]) => (
                    <LetterSection
                      key={letter}
                      letter={letter}
                      members={members}
                      spec={specOf}
                      category={catOf}
                      t={t}
                    />
                  ))}
                </div>

                {/* ── the other script ──
                    A NAMED SECTION, not a "#" bucket. These are accredited
                    journalists whose names are written in the other alphabet;
                    filing them under a placeholder would be a small insult
                    repeated once per person. */}
                {secondaryGroups.length > 0 && (
                  <div className="mt-16">
                    <div className="flex items-center gap-4">
                      <p className="flex-none text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
                        {arabic ? t("latinNames") : t("arabicNames")}
                      </p>
                      <span className="foil-rule h-px flex-1 opacity-30" aria-hidden="true" />
                    </div>

                    <div className="mt-8 space-y-10">
                      {secondaryGroups.map(([letter, members]) => (
                        <LetterSection
                          key={letter}
                          letter={letter}
                          members={members}
                          spec={specOf}
                          category={catOf}
                          t={t}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <ul className="space-y-4">
                {byInstitution.map(([institution, members]) => (
                  <OutletCard
                    key={institution}
                    institution={institution}
                    members={members}
                    spec={specOf}
                    validUntil={fmtDate}
                    t={t}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {!registry.isLoading && !searching && all.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-white p-14 text-center">
            <Info className="mx-auto h-8 w-8 text-[var(--muted-fg)]" />
            <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
              {t("noneYetTitle")}
            </p>
            <p className="mt-2 text-[13.5px] text-[var(--slate)]">
              {t("noneYetBody")}
            </p>
          </div>
        )}
      </section>

      {/* ══ what this register is, and is not ══ */}
      <section className="mx-auto max-w-5xl px-6 pb-20">
        <Overline index="02">{t("scopeOverline")}</Overline>

        <div className="relative mt-8 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-7">
          <Guilloche
            className="rtl-mirror pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 text-[var(--green-900)] opacity-[0.03]"
            rings={30}
          />
          <div className="relative z-10 flex items-start gap-4">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[var(--green-600)]" />
            <div className="min-w-0">
              <p className="text-[14px] font-extrabold text-[var(--green-900)]">
                {t("scopeTitle")}
              </p>
              <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-[var(--slate)]">
                {t.rich("scopeBody", { b: (c) => <b>{c}</b> })}
              </p>
              <p className="mt-5 text-[12.5px] text-[var(--muted-fg)]">
                {t("areYouAJournalist")}{" "}
                <Link
                  href={routes.publicSessions}
                  className="font-semibold text-[var(--green-700)] underline underline-offset-2"
                >
                  {t("seeSessions")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ONE LETTER OF THE ROLL
   ══════════════════════════════════════════════════════════════════ */

function LetterSection({
  letter, members, spec, category, t,
}: {
  letter: string;
  members: PublicJournalist[];
  spec: (j: PublicJournalist) => string | null | undefined;
  category: (j: PublicJournalist) => string | null | undefined;
  t: ReturnType<typeof useTranslations<"registry">>;
}) {
  return (
    <section id={`lettre-${encodeURIComponent(letter)}`} className="scroll-mt-24">
      {/* the engraved initial — the page's strongest typographic moment, and
          what makes this read as a printed register rather than a list */}
      <div className="flex items-center gap-5">
        <span className="relative flex-none">
          <span
            // Arabic letterforms need no negative tracking, and would break
            // under it. The gradient is the effect; the tracking is not.
            className="block text-[52px] font-extrabold leading-none"
            style={{
              background: "linear-gradient(160deg, var(--gold-500), #b8860b 70%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              color: "transparent",
              letterSpacing: 0,
            }}
          >
            {letter}
          </span>
          <span
            className="absolute inset-x-0 -bottom-1 h-px"
            style={{ background: "linear-gradient(90deg, var(--gold-500), transparent)" }}
            aria-hidden="true"
          />
        </span>

        <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />

        <span className="flex-none font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          {t("entries", { count: members.length })}
        </span>
      </div>

      {/* Two columns on desktop, like a printed roll. */}
      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
        {members.map((j) => (
          <RollEntry
            key={j.cardNumber}
            journalist={j}
            spec={spec(j)}
            category={category(j)}
          />
        ))}
      </ul>
    </section>
  );
}

/* ══ one entry in the roll — compact, two per row ══ */

function RollEntry({
  journalist, spec, category,
}: {
  journalist: PublicJournalist;
  spec?: string | null;
  category?: string | null;
}) {
  return (
    <li className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-white px-4 py-3 transition-all hover:-translate-y-px hover:border-[var(--green-500)]/45 hover:shadow-[0_12px_28px_-20px_rgba(11,46,31,.65)]">
      <span
        className="absolute inset-y-0 start-0 w-[2.5px] origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100"
        style={{ background: "linear-gradient(180deg, var(--gold-500), var(--green-500))" }}
        aria-hidden="true"
      />

      {/* dir="auto": the name may be in either script, whatever the page is. */}
      <p dir="auto" className="truncate text-[14px] font-bold text-[var(--green-900)]">
        {journalist.fullName}
      </p>

      <p className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[var(--slate)]">
        <span className="truncate">{spec ?? category ?? "—"}</span>
        {journalist.institution && (
          <>
            <span className="flex-none opacity-35">·</span>
            <span dir="auto" className="truncate opacity-80">
              {journalist.institution}
            </span>
          </>
        )}
      </p>

      <p dir="ltr" className="mt-1.5 font-mono text-[10.5px] tracking-tight text-[var(--muted-fg)]">
        {journalist.cardNumber}
      </p>
    </li>
  );
}

/* ══ one outlet, with its newsroom ══ */

function OutletCard({
  institution, members, spec, validUntil, t,
}: {
  institution: string;
  members: PublicJournalist[];
  spec: (j: PublicJournalist) => string | null | undefined;
  validUntil: (iso?: string | null) => string;
  t: ReturnType<typeof useTranslations<"registry">>;
}) {
  const named = institution !== "—";

  return (
    <li className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <Guilloche
        className="rtl-mirror pointer-events-none absolute -right-20 -top-20 h-56 w-56 text-[var(--green-900)] opacity-[0.035]"
        rings={24}
      />

      <div
        className="relative flex items-center gap-3.5 px-5 py-4 text-white"
        style={{
          background:
            "radial-gradient(400px 120px at 90% -40%, rgba(255,215,0,.16), transparent 65%), linear-gradient(140deg, var(--green-900), #0e3d29 75%)",
        }}
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-white/10 ring-1 ring-inset ring-white/20">
          <Building2 className="h-4 w-4 text-[var(--gold-500)]" />
        </span>
        {/* An outlet name is free text in whatever script its owner uses. */}
        <p dir="auto" className="min-w-0 flex-1 truncate text-[14.5px] font-extrabold">
          {named ? institution : t("unnamedOutlet")}
        </p>
        <span className="flex-none rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-bold text-white/85 ring-1 ring-inset ring-white/20">
          {members.length}
        </span>
      </div>

      <ul className="relative divide-y divide-[#f2f5f3]">
        {members.map((j) => (
          <li key={j.cardNumber}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-5 py-3 transition-colors hover:bg-[#fbfcfb]">
            <span dir="auto" className="text-[13.5px] font-bold text-[var(--green-900)]">
              {j.fullName}
            </span>
            {spec(j) && (
              <span className="flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
                <Briefcase className="h-3 w-3 opacity-50" />
                {spec(j)}
              </span>
            )}
            <span className="ms-auto flex items-baseline gap-3">
              <span dir="ltr" className="font-mono text-[11px] text-[var(--muted-fg)]">
                {j.cardNumber}
              </span>
              <span className="hidden text-[11px] text-[var(--muted-fg)] sm:inline">
                → {validUntil(j.expiresAt)}
              </span>
            </span>
          </li>
        ))}
      </ul>

      <MicroprintRule
        className="pb-1.5 text-center text-[var(--green-700)] opacity-[0.08]"
        repeat={14}
      />
    </li>
  );
}

/* ══ a full record, for a search result ══ */

function RegisterEntry({
  journalist, spec, category, validUntil, t,
}: {
  journalist: PublicJournalist;
  spec?: string | null;
  category?: string | null;
  validUntil: string;
  t: ReturnType<typeof useTranslations<"registry">>;
}) {
  return (
    <li className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all hover:border-[var(--green-500)]/40 hover:shadow-[0_14px_36px_-24px_rgba(11,46,31,.7)]">
      <span
        className="absolute inset-y-0 start-0 w-[3px]"
        style={{ background: "linear-gradient(180deg, var(--gold-500), var(--green-500))" }}
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-start gap-4 py-5 pe-5 ps-6">
        <span className="relative mt-0.5 flex h-11 w-11 flex-none items-center justify-center">
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(255,215,0,.18), transparent 70%)" }}
            aria-hidden="true"
          />
          <OfficialSeal
            className="relative h-full w-full"
            color="var(--green-700)"
            id={`seal-${journalist.cardNumber.replace(/\W/g, "")}`}
          />
        </span>

        <div className="min-w-0 flex-1">
          <p dir="auto" className="text-[16.5px] font-extrabold leading-tight text-[var(--green-900)]">
            {journalist.fullName}
          </p>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-[var(--slate)]">
            {spec && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 opacity-55" />
                {spec}
              </span>
            )}
            {journalist.institution && (
              <span dir="auto" className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 flex-none opacity-55" />
                {journalist.institution}
              </span>
            )}
          </p>

          {category && (
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--green-tint)] px-3 py-1 text-[11.5px] font-bold text-[var(--green-700)]">
              {category}
            </span>
          )}
        </div>

        <div className="flex-none text-end">
          <p dir="ltr" className="font-mono text-[13px] font-bold tracking-tight text-[var(--green-900)]">
            {journalist.cardNumber}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--muted-fg)]">
            {t("validUntil")}
          </p>
          <p className="text-[12px] font-semibold text-[var(--slate)]">
            {validUntil}
          </p>
        </div>
      </div>

      <MicroprintRule
        className="pb-1.5 text-center text-[var(--green-700)] opacity-[0.09]"
        repeat={14}
      />
    </li>
  );
}

/* ══ nothing found ══ */

function EmptyResult({ t }: { t: ReturnType<typeof useTranslations<"registry">> }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-9 text-center">
      <Guilloche
        className="rtl-mirror pointer-events-none absolute -right-24 -top-24 h-64 w-64 text-[var(--green-900)] opacity-[0.035]"
        rings={28}
      />
      <div className="relative z-10">
        <Info className="mx-auto h-8 w-8 text-[var(--muted-fg)]" />
        <p className="mt-4 text-[16px] font-extrabold text-[var(--green-900)]">
          {t("emptyTitle")}
        </p>
        {/* Someone searching a name and finding nothing must not conclude
            "this person is a fraud". They may be accredited under a different
            spelling, their card may have lapsed, or they may indeed hold
            nothing — very different things to say about a journalist. */}
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-[var(--slate)]">
          {t("emptyBody")}
        </p>

        <div className="mx-auto mt-6 flex max-w-sm items-start gap-3 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4 text-start">
          <QrCode className="mt-0.5 h-4 w-4 flex-none text-[var(--green-700)]" />
          <p className="text-[12.5px] leading-relaxed text-[var(--slate)]">
            {t("emptyQr")}
          </p>
        </div>
      </div>
    </div>
  );
}
