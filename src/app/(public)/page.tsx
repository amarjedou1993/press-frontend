// src/app/(public)/page.tsx  →  /
// Server component + ISR. Complete HTML on the first byte, indexable, fast on
// a weak connection — and it reads like an official publication rather than a
// product page: numbered sections, security-print motifs, editorial type, and
// Arabic set as composition rather than as a translation footnote.

import Link from "next/link";
import { ArrowRight, ShieldCheck, Languages, BadgeCheck } from "lucide-react";
import { fetchOpenSessions, fetchCategories } from "@/lib/api/public";
import { routes } from "@/lib/routes";
import { PressCard } from "@/components/public/PressCard";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule, Overline,
} from "@/components/public/patterns";

export const revalidate = 60;

export const metadata = {
  title: "HAPA — Accréditation presse | République Islamique de Mauritanie",
  description:
    "Demandez votre carte de presse auprès de la Haute Autorité de la Presse et de l'Audiovisuel. Dépôt en ligne, suivi de dossier, délivrance officielle.",
};

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

const STEPS = [
  { n: "01", t: "Ouverture d'une session", ar: "فتح الدورة",
    d: "La HAPA ouvre une session de candidature et en publie le calendrier." },
  { n: "02", t: "Dépôt du dossier", ar: "إيداع الملف",
    d: "Vous créez votre compte et soumettez vos pièces justificatives en ligne." },
  { n: "03", t: "Examen par la commission", ar: "دراسة اللجنة",
    d: "La commission étudie votre dossier ; une correction peut être demandée." },
  { n: "04", t: "Délivrance de la carte", ar: "تسليم البطاقة",
    d: "En cas d'acceptation, votre carte bilingue est éditée par la HAPA." },
];

export default async function LandingPage() {
  const [sessions, categories] = await Promise.all([
    fetchOpenSessions(),
    fetchCategories(),
  ]);
  const open = sessions.length > 0;

  return (
    <>
      {/* ══ HERO ══════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(1100px 520px at 78% -20%, rgba(255,215,0,.13), transparent 62%), radial-gradient(800px 600px at -12% 120%, rgba(0,169,92,.24), transparent 58%), linear-gradient(168deg, #08251a 0%, var(--green-900) 45%, #0d3a27 100%)",
        }}
      >
        {/* engraved rosettes */}
        <Guilloche className="pointer-events-none absolute -right-40 -top-56 h-[720px] w-[720px] text-white opacity-[0.055]" rings={54} />
        <Guilloche className="pointer-events-none absolute -bottom-72 -left-52 h-[560px] w-[560px] text-[var(--gold-500)] opacity-[0.05]" rings={38} />
        {/* fine security hatching */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-20 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_1fr]">
            {/* ── headline column ── */}
            <div className="reveal">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
                  <i className="h-4 w-1.5 rounded-full bg-[var(--green-500)]" />
                  <i className="h-4 w-1.5 rounded-full bg-[var(--gold-500)]" />
                  <i className="h-4 w-1.5 rounded-full bg-[var(--red-500)]" />
                </span>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-white/55">
                  République Islamique de Mauritanie
                </p>
              </div>

              <div className="mt-8 flex gap-6">
                <h1 className="text-[clamp(40px,6.4vw,74px)] font-extrabold leading-[0.94] tracking-[-0.02em]">
                  La carte
                  <br />
                  de presse
                  <br />
                  <span className="text-[var(--gold-500)]">officielle</span>
                </h1>
                {/* Arabic as a vertical ornament, not a footnote */}
                <p
                  dir="rtl"
                  className="hidden self-stretch border-r border-white/15 pr-5 text-[15px] font-semibold leading-[2.1] text-white/45 sm:block"
                  style={{ writingMode: "vertical-rl" }}
                >
                  البطاقة الصحفية الرسمية
                </p>
              </div>

              <p className="mt-7 max-w-xl text-[16px] leading-[1.75] text-white/65">
                La Haute Autorité de la Presse et de l&apos;Audiovisuel délivre la
                carte de presse aux journalistes exerçant en Mauritanie. Déposez
                votre demande en ligne et suivez chaque étape de son instruction.
              </p>

              {/* live status */}
              <div className="mt-9 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/12 bg-black/25 px-5 py-3.5 backdrop-blur-sm">
                <span className="flex items-center gap-2.5">
                  <span
                    className={`h-2 w-2 rounded-full ${open ? "bg-[var(--green-500)] shadow-[0_0_0_4px_rgba(0,169,92,.22)] motion-safe:animate-pulse" : "bg-white/25"}`}
                    aria-hidden="true"
                  />
                  <span className="text-[13.5px] font-semibold">
                    {open
                      ? `Candidatures ouvertes jusqu'au ${fmtLong(sessions[0].receivingEnd)}`
                      : "Aucune session ouverte actuellement"}
                  </span>
                </span>
                <Link
                  href={routes.publicSessions}
                  className="inline-flex items-center gap-1 text-[13px] font-bold text-[var(--gold-500)] underline decoration-[var(--gold-500)]/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
                >
                  Consulter les sessions <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={routes.auth.register}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-bold text-[var(--green-900)] shadow-[0_12px_30px_-12px_rgba(255,255,255,.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(255,255,255,.5)]"
                >
                  Déposer une demande
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
                <Link
                  href={routes.auth.login}
                  className="inline-flex items-center rounded-xl border border-white/25 px-7 py-3.5 text-[14px] font-bold text-white transition-colors hover:border-white/45 hover:bg-white/10"
                >
                  Espace candidat
                </Link>
              </div>
            </div>

            {/* ── specimen column ── */}
            <div className="reveal reveal-2 justify-self-center lg:justify-self-end">
              <div className="relative w-[min(430px,88vw)]">
                <OfficialSeal
                  className="pointer-events-none absolute -left-14 -top-14 z-20 hidden h-32 w-32 opacity-95 drop-shadow-[0_8px_20px_rgba(0,0,0,.45)] xl:block"
                  color="var(--gold-500)"
                  id="hero-seal"
                />
                <PressCard />
                <p className="mt-6 text-center text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  Spécimen — carte de presse bilingue
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* woven band closing the hero */}
        <GuillocheBand className="pointer-events-none absolute inset-x-0 bottom-0 h-20 text-white opacity-[0.09]" lines={9} />
        <TricolorRule className="absolute inset-x-0 bottom-0" />
      </section>

      {/* microprint seam */}
      <MicroprintRule className="border-b border-[var(--line)] bg-white py-1.5 text-[var(--green-700)] opacity-30" repeat={14} />

      {/* ══ PROCÉDURE ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Overline index="01">La procédure</Overline>
        <h2 className="mt-5 max-w-2xl text-[clamp(26px,3.4vw,36px)] font-extrabold leading-[1.15] tracking-[-0.015em] text-[var(--green-900)]">
          Quatre étapes, de la candidature à la carte
        </h2>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {STEPS.map((s) => (
            <li key={s.n} className="group relative bg-white p-7 transition-colors hover:bg-[var(--green-tint)]/40">
              <span className="font-mono text-[26px] font-extrabold leading-none text-[var(--green-900)]/12 transition-colors group-hover:text-[var(--green-600)]/30">
                {s.n}
              </span>
              <h3 className="mt-4 text-[15px] font-extrabold leading-snug text-[var(--green-900)]">
                {s.t}
              </h3>
              <p dir="rtl" className="mt-1 text-[12.5px] font-semibold text-[var(--green-700)]/65">
                {s.ar}
              </p>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--slate)]">{s.d}</p>
              <span className="absolute inset-x-7 bottom-0 h-[3px] scale-x-0 bg-[var(--gold-500)] transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      {/* ══ CATÉGORIES ════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="border-y border-[var(--line)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Overline index="02">Catégories d&apos;accréditation</Overline>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {categories.map((c, i) => (
                <article
                  key={c.id}
                  className="relative overflow-hidden rounded-2xl border border-[var(--line)] p-7 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(11,46,31,.35)]"
                >
                  <Guilloche
                    className="pointer-events-none absolute -right-10 -top-12 h-40 w-40 text-[var(--green-700)] opacity-[0.06]"
                    rings={26}
                  />
                  <span className="relative font-mono text-[11px] font-bold text-[var(--gold-700)]">
                    0{i + 1}
                  </span>
                  <h3 className="relative mt-3 text-[16px] font-extrabold leading-snug text-[var(--green-900)]">
                    {c.labelFr}
                  </h3>
                  <p dir="rtl" className="relative mt-2 text-[14px] font-semibold text-[var(--green-700)]/70">
                    {c.labelAr}
                  </p>
                  <TricolorRule className="relative mt-6 w-16 rounded-full" thin />
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-[13.5px] leading-relaxed text-[var(--slate)]">
              Les pièces justificatives requises dépendent de votre catégorie ;
              elles vous sont indiquées lors du dépôt, et le système vérifie que
              votre dossier est complet avant soumission.
            </p>
          </div>
        </section>
      )}

      {/* ══ GARANTIES ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Overline index="03">Nos garanties</Overline>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {[
            { Icon: ShieldCheck, t: "Données protégées", ar: "بيانات محمية",
              d: "Vos informations sont traitées exclusivement par la HAPA, dans le cadre de l'instruction de votre dossier." },
            { Icon: Languages, t: "Bilingue français · arabe", ar: "ثنائي اللغة",
              d: "Le service et la carte délivrée sont disponibles dans les deux langues officielles de la République." },
            { Icon: BadgeCheck, t: "Registre officiel", ar: "سجل رسمي",
              d: "Chaque carte délivrée est enregistrée et vérifiable auprès de la Haute Autorité." },
          ].map(({ Icon, t, ar, d }) => (
            <div key={t}>
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--green-tint)]">
                <Icon className="h-[19px] w-[19px] text-[var(--green-700)]" />
              </span>
              <h3 className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">{t}</h3>
              <p dir="rtl" className="mt-0.5 text-[12.5px] font-semibold text-[var(--green-700)]/60">{ar}</p>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--slate)]">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ══ CTA ═══════════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div
          className="relative overflow-hidden rounded-3xl px-8 py-16 text-center text-white"
          style={{
            background:
              "radial-gradient(700px 340px at 50% -30%, rgba(255,215,0,.16), transparent 62%), linear-gradient(158deg, var(--green-900), #0e3d29)",
          }}
        >
          <Guilloche className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 text-white opacity-[0.07]" rings={40} />
          <div className="relative z-10">
            <OfficialSeal className="mx-auto h-20 w-20 opacity-90" color="var(--gold-500)" id="cta-seal" />
            <h2 className="mt-7 text-[clamp(24px,3.2vw,34px)] font-extrabold leading-tight tracking-[-0.015em]">
              Prêt à déposer votre demande ?
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed text-white/65">
              Créez votre compte dès maintenant. Vous serez informé par courriel
              à chaque étape de l&apos;instruction de votre dossier.
            </p>
            <Link
              href={routes.auth.register}
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-[14px] font-bold text-[var(--green-900)] transition-all hover:-translate-y-0.5"
            >
              Créer mon compte
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
