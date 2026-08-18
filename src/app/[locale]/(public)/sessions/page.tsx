import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, CalendarDays, Clock, AlertTriangle } from "lucide-react";
import { fetchOpenSessions, fetchCategories } from "@/lib/api/public";
import { routes } from "@/lib/routes";
import { Link } from "@/i18n/navigation";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule, Overline,
} from "@/components/public/patterns";

export const revalidate = 60;

export async function generateMetadata() {
  const t = await getTranslations("sessions");
  return { title: t("metaTitle"), description: t("metaDescription") };
}

function daysUntil(iso: string) {
  const end = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86_400_000);
}

export default async function PublicSessionsPage() {
  const locale = await getLocale();
  const t = await getTranslations("sessions");
  const arabic = locale === "ar";

  const [sessions, categories] = await Promise.all([
    fetchOpenSessions(),
    fetchCategories(),
  ]);

  /**
   * "ar" rather than "ar-MR": Mauritanian Arabic uses Western digits, and the
   * country tag introduces eastern ones on some platforms. The printed card
   * uses Western digits, and a date on screen must match it.
   */
  const fmtLong = (iso: string) =>
    new Date(iso + "T00:00:00").toLocaleDateString(arabic ? "ar" : "fr-FR", {
      day: "numeric", month: "long", year: "numeric",
    });

  return (
    <>
      {/* ── page header ── */}
      <section
        className="relative overflow-hidden text-white"
        style={{
          background:
            "radial-gradient(800px 380px at 82% -30%, rgba(255,215,0,.12), transparent 62%), linear-gradient(166deg, #08251a, var(--green-900) 70%)",
        }}
      >
        {/* rtl-mirror: the rosette belongs at the far edge, whichever that is */}
        <Guilloche className="rtl-mirror pointer-events-none absolute -right-32 -top-40 h-[520px] w-[520px] text-white opacity-[0.055]" rings={44} />
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
            {/* The other language, as the section's own signature — the same
                pairing the masthead carries, and it swaps with the reader. */}
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
        </div>

        <GuillocheBand className="pointer-events-none absolute inset-x-0 bottom-0 h-16 text-white opacity-[0.08]" lines={7} />
        <TricolorRule className="absolute inset-x-0 bottom-0" />
      </section>

      <MicroprintRule className="border-b border-[var(--line)] bg-white py-1.5 text-[var(--green-700)] opacity-30" repeat={14} />

      {/* ── sessions ── */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <Overline index="01">
          {sessions.length > 0
            ? t("openCount", { count: sessions.length })
            : t("statusOverline")}
        </Overline>

        {sessions.length === 0 ? (
          <div className="reveal mt-10 overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="relative px-8 py-16 text-center">
              {/* centred, so no mirroring needed */}
              <Guilloche className="pointer-events-none absolute left-1/2 top-1/2 h-[340px] w-[340px] -translate-x-1/2 -translate-y-1/2 text-[var(--green-700)] opacity-[0.05]" rings={30} />
              <div className="relative">
                <span className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--green-tint)]">
                  <CalendarDays className="h-6 w-6 text-[var(--green-700)]" />
                </span>
                <h2 className="mt-6 text-[20px] font-extrabold text-[var(--green-900)]">
                  {t("noneTitle")}
                </h2>
                <p className="mx-auto mt-4 max-w-md text-[14px] leading-relaxed text-[var(--slate)]">
                  {t("noneBody")}
                </p>
                <Link
                  href={routes.auth.register}
                  className="group mt-7 inline-flex items-center gap-2 rounded-xl bg-[var(--green-700)] px-6 py-3.5 text-[14px] font-bold text-white transition-all hover:-translate-y-0.5 hover:bg-[var(--green-600)]"
                >
                  {t("createAccount")}
                  <ArrowRight className="rtl-flip h-4 w-4" />
                </Link>
              </div>
            </div>
            <TricolorRule />
          </div>
        ) : (
          <div className="mt-10 space-y-6">
            {sessions.map((s, i) => {
              const left = daysUntil(s.receivingEnd);
              const urgent = left >= 0 && left <= 5;
              return (
                <article
                  key={s.id}
                  className={`reveal reveal-${Math.min(i + 1, 3)} relative overflow-hidden rounded-2xl text-white shadow-[0_24px_60px_-32px_rgba(11,46,31,.7)]`}
                  style={{
                    background:
                      "radial-gradient(680px 320px at 88% -30%, rgba(255,215,0,.15), transparent 62%), linear-gradient(158deg, var(--green-900), #0e3d29 70%)",
                  }}
                >
                  <Guilloche className="rtl-mirror pointer-events-none absolute -right-20 -top-24 h-[320px] w-[320px] text-white opacity-[0.06]" rings={34} />
                  <OfficialSeal
                    className="rtl-mirror pointer-events-none absolute -bottom-8 -right-6 hidden h-40 w-40 opacity-[0.13] sm:block"
                    color="var(--gold-500)"
                    id={`sess-seal-${s.id}`}
                  />

                  <div className="relative z-10 p-8">
                    <div className="flex flex-wrap items-start justify-between gap-6">
                      <div className="min-w-0">
                        <span className="inline-flex items-center gap-2 rounded-full bg-[var(--green-500)] px-3.5 py-1.5 text-[11px] font-extrabold uppercase tracking-wider">
                          <span className="h-1.5 w-1.5 rounded-full bg-white motion-safe:animate-pulse" />
                          {t("openBadge")}
                        </span>

                        <h2 className="mt-5 text-[clamp(21px,2.6vw,27px)] font-extrabold leading-tight">
                          {t("openedOn", { date: fmtLong(s.startDate) })}
                        </h2>

                        <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-3">
                          <div>
                            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/40">
                              {t("opening")}
                            </p>
                            <p className="mt-1 font-mono text-[14px] font-semibold">
                              {fmtLong(s.startDate)}
                            </p>
                          </div>
                          <span className="hidden h-8 w-px bg-white/15 sm:block" aria-hidden="true" />
                          <div>
                            <p className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-[var(--gold-500)]">
                              {t("closing")}
                            </p>
                            <p className="mt-1 font-mono text-[14px] font-semibold">
                              {fmtLong(s.receivingEnd)}
                            </p>
                          </div>
                        </div>

                        {urgent && (
                          <p className="mt-5 inline-flex items-center gap-2 rounded-lg bg-[var(--gold-500)]/15 px-3.5 py-2 text-[12.5px] font-bold text-[var(--gold-500)] ring-1 ring-[var(--gold-500)]/35">
                            <AlertTriangle className="h-3.5 w-3.5 flex-none" />
                            {left === 0 ? t("lastDay") : t("daysLeftWarning", { count: left })}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-none flex-col items-stretch gap-3">
                        <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-4 text-center">
                          <p className="font-mono text-[30px] font-extrabold leading-none">
                            {left > 0 ? left : 0}
                          </p>
                          <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                            {t("daysRemaining", { count: Math.max(left, 0) })}
                          </p>
                        </div>
                        <Link
                          href={routes.auth.register}
                          className="group inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3.5 text-[13.5px] font-bold text-[var(--green-900)] transition-all hover:-translate-y-0.5"
                        >
                          {t("apply")}
                          <ArrowRight className="rtl-flip h-4 w-4" />
                        </Link>
                      </div>
                    </div>

                    <p className="mt-7 flex items-start gap-2 border-t border-white/10 pt-5 text-[12.5px] leading-relaxed text-white/45">
                      <Clock className="mt-0.5 h-3.5 w-3.5 flex-none" />
                      {t("afterClosing")}
                    </p>
                  </div>
                  <TricolorRule />
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── categories reminder ── */}
      {categories.length > 0 && (
        <section className="border-t border-[var(--line)] bg-white">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <Overline index="02">{t("categoriesOverline")}</Overline>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {categories.map((c, i) => (
                <div key={c.id} className="min-w-0 rounded-xl border border-[var(--line)] p-6">
                  <span className="font-mono text-[11px] font-bold text-[var(--gold-700)]">
                    0{i + 1}
                  </span>
                  {/* One language: a category name is functional text. */}
                  <p className="mt-2.5 text-[14.5px] font-extrabold leading-snug text-[var(--green-900)]">
                    {arabic ? c.labelAr : c.labelFr}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
