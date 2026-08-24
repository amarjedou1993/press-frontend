"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import {
  Inbox, Gavel, PenLine, Scale, IdCard, Users, ArrowRight, ArrowUpRight,
  AlertTriangle, CalendarPlus, ShieldX, CalendarClock, BadgeCheck,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  listSessions, sessionKeys, PHASE_LABELS, type SessionResponse,
} from "@/lib/api/sessions";
import { listReviewers, reviewerKeys } from "@/lib/api/admin";
import { getIssuable, getRegistry, cardKeys } from "@/lib/api/cards";
import { getPendingProposals, lifecycleKeys } from "@/lib/api/lifecycle";
import { routes } from "@/lib/routes";

const PHASES = [
  { key: "RECEIVING",   label: "Réception",   Icon: Inbox,
    endOf: (s: SessionResponse) => s.receivingEnd },
  { key: "REVIEW",      label: "Examen",      Icon: Gavel,
    endOf: (s: SessionResponse) => s.reviewEnd },
  { key: "CORRECTION",  label: "Correction",  Icon: PenLine,
    endOf: (s: SessionResponse) => s.correctionEnd },
  { key: "RECLAMATION", label: "Réclamation", Icon: Scale,
    endOf: (s: SessionResponse) => s.reclamationEnd },
] as const;

/** Cards lapsing inside this window need a cycle already being planned. */
const LAPSE_HORIZON_DAYS = 90;

function daysUntil(iso?: string | null): number | null {
  if (!iso) return null;
  const end = new Date(iso + "T00:00:00").getTime();
  const today = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - today) / 86_400_000);
}

function shortFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "short",
  });
}

export default function AdminHomePage() {
  const router = useRouter();

  const sessions = useQuery({ queryKey: sessionKeys.all, queryFn: listSessions });
  const reviewers = useQuery({ queryKey: reviewerKeys.all, queryFn: listReviewers });
  const issuable = useQuery({ queryKey: cardKeys.issuable, queryFn: getIssuable });
  const registry = useQuery({ queryKey: cardKeys.registry, queryFn: getRegistry });
  const proposals = useQuery({
    queryKey: lifecycleKeys.pending,
    queryFn: getPendingProposals,
  });

  const active = useMemo(
    () => sessions.data?.find((s) => s.status !== "CLOSED" && s.status !== "PLANNED"),
    [sessions.data]
  );
  const planned = useMemo(
    () => sessions.data?.find((s) => s.status === "PLANNED"),
    [sessions.data]
  );

  const phaseIndex = active ? PHASES.findIndex((p) => p.key === active.status) : -1;
  const currentPhase = phaseIndex >= 0 ? PHASES[phaseIndex] : null;
  const phaseEndsIn = currentPhase && active
    ? daysUntil(currentPhase.endOf(active))
    : null;

  const activeReviewers = reviewers.data?.filter((r) => r.enabled).length ?? 0;
  const ready = issuable.data?.filter((i) => !i.blockerFr) ?? [];
  const blocked = issuable.data?.filter((i) => i.blockerFr) ?? [];
  const pending = proposals.data ?? [];
  const suspendedPending = pending.filter((p) => p.cardStatus === "SUSPENDED").length;

  /* ══ the card population, across every session ══ */
  const population = useMemo(() => {
    const cards = registry.data ?? [];

    // In force TODAY. `expired` is derived server-side from expires_at, so a
    // lapsed card can never count as valid because a job failed to run.
    const inCirculation = cards.filter(
      (c) => c.status === "VALID" && !c.expired).length;

    // The planning figure: cards lapsing inside the horizon.
    const lapsingSoon = cards.filter((c) => {
      if (c.status !== "VALID" || c.expired) return false;
      const days = daysUntil(c.expiresAt);
      return days !== null && days >= 0 && days <= LAPSE_HORIZON_DAYS;
    }).length;

    const revoked = cards.filter((c) => c.status === "REVOKED").length;
    const suspended = cards.filter((c) => c.status === "SUSPENDED").length;
    const expired = cards.filter((c) => c.expired).length;

    return {
      total: cards.length,
      inCirculation,
      lapsingSoon,
      revoked,
      suspended,
      expired,
      withheld: revoked + suspended,
    };
  }, [registry.data]);

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-4">

      {/* ══════════════════════════════════════════════════════════
          THE CYCLE — the signature of this page.
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 82% -30%, rgba(255,215,0,.14), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />

        <div className="relative z-10 px-7 pt-7">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
            {/* Haute Autorité de la Presse et de l&apos;Audiovisuel */}
            Ministère de la Culture, 
            des Arts, de la Communication  <br />et des Relations avec le Parlement
          </p>

          {sessions.isLoading ? (
            <div className="py-6">
              <Skeleton className="h-20 w-full bg-white/10" />
            </div>
          ) : active ? (
            <>
              <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
                <div>
                  <h2 className="text-[30px] font-extrabold leading-none tracking-tight">
                    {PHASE_LABELS[active.status] ?? active.status}
                  </h2>
                  <p className="mt-2 text-[13px] text-white/55">
                    Session n° {active.id} · ouverte le {shortFr(active.startDate)}
                    {" · "}clôture le {shortFr(active.reclamationEnd)}
                  </p>
                </div>

                {phaseEndsIn !== null && (
                  <div className="text-right">
                    <p className="font-mono text-[46px] font-extrabold leading-none"
                      style={{ color: phaseEndsIn <= 2 ? "var(--gold-500)" : "#fff" }}>
                      {Math.max(0, phaseEndsIn)}
                    </p>
                    <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                      {phaseEndsIn <= 0
                        ? "dernier jour"
                        : phaseEndsIn === 1 ? "jour restant" : "jours restants"}
                    </p>
                  </div>
                )}
              </div>

              {/* the rail */}
              <ol className="mt-7 grid grid-cols-4 gap-1.5" aria-label="Phases de la session">
                {PHASES.map((phase, i) => {
                  const done = i < phaseIndex;
                  const now = i === phaseIndex;
                  return (
                    <li key={phase.key}>
                      <div className="h-[3px] rounded-full"
                        style={{
                          background: done ? "var(--green-500)"
                            : now ? "var(--gold-500)" : "rgba(255,255,255,.14)",
                        }} />
                      <div className="mt-2.5 flex items-start gap-2">
                        <phase.Icon className="mt-[1px] h-3.5 w-3.5 flex-none"
                          style={{
                            color: done ? "var(--green-500)"
                              : now ? "var(--gold-500)" : "rgba(255,255,255,.3)",
                          }} />
                        <div className="min-w-0">
                          <span className="block truncate text-[12px] font-bold"
                            style={{
                              color: now ? "#fff"
                                : done ? "rgba(255,255,255,.7)" : "rgba(255,255,255,.4)",
                            }}>
                            {phase.label}
                          </span>
                          <span className="block font-mono text-[10.5px]"
                            style={{ color: now ? "rgba(255,255,255,.6)" : "rgba(255,255,255,.3)" }}>
                            → {shortFr(phase.endOf(active))}
                          </span>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div className="mt-6 flex justify-end pb-6">
                <button type="button"
                  onClick={() => router.push(routes.admin.sessionResults(active.id))}
                  className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--gold-500)] transition-opacity hover:opacity-80">
                  Voir les résultats <ArrowUpRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </>
          ) : (
            /* No session running — an empty state that invites the one act
               that matters, rather than reporting nothing. */
            <div className="py-8">
              <h2 className="text-[26px] font-extrabold leading-tight">
                {planned ? "Session programmée" : "Aucune session en cours"}
              </h2>
              <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/60">
                {planned
                  ? `La session n° ${planned.id} s'ouvrira le ${shortFr(planned.startDate)}. Les candidatures ne sont pas encore acceptées.`
                  : "Les journalistes ne peuvent déposer de candidature qu'une fois une session ouverte."}
              </p>
              <button type="button"
                onClick={() => router.push(routes.admin.sessions)}
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[var(--gold-500)] px-4 py-2.5 text-[13px] font-bold text-[var(--green-900)] transition-opacity hover:opacity-90">
                <CalendarPlus className="h-4 w-4" />
                {planned ? "Voir la session" : "Ouvrir une session"}
              </button>
            </div>
          )}
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHAT NEEDS A DECISION — ordered by consequence.
          ══════════════════════════════════════════════════════════ */}
      {(pending.length > 0 || ready.length > 0 || blocked.length > 0) && (
        <section className="space-y-2.5">
          <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
            En attente de votre décision
          </h3>

          {pending.length > 0 && (
            <ActionRow
              tone="red"
              Icon={Gavel}
              title={`${pending.length} proposition${pending.length > 1 ? "s" : ""} de retrait`}
              detail={
                pending.length === 1
                  ? `Carte de ${pending[0].holderFullName} — ${pending[0].groundLabelFr}.`
                  : `Dont celle de ${pending[0].holderFullName}.`
              }
              extra={suspendedPending > 0
                ? `${suspendedPending} carte${suspendedPending > 1 ? "s" : ""} déjà suspendue${suspendedPending > 1 ? "s" : ""} à titre conservatoire.`
                : undefined}
              action="Examiner"
              onAction={() => router.push(routes.admin.revocations)}
            />
          )}

          {ready.length > 0 && (
            <ActionRow
              tone="green"
              Icon={IdCard}
              title={`${ready.length} carte${ready.length > 1 ? "s" : ""} à éditer`}
              detail={`Candidature${ready.length > 1 ? "s" : ""} acceptée${ready.length > 1 ? "s" : ""} par la commission.`}
              action="Éditer"
              onAction={() => router.push(routes.admin.cards)}
            />
          )}

          {blocked.length > 0 && (
            <ActionRow
              tone="gold"
              Icon={AlertTriangle}
              title={`${blocked.length} dossier${blocked.length > 1 ? "s" : ""} sans carte possible`}
              detail="Photographie, spécialité ou organe de presse manquant."
              action="Voir"
              onAction={() => router.push(routes.admin.cards)}
            />
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          THE CARD POPULATION — the whole corps, not this cycle.

          "How many accredited journalists are there?" had no answer
          anywhere in the system until now.
          ══════════════════════════════════════════════════════════ */}
      <section>
        <h3 className="px-1 pb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
          Cartes en circulation
        </h3>

        <div className="grid grid-cols-3 divide-x divide-[var(--line)] overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <Figure
            value={registry.isLoading ? null : population.inCirculation}
            label="En circulation"
            note={population.expired > 0
              ? `${population.expired} expirée${population.expired > 1 ? "s" : ""}`
              : "valides à ce jour"}
            Icon={BadgeCheck}
            onClick={() => router.push(routes.admin.cards)}
          />

          {/* THE PLANNING FIGURE. Forty cards lapsing in March means a
              session should open in January — and knowing that in December is
              the difference between a planned cycle and a scramble. */}
          <Figure
            value={registry.isLoading ? null : population.lapsingSoon}
            label="Expirent sous 90 j"
            note={population.lapsingSoon > 0
              ? "prévoir une session"
              : "aucune échéance proche"}
            warn={population.lapsingSoon > 0}
            Icon={CalendarClock}
            onClick={() => router.push(routes.admin.cards)}
          />

          <Figure
            value={registry.isLoading ? null : population.withheld}
            label="Retirées / suspendues"
            note={population.withheld > 0
              ? `${population.revoked} retirée${population.revoked > 1 ? "s" : ""} · ${population.suspended} suspendue${population.suspended > 1 ? "s" : ""}`
              : "aucune"}
            urgent={population.withheld > 0}
            Icon={ShieldX}
            onClick={() => router.push(routes.admin.cards)}
          />
        </div>

        {/* Said in a sentence as well as a number: an administrator planning
            the year's calendar should not have to infer the consequence. */}
        {!registry.isLoading && population.lapsingSoon > 0 && !active && !planned && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
            <CalendarClock className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <p>
              <b>
                {population.lapsingSoon} carte{population.lapsingSoon > 1 ? "s" : ""}{" "}
                arrive{population.lapsingSoon > 1 ? "nt" : ""} à échéance dans
                les trois mois
              </b>{" "}
              et aucune session n&apos;est ouverte ni programmée. Leurs
              titulaires devront candidater à nouveau pour rester accrédités.
            </p>
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE REGISTER — a measured row, not four boxes.
          ══════════════════════════════════════════════════════════ */}
      <section>
        <h3 className="px-1 pb-2.5 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
          Registre
        </h3>

        <div className="grid grid-cols-2 divide-y divide-[var(--line)] overflow-hidden rounded-[18px] border border-[var(--line)] bg-white sm:grid-cols-4 sm:divide-x sm:divide-y-0">
          <Figure
            value={registry.isLoading ? null : population.total}
            label="Cartes éditées"
            note={ready.length > 0 ? `+${ready.length} en attente` : "depuis l'origine"}
            onClick={() => router.push(routes.admin.cards)}
          />
          <Figure
            value={proposals.isLoading ? null : pending.length}
            label="Retraits proposés"
            note={pending.length > 0 ? "en attente de décision" : "aucun en cours"}
            urgent={pending.length > 0}
            Icon={ShieldX}
            onClick={() => router.push(routes.admin.revocations)}
          />
          <Figure
            value={reviewers.isLoading ? null : activeReviewers}
            label="Membres actifs"
            note={`sur ${reviewers.data?.length ?? 0} inscrits`}
            warn={!reviewers.isLoading && activeReviewers < 2}
            Icon={Users}
            onClick={() => router.push(routes.admin.reviewers)}
          />
          <Figure
            value={sessions.isLoading ? null : (sessions.data?.length ?? 0)}
            label="Sessions"
            note={active ? "1 en cours" : planned ? "1 programmée" : "aucune ouverte"}
            onClick={() => router.push(routes.admin.sessions)}
          />
        </div>

        {/* The single-member commission cannot honour the objection right at
            all — better seen here than discovered by a rejected journalist. */}
        {!reviewers.isLoading && activeReviewers < 2 && (
          <div className="mt-2.5 flex items-start gap-2 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <p>
              <b>La commission doit compter au moins deux membres actifs.</b>{" "}
              Une réclamation est examinée par un membre autre que l&apos;auteur
              de la décision contestée : avec un seul membre, un candidat rejeté
              ne pourra pas exercer son droit de recours.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

/* ══ one thing awaiting a decision ══ */

const TONES = {
  red:   { border: "var(--red-500)",   bg: "var(--red-tint)",   fg: "var(--red-700)",   chip: "var(--red-500)" },
  green: { border: "var(--green-500)", bg: "var(--green-tint)", fg: "var(--green-700)", chip: "var(--green-600)" },
  gold:  { border: "var(--gold-500)",  bg: "var(--gold-tint)",  fg: "var(--gold-700)",  chip: "var(--gold-700)" },
} as const;

function ActionRow({
  tone, Icon, title, detail, extra, action, onAction,
}: {
  tone: keyof typeof TONES;
  Icon: React.ElementType;
  title: string;
  detail: string;
  extra?: string;
  action: string;
  onAction: () => void;
}) {
  const t = TONES[tone];
  return (
    <button
      type="button"
      onClick={onAction}
      className="group flex w-full flex-wrap items-center gap-4 rounded-[18px] border-l-[3px] px-5 py-4 text-left transition-shadow hover:shadow-[0_8px_24px_-16px_rgba(11,46,31,.5)]"
      style={{ borderLeftColor: t.border, background: t.bg }}
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
        style={{ background: t.chip }}>
        <Icon className="h-4 w-4 text-white" />
      </span>

      {/* Spans, not paragraphs: this whole row is a <button>, and a button
          may not contain block-level content. */}
      <span className="min-w-0 flex-1">
        <span className="block text-[14px] font-extrabold" style={{ color: t.fg }}>
          {title}
        </span>
        <span className="block text-[12.5px] leading-relaxed" style={{ color: t.fg }}>
          {detail}
          {extra && <> <b className="font-semibold">{extra}</b></>}
        </span>
      </span>

      <span className="inline-flex flex-none items-center gap-1.5 text-[12.5px] font-bold"
        style={{ color: t.fg }}>
        {action}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </button>
  );
}

/* ══ one figure in the register ══ */

function Figure({
  value, label, note, urgent, warn, Icon, onClick,
}: {
  value: number | null;
  label: string;
  note?: string;
  urgent?: boolean;
  warn?: boolean;
  Icon?: React.ElementType;
  onClick: () => void;
}) {
  const colour = urgent ? "var(--red-700)"
    : warn ? "var(--gold-700)"
    : "var(--green-900)";

  return (
    <button
      type="button"
      onClick={onClick}
      className="group px-5 py-5 text-left transition-colors hover:bg-[#fbfcfb]"
    >
      {/* A div, not a p: Skeleton renders a div, and a <p> may not contain
          one. The browser's parser closes the <p> when it meets the <div>,
          so the server and client end up with different trees — a hydration
          mismatch, not merely a warning. */}
      <div className="flex items-baseline gap-2">
        {value === null ? (
          <Skeleton className="h-8 w-12" />
        ) : (
          <span className="font-mono text-[32px] font-extrabold leading-none tracking-tight"
            style={{ color: colour }}>
            {value}
          </span>
        )}
        {Icon && (urgent || warn) && (
          <Icon className="h-3.5 w-3.5" style={{ color: colour }} />
        )}
      </div>

      <span className="mt-2 block text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--slate)]">
        {label}
      </span>
      {note && (
        <span className="mt-0.5 block text-[11.5px] text-[var(--muted-fg)]">
          {note}
        </span>
      )}
    </button>
  );
}
