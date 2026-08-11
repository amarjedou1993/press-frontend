"use client";
// src/app/journalistes/page.tsx
// The public register of accredited journalists.
//
// ───────────────────────────────────────────────────────────────────────
// IT IS A REGISTER, AND IT IS BUILT LIKE ONE.
//
// A register is not a list — it is an INDEXED directory, navigated by letter
// the way a gazette or a professional roll is. So the browse view carries an
// alphabet rail, engraved section initials, and entries set in two columns
// like a printed record.
//
// The site's security-print vocabulary — guilloche, foil rules, microprint,
// the state seal — is load-bearing here. This page's purpose is to say "the
// Authority vouches for this person", and a page that looked like a search
// widget would say it less convincingly than the card in the journalist's
// pocket does.
//
// TWO WAYS IN, because two people arrive with different questions:
//   PAR NOM     — a ministry looking for one person
//   PAR ORGANE  — an editor looking at their own newsroom
//
// AND NO PHOTOGRAPHS anywhere. The verification page shows one, to somebody
// already holding the card. A public list of faces, sortable by outlet, is a
// directory of every journalist in Mauritania.
// ───────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  Search, Building2, Briefcase, ShieldCheck, X, Info, QrCode,
  LayoutList, Users2,
} from "lucide-react";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule,
} from "@/components/public/patterns";
import { getPublicRegistry, type PublicJournalist } from "@/lib/api/journalists";
import { routes } from "@/lib/routes";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/** Accent- and case-insensitive: "Mohamed" must find "Mohâmed". */
function normalise(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

/** The letter an entry files under — accents folded, anything else under #. */
function initialOf(name: string) {
  const first = normalise(name.trim()).charAt(0).toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export default function PublicRegistryPage() {
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"name" | "outlet">("name");

  const registry = useQuery({
    queryKey: ["public", "journalists"],
    queryFn: getPublicRegistry,
    staleTime: 5 * 60 * 1000,
  });

  const all = registry.data?.journalists ?? [];

  const results = useMemo(() => {
    const term = normalise(search.trim());
    if (!term) return [];
    return all.filter((j) =>
      normalise(j.fullName).includes(term)
      || normalise(j.institution ?? "").includes(term)
      || normalise(j.cardNumber).includes(term)
      || normalise(j.specialisationFr ?? "").includes(term));
  }, [all, search]);

  const searching = search.trim().length > 0;

  /** Grouped by initial, in alphabetical order — the register's own order. */
  const byLetter = useMemo(() => {
    const map = new Map<string, PublicJournalist[]>();
    for (const j of all) {
      const letter = initialOf(j.fullName);
      if (!map.has(letter)) map.set(letter, []);
      map.get(letter)!.push(j);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b, "fr"));
  }, [all]);

  const lettersPresent = useMemo(
    () => new Set(byLetter.map(([letter]) => letter)),
    [byLetter]
  );

  /** By outlet — how an editor thinks about their own newsroom. */
  const byInstitution = useMemo(() => {
    const map = new Map<string, PublicJournalist[]>();
    for (const j of all) {
      const key = j.institution?.trim() || "—";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(j);
    }
    return [...map.entries()].sort((a, b) =>
      b[1].length - a[1].length || a[0].localeCompare(b[0], "fr"));
  }, [all]);

  return (
    <main className="min-h-screen bg-[var(--paper,#f4f6f5)]">

      {/* ══════════════════════════════════════════════════════════
          THE REGISTER'S HEAD
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(900px 460px at 50% -18%, rgba(255,215,0,.13), transparent 62%), radial-gradient(700px 380px at 88% 120%, rgba(0,169,92,.14), transparent 60%), linear-gradient(168deg, var(--green-900) 0%, #071f16 100%)",
        }}
      >
        <Guilloche
          className="pointer-events-none absolute -left-52 -top-44 h-[600px] w-[600px] text-white opacity-[0.05]"
          rings={48}
        />
        <Guilloche
          className="pointer-events-none absolute -right-40 -bottom-56 h-[440px] w-[440px] text-[var(--gold-500)] opacity-[0.045]"
          rings={32}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-4xl px-6 pb-14 pt-14 text-center">
          <div className="mx-auto flex max-w-md items-center gap-5">
            <span className="foil-rule h-px flex-1 opacity-40" aria-hidden="true" />
            <span className="relative flex h-[64px] w-[64px] flex-none items-center justify-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true"
              />
              <OfficialSeal className="relative h-full w-full"
                color="var(--gold-500)" id="registry-seal" />
            </span>
            <span className="foil-rule h-px flex-1 opacity-40" aria-hidden="true" />
          </div>

          <p className="mt-6 text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
            Registre officiel
          </p>

          <h1 className="mt-4 text-[32px] font-extrabold leading-[1.12] tracking-tight sm:text-[38px]">
            Journalistes accrédités
          </h1>
          <p dir="rtl" lang="ar" className="mt-2.5 text-[21px] font-semibold text-white/50">
            سجل الصحفيين المعتمدين
          </p>

          <p className="mx-auto mt-5 max-w-xl text-[14px] leading-relaxed text-white/45">
            Vérifiez qu&apos;une personne est titulaire d&apos;une carte de
            presse en cours de validité.
          </p>

          <div className="relative mx-auto mt-9 max-w-xl">
            <Search className="pointer-events-none absolute left-5 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--green-900)]/35" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              placeholder="Nom, organe de presse, n° de carte…"
              aria-label="Rechercher un journaliste accrédité"
              className="h-14 w-full rounded-2xl bg-white pl-14 pr-12 text-[15.5px] text-[var(--ink)] shadow-[0_20px_50px_-26px_rgba(0,0,0,.8)] outline-none
                         placeholder:text-[var(--muted-fg)]
                         focus-visible:ring-4 focus-visible:ring-[var(--gold-500)]/45"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")}
                aria-label="Effacer la recherche"
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-[#f2f5f3] hover:text-[var(--ink)]">
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {!registry.isLoading && (
            <p className="mt-5 font-mono text-[11px] uppercase tracking-[0.14em] text-white/30">
              {registry.data?.total ?? 0} inscrit
              {(registry.data?.total ?? 0) > 1 ? "s" : ""}
              {" · arrêté au "}{longFr(registry.data?.compiledAt)}
            </p>
          )}
        </div>

        <GuillocheBand
          className="pointer-events-none absolute inset-x-0 bottom-3 h-14 text-white opacity-[0.06]"
          lines={8}
        />
        <MicroprintRule className="relative z-10 pb-1.5 text-center text-white opacity-[0.14]"
          repeat={16} />
      </section>
      <TricolorRule thin />

      <div className="mx-auto max-w-4xl px-6 pb-24 pt-9">

        {registry.isLoading && (
          <div className="space-y-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-[104px] animate-pulse rounded-2xl bg-white" />
            ))}
          </div>
        )}

        {registry.isError && (
          <p className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center text-[14px] text-[var(--slate)]">
            Le registre n&apos;est pas consultable pour le moment. Réessayez
            dans quelques instants.
          </p>
        )}

        {/* ══ search results ══ */}
        {!registry.isLoading && searching && (
          <>
            <div className="flex items-center gap-4 pb-4">
              <p className="text-[11.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                {results.length === 0
                  ? "Aucune inscription"
                  : `${results.length} inscription${results.length > 1 ? "s" : ""}`}
              </p>
              <span className="foil-rule h-px flex-1 opacity-30" aria-hidden="true" />
            </div>

            {results.length === 0 ? (
              <EmptyResult />
            ) : (
              <ul className="space-y-3">
                {results.map((j) => <RegisterEntry key={j.cardNumber} journalist={j} />)}
              </ul>
            )}
          </>
        )}

        {/* ══════════════════════════════════════════════════════════
            BROWSE — the register proper
            ══════════════════════════════════════════════════════════ */}
        {!registry.isLoading && !searching && all.length > 0 && (
          <>
            {/* the two ways in */}
            <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
              <div className="inline-flex rounded-xl bg-white p-1 ring-1 ring-inset ring-[var(--line)]">
                {([
                  { key: "name" as const, label: "Par nom", Icon: LayoutList },
                  { key: "outlet" as const, label: "Par organe", Icon: Users2 },
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
                  ? `${byLetter.length} lettre${byLetter.length > 1 ? "s" : ""}`
                  : `${byInstitution.length} organe${byInstitution.length > 1 ? "s" : ""}`}
              </p>
            </div>

            {view === "name" ? (
              <>
                {/* ── the alphabet rail ──
                    A register's signature interaction. Sticky, so it stays
                    reachable however far down the roll you are; letters with
                    no entry are dimmed rather than hidden, because their
                    absence is itself information. */}
                <nav
                  aria-label="Index alphabétique"
                  className="sticky top-[124px] z-20 -mx-2 mb-7 rounded-2xl border border-[var(--line)] bg-white/85 px-2 py-2 backdrop-blur-md"
                >
                  <ul className="flex flex-wrap justify-center gap-0.5">
                    {ALPHABET.map((letter) => {
                      const present = lettersPresent.has(letter);
                      return (
                        <li key={letter}>
                          {present ? (
                            <a
                              href={`#lettre-${letter}`}
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

                {/* ── the roll, letter by letter ── */}
                <div className="space-y-10">
                  {byLetter.map(([letter, members]) => (
                    <section key={letter} id={`lettre-${letter}`} className="scroll-mt-[190px]">
                      {/* the engraved initial — the page's strongest
                          typographic moment, and the thing that makes this
                          read as a printed register rather than a list */}
                      <div className="flex items-center gap-5">
                        <span className="relative flex-none">
                          <span
                            className="block text-[52px] font-extrabold leading-none tracking-tight"
                            style={{
                              background: "linear-gradient(160deg, var(--gold-500), #b8860b 70%)",
                              WebkitBackgroundClip: "text",
                              backgroundClip: "text",
                              color: "transparent",
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
                          {members.length} inscrit{members.length > 1 ? "s" : ""}
                        </span>
                      </div>

                      {/* Two columns on desktop, like a printed roll. */}
                      <ul className="mt-4 grid gap-2.5 sm:grid-cols-2">
                        {members.map((j) => (
                          <RollEntry key={j.cardNumber} journalist={j} />
                        ))}
                      </ul>
                    </section>
                  ))}
                </div>
              </>
            ) : (
              /* ── by outlet ── */
              <ul className="space-y-4">
                {byInstitution.map(([institution, members]) => (
                  <OutletCard
                    key={institution}
                    institution={institution}
                    members={members}
                  />
                ))}
              </ul>
            )}
          </>
        )}

        {!registry.isLoading && !searching && all.length === 0 && (
          <div className="rounded-2xl border border-[var(--line)] bg-white p-12 text-center">
            <Info className="mx-auto h-8 w-8 text-[var(--muted-fg)]" />
            <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
              Le registre est encore vide
            </p>
            <p className="mt-2 text-[13.5px] text-[var(--slate)]">
              Aucune carte de presse en cours de validité n&apos;a encore été
              délivrée.
            </p>
          </div>
        )}

        {/* ══ what this register is, and is not ══ */}
        <div className="relative mt-14 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6">
          <Guilloche
            className="pointer-events-none absolute -bottom-28 -right-24 h-72 w-72 text-[var(--green-900)] opacity-[0.03]"
            rings={30}
          />
          <div className="relative z-10 flex items-start gap-3.5">
            <ShieldCheck className="mt-0.5 h-5 w-5 flex-none text-[var(--green-600)]" />
            <div>
              <p className="text-[13.5px] font-extrabold text-[var(--green-900)]">
                Ce que contient ce registre
              </p>
              <p className="mt-2 text-[13px] leading-relaxed text-[var(--slate)]">
                Les titulaires d&apos;une carte de presse <b>en cours de
                validité</b> à la date indiquée. Les cartes expirées,
                suspendues ou retirées n&apos;y figurent pas. Le registre ne
                comporte ni photographie ni coordonnées : pour confirmer
                l&apos;identité du porteur d&apos;une carte,{" "}
                <b>scannez le code figurant au recto</b>.
              </p>
              <p dir="rtl" lang="ar" className="mt-3.5 text-[13px] leading-[1.9] text-[var(--slate)]">
                يتضمن هذا السجل حاملي البطاقة الصحفية السارية المفعول. للتحقق من
                هوية حامل البطاقة، امسح الرمز الموجود على وجهها.
              </p>
              <p className="mt-4 text-[12.5px] text-[var(--muted-fg)]">
                Une question sur une accréditation ?{" "}
                <Link href={routes.publicSessions}
                  className="font-semibold text-[var(--green-700)] underline underline-offset-2">
                  Consulter les sessions
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ONE ENTRY IN THE ROLL — compact, two per row

   Deliberately quieter than a search result: this is a name being SCANNED
   past, not an answer being read. The seal and the full record appear only
   when it is the thing you were looking for.
   ══════════════════════════════════════════════════════════════════ */

function RollEntry({ journalist }: { journalist: PublicJournalist }) {
  return (
    <li className="group relative overflow-hidden rounded-xl border border-[var(--line)] bg-white px-4 py-3 transition-all hover:-translate-y-px hover:border-[var(--green-500)]/45 hover:shadow-[0_12px_28px_-20px_rgba(11,46,31,.65)]">
      {/* the edge lights on hover — the register acknowledging the entry */}
      <span
        className="absolute inset-y-0 left-0 w-[2.5px] origin-top scale-y-0 transition-transform duration-300 group-hover:scale-y-100"
        style={{ background: "linear-gradient(180deg, var(--gold-500), var(--green-500))" }}
        aria-hidden="true"
      />

      <p className="truncate text-[14px] font-bold text-[var(--green-900)]">
        {journalist.fullName}
      </p>

      <p className="mt-0.5 flex items-center gap-2 text-[11.5px] text-[var(--slate)]">
        <span className="truncate">
          {journalist.specialisationFr ?? journalist.categoryLabelFr ?? "—"}
        </span>
        {journalist.institution && (
          <>
            <span className="flex-none opacity-35">·</span>
            <span className="truncate opacity-80">{journalist.institution}</span>
          </>
        )}
      </p>

      <p className="mt-1.5 font-mono text-[10.5px] tracking-tight text-[var(--muted-fg)]">
        {journalist.cardNumber}
      </p>
    </li>
  );
}

/* ══ one outlet, with its newsroom ══ */

function OutletCard({
  institution, members,
}: {
  institution: string;
  members: PublicJournalist[];
}) {
  const named = institution !== "—";

  return (
    <li className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <Guilloche
        className="pointer-events-none absolute -right-20 -top-20 h-56 w-56 text-[var(--green-900)] opacity-[0.035]"
        rings={24}
      />

      {/* the masthead band */}
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
        <p className="min-w-0 flex-1 truncate text-[14.5px] font-extrabold">
          {named ? institution : "Organe non précisé"}
        </p>
        <span className="flex-none rounded-full bg-white/10 px-3 py-1 font-mono text-[11px] font-bold text-white/85 ring-1 ring-inset ring-white/20">
          {members.length}
        </span>
      </div>

      <ul className="relative divide-y divide-[#f2f5f3]">
        {members.map((j) => (
          <li key={j.cardNumber}
            className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5 px-5 py-3 transition-colors hover:bg-[#fbfcfb]">
            <span className="text-[13.5px] font-bold text-[var(--green-900)]">
              {j.fullName}
            </span>
            {j.specialisationFr && (
              <span className="flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
                <Briefcase className="h-3 w-3 opacity-50" />
                {j.specialisationFr}
              </span>
            )}
            <span className="ml-auto flex items-baseline gap-3">
              <span className="font-mono text-[11px] text-[var(--muted-fg)]">
                {j.cardNumber}
              </span>
              <span className="hidden text-[11px] text-[var(--muted-fg)] sm:inline">
                → {longFr(j.expiresAt)}
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

function RegisterEntry({ journalist }: { journalist: PublicJournalist }) {
  return (
    <li className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all hover:border-[var(--green-500)]/40 hover:shadow-[0_14px_36px_-24px_rgba(11,46,31,.7)]">
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{ background: "linear-gradient(180deg, var(--gold-500), var(--green-500))" }}
        aria-hidden="true"
      />

      <div className="flex flex-wrap items-start gap-4 py-5 pl-6 pr-5">
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
          <p className="text-[16.5px] font-extrabold leading-tight text-[var(--green-900)]">
            {journalist.fullName}
          </p>

          <p className="mt-1.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-[12.5px] text-[var(--slate)]">
            {journalist.specialisationFr && (
              <span className="flex items-center gap-1.5">
                <Briefcase className="h-3 w-3 opacity-55" />
                {journalist.specialisationFr}
              </span>
            )}
            {journalist.institution && (
              <span className="flex items-center gap-1.5">
                <Building2 className="h-3 w-3 opacity-55" />
                {journalist.institution}
              </span>
            )}
          </p>

          {journalist.categoryLabelFr && (
            <span className="mt-2.5 inline-flex items-center gap-1.5 rounded-full bg-[var(--green-tint)] px-3 py-1 text-[11.5px] font-bold text-[var(--green-700)]">
              {journalist.categoryLabelFr}
              {journalist.categoryLabelAr && (
                <span dir="rtl" lang="ar" className="font-semibold opacity-55">
                  {journalist.categoryLabelAr}
                </span>
              )}
            </span>
          )}
        </div>

        <div className="flex-none text-right">
          <p className="font-mono text-[13px] font-bold tracking-tight text-[var(--green-900)]">
            {journalist.cardNumber}
          </p>
          <p className="mt-1.5 text-[11px] uppercase tracking-[0.1em] text-[var(--muted-fg)]">
            valable jusqu&apos;au
          </p>
          <p className="text-[12px] font-semibold text-[var(--slate)]">
            {longFr(journalist.expiresAt)}
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

function EmptyResult() {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-9 text-center">
      <Guilloche
        className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 text-[var(--green-900)] opacity-[0.035]"
        rings={28}
      />
      <div className="relative z-10">
        <Info className="mx-auto h-8 w-8 text-[var(--muted-fg)]" />
        <p className="mt-4 text-[16px] font-extrabold text-[var(--green-900)]">
          Personne ne correspond à cette recherche
        </p>
        {/* Someone searching a name and finding nothing must not conclude
            "this person is a fraud". They may be accredited under a different
            spelling, their card may have lapsed, or they may indeed hold
            nothing — very different things to say about a journalist. */}
        <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-[var(--slate)]">
          Le registre reprend le nom tel qu&apos;il figure sur la carte :
          vérifiez l&apos;orthographe. Une absence de résultat ne signifie pas
          qu&apos;une carte est fausse — elle peut aussi être expirée,
          suspendue, ou établie sous une autre graphie.
        </p>

        <div className="mx-auto mt-6 flex max-w-sm items-start gap-3 rounded-xl border border-[var(--line)] bg-[#fbfcfb] p-4 text-left">
          <QrCode className="mt-0.5 h-4 w-4 flex-none text-[var(--green-700)]" />
          <p className="text-[12.5px] leading-relaxed text-[var(--slate)]">
            Pour vérifier une carte que vous avez entre les mains, scannez le
            code figurant au recto : il indique son statut en temps réel.
          </p>
        </div>
      </div>
    </div>
  );
}
