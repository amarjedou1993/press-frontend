"use client";
// src/app/(candidate)/dashboard/page.tsx
//
// ───────────────────────────────────────────────────────────────────────
// IT ANSWERS ONE QUESTION: WHAT SHOULD I DO NOW?
//
// Everything else on this screen is subordinate to that. So the hero is
// state-dependent, and three things were changed because the previous version
// answered the question incompletely:
//
// 1. THE DEADLINE APPEARS WHEN IT MATTERS MOST, WHICH IS THE OPPOSITE OF
//    BEFORE. The countdown previously showed only when the candidate had NO
//    application — and vanished the moment they started one. A journalist with
//    a half-finished draft and two days left is precisely the person who needs
//    to see the number, and they were the one person it was hidden from.
//
// 2. IT SAYS WHAT IS BLOCKING SUBMISSION. "Compléter mon dossier" is an
//    instruction without a quantity: the candidate had to open another page to
//    learn whether that meant one field or eight documents. The dashboard now
//    calls the readiness endpoint it never used and states the count.
//
// 3. THE CARD APPEARS ON ACCEPTANCE. IssuedCardPreview existed and was
//    rendered only on /application — so the page a candidate lands on after
//    weeks of waiting greeted the best news of the process with a paragraph.
//    The outcome should be the OBJECT, not a sentence about the object.
//
// And it now speaks the site's vocabulary — seal, guilloche, microprint,
// foil rules — instead of a hand-copied rosette.
// ───────────────────────────────────────────────────────────────────────

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowRight, FileText, User, AlertCircle, Clock, Check,
  CalendarClock, ListChecks, ShieldCheck, ShieldAlert, Download, QrCode,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { DossierProgress } from "@/components/candidate/DossierProgress";
import { IssuedCardPreview } from "@/components/candidate/IssuedCardPreview";
import {
  Guilloche, OfficialSeal, MicroprintRule,
} from "@/components/public/patterns";
import {
  listMyApplications, getReadiness, applicationKeys, STATUS_KIND,
  type ApplicationStatus,
} from "@/lib/api/applications";
import { getMyCard, myCardKeys } from "@/lib/api/my-card";
import { listOpenSessions, catalogKeys } from "@/lib/api/sessions-public";
import { getMe, accountKeys } from "@/lib/api/account";
import { routes } from "@/lib/routes";

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function fmtShort(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}
function daysUntil(iso: string) {
  const end = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86_400_000);
}

/**
 * What the hero says, per state.
 *
 * A decision that reaches the candidate as an unchanged screen has not really
 * reached them — so an acceptance and a rejection say different things, in
 * different colours, and offer different next steps.
 */
const HERO: Record<ApplicationStatus, {
  headline: string;
  body: string;
  cta: string;
  /** Set to colour the button; otherwise it stays white on the green hero. */
  ctaSolid?: string;
}> = {
  DRAFT: {
    headline: "Dossier en préparation",
    body: "Complétez les pièces demandées, puis soumettez votre dossier à la commission.",
    cta: "Compléter mon dossier",
  },
  UNDER_REVIEW: {
    headline: "Dossier en cours d'examen",
    body: "Votre dossier est entre les mains de la commission. Vous serez informé par e-mail de sa décision.",
    cta: "Suivre mon dossier",
  },
  CORRECTION_REQUESTED: {
    headline: "Corrections demandées",
    body: "La commission a signalé des pièces à corriger. Remplacez-les avant la fin du délai, faute de quoi votre dossier sera rejeté.",
    cta: "Corriger mon dossier",
    ctaSolid: "var(--gold-700)",
  },
  UNDER_FINAL_REVIEW: {
    headline: "Examen final en cours",
    body: "Vos corrections ont été reçues. La commission procède à l'examen final de votre dossier.",
    cta: "Suivre mon dossier",
  },
  ACCEPTED: {
    headline: "Demande acceptée",
    body: "La commission a reconnu votre qualité de journaliste professionnel. Votre carte de presse sera éditée par le Ministère.",
    cta: "Voir la décision",
  },
  CARD_ISSUED: {
    headline: "Carte de presse éditée",
    body: "Votre carte a été établie par le Ministère et porte un numéro officiel.",
    cta: "Voir ma carte",
  },
  REJECTED: {
    headline: "Demande non retenue",
    body: "La commission n'a pas donné une suite favorable à votre demande. Vous pouvez contester cette décision.",
    cta: "Consulter la décision",
    ctaSolid: "var(--red-500)",
  },
  UNDER_RECLAMATION: {
    headline: "Réclamation en cours",
    body: "Votre contestation est examinée par un autre membre de la commission que celui ayant rendu la décision initiale.",
    cta: "Suivre ma réclamation",
  },
  FINAL_REJECTION: {
    headline: "Décision définitive",
    body: "Après réexamen, la décision de rejet est confirmée. Vous pourrez déposer une nouvelle demande lors d'une prochaine session.",
    cta: "Consulter la décision",
    ctaSolid: "var(--red-500)",
  },
};

/** The hero's field, per outcome — good news should not look like bad news. */
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

const DEFAULT_FIELD =
  "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)";

export default function DashboardPage() {
  const me = useQuery({ queryKey: accountKeys.me, queryFn: getMe });
  const applications = useQuery({ queryKey: applicationKeys.all, queryFn: listMyApplications });
  const sessions = useQuery({ queryKey: catalogKeys.openSessions, queryFn: listOpenSessions });

  const current = applications.data?.[0];
  const openSession = sessions.data?.[0];
  const left = openSession ? daysUntil(openSession.receivingEnd) : null;

  /* What is stopping submission — the endpoint the dashboard never called.
     Only while the dossier is still the candidate's to change. */
  const readiness = useQuery({
    queryKey: applicationKeys.readiness(current?.id ?? 0),
    queryFn: () => getReadiness(current!.id),
    enabled: !!current && current.status === "DRAFT",
  });

  /* The holder's own card — number, category and validity, which nothing in
     the candidate space could previously show them. 204 when they hold none. */
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

  // The deadline matters MOST to someone with an unfinished draft — which is
  // exactly who used not to see it.
  const showCountdown = left !== null && left >= 0
    && (!current || isDraft);
  const urgent = showCountdown && left! <= 3;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {loading ? (
        <Skeleton className="h-72 w-full rounded-2xl" />
      ) : (
        <section
          className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-34px_rgba(11,46,31,.85)]"
          style={{ background: (current && FIELD[current.status]) ?? DEFAULT_FIELD }}
        >
          <Guilloche
            className="pointer-events-none absolute -right-24 -top-28 h-[340px] w-[340px] text-white opacity-[0.06]"
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
                    Ma demande de carte de presse
                  </p>
                </div>

                {current ? (
                  <>
                    <div className="mt-3 flex flex-wrap items-center gap-3">
                      <h2 className="engraved-dark text-[27px] font-extrabold leading-tight tracking-tight">
                        {HERO[current.status].headline}
                      </h2>
                      <span className="font-mono text-[11.5px] text-white/35">
                        n° {current.id}
                      </span>
                    </div>
                    <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                      {HERO[current.status].body}
                    </p>
                  </>
                ) : openSession ? (
                  <>
                    <h2 className="engraved-dark mt-3 text-[27px] font-extrabold leading-tight tracking-tight">
                      Une session est ouverte
                    </h2>
                    <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                      Vous pouvez déposer votre demande jusqu&apos;au{" "}
                      <b className="font-semibold text-white/90">
                        {fmtLong(openSession.receivingEnd)}
                      </b>.
                    </p>
                  </>
                ) : (
                  <>
                    <h2 className="engraved-dark mt-3 text-[27px] font-extrabold leading-tight tracking-tight">
                      Aucune session ouverte
                    </h2>
                    <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                      Vous serez informé par e-mail dès l&apos;ouverture de la
                      prochaine session de candidature.
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
                    {left === 0
                      ? "dernier jour"
                      : `jour${left! > 1 ? "s" : ""} restant${left! > 1 ? "s" : ""}`}
                  </p>
                  {isDraft && (
                    <p className="mt-2 border-t border-white/15 pt-2 text-[9px] font-semibold uppercase tracking-wide text-white/40">
                      pour déposer
                    </p>
                  )}
                </div>
              )}
            </div>

            {current && (
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
                    <p className="flex-1 text-[13px] font-semibold">
                      Votre dossier est complet et peut être soumis.
                    </p>
                  </>
                ) : (
                  <>
                    <ListChecks className="h-4 w-4 flex-none text-[var(--gold-500)]" />
                    <p className="flex-1 text-[13px]">
                      <b className="font-bold">
                        {blockers.length} condition{blockers.length > 1 ? "s" : ""}
                      </b>{" "}
                      rest{blockers.length > 1 ? "ent" : "e"} à remplir avant de
                      pouvoir soumettre.
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
                    background: HERO[current.status].ctaSolid ?? "#fff",
                    color: HERO[current.status].ctaSolid ? "#fff" : "var(--green-900)",
                    boxShadow: "0 12px 28px -14px rgba(0,0,0,.7)",
                  }}
                >
                  {HERO[current.status].cta}
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              ) : openSession ? (
                <Link
                  href={routes.candidate.newApplication}
                  className="group inline-flex items-center gap-2 rounded-xl bg-[var(--gold-500)] px-6 py-3 text-[14px] font-extrabold text-[var(--green-900)] shadow-[0_12px_28px_-14px_rgba(255,215,0,.8)] transition-all hover:-translate-y-0.5 hover:bg-[#ffe14d]"
                >
                  Déposer ma demande
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
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

          A candidate landing here after weeks of waiting should meet the
          credential, not a paragraph about it.
          ══════════════════════════════════════════════════════════ */}
      {accepted && me.data && (
        <section className="overflow-hidden rounded-[20px] border border-[var(--line)] bg-white">
          <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-6 py-4">
            <OfficialSeal
              className="h-5 w-5 flex-none"
              color="var(--green-700)"
              id="dash-card-seal"
            />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              {issuedCard ? "Votre carte de presse" : "Votre carte, telle qu'elle sera éditée"}
            </p>
            <span className="foil-rule h-px flex-1 opacity-40" aria-hidden="true" />
          </div>

          {/* THE CARD BESIDE ITS DETAILS, not filling the page. A credential
              is a small object and reads as one — at full container width it
              was larger than the hero above it. */}
          <div className="grid gap-6 p-6 md:grid-cols-[minmax(0,340px)_1fr] md:items-start">
            <IssuedCardPreview
              fullName={me.data.fullName}
              nni={me.data.profile?.nni ?? me.data.profile?.passportNo}
              categoryLabel={card?.categoryLabelFr}
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
                    <Detail label="N° de carte" value={card.cardNumber} mono />
                    <Detail label="Catégorie" value={card.categoryLabelFr} />
                    {card.specialisationFr && (
                      <Detail label="Spécialité" value={card.specialisationFr} />
                    )}
                    {card.institution && (
                      <Detail label="Organe de presse" value={card.institution} />
                    )}
                    <Detail label="Délivrée le" value={fmtShort(card.issuedAt)} />
                    <Detail label="Valable jusqu'au" value={fmtShort(card.expiresAt)} />
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
                        Carte {card.statusLabelFr.toLowerCase()}
                      </p>
                      {card.statusReason && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--red-700)]">
                          {card.statusReason}
                        </p>
                      )}
                      {card.usable && (
                        <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--green-700)]">
                          Toute vérification du code figurant sur votre carte
                          confirmera sa validité.
                        </p>
                      )}
                    </div>
                  </div>

                  <p className="mt-4 flex items-start gap-2 text-[12px] leading-relaxed text-[var(--muted-fg)]">
                    <QrCode className="mt-0.5 h-3.5 w-3.5 flex-none" />
                    Votre carte porte un code de vérification : quiconque le
                    scanne obtient son état auprès du Ministère.
                  </p>
                </>
              ) : (
                /* ACCEPTED but not yet issued — say what happens next rather
                   than leaving an empty column. */
                <div className="rounded-xl border border-dashed border-[var(--line)] bg-[#fbfcfb] p-5">
                  <p className="text-[13.5px] font-extrabold text-[var(--green-900)]">
                    Votre carte est en cours d&apos;édition
                  </p>
                  <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--slate)]">
                    La commission a accepté votre demande. Le Ministère établit
                    désormais votre carte : elle recevra un numéro officiel et
                    une date de validité, et vous serez informé par e-mail dès
                    qu&apos;elle sera prête.
                  </p>
                  <p className="mt-3 text-[12px] text-[var(--muted-fg)]">
                    L&apos;aperçu ci-contre est indicatif.
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
          className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--green-500)]/40 hover:shadow-[0_16px_36px_-24px_rgba(11,46,31,.5)]"
        >
          <Guilloche
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 text-[var(--green-900)] opacity-[0.03]"
            rings={22}
          />
          <div className="relative flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-tint)]">
              <User className="h-[18px] w-[18px] text-[var(--green-700)]" />
            </span>
            {me.data && (
              me.data.profileComplete ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green-700)]">
                  <Check className="h-3 w-3" /> Complet
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
                  <AlertCircle className="h-3 w-3" /> À compléter
                </span>
              )
            )}
          </div>
          <p className="relative mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Mon profil
          </p>
          <p className="relative mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
            Identité, date et lieu de naissance, photographie — requis avant
            toute soumission.
          </p>
          <span className="relative mt-4 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--green-700)]">
            {me.data?.profileComplete ? "Consulter" : "Compléter"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>

        {/* Previously a DEAD CARD: no link, no specifics, no reason to read it
            twice. It now goes where it describes, and says what remains. */}
        <Link
          href={current ? routes.candidate.application : routes.candidate.newApplication}
          className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--green-500)]/40 hover:shadow-[0_16px_36px_-24px_rgba(11,46,31,.5)]"
        >
          <Guilloche
            className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 text-[var(--green-900)] opacity-[0.03]"
            rings={22}
          />
          <div className="relative flex items-start justify-between">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--green-tint)]">
              <FileText className="h-[18px] w-[18px] text-[var(--green-700)]" />
            </span>
            {isDraft && !readiness.isLoading && blockers.length > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
                {blockers.length} à traiter
              </span>
            )}
          </div>
          <p className="relative mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {current ? "Mon dossier" : "Les pièces à préparer"}
          </p>
          <p className="relative mt-1.5 text-[13px] leading-relaxed text-[var(--slate)]">
            Les pièces requises dépendent de votre catégorie. Elles vous sont
            indiquées une par une, avec ce qui manque encore.
          </p>
          <p className="relative mt-3 font-mono text-[11px] text-[var(--muted-fg)]">
            PDF · JPEG · PNG — 10 Mo max
          </p>
          <span className="relative mt-3 inline-flex items-center gap-1 text-[12.5px] font-bold text-[var(--green-700)]">
            {current ? "Ouvrir" : "Commencer"}
            <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
          </span>
        </Link>
      </div>

      {/* ══ previous applications ══ */}
      {applications.data && applications.data.length > 1 && (
        <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
          <div className="flex items-center gap-3">
            <CalendarClock className="h-3.5 w-3.5 text-[var(--green-700)]" />
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              Mes demandes précédentes
            </p>
            <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
          </div>
          <ul className="mt-3 divide-y divide-[var(--line)]">
            {applications.data.slice(1).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-4 py-3">
                <div className="min-w-0">
                  <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                    Dossier n° {a.id}
                  </p>
                  <p className="flex items-center gap-1.5 text-[11.5px] text-[var(--muted-fg)]">
                    <Clock className="h-3 w-3" />
                    {new Date(a.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className="flex-none rounded-full px-3 py-1 text-[11.5px] font-bold"
                  style={{
                    background: `var(--st-${STATUS_KIND[a.status]}-bg)`,
                    color: `var(--st-${STATUS_KIND[a.status]}-fg)`,
                  }}
                >
                  {a.statusLabelFr}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

/* ══ one line of the record ══ */

function Detail({ label, value, mono = false }: {
  label: string; value?: string | null; mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-4 py-2.5">
      <dt className="flex-none text-[11.5px] font-semibold text-[var(--slate)]">
        {label}
      </dt>
      <dd className={`min-w-0 truncate text-right text-[13px] font-bold text-[var(--green-900)] ${mono ? "font-mono tracking-tight" : ""}`}>
        {value || "—"}
      </dd>
    </div>
  );
}
