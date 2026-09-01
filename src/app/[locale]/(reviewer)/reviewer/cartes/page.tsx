"use client";
// src/app/[locale]/(reviewer)/reviewer/cartes/page.tsx

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IdCard, Gavel, Search, ShieldAlert, ShieldX, ShieldCheck, Clock,
  Building2, Briefcase, Inbox, Undo2, Check, X, CalendarRange,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ProposeRevocationDialog } from "@/components/card/ProposeRevocationDialog";
import {
  getReviewerCards, reviewerCardKeys, type ReviewerCard,
} from "@/lib/api/reviewer-cards";
import {
  getMyProposals, withdrawProposal, lifecycleKeys,
  type ProposalResponse,
} from "@/lib/api/lifecycle";
import { ApiError } from "@/lib/api/client";
import { Guilloche } from "@/components/public/patterns";

type Tab = "register" | "mine";

const STATUS_TONE: Record<string, { bg: string; fg: string; Icon: React.ElementType }> = {
  VALID:     { bg: "var(--green-tint)", fg: "var(--green-700)", Icon: ShieldCheck },
  EXPIRED:   { bg: "#eef1ef",           fg: "var(--muted-fg)",  Icon: Clock },
  SUSPENDED: { bg: "var(--gold-tint)",  fg: "var(--gold-700)",  Icon: ShieldAlert },
  REVOKED:   { bg: "var(--red-tint)",   fg: "var(--red-700)",   Icon: ShieldX },
};

const PROPOSAL_TONE: Record<string, { bg: string; fg: string }> = {
  PENDING:   { bg: "var(--gold-tint)",  fg: "var(--gold-700)" },
  EXECUTED:  { bg: "var(--red-tint)",   fg: "var(--red-700)" },
  DECLINED:  { bg: "#eef1ef",           fg: "var(--muted-fg)" },
  WITHDRAWN: { bg: "#eef1ef",           fg: "var(--muted-fg)" },
};

const STATUS_FILTERS = [
  { key: "",          label: "Tous les statuts" },
  { key: "VALID",     label: "Valides" },
  { key: "SUSPENDED", label: "Suspendues" },
  { key: "REVOKED",   label: "Retirées" },
  { key: "EXPIRED",   label: "Expirées" },
];

function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function ReviewerCardsPage() {
  const qc = useQueryClient();

  const [tab, setTab] = useState<Tab>("register");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  /**
   * ⚠️ THE SESSION FILTER — the unit the commission actually reads in.
   *
   * Cards are issued in COHORTS: everyone accredited in one session shares an
   * expiry, and the decisions behind them were taken in one sitting. Reading
   * back over a session is a real task; reading over "all cards ever" is not.
   */
  const [sessionFilter, setSessionFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const [proposingFor, setProposingFor] = useState<ReviewerCard | null>(null);
  const [withdrawing, setWithdrawing] = useState<ProposalResponse | null>(null);

  const cards = useQuery({
    queryKey: reviewerCardKeys.all,
    queryFn: getReviewerCards,
  });

  const mine = useQuery({
    queryKey: lifecycleKeys.mine,
    queryFn: getMyProposals,
  });

  const pendingMine = useMemo(
    () => (mine.data ?? []).filter((p) => p.status === "PENDING").length,
    [mine.data]
  );

  /**
   * ⚠️ WHAT THE HEADING CLAIMS.
   *
   * "En circulation" excludes a revoked card, a suspended one and a lapsed
   * one — none of those is in anyone's pocket as a working credential. The
   * total of every card ever issued is a different number, and putting it
   * under that sentence makes the sentence untrue.
   */
  const inCirculation = useMemo(
    () => (cards.data ?? []).filter((c) => c.status === "VALID" && !c.expired).length,
    [cards.data]
  );

  /**
   * The sessions present in the register.
   *
   * Derived from the cards themselves rather than fetched: a session that
   * produced no card has nothing to read back over, and offering it would be
   * an empty promise. Newest first — that is the one being worked on.
   */
  const sessions = useMemo(() => {
    const seen = new Map<number, string>();
    for (const card of cards.data ?? []) {
      if (card.sessionId != null && !seen.has(card.sessionId)) {
        seen.set(card.sessionId, card.sessionLabel ?? `Session ${card.sessionId}`);
      }
    }
    return [...seen.entries()]
      .map(([id, label]) => ({ id, label }))
      .sort((a, b) => b.id - a.id);
  }, [cards.data]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cards.data ?? []).filter((c) => {
      if (sessionFilter && String(c.sessionId) !== sessionFilter) return false;
      if (statusFilter && c.status !== statusFilter) return false;
      if (!term) return true;
      return c.holderFullName.toLowerCase().includes(term)
          || c.cardNumber.toLowerCase().includes(term)
          || (c.institution ?? "").toLowerCase().includes(term)
          || (c.categoryLabelFr ?? "").toLowerCase().includes(term);
    });
  }, [cards.data, search, statusFilter, sessionFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const activeFilters = !!(search || statusFilter || sessionFilter);
  const currentSession = sessions.find((s) => String(s.id) === sessionFilter);

  const withdraw = useMutation({
    mutationFn: (proposalId: number) => withdrawProposal(proposalId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: lifecycleKeys.mine });
      qc.invalidateQueries({ queryKey: reviewerCardKeys.all });
      setWithdrawing(null);
      toast.success("Proposition retirée", {
        description: "Toute suspension conservatoire a été levée.",
      });
    },
    onError: (e) => {
      setWithdrawing(null);
      toast.error("Retrait impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      });
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
        style={{
          background:
            "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-24 -top-28 h-[220px] w-[220px] text-white opacity-[0.06] sm:-right-20 sm:-top-24 sm:h-[300px] sm:w-[300px]"
          rings={34}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:items-end sm:gap-6 sm:p-7">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Registre des cartes
            </p>
            <h2 className="mt-2.5 text-[22px] font-extrabold leading-tight sm:text-[26px]">
              Cartes de presse en circulation
            </h2>
            <p className="mt-2 max-w-lg text-[13px] leading-relaxed text-white/65 sm:text-[14px]">
              La commission peut proposer le retrait d&apos;une carte. Le
              retrait est prononcé par la Haute Autorité.
            </p>
          </div>

          <div className="flex w-full flex-wrap gap-3 sm:w-auto sm:flex-none">
            <div className="flex-none rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              {/* ⚠️ NOT cards.data.length. See inCirculation above: a revoked
                  card is not in circulation, and the heading says so. */}
              <p className="font-mono text-[26px] font-extrabold leading-none">
                {cards.isLoading ? "—" : inCirculation}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                en circulation
              </p>
            </div>
            {pendingMine > 0 && (
              <div className="flex-none rounded-xl border border-[var(--gold-500)]/40 bg-black/20 px-5 py-3.5 text-center">
                <p className="font-mono text-[26px] font-extrabold leading-none text-[var(--gold-500)]">
                  {pendingMine}
                </p>
                <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                  en attente
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══ the two questions ══ */}
      <div className="inline-flex rounded-xl bg-[#f2f5f3] p-1">
        {([
          { key: "register" as const, label: "Registre", count: cards.data?.length ?? 0 },
          { key: "mine" as const, label: "Mes propositions", count: mine.data?.length ?? 0 },
        ]).map((t) => {
          const selected = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              aria-pressed={selected}
              className="rounded-lg px-4 py-1.5 text-[12.5px] font-bold transition-all"
              style={selected
                ? { background: "#fff", color: "var(--green-900)",
                    boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                : { color: "var(--slate)" }}
            >
              {t.label}
              {/* ⚠️ The TOTAL here, deliberately — this tab holds every card,
                  including the withdrawn ones a member may need to look up. */}
              <span className="ml-1.5 font-mono text-[10.5px] opacity-60">{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ══ the register ══ */}
      {tab === "register" && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
            <span className="hidden h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)] sm:flex">
              <IdCard className="h-4 w-4 text-[var(--green-700)]" />
            </span>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Nom, n° de carte, organe de presse…"
                aria-label="Rechercher une carte"
                className="h-9 w-full rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 sm:w-64"
              />
            </div>

            {/* ⚠️ Hidden when there is only one session: a select with a single
                option is furniture. */}
            {sessions.length > 1 && (
              <div className="relative">
                <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                <select
                  value={sessionFilter}
                  onChange={(e) => { setSessionFilter(e.target.value); setPage(1); }}
                  aria-label="Filtrer par session"
                  className="h-9 rounded-lg border bg-white pl-9 pr-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
                  style={{ borderColor: sessionFilter ? "var(--green-500)" : "var(--line)" }}
                >
                  <option value="">Toutes les sessions</option>
                  {sessions.map((s) => (
                    <option key={s.id} value={String(s.id)}>{s.label}</option>
                  ))}
                </select>
              </div>
            )}

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              aria-label="Filtrer par statut"
              className="h-9 rounded-lg border bg-white px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
              style={{ borderColor: statusFilter ? "var(--green-500)" : "var(--line)" }}
            >
              {STATUS_FILTERS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>

            {activeFilters && (
              <button type="button"
                onClick={() => {
                  setSearch(""); setStatusFilter(""); setSessionFilter(""); setPage(1);
                }}
                className="text-[12px] font-semibold text-[var(--muted-fg)] underline underline-offset-2 hover:text-[var(--ink)]">
                effacer
              </button>
            )}

            <p className="ms-auto text-[12px] text-[var(--slate)]">
              {filtered.length} carte{filtered.length > 1 ? "s" : ""}
              {currentSession && (
                <span className="hidden sm:inline">
                  {" "}· {currentSession.label.toLowerCase()}
                </span>
              )}
            </p>
          </div>

          {cards.isLoading ? (
            <Skeleton className="m-5 h-32" />
          ) : filtered.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13.5px] text-[var(--slate)]">
              {activeFilters
                ? "Aucune carte ne correspond à ces critères."
                : "Aucune carte n'a encore été éditée."}
            </p>
          ) : (
            <>
              <ul className="divide-y divide-[var(--line)]">
                {visible.map((card) => (
                  <CardRow
                    key={card.cardId}
                    card={card}
                    showSession={!sessionFilter}
                    onPropose={() => setProposingFor(card)}
                  />
                ))}
              </ul>

              <PaginationBar
                page={safePage}
                pageSize={pageSize}
                total={filtered.length}
                onPageChange={setPage}
                onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
                itemNounSingular="carte"
                itemNounPlural="cartes"
              />
            </>
          )}
        </div>
      )}

      {/* ══ my proposals ══ */}
      {tab === "mine" && (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--gold-tint)]">
              <Gavel className="h-4 w-4 text-[var(--gold-700)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold text-[var(--green-900)]">
                Mes propositions de retrait
              </p>
              <p className="text-[12px] text-[var(--slate)]">
                Ce que vous avez proposé, et ce qu&apos;il en est advenu.
              </p>
            </div>
          </div>

          {mine.isLoading ? (
            <Skeleton className="m-5 h-32" />
          ) : (mine.data?.length ?? 0) === 0 ? (
            <div className="px-5 py-12 text-center">
              <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-40" />
              <p className="mt-4 text-[14px] font-extrabold text-[var(--green-900)]">
                Aucune proposition
              </p>
              <p className="mt-2 text-[13px] text-[var(--slate)]">
                Vous n&apos;avez proposé le retrait d&apos;aucune carte.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-[var(--line)]">
              {mine.data?.map((proposal) => (
                <ProposalRow
                  key={proposal.id}
                  proposal={proposal}
                  onWithdraw={() => setWithdrawing(proposal)}
                />
              ))}
            </ul>
          )}
        </div>
      )}

      <ProposeRevocationDialog
        cardId={proposingFor?.cardId ?? null}
        cardNumber={proposingFor?.cardNumber}
        holderFullName={proposingFor?.holderFullName}
        open={!!proposingFor}
        onOpenChange={(o) => {
          if (!o) {
            setProposingFor(null);
            // A successful proposal changes the register too: the card now
            // carries a pending proposal, and may have been suspended.
            qc.invalidateQueries({ queryKey: reviewerCardKeys.all });
          }
        }}
      />

      <AlertDialog open={!!withdrawing} onOpenChange={(o) => !o && setWithdrawing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer votre proposition ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre proposition concernant la carte{" "}
              {withdrawing?.cardNumber} ne sera plus examinée.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* OUTSIDE the description: AlertDialogDescription renders a <p>,
              and this is a consequence rather than a description of the act. */}
          {withdrawing?.warrantsImmediateSuspension && (
            <p className="text-[13px] font-medium leading-relaxed text-[var(--green-700)]">
              La suspension conservatoire sera levée et la carte redeviendra
              valide.
            </p>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Conserver</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => withdrawing && withdraw.mutate(withdrawing.id)}
              disabled={withdraw.isPending}
            >
              {withdraw.isPending ? "Retrait…" : "Retirer la proposition"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══ one card in the register ══ */

function CardRow({
  card, showSession, onPropose,
}: {
  card: ReviewerCard;
  /** Hidden when a session filter is active — every row would repeat it. */
  showSession: boolean;
  onPropose: () => void;
}) {
  const tone = STATUS_TONE[card.status] ?? STATUS_TONE.VALID;
  const blocked = !!card.cannotProposeReasonFr;

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
        style={{ background: tone.bg }}>
        <tone.Icon className="h-4 w-4" style={{ color: tone.fg }} />
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
          {card.holderFullName}
          <span className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
            {card.cardNumber}
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--slate)]">
          <span>{card.categoryLabelFr}</span>
          {card.specialisationFr && (
            <span className="flex items-center gap-1">
              <Briefcase className="h-3 w-3 opacity-60" />
              {card.specialisationFr}
            </span>
          )}
          {card.institution && (
            <span className="flex items-center gap-1">
              <Building2 className="h-3 w-3 opacity-60" />
              {card.institution}
            </span>
          )}
          {showSession && card.sessionLabel && (
            <span className="flex items-center gap-1">
              <CalendarRange className="h-3 w-3 opacity-60" />
              {card.sessionLabel}
            </span>
          )}
          <span className="opacity-60">
            jusqu&apos;au {longFr(card.expiresAt)}
          </span>
        </p>
      </div>

      <span className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        style={{ background: tone.bg, color: tone.fg }}>
        {card.statusLabelFr}
      </span>

      {/* The server decided whether this may be proposed, and why not. The
          reason is shown rather than the button being silently disabled — a
          greyed-out control with no explanation is a question nobody can
          answer. */}
      {blocked ? (
        <span
          title={card.cannotProposeReasonFr ?? undefined}
          className="max-w-[220px] flex-none truncate rounded-lg bg-[#f2f5f3] px-2.5 py-1.5 text-[11.5px] text-[var(--muted-fg)]"
        >
          {card.proposedByMe ? "Votre proposition est en cours" : card.cannotProposeReasonFr}
        </span>
      ) : (
        <Button size="xs" variant="outline"
          className="flex-none border-[var(--gold-500)]/50 text-[var(--gold-700)] hover:bg-[var(--gold-tint)]"
          onClick={onPropose}>
          <Gavel className="h-3.5 w-3.5" />
          Proposer le retrait
        </Button>
      )}
    </li>
  );
}

/* ══ one of my proposals ══ */

function ProposalRow({
  proposal, onWithdraw,
}: {
  proposal: ProposalResponse;
  onWithdraw: () => void;
}) {
  const tone = PROPOSAL_TONE[proposal.status] ?? PROPOSAL_TONE.PENDING;
  const open = proposal.status === "PENDING";

  return (
    <li className="px-5 py-4">
      <div className="flex flex-wrap items-start gap-4">
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
            {proposal.holderFullName}
            <span className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
              {proposal.cardNumber}
            </span>
          </p>
          <p className="mt-0.5 text-[12.5px] text-[var(--slate)]">
            {proposal.groundLabelFr}
            <span className="mx-1.5 opacity-40">·</span>
            proposée le {longFr(proposal.proposedAt)}
          </p>
        </div>

        <span className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}>
          {proposal.statusLabelFr}
        </span>

        {open && (
          <Button size="xs" variant="outline" className="flex-none"
            onClick={onWithdraw}>
            <Undo2 className="h-3.5 w-3.5" /> Retirer
          </Button>
        )}
      </div>

      {/* The Authority's answer, where there is one. A proposer who cannot
          read the refusal will simply propose again. */}
      {proposal.decidedNote && (
        <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#fbfcfb] px-4 py-3">
          {proposal.status === "EXECUTED"
            ? <Check className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--red-700)]" />
            : <X className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--muted-fg)]" />}
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--muted-fg)]">
              {proposal.status === "EXECUTED"
                ? "Retrait prononcé" : "Réponse de la Haute Autorité"}
              {proposal.decidedByName && <> — {proposal.decidedByName}</>}
            </p>
            <p dir="auto" className="mt-1 whitespace-pre-wrap text-[13px] leading-relaxed text-[var(--ink)]">
              {proposal.decidedNote}
            </p>
          </div>
        </div>
      )}
    </li>
  );
}
