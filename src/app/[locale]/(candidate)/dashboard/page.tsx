"use client";
// src/app/[locale]/(candidate)/dashboard/page.tsx
//
// It answers one question: WHAT SHOULD I DO NOW?
//
// Everything else is subordinate to that. The hero is state-dependent, the
// deadline appears to whoever can still act on it, and the blockers are
// stated as a quantity rather than an exhortation.

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, FileText, User, AlertCircle, Clock, Check,
  CalendarClock, ListChecks, ShieldCheck, ShieldAlert, QrCode,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { DossierProgress } from "@/components/candidate/DossierProgress";
import { IssuedCardPreview } from "@/components/candidate/IssuedCardPreview";
import { Guilloche, OfficialSeal, MicroprintRule } from "@/components/public/patterns";
import {
  listMyApplications, getReadiness, applicationKeys, STATUS_KIND,
  type ApplicationStatus,
} from "@/lib/api/applications";
import { getMyCard, myCardKeys } from "@/lib/api/my-card";
import { listOpenSessions, catalogKeys } from "@/lib/api/sessions-public";
import { getMe, accountKeys } from "@/lib/api/account";
import { routes } from "@/lib/routes";

/**
 * The hero's FIELD, per outcome — good news should not look like bad news.
 *
 * Only the colour lives here; every word comes from the catalogue under the
 * status's own name, so a decision reads in the candidate's language.
 */
const FIELD: Partial<Record<ApplicationStatus, string>> = {
  ACCEPTED:
    "radial-gradient(700px 340px at 85% -25%, rgba(255,215,0,.22), transparent 60%), linear-gradient(158deg, #08301f 0%, #0e4a2e 60%, #0b3a24 100%)",
  CARD_ISSUED:
    "radial-gradient(700px 340px at 85% -25%, rgba(255,215,0,.24), transparent 60%), linear-gradient(158deg, #08301f 0%, #0e4a2e 60%, #0b3a24 100%)",
  REJECTED:
    "radial-gradient(700px 340px at 85% -25%, rgba(208,28,31,.20), transparent 60%), linear-gradient(158deg, #2a1114 0%, #221a19 60%, #1a1512 100%)",
  FINAL_REJECTION:
    "radial-gradient(700px 340px at 85% -25%, rgba(208,28,31,.20), transparent 60%), linear-gradient(158deg, #2a1114 0%, #221a19 60%, #1a1512 100%)",
  CORRECTION_REQUESTED:
    "radial-gradient(700px 340px at 85% -25%, rgba(255,215,0,.26), transparent 60%), linear-gradient(158deg, #33290a 0%, #2c2408 60%, #1f1a06 100%)",
};

/**
 * ⚠️ THE CARD'S FIELD OVERRIDES THE DOSSIER'S.
 *
 * A dossier reaches CARD_ISSUED and never moves again; a suspension or
 * withdrawal afterwards lives on the CARD. Without this, someone whose card
 * had just been revoked opened their dashboard to a GREEN hero announcing
 * "Carte de presse éditée" — the system congratulating them on the credential
 * it had taken away.
 */
const CARD_FIELD: Record<string, string> = {
  SUSPENDED:
    "radial-gradient(700px 340px at 85% -25%, rgba(255,215,0,.26), transparent 60%), linear-gradient(158deg, #33290a 0%, #2c2408 60%, #1f1a06 100%)",
  REVOKED:
    "radial-gradient(700px 340px at 85% -25%, rgba(208,28,31,.20), transparent 60%), linear-gradient(158deg, #2a1114 0%, #221a19 60%, #1a1512 100%)",
  // Ash. Expiry is not a sanction — every card expires, and the holder did
  // nothing wrong.
  EXPIRED:
    "radial-gradient(700px 340px at 85% -25%, rgba(255,255,255,.06), transparent 62%), linear-gradient(158deg, #2b3833 0%, #222d29 55%, #1b2420 100%)",
};

const DEFAULT_FIELD =
  "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)";

/** Which states get a coloured call to action rather than white on green. */
const CTA_SOLID: Partial<Record<ApplicationStatus, string>> = {
  CORRECTION_REQUESTED: "var(--gold-700)",
  REJECTED: "var(--red-500)",
  FINAL_REJECTION: "var(--red-500)",
};

const CARD_CTA_SOLID: Record<string, string> = {
  SUSPENDED: "var(--gold-700)",
  REVOKED: "var(--red-500)",
};

function daysUntil(iso: string) {
  const end = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86_400_000);
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const th = useTranslations("dashboardHero");
  const tc = useTranslations("cardStatus");
  const locale = useLocale();
  const format = useFormatter();
  const arabic = locale === "ar";

  const me = useQuery({ queryKey: accountKeys.me, queryFn: getMe });
  const applications = useQuery({ queryKey: applicationKeys.all, queryFn: listMyApplications });
  const sessions = useQuery({ queryKey: catalogKeys.openSessions, queryFn: listOpenSessions });

  const current = applications.data?.[0];
  const openSession = sessions.data?.[0];
  const left = openSession ? daysUntil(openSession.receivingEnd) : null;

  /* What is stopping submission. Only while the dossier is still the
     candidate's to change. */
  const readiness = useQuery({
    queryKey: applicationKeys.readiness(current?.id ?? 0),
    queryFn: () => getReadiness(current!.id),
    enabled: !!current && current.status === "DRAFT",
  });

  /* The holder's own card — number, category and validity. 204 when none. */
  const myCard = useQuery({
    queryKey: myCardKeys.card,
    queryFn: getMyCard,
    enabled: !!current
      && (current.status === "ACCEPTED" || current.status === "CARD_ISSUED"),
  });

  const loading = me.isLoading || applications.isLoading || sessions.isLoading;
  const blockers = readiness.data?.blockers ?? [];
  const isDraft = current?.status === "DRAFT";
  const accepted = current?.status === "ACCEPTED" || current?.status === "CARD_ISSUED";
  const issuedCard = current?.status === "CARD_ISSUED";
  const card = myCard.data;

  /**
   * The card's state, when it says something the dossier cannot.
   *
   * ⚠️ Only once a card EXISTS. An ACCEPTED dossier awaiting issuance has no
   * card, and must not be dressed as a sanction.
   */
  const cardOverride = card && CARD_FIELD[card.status] ? card.status : null;
  const cardWithheld = !!card && card.usable === false;

  /** The catalogue block the hero reads. */
  const heroKey = cardOverride ? `card.${cardOverride}` : current?.status;

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    return isNaN(d.getTime()) ? "—" : format.dateTime(d, "long");
  };

  // The deadline matters MOST to someone with an unfinished draft — which is
  // exactly who used not to see it.
  const showCountdown = left !== null && left >= 0 && (!current || isDraft);
  const urgent = showCountdown && left! <= 3;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {loading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (
        <section
          className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-34px_rgba(11,46,31,.85)]"
          style={{
            background: cardOverride
              ? CARD_FIELD[cardOverride]
              : (current && FIELD[current.status]) ?? DEFAULT_FIELD,
          }}
        >
          <Guilloche
            className="rtl-mirror pointer-events-none absolute -right-24 -top-28 h-[340px] w-[340px] text-white opacity-[0.06]"
            rings={34}
          />
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
            aria-hidden="true"
          />

          <div className="relative z-10 p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <OfficialSeal
                    className="h-5 w-5 flex-none opacity-80"
                    color="var(--gold-500)"
                    id="dash-seal"
                  />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
                    {t("eyebrow")}
                  </p>
                </div>

                {current ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="engraved-dark text-[27px] font-extrabold leading-tight tracking-tight">
                        {th(`${heroKey}.headline`)}
                      </h2>
                      <span dir="ltr" className="font-mono text-[11.5px] text-white/35">
                        {t("dossierNo", { id: current.id })}
                      </span>
                    </div>
                    <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                      {th(`${heroKey}.body`)}
                    </p>
                  </>
                ) : openSession ? (
                  <>
                    <h2 className="engraved-dark mt-3 text-[27px] font-extrabold leading-tight tracking-tight">
                      {t("sessionOpenTitle")}
                    </h2>
                    <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                      {t.rich("sessionOpenBody", {
                        date: fmtDate(openSession.receivingEnd),
                        b: (c) => <b className="font-semibold text-white/90">{c}</b>,
                      })}
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="engraved-dark mt-3 text-[27px] font-extrabold leading-tight tracking-tight">
                      {t("noSessionTitle")}
                    </h2>
                    <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                      {t("noSessionBody")}
                    </p>
                  </>
                )}
              </div>

              {/* THE DEADLINE — shown to whoever can still act on it. */}
              {showCountdown && (
                <div
                  className="flex-none rounded-xl px-5 py-4 text-center"
                  style={{
                    background: urgent ? "rgba(208,28,31,.20)" : "rgba(0,0,0,.22)",
                    boxShadow: `inset 0 0 0 1px ${urgent ? "rgba(208,28,31,.5)" : "rgba(255,255,255,.14)"}`,
                  }}
                >
                  <p className="font-mono text-[32px] font-extrabold leading-none"
                    style={{ color: urgent ? "#ff9b9d" : "#fff" }}>
                    {left}
                  </p>
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
                    {t("daysRemaining", { count: left! })}
                  </p>
                  {isDraft && (
                    <p className="mt-2 border-t border-white/15 pt-2 text-[9px] font-semibold uppercase tracking-wide text-white/40">
                      {t("toSubmit")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ⚠️ The rail is hidden once the CARD has been withheld. It shows
                the dossier's four stages ending in "Décision" — a completed
                journey, in green, beneath a withdrawal notice. The dossier did
                complete; saying so here would only contradict the headline. */}
            {current && !cardOverride && (
              <div className="mt-7 rounded-xl bg-black/25 px-5 py-5">
                <DossierProgress status={current.status} />
              </div>
            )}

            {/* WHAT IS BLOCKING SUBMISSION — a quantity, not an exhortation. */}
            {isDraft && !readiness.isLoading && (
              <div className="mt-5 flex flex-wrap items-center gap-3 rounded-xl border border-white/12 bg-black/25 px-5 py-3.5">
                {blockers.length === 0 ? (
                  <>
                    <Check className="h-4 w-4 flex-none text-[var(--green-500)]" />
                    <p className="min-w-0 flex-1 text-[13px] font-semibold">
                      {t("readyToSubmit")}
                    </p>
                  </>
                ) : (
                  <>
                    <ListChecks className="h-4 w-4 flex-none text-[var(--gold-500)]" />
                    <p className="min-w-0 flex-1 text-[13px]">
                      {t.rich("conditionsRemain", {
                        count: blockers.length,
                        b: (c) => <b className="font-bold">{c}</b>,
                      })}
                    </p>
                  </>
                )}
              </div>
            )}

            <div className="mt-7">
              {current ? (
                <Link
                  href={routes.candidate.application}
                  className="group inline-flex items-center gap-2 rounded-xl px-6 py-3 text-[14px] font-extrabold transition-all hover:-translate-y-0.5"
                  style={{
                    background: cardOverride
                      ? (CARD_CTA_SOLID[cardOverride] ?? "#fff")
                      : (CTA_SOLID[current.status] ?? "#fff"),
                    color: (cardOverride ? CARD_CTA_SOLID[cardOverride] : CTA_SOLID[current.status])
                      ? "#fff" : "var(--green-900)",
                    boxShadow: "0 12px 28px -14px rgba(0,0,0,.7)",
                  }}
                >
                  {th(`${heroKey}.cta`)}
                  <ArrowRight className="rtl-flip h-4 w-4" />
                </Link>
              ) : openSession ? (
                <Link
                  href={routes.candidate.newApplication}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[var(--gold-500)] px-6 py-3 text-[14px] font-extrabold text-[var(--green-900)] shadow-[0_12px_28px_-14px_rgba(255,215,0,.8)] transition-all hover:-translate-y-0.5 hover:bg-[#ffe14d]"
                >
                  {t("apply")}
                  <ArrowRight className="rtl-flip h-4 w-4" />
                </Link>
              ) : null}
            </div>
          </div>

          <MicroprintRule
            className="relative z-10 pb-1 text-center text-white opacity-[0.12]"
            repeat={14}
          />
          <div className="flex h-1.5" aria-hidden="true">
            <i className="flex-1 bg-[var(--green-500)]" />
            <i className="flex-1 bg-[var(--gold-500)]" />
            <i className="flex-1 bg-[var(--red-500)]" />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          THE CARD — on acceptance, the outcome IS the object.
          ══════════════════════════════════════════════════════════ */}
      {accepted && me.data && (
        <section className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-6 py-4">
            <OfficialSeal
              className="h-5 w-5 flex-none"
              color={cardWithheld ? "var(--red-700)" : "var(--green-700)"}
              id="dash-card-seal"
            />
            {/* ⚠️ THREE STATES. "Votre carte de presse" above a withdrawn card
                reads as though it were still theirs. The panel stays — a
                holder may need to quote the number — but the heading must not
                contradict the notice above it. */}
            <p className="text-[10px] font-bold uppercase tracking-[0.18em]"
              style={{ color: cardWithheld ? "var(--red-700)" : "var(--green-700)" }}>
              {cardWithheld
                ? t("yourCardWithheld")
                : issuedCard ? t("yourCard") : t("yourCardPending")}
            </p>
            <span className="foil-rule h-px flex-1 opacity-40" aria-hidden="true" />
          </div>

          {/* THE CARD BESIDE ITS DETAILS, not filling the page. */}
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,340px)_1fr] md:items-start">
            <IssuedCardPreview
              fullName={me.data.fullName}
              nni={me.data.profile?.nni ?? me.data.profile?.passportNo}
              categoryLabel={arabic ? card?.categoryLabelAr : card?.categoryLabelFr}
              cardNumber={card?.cardNumber}
              validUntil={card?.expiresAt}
              issued={!!issuedCard}
            />

            <div className="min-w-0">
              {/* the record, legible — a card read at 9px is a keepsake, this
                  is the version a holder actually quotes down a telephone */}
              {card ? (
                <>
                  <dl className="divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
                    <Detail label={t("cardNumber")} value={card.cardNumber} mono />
                    <Detail
                      label={t("category")}
                      value={arabic ? card.categoryLabelAr : card.categoryLabelFr}
                    />
                    {(arabic ? card.specialisationAr : card.specialisationFr) && (
                      <Detail
                        label={t("specialisation")}
                        value={arabic ? card.specialisationAr : card.specialisationFr}
                      />
                    )}
                    {card.institution && (
                      // dir="auto": an outlet writes its name in its own script.
                      <Detail label={t("institution")} value={card.institution} auto />
                    )}
                    <Detail label={t("issuedOn")} value={fmtDate(card.issuedAt)} />
                    <Detail label={t("validUntil")} value={fmtDate(card.expiresAt)} />
                  </dl>

                  {/* the status, where it is not simply valid — a holder whose
                      card stops working should learn it here, not at a
                      checkpoint */}
                  <div
                    className="mt-4 flex items-start gap-2.5 rounded-xl px-4 py-3"
                    style={{
                      background: card.usable ? "var(--green-tint)" : "var(--red-tint)",
                    }}
                  >
                    {card.usable ? (
                      <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--green-700)]" />
                    ) : (
                      <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-[var(--red-700)]" />
                    )}
                    <div className="min-w-0">
                      <p className="text-[12.5px] font-extrabold"
                        style={{ color: card.usable ? "var(--green-700)" : "var(--red-700)" }}>
                        {/* From the ENUM, not statusLabelFr — the catalogue
                            has all four in both languages. */}
                        {t("cardIs", { status: tc(card.status).toLowerCase() })}
                      </p>
                      {card.statusReason && (
                        <p dir="auto" className="user-text mt-0.5 whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--red-700)]">
                          {card.statusReason}
                        </p>
                      )}
                      {card.usable && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--green-700)]">
                          {t("verificationConfirms")}
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-[var(--muted-fg)]">
                    <QrCode className="mt-0.5 h-3.5 w-3.5 flex-none" />
                    {t("qrNote")}
                  </p>
                </>
              ) : (
                /* ACCEPTED but not yet issued — say what happens next rather
                   than leaving an empty column. */
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[#fbfcfb] p-5">
                  <p className="text-[13.5px] font-extrabold text-[var(--green-900)]">
                    {t("beingIssuedTitle")}
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--slate)]">
                    {t("beingIssuedBody")}
                  </p>
                  <p className="mt-3 text-[12px] text-[var(--muted-fg)]">
                    {t("previewIndicative")}
                  </p>
                </div>
              )}
            </div>
          </div>

          <MicroprintRule
            className="pb-1.5 text-center text-[var(--green-700)] opacity-[0.09]"
            repeat={14}
          />
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          PREPARATION — two real destinations, not one and a notice.
          ══════════════════════════════════════════════════════════ */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href={routes.candidate.profile}
          className="group relative min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--green-500)]/40 hover:shadow-[0_16px_36px_-24px_rgba(11,46,31,.5)]"
        >
          <Guilloche
            className="rtl-mirror pointer-events-none absolute -right-16 -top-16 h-44 w-44 text-[var(--green-900)] opacity-[0.03]"
            rings={22}
          />
          <div className="relative flex items-start justify-between">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
              <User className="h-[18px] w-[18px] text-[var(--green-700)]" />
            </span>
            {me.data && (
              me.data.profileComplete ? (
                <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green-700)]">
                  <Check className="h-3 w-3" /> {t("complete")}
                </span>
              ) : (
                <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
                  <AlertCircle className="h-3 w-3" /> {t("toComplete")}
                </span>
              )
            )}
          </div>
          <p className="relative mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {t("myProfile")}
          </p>
          <p className="relative mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
            {t("myProfileBody")}
          </p>
          <span className="relative mt-4 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--green-700)]">
            {me.data?.profileComplete ? t("view") : t("fillIn")}
            <ArrowRight className="rtl-flip h-3 w-3" />
          </span>
        </Link>

        <Link
          href={current ? routes.candidate.application : routes.candidate.newApplication}
          className="group relative min-w-0 overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--green-500)]/40 hover:shadow-[0_16px_36px_-24px_rgba(11,46,31,.5)]"
        >
          <Guilloche
            className="rtl-mirror pointer-events-none absolute -right-16 -top-16 h-44 w-44 text-[var(--green-900)] opacity-[0.03]"
            rings={22}
          />
          <div className="relative flex items-start justify-between">
            <span className="flex h-10 w-10 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
              <FileText className="h-[18px] w-[18px] text-[var(--green-700)]" />
            </span>
            {isDraft && !readiness.isLoading && blockers.length > 0 && (
              <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
                {t("toHandle", { count: blockers.length })}
              </span>
            )}
          </div>
          <p className="relative mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {current ? t("myDossier") : t("piecesToPrepare")}
          </p>
          <p className="relative mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
            {t("piecesBody")}
          </p>
          <p dir="ltr" className="relative mt-3 font-mono text-[11px] text-[var(--muted-fg)] rtl:text-end">
            {t("formats")}
          </p>
          <span className="relative mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--green-700)]">
            {current ? t("open") : t("start")}
            <ArrowRight className="rtl-flip h-3 w-3" />
          </span>
        </Link>
      </div>

      {/* ══ previous applications ══ */}
      {applications.data && applications.data.length > 1 && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              {t("previousApplications")}
            </p>
            <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
          </div>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {applications.data.slice(1).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                    {t("dossierNo", { id: a.id })}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted-fg)]">
                    <Clock className="h-3 w-3 flex-none" />
                    {format.dateTime(new Date(a.createdAt), "short")}
                  </p>
                </div>
                <span
                  className="flex-none rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{
                    background: `var(--st-${STATUS_KIND[a.status]}-bg)`,
                    color: `var(--st-${STATUS_KIND[a.status]}-fg)`,
                  }}
                >
                  {/* From the enum — the catalogue has all nine. */}
                  <StatusLabel status={a.status} />
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ══ a status, in the reader's language ══ */

function StatusLabel({ status }: { status: ApplicationStatus }) {
  const t = useTranslations("applicationStatus");
  return <>{t(status)}</>;
}

/* ══ one line of the record ══ */

function Detail({ label, value, mono = false, auto = false }: {
  label: string; value?: string | null; mono?: boolean; auto?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="flex-none text-[11.5px] font-semibold text-[var(--slate)]">
        {label}
      </dt>
      <dd
        dir={mono ? "ltr" : auto ? "auto" : undefined}
        className={`min-w-0 truncate text-end text-[13px] font-bold text-[var(--green-900)] ${mono ? "font-mono tracking-tight" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
