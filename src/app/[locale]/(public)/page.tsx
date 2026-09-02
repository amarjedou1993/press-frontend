import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, ShieldCheck, Languages, BadgeCheck } from "lucide-react";
import { fetchOpenSessions, fetchCategories } from "@/lib/api/public";
import { routes } from "@/lib/routes";
import { Link } from "@/i18n/navigation";
import { PressCard } from "@/components/public/PressCard";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule, Overline,
} from "@/components/public/patterns";

export const revalidate = 60;

export async function generateMetadata() {
  const t = await getTranslations("home");
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function LandingPage() {
  const locale = await getLocale();
  const t = await getTranslations("home");

  const [sessions, categories] = await Promise.all([
    fetchOpenSessions(),
    fetchCategories(),
  ]);
  const open = sessions.length > 0;
  const arabic = locale === "ar";

  /**
   * "ar" rather than "ar-MR": Mauritanian Arabic uses Western digits, and the
   * country tag introduces eastern ones on some platforms. The printed card
   * uses Western digits, and a date on screen must match it.
   */
  const fmtLong = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(arabic ? "ar" : "fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

  const STEPS = ["open", "submit", "review", "issue"] as const;

  const GUARANTEES = [
    { key: "data", Icon: ShieldCheck },
    { key: "bilingual", Icon: Languages },
    { key: "registry", Icon: BadgeCheck },
  ] as const;

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
        {/* engraved rosettes — rtl-mirror keeps the COMPOSITION rather than
            the coordinates: the large one at the far edge, the gold one
            behind the text, whichever direction that is. */}
        <Guilloche className="rtl-mirror pointer-events-none absolute -right-40 -top-56 h-[720px] w-[720px] text-white opacity-[0.055]" rings={54} />
        <Guilloche className="rtl-mirror pointer-events-none absolute -bottom-72 -left-52 h-[560px] w-[560px] text-[var(--gold-500)] opacity-[0.05]" rings={38} />
        {/* fine security hatching */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-20 lg:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1.08fr_1fr]">
            {/* ── headline column ── */}
            <div className="reveal min-w-0">
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
                  <i className="h-4 w-1.5 rounded-full bg-[var(--green-500)]" />
                  <i className="h-4 w-1.5 rounded-full bg-[var(--gold-500)]" />
                  <i className="h-4 w-1.5 rounded-full bg-[var(--red-500)]" />
                </span>
                <p className="text-[10.5px] font-bold uppercase tracking-[0.24em] text-white/55">
                  {t("republic")}
                </p>
              </div>

              <div className="mt-8 flex gap-6">
                <h1 className="text-[clamp(40px,6.4vw,74px)] font-extrabold leading-[0.94] tracking-[-0.02em]">
                  {t.rich("title", {
                    gold: (c) => <span className="text-[var(--gold-500)]">{c}</span>,
                    br: () => <br />,
                  })}
                </h1>

                {/* THE VERTICAL ORNAMENT CARRIES THE OTHER LANGUAGE.
                    This is the page's masthead, and a masthead names the state
                    in both — so it stays, and it swaps. In French the Arabic
                    runs down the edge; in Arabic the French does. */}
                <p
                  dir={arabic ? "ltr" : "rtl"}
                  lang={arabic ? "fr" : "ar"}
                  className="hidden self-stretch border-e border-white/15 pe-5 text-[15px] font-semibold leading-[2.1] text-white/45 sm:block"
                  style={{ writingMode: "vertical-rl", letterSpacing: arabic ? "0.06em" : 0 }}
                >
                  {t("titleVertical")}
                </p>
              </div>

              <p className="mt-7 max-w-xl text-[16px] leading-[1.75] text-white/65">
                {t("lede")}
              </p>

              {/*
                ⚠️ THE STATUS PANEL APPEARS ONLY WHEN A SESSION IS OPEN.

                The ribbon at the top of every public page already carries this
                status and this link. Repeating them in the hero says the same
                thing twice — and when nothing is open it says "Aucune session
                ouverte · Consulter les sessions", inviting a visitor to a page
                that will say it a third time and show an empty list.

                Its absence is not a gap: the ribbon is still there, three
                centimetres above. What the hero adds when a session IS open is
                the closing date, in full — the one fact worth repeating,
                because it is what turns interest into an application.
              */}
              {open && (
                <div className="mt-9 inline-flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-white/12 bg-black/25 px-5 py-3.5 backdrop-blur-sm">
                  <span className="flex items-center gap-2.5">
                    <span
                      className="h-2 w-2 flex-none rounded-full bg-[var(--green-500)] shadow-[0_0_0_4px_rgba(0,169,92,.22)] motion-safe:animate-pulse"
                      aria-hidden="true"
                    />
                    <span className="text-[13.5px] font-semibold">
                      {t("openUntil", { date: fmtLong(sessions[0].receivingEnd) })}
                    </span>
                  </span>
                  <Link
                    href={routes.publicSessions}
                    className="inline-flex items-center gap-1 text-[13px] font-bold text-[var(--gold-500)] underline decoration-[var(--gold-500)]/40 underline-offset-4 transition-colors hover:text-white hover:decoration-white/60"
                  >
                    {t("seeSessions")} <ArrowRight className="rtl-flip h-3.5 w-3.5" />
                  </Link>
                </div>
              )}

              {/* ⚠️ BOTH BUTTONS STAY, open or not.
                  Registering BEFORE a session opens is the sensible order: a
                  candidate needs a complete profile and a verified address
                  before they can apply, and a closed session is exactly when
                  there is time to do it. Hiding the invitation would push
                  everyone into the fortnight when the queue is longest. */}
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href={routes.auth.register}
                  className="group inline-flex items-center gap-2 rounded-xl bg-white px-7 py-3.5 text-[14px] font-bold text-[var(--green-900)] shadow-[0_12px_30px_-12px_rgba(255,255,255,.4)] transition-all hover:-translate-y-0.5 hover:shadow-[0_18px_40px_-14px_rgba(255,255,255,.5)]"
                >
                  {t("cta")}
                  <ArrowRight className="rtl-flip h-4 w-4" />
                </Link>
                <Link
                  href={routes.auth.login}
                  className="inline-flex items-center rounded-xl border border-white/25 px-7 py-3.5 text-[14px] font-bold text-white transition-colors hover:border-white/45 hover:bg-white/10"
                >
                  {t("candidateSpace")}
                </Link>
              </div>
            </div>

            {/* ── specimen column ── */}
            <div className="reveal reveal-2 min-w-0 justify-self-center lg:justify-self-end">
              <div className="relative w-[min(430px,88vw)]">
                {/* -left-14 is a physical offset: mirrored so the seal always
                    overlaps the card's outer corner. */}
                <OfficialSeal
                  className="rtl-mirror pointer-events-none absolute -left-14 -top-14 z-20 hidden h-32 w-32 opacity-95 drop-shadow-[0_8px_20px_rgba(0,0,0,.45)] xl:block"
                  color="var(--gold-500)"
                  id="hero-seal"
                />
                {/* ⚠️ The card is NOT mirrored. It is a physical object with a
                    fixed layout — Arabic already leads on it, and flipping it
                    would show a card that does not exist. */}
                <PressCard />
                <p className="mt-6 text-center text-[10.5px] font-semibold uppercase tracking-[0.2em] text-white/35">
                  {t("specimen")}
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
        <Overline index="01">{t("procedureOverline")}</Overline>
        <h2 className="mt-5 max-w-2xl text-[clamp(26px,3.4vw,36px)] font-extrabold leading-[1.15] tracking-[-0.015em] text-[var(--green-900)]">
          {t("procedureTitle")}
        </h2>

        <ol className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-[var(--line)] bg-[var(--line)] md:grid-cols-4">
          {STEPS.map((key, i) => (
            <li key={key} className="group relative min-w-0 bg-white p-7 transition-colors hover:bg-[var(--green-tint)]/40">
              <span className="font-mono text-[26px] font-extrabold leading-none text-[var(--green-900)]/12 transition-colors group-hover:text-[var(--green-600)]/30">
                0{i + 1}
              </span>
              <h3 className="mt-4 text-[15px] font-extrabold leading-snug text-[var(--green-900)]">
                {t(`steps.${key}.title`)}
              </h3>
              <p className="mt-3 text-[13.5px] leading-relaxed text-[var(--slate)]">
                {t(`steps.${key}.body`)}
              </p>
              {/* inset-x keeps the rule centred; the scale grows from the
                  reading edge. */}
              <span className="absolute inset-x-7 bottom-0 h-[3px] origin-[inline-start] scale-x-0 bg-[var(--gold-500)] transition-transform duration-300 group-hover:scale-x-100" aria-hidden="true" />
            </li>
          ))}
        </ol>
      </section>

      {/* ══ CATÉGORIES ════════════════════════════════════════ */}
      {categories.length > 0 && (
        <section className="border-y border-[var(--line)] bg-white">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <Overline index="02">{t("categoriesOverline")}</Overline>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {categories.map((c, i) => (
                <article
                  key={c.id}
                  className="relative min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] p-7 transition-shadow hover:shadow-[0_18px_40px_-24px_rgba(11,46,31,.35)]"
                >
                  <Guilloche
                    className="rtl-mirror pointer-events-none absolute -right-10 -top-12 h-40 w-40 text-[var(--green-700)] opacity-[0.06]"
                    rings={26}
                  />
                  <span className="relative font-mono text-[11px] font-bold text-[var(--gold-700)]">
                    0{i + 1}
                  </span>
                  {/* ONE language. A category name is functional text, and the
                      reader has chosen how to read it. */}
                  <h3 className="relative mt-3 text-[16px] font-extrabold leading-snug text-[var(--green-900)]">
                    {arabic ? c.labelAr : c.labelFr}
                  </h3>
                  <TricolorRule className="relative mt-6 w-16 rounded-full" thin />
                </article>
              ))}
            </div>
            <p className="mt-8 max-w-2xl text-[13.5px] leading-relaxed text-[var(--slate)]">
              {t("categoriesNote")}
            </p>
          </div>
        </section>
      )}

      {/* ══ GARANTIES ═════════════════════════════════════════ */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <Overline index="03">{t("guaranteesOverline")}</Overline>
        <div className="mt-10 grid gap-10 md:grid-cols-3">
          {GUARANTEES.map(({ key, Icon }) => (
            <div key={key} className="min-w-0">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--green-tint)]">
                <Icon className="h-[19px] w-[19px] text-[var(--green-700)]" />
              </span>
              <h3 className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
                {t(`guarantees.${key}.title`)}
              </h3>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-[var(--slate)]">
                {t(`guarantees.${key}.body`)}
              </p>
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
          {/* centred, so no mirroring needed */}
          <Guilloche className="pointer-events-none absolute -bottom-40 left-1/2 h-[420px] w-[420px] -translate-x-1/2 text-white opacity-[0.07]" rings={40} />
          <div className="relative z-10">
            <OfficialSeal className="mx-auto h-20 w-20 opacity-90" color="var(--gold-500)" id="cta-seal" />
            <h2 className="mt-7 text-[clamp(24px,3.2vw,34px)] font-extrabold leading-tight tracking-[-0.015em]">
              {t("ctaTitle")}
            </h2>
            <p className="mx-auto mt-3 max-w-lg text-[14.5px] leading-relaxed text-white/65">
              {t("ctaBody")}
            </p>
            <Link
              href={routes.auth.register}
              className="group mt-9 inline-flex items-center gap-2 rounded-xl bg-white px-8 py-4 text-[14px] font-bold text-[var(--green-900)] transition-all hover:-translate-y-0.5"
            >
              {t("ctaButton")}
              <ArrowRight className="rtl-flip h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
