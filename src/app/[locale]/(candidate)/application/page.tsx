"use client";

import { useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText, Link2, Trash2, Download, History, Send, Check, AlertCircle,
  CalendarClock, ShieldCheck, ShieldAlert, QrCode,
} from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { DossierProgress } from "@/components/candidate/DossierProgress";
import { RequirementChecklist } from "@/components/candidate/RequirementChecklist";
import { DocumentUploader } from "@/components/candidate/DocumentUploader";
import { StatusTimeline } from "@/components/candidate/StatusTimeline";
import { DecisionOutcome } from "@/components/candidate/DecisionOutcome";
import { DossierArchive } from "@/components/candidate/DossierArchive";
import { CorrectionPanel } from "@/components/candidate/CorrectionPanel";
import { ObjectionPanel } from "@/components/candidate/ObjectionPanel";
import { IssuedCardPreview } from "@/components/candidate/IssuedCardPreview";
import { EmploymentCard } from "@/components/candidate/EmploymentCard";
import { Guilloche, OfficialSeal, MicroprintRule } from "@/components/public/patterns";
import {
  listMyApplications, getApplication, removeDocument, submitApplication,
  applicationKeys, STATUS_KIND, type DocumentType,
} from "@/lib/api/applications";
import { getMyCard, myCardKeys } from "@/lib/api/my-card";
import { listOpenSessions, catalogKeys } from "@/lib/api/sessions-public";
import { getMe, accountKeys } from "@/lib/api/account";
import { openProtectedFile } from "@/lib/api/files";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

function daysUntil(iso: string) {
  const end = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86_400_000);
}

export default function ApplicationPage() {
  const t = useTranslations("application");
  const ts = useTranslations("applicationStatus");
  const tc = useTranslations("cardStatus");
  const td = useTranslations("documentType");
  const locale = useLocale();
  const format = useFormatter();
  const arabic = locale === "ar";

  const router = useRouter();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [uploadFor, setUploadFor] =
    useState<{ docType: DocumentType; remaining: number } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const list = useQuery({ queryKey: applicationKeys.all, queryFn: listMyApplications });
  const currentId = list.data?.[0]?.id;
  const me = useQuery({ queryKey: accountKeys.me, queryFn: getMe });
  const sessions = useQuery({ queryKey: catalogKeys.openSessions, queryFn: listOpenSessions });

  const detail = useQuery({
    queryKey: applicationKeys.detail(currentId!),
    queryFn: () => getApplication(currentId!),
    enabled: !!currentId,
  });

  const status = detail.data?.application.status;

  /**
   * ⚠️ "Favourable" describes the DOSSIER, not the card.
   *
   * A withdrawn card still sits on a CARD_ISSUED application — the dossier
   * never moves again once a card exists. So this stays true after a
   * revocation, which is correct: the holder should still be able to see
   * their card's number and dates. What the card is WORTH is a separate
   * question, answered below.
   */
  const favourable = status === "ACCEPTED" || status === "CARD_ISSUED";

  const myCard = useQuery({
    queryKey: myCardKeys.card,
    queryFn: getMyCard,
    enabled: favourable,
  });

  const fmtDate = (iso?: string | null) => {
    if (!iso) return "—";
    const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
    return isNaN(d.getTime()) ? "—" : format.dateTime(d, "long");
  };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: applicationKeys.detail(currentId!) });
    qc.invalidateQueries({ queryKey: applicationKeys.all });
  };

  const remove = useMutation({
    mutationFn: (documentId: number) => removeDocument(currentId!, documentId),
    onSuccess: () => {
      refresh();
      setDeleting(null);
      toast.success(t("pieceRemoved"));
    },
    onError: (e) => {
      setDeleting(null);
      toast.error(t("removeFailed"), {
        description: e instanceof ApiError
          ? (e.problem.detail ?? e.message)
          : t("tryAgain"),
      });
    },
  });

  const submit = useMutation({
    mutationFn: () => submitApplication(currentId!),
    onSuccess: () => {
      refresh();
      setConfirmSubmit(false);
      toast.success(t("submittedTitle"), { description: t("submittedBody") });
    },
    onError: (e) => {
      setConfirmSubmit(false);
      // 422 carries the blockers; the checklist already displays them.
      toast.error(t("submitRefused"), {
        description: e instanceof ApiError
          ? (e.problem.detail ?? t("conditionsUnmet"))
          : t("tryAgain"),
      });
    },
  });

  if (list.isLoading || (currentId && detail.isLoading)) {
    return <Skeleton className="mx-auto h-96 max-w-4xl rounded-2xl" />;
  }

  /* ── no dossier yet ── */
  if (!currentId || !detail.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <VerificationBanner />
        <div className="relative overflow-hidden rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Guilloche
            className="pointer-events-none absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 text-[var(--green-900)] opacity-[0.035]"
            rings={28}
          />
          <div className="relative">
            <FileText className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
            <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
              {t("noneTitle")}
            </p>
            <p className="mt-2 text-[13.5px] text-[var(--slate)]">
              {t("noneBody")}
            </p>
            <Button className="mt-5"
              onClick={() => router.push(routes.candidate.newApplication)}>
              {t("apply")}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const { application, documents, timeline, readiness } = detail.data;
  const kind = STATUS_KIND[application.status];
  const editable = application.editable;
  const card = myCard.data;

  /** Whether the card is in force TODAY, whatever the dossier says. */
  const cardWithheld = !!card && card.usable === false;

  const decided = ["ACCEPTED", "CARD_ISSUED", "REJECTED", "FINAL_REJECTION"]
    .includes(application.status);
  const refused = ["REJECTED", "FINAL_REJECTION"].includes(application.status);
  const correcting = application.status === "CORRECTION_REQUESTED";

  const blockerCount = readiness.blockers?.length ?? 0;
  const canSubmit = readiness.canSubmit;

  /* The deposit deadline — relevant only while the dossier is unsubmitted. */
  const openSession = sessions.data?.[0];
  const left = editable && openSession ? daysUntil(openSession.receivingEnd) : null;
  const urgent = left !== null && left <= 3;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {/* ══ header — only while the dossier is still in progress ══ */}
      {!decided && (
        <section
          className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-34px_rgba(11,46,31,.85)]"
          style={{
            background: correcting
              ? "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.26), transparent 60%), linear-gradient(158deg, #33290a 0%, #2c2408 60%, #1f1a06 100%)"
              : "radial-gradient(700px 340px at 90% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
          }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.05]"
            style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
            aria-hidden="true"
          />
          <Guilloche
            className="rtl-mirror pointer-events-none absolute -right-28 -top-32 h-[240px] w-[240px] text-white opacity-[0.06] sm:-right-24 sm:-top-28 sm:h-[340px] sm:w-[340px]"
            rings={34}
          />

          <div className="relative z-10 p-5 sm:p-7">
            <div className="flex flex-wrap items-start justify-between gap-5">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2.5">
                  <OfficialSeal
                    className="h-5 w-5 flex-none opacity-80"
                    color="var(--gold-500)"
                    id="app-seal"
                  />
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
                    {t("eyebrow")}
                  </p>
                </div>

                {/* The heading names the DOSSIER; the pill carries the status.
                    They used to print the same string twice. */}
                <div className="mt-3 flex flex-wrap items-baseline gap-3">
                  <h2 className="engraved-dark text-[22px] font-extrabold leading-tight tracking-tight sm:text-[27px]">
                    {t("dossierNo", { id: application.id })}
                  </h2>
                  <span
                    className="rounded-full px-3 py-1 text-[11px] font-extrabold sm:px-3.5 sm:text-[11.5px]"
                    style={{
                      background: `var(--st-${kind}-bg)`,
                      color: `var(--st-${kind}-fg)`,
                    }}
                  >
                    {ts(application.status)}
                  </span>
                </div>

                <p className="mt-2 text-[13px] text-white/55">
                  {application.submittedAt
                    ? t("submittedOn", { date: fmtDate(application.submittedAt) })
                    : t("openedOn", { date: fmtDate(application.createdAt) })}
                </p>
              </div>

              {/* THE DEADLINE, on the page where the work happens. */}
              {left !== null && left >= 0 && (
                /* ⚠️ A FULL-WIDTH BAND ON A PHONE.
                   As flex-none beside the title it held about 90px and left
                   the heading and its status pill fighting over the rest —
                   and this is the page's most important number. Below sm it
                   takes its own row and lays out horizontally, which also
                   makes the three lines readable rather than stacked into a
                   narrow column. */
                <div
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 sm:w-auto sm:flex-none sm:flex-col sm:gap-0 sm:px-5 sm:py-4 sm:text-center"
                  style={{
                    background: urgent ? "rgba(208,28,31,.20)" : "rgba(0,0,0,.22)",
                    boxShadow: `inset 0 0 0 1px ${urgent ? "rgba(208,28,31,.5)" : "rgba(255,255,255,.14)"}`,
                  }}
                >
                  <p className="font-mono text-[26px] font-extrabold leading-none sm:text-[30px]"
                    style={{ color: urgent ? "#ff9b9d" : "#fff" }}>
                    {left}
                  </p>
                  <p className="text-[9px] font-bold uppercase tracking-[0.14em] text-white/50 sm:mt-1.5">
                    {t("daysRemaining", { count: left })}
                  </p>
                  <p className="ms-auto border-s border-white/15 ps-3 text-[9px] font-semibold uppercase tracking-wide text-white/40 sm:ms-0 sm:mt-2 sm:border-s-0 sm:border-t sm:ps-0 sm:pt-2">
                    {t("toSubmit")}
                  </p>
                </div>
              )}
            </div>

            <div className="mt-6 rounded-xl bg-black/25 px-3 py-4 sm:mt-7 sm:px-5 sm:py-5">
              <DossierProgress status={application.status} />
            </div>
          </div>

          {/* ⚠️ Hidden below sm: fourteen repetitions at 375px are a grey
              smear, which is decoration failing at being decoration. */}
          <MicroprintRule
            className="relative z-10 hidden pb-1 text-center text-white opacity-[0.12] sm:block"
            repeat={14}
          />
          <div className="flex h-1.5" aria-hidden="true">
            <i className="flex-1 bg-[var(--green-500)]" />
            <i className="flex-1 bg-[var(--gold-500)]" />
            <i className="flex-1 bg-[var(--red-500)]" />
          </div>
        </section>
      )}

      {/* ══ the decision — renders nothing while still in progress ══
          ⚠️ THE CARD'S STATE GOES IN TOO.
          A dossier reaches CARD_ISSUED and stays there for ever; a suspension
          or withdrawal afterwards is recorded on the CARD. Without these three
          props the panel keeps announcing "your card has been issued" — in
          green, under the ministry's seal — to somebody the Ministry has just
          sanctioned. */}
      <DecisionOutcome
        status={application.status}
        timeline={timeline}
        applicationId={application.id}
        cardStatus={card?.status}
        cardStatusReason={card?.statusReason}
        cardStatusChangedAt={card?.statusChangedAt}
      />

      {/* The right to contest, beneath the decision it contests. */}
      <ObjectionPanel
        applicationId={application.id}
        visible={application.status === "REJECTED"}
      />

      {/* ══ the correction round — renders nothing unless one is open ══ */}
      <CorrectionPanel applicationId={application.id} />

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* ══ left column ══ */}
        <div className="min-w-0 space-y-6">
          {decided ? (
            <DossierArchive
              applicationId={application.id}
              documents={documents}
              timeline={timeline}
              defaultOpen={refused}
            />
          ) : (
            <>
              {/* Specialisation and institution — printed on the card, and
                  nothing else in the system asks for them. */}
              {!correcting && (
                <EmploymentCard
                  applicationId={application.id}
                  editable={editable}
                  currentSpecialisationId={application.specialisationId}
                  currentInstitution={application.institution}
                />
              )}

              {/* ── pieces ── */}
              {!correcting && (
                <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                  <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                      {t("attachments")}
                    </p>
                    <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
                    {documents.length > 0 && (
                      <span className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
                        {documents.length}
                      </span>
                    )}
                  </div>

                  {documents.length === 0 ? (
                    <p className="px-5 py-8 text-center text-[13.5px] leading-relaxed text-[var(--slate)] sm:px-6">
                      {t("noPieces")}
                    </p>
                  ) : (
                    <ul className="divide-y divide-[var(--line)]">
                      {documents.map((d) => (
                        <li key={d.id} className="flex items-start gap-3 px-5 py-3.5 sm:px-6">
                          <span
                            className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                            style={{
                              background: d.needsCorrection ? "var(--gold-tint)" : "var(--green-tint)",
                              color: d.needsCorrection ? "var(--gold-700)" : "var(--green-700)",
                            }}
                          >
                            {d.kind === "FILE" ? <FileText className="h-4 w-4" />
                                               : <Link2 className="h-4 w-4" />}
                          </span>

                          <div className="min-w-0 flex-1">
                            <p className="flex flex-wrap items-baseline gap-x-1.5 text-[13px] font-semibold text-[var(--ink)] sm:text-[13.5px]">
                              {td(d.docType)}
                              {d.version > 1 && (
                                <span dir="ltr" className="inline-block font-mono text-[11px] font-normal text-[var(--muted-fg)]">
                                  v{d.version}
                                </span>
                              )}
                            </p>

                            {d.url ? (
                              // dir="ltr": a URL's slashes and dots reorder in
                              // an RTL paragraph, and a scrambled address is
                              // unusable even though the href still works.
                              <a href={d.url} target="_blank" rel="noopener noreferrer"
                                dir="ltr"
                                className="block truncate text-start text-[12.5px] text-[var(--green-700)] underline underline-offset-2">
                                {d.url}
                              </a>
                            ) : (
                              /* A plain <a href> carries no Authorization
                                 header, so the endpoint would answer 401 and
                                 the link would silently do nothing. */
                              <button
                                type="button"
                                onClick={async () => {
                                  const ok = await openProtectedFile(
                                    `/api/applications/${application.id}/documents/${d.id}/file`,
                                    token, td(d.docType));
                                  if (!ok) toast.error(t("cannotOpen"));
                                }}
                                className="inline-flex items-center gap-1 text-[12.5px] text-[var(--green-700)] underline underline-offset-2"
                              >
                                <Download className="h-3 w-3 flex-none" /> {t("openFile")}
                              </button>
                            )}

                            {d.needsCorrection && d.observation && (
                              /* ⚠️ dir="auto" — written by a commission
                                 member, in whichever language they use. */
                              /* ⚠️ break-words: pre-wrap keeps the member's
                                 line breaks but not a long token, and an
                                 observation is where a link gets cited. */
                              <p dir="auto"
                                className="user-text mt-1.5 whitespace-pre-wrap break-words rounded-lg bg-[var(--gold-tint)] px-2.5 py-1.5 text-[12px] leading-relaxed text-[var(--gold-700)] sm:text-[12.5px]">
                                <b>{t("observation")}</b> {d.observation}
                              </p>
                            )}
                          </div>

                          {editable && (
                            <button
                              type="button"
                              onClick={() => setDeleting(d.id)}
                              aria-label={t("removeAria", { type: td(d.docType) })}
                              title={t("remove")}
                              /* p-2: a 32px target on a screen operated by a
                                 thumb, beside a 40px one. */
                              className="flex-none rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-500)]"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* ── timeline ── */}
              {timeline.length > 0 && (
                <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
                  <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
                    <History className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
                    <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                      {t("history")}
                    </p>
                    <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
                  </div>
                  <div className="p-5 sm:p-6">
                    <StatusTimeline entries={timeline} />
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* ══ right column ══
            The CREDENTIAL once a decision is favourable, the CHECKLIST while
            one is still being worked towards, and nothing after a refusal —
            where a list of requirements would only invite the candidate to
            wonder what they got wrong. */}
        <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">
          {favourable ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
                <OfficialSeal
                  className="h-4 w-4 flex-none"
                  color={cardWithheld ? "var(--red-700)" : "var(--green-700)"}
                  id="app-card-seal"
                />
                {/* ⚠️ THREE STATES, NOT TWO.
                    "Votre carte de presse" above a withdrawn card reads as
                    though it is still theirs. The panel stays — a holder may
                    need to quote the number even after a withdrawal — but its
                    heading must not contradict the notice above it. */}
                <p className="text-[10px] font-bold uppercase tracking-[0.16em]"
                  style={{ color: cardWithheld ? "var(--red-700)" : "var(--green-700)" }}>
                  {cardWithheld
                    ? t("yourCardWithheld")
                    : application.status === "CARD_ISSUED"
                      ? t("yourCard")
                      : t("yourCardPending")}
                </p>
              </div>

              <div className="p-5">
                <IssuedCardPreview
                  fullName={me.data?.fullName ?? ""}
                  nni={me.data?.profile?.nni ?? me.data?.profile?.passportNo}
                  categoryLabel={arabic ? card?.categoryLabelAr : card?.categoryLabelFr}
                  cardNumber={card?.cardNumber}
                  validUntil={card?.expiresAt}
                  issued={application.status === "CARD_ISSUED"}
                />

                {card && (
                  <>
                    <dl className="mt-5 divide-y divide-[var(--line)] rounded-xl border border-[var(--line)]">
                      <Detail label={t("cardNumber")} value={card.cardNumber} mono />
                      <Detail label={t("validUntil")} value={fmtDate(card.expiresAt)} />
                    </dl>

                    <div
                      className="mt-3 flex items-start gap-2.5 rounded-xl px-4 py-3"
                      style={{ background: card.usable ? "var(--green-tint)" : "var(--red-tint)" }}
                    >
                      {card.usable
                        ? <ShieldCheck className="mt-0.5 h-4 w-4 flex-none text-[var(--green-700)]" />
                        : <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-[var(--red-700)]" />}
                      <div className="min-w-0">
                        <p className="text-[12.5px] font-extrabold"
                          style={{ color: card.usable ? "var(--green-700)" : "var(--red-700)" }}>
                          {t("cardIs", { status: tc(card.status).toLowerCase() })}
                        </p>
                        {/* ⚠️ The reason is NOT repeated here when the notice
                            above already carries it in full — the panel above
                            quotes it as a considérant, and printing the same
                            paragraph twice on one screen makes neither look
                            authoritative. */}
                        {card.statusReason && !cardWithheld && (
                          <p dir="auto" className="user-text mt-0.5 text-[12px] leading-relaxed text-[var(--red-700)]">
                            {card.statusReason}
                          </p>
                        )}
                      </div>
                    </div>

                    <p className="mt-3 flex items-start gap-2 text-[11.5px] leading-relaxed text-[var(--muted-fg)]">
                      <QrCode className="mt-0.5 h-3.5 w-3.5 flex-none" />
                      {t("qrNote")}
                    </p>
                  </>
                )}
              </div>
            </div>
          ) : !decided ? (
            <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
              <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4 sm:px-6">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                  {editable ? t("whatRemains") : t("dossierPieces")}
                </p>
                <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
              </div>

              <div className="p-5 sm:p-6">
                <RequirementChecklist
                  readiness={readiness}
                  editable={editable}
                  onAdd={
                    editable
                      ? (docType) => {
                          // How many of this type are still missing — the
                          // uploader opens with that many inputs.
                          const req =
                            readiness.mandatory?.find((r) => r.docType === docType) ??
                            readiness.alternativeGroups
                              ?.flatMap((g) => g.options)
                              .find((r) => r.docType === docType);
                          const remaining = req
                            ? Math.max(req.required - req.provided, 1)
                            : 1;
                          setUploadFor({ docType, remaining });
                        }
                      : undefined
                  }
                />
              </div>

              {/* ══ THE ACT THIS PAGE EXISTS FOR ══
                  Set apart from the checklist rather than appended to it, and
                  it EXPLAINS ITSELF: a candidate looking at a dead button
                  should not have to look elsewhere to learn what it is
                  waiting for. Gold the moment it can be pressed. */}
              {editable && (
                <div
                  className="border-t px-5 py-5 sm:px-6"
                  style={{
                    borderColor: canSubmit ? "var(--gold-500)" : "var(--line)",
                    background: canSubmit ? "var(--gold-tint)" : "#fbfcfb",
                  }}
                >
                  {canSubmit ? (
                    <>
                      <p className="flex items-center gap-2 text-[12.5px] font-extrabold text-[var(--gold-700)]">
                        <Check className="h-3.5 w-3.5 flex-none" />
                        {t("dossierComplete")}
                      </p>
                      <button
                        type="button"
                        onClick={() => setConfirmSubmit(true)}
                        disabled={submit.isPending}
                        className="group mt-3 inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[var(--gold-500)] text-[14px] font-extrabold text-[var(--green-900)]
                                   shadow-[0_12px_28px_-12px_rgba(255,215,0,.85)] transition-all
                                   hover:-translate-y-px hover:bg-[#ffe14d]
                                   disabled:cursor-not-allowed disabled:opacity-60
                                   focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-700)] focus-visible:ring-offset-2"
                      >
                        <Send className="h-4 w-4 flex-none" />
                        {t("submitDossier")}
                      </button>
                    </>
                  ) : (
                    <>
                      <p className="flex items-start gap-2 text-[12.5px] leading-relaxed text-[var(--slate)]">
                        <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />
                        <span>
                          {t.rich("conditionsRemain", {
                            count: blockerCount,
                            b: (c) => <b className="font-bold text-[var(--gold-700)]">{c}</b>,
                          })}
                        </span>
                      </p>
                      <button
                        type="button"
                        disabled
                        className="mt-3 inline-flex h-12 w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl border border-[var(--line)] bg-white text-[14px] font-bold text-[var(--muted-fg)]"
                      >
                        <Send className="h-4 w-4 flex-none" />
                        {t("submitDossier")}
                      </button>
                    </>
                  )}

                  {left !== null && left >= 0 && (
                    <p className="mt-3 flex items-center gap-1.5 text-[11.5px] font-semibold"
                      style={{ color: urgent ? "var(--red-700)" : "var(--muted-fg)" }}>
                      <CalendarClock className="h-3 w-3 flex-none" />
                      {left === 0 ? t("lastDayToSubmit") : t("stillDays", { count: left })}
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>

      {/* ══ dialogs ══ */}
      <DocumentUploader
        applicationId={application.id}
        docType={uploadFor?.docType ?? null}
        remaining={uploadFor?.remaining ?? 1}
        open={!!uploadFor}
        onOpenChange={(o) => !o && setUploadFor(null)}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("removeTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("removeBody")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
              onClick={() => deleting && remove.mutate(deleting)}
            >
              {t("remove")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmSubmitTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("confirmSubmitBody")}</AlertDialogDescription>
          </AlertDialogHeader>

          {/* OUTSIDE the description: a WARNING about a consequence the
              action's name does not carry, not a description of it. */}
          <p className="text-[13px] font-medium leading-relaxed text-[var(--red-500)]">
            {t("noMoreEdits")}
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
            >
              {submit.isPending ? t("sending") : t("confirmSubmit")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══ one line of the record ══ */

function Detail({ label, value, mono = false }: {
  label: string; value?: string | null; mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3 px-4 py-2.5 sm:gap-4">
      <dt className="flex-none text-[11.5px] font-semibold text-[var(--slate)]">
        {label}
      </dt>
      <dd
        dir={mono ? "ltr" : undefined}
        className={`min-w-0 truncate text-end text-[13px] font-bold text-[var(--green-900)] ${mono ? "font-mono tracking-tight" : ""}`}
      >
        {value || "—"}
      </dd>
    </div>
  );
}
