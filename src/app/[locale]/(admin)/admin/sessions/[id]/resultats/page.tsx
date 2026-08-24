"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, FileSpreadsheet, Search, Scale, IdCard, PenLine, Inbox,
  AlertTriangle, Check, X, Clock, Users, ArrowRight, Loader2, CircleDot,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  getSessionResults, getSessionCandidates, downloadSessionResults, resultsKeys,
  type CandidateOutcome, type Outcome, type SessionResults,
} from "@/lib/api/session-results";
import { useAuthStore } from "@/lib/auth";
import { routes } from "@/lib/routes";

const OUTCOME_TONE: Record<Outcome, { bg: string; fg: string; label: string }> = {
  ACCEPTED: { bg: "var(--green-tint)", fg: "var(--green-700)", label: "Acceptée" },
  REJECTED: { bg: "var(--red-tint)",   fg: "var(--red-700)",   label: "Rejetée" },
  PENDING:  { bg: "var(--gold-tint)",  fg: "var(--gold-700)",  label: "En cours" },
  DRAFT:    { bg: "#eef1ef",           fg: "var(--muted-fg)",  label: "Non déposée" },
};

const OUTCOME_FILTERS: { key: "" | Outcome; label: string }[] = [
  { key: "",         label: "Tous" },
  { key: "ACCEPTED", label: "Acceptées" },
  { key: "REJECTED", label: "Rejetées" },
  { key: "PENDING",  label: "En cours" },
  { key: "DRAFT",    label: "Non déposées" },
];

function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function pct(part: number, whole: number) {
  return whole === 0 ? 0 : Math.round((part / whole) * 100);
}

export default function SessionResultsPage() {
  const params = useParams();
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const sessionId = Number(params.id);

  const [search, setSearch] = useState("");
  const [outcome, setOutcome] = useState<"" | Outcome>("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(24);

  const results = useQuery({
    queryKey: resultsKeys.results(sessionId),
    queryFn: () => getSessionResults(sessionId),
    enabled: Number.isFinite(sessionId),
  });

  const candidates = useQuery({
    queryKey: resultsKeys.candidates(sessionId),
    queryFn: () => getSessionCandidates(sessionId),
    enabled: Number.isFinite(sessionId),
  });

  const exportXlsx = useMutation({
    mutationFn: () => downloadSessionResults(sessionId, token),
    onError: () => toast.error("Export impossible", {
      description: "Réessayez dans un instant.",
    }),
  });

  const r = results.data;

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (candidates.data ?? []).filter((c) => {
      if (outcome && c.outcome !== outcome) return false;
      if (!term) return true;
      return c.fullName.toLowerCase().includes(term)
          || (c.institution ?? "").toLowerCase().includes(term)
          || (c.cardNumber ?? "").toLowerCase().includes(term)
          || c.categoryLabelFr.toLowerCase().includes(term);
    });
  }, [candidates.data, search, outcome]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const pendingWork = r
    ? r.unclaimed + r.awaitingCorrection + r.acceptedWithoutCard
    : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-7 pb-4">

      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon"
          onClick={() => router.push(routes.admin.sessions)}
          aria-label="Retour aux sessions">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="min-w-0 flex-1">
          <h2 className="text-xl font-extrabold text-[var(--green-900)]">
            Session n° {sessionId}
          </h2>
          <p className="text-sm text-[var(--slate)]">
            {r ? (r.closed ? "Résultats définitifs" : "Déroulement en cours") : "…"}
          </p>
        </div>
        <Button variant="outline" size="sm"
          disabled={exportXlsx.isPending}
          onClick={() => exportXlsx.mutate()}>
          {exportXlsx.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <FileSpreadsheet className="h-3.5 w-3.5" />}
          Exporter
        </Button>
      </div>

      {/* ══════════════════════════════════════════════════════════
          THE COHORT — the signature.

          One proportional measure of what became of everyone who applied.
          The bar IS the session: where it sits between green and red is the
          only summary most people will ever need.
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 85% -30%, rgba(255,215,0,.12), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />

        <div className="relative z-10 px-7 py-7">
          {results.isLoading || !r ? (
            <Skeleton className="h-40 w-full bg-white/10" />
          ) : (
            <>
              <div className="flex flex-wrap items-end justify-between gap-6">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                    {r.closed ? "Session close" : r.statusLabelFr}
                  </p>
                  <h3 className="mt-2.5 text-[30px] font-extrabold leading-none tracking-tight">
                    {r.submitted} candidature{r.submitted > 1 ? "s" : ""} déposée{r.submitted > 1 ? "s" : ""}
                  </h3>
                  <p className="mt-2 text-[13px] text-white/55">
                    du {longFr(r.startDate)} au {longFr(r.reclamationEnd)}
                    {r.started > r.submitted && (
                      <> · {r.started - r.submitted} dossier
                        {r.started - r.submitted > 1 ? "s" : ""} jamais déposé
                        {r.started - r.submitted > 1 ? "s" : ""}</>
                    )}
                  </p>
                </div>

                <div className="text-right">
                  <p className="font-mono text-[46px] font-extrabold leading-none text-[var(--gold-500)]">
                    {r.cardsIssued}
                  </p>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white/45">
                    carte{r.cardsIssued > 1 ? "s" : ""} éditée{r.cardsIssued > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* the measure */}
              {r.submitted > 0 && (
                <>
                  <div className="mt-7 flex h-3 overflow-hidden rounded-full bg-white/10">
                    {r.accepted > 0 && (
                      <div style={{ width: `${pct(r.accepted, r.submitted)}%`,
                                    background: "var(--green-500)" }}
                        title={`${r.accepted} acceptées`} />
                    )}
                    {r.inProgress > 0 && (
                      <div style={{ width: `${pct(r.inProgress, r.submitted)}%`,
                                    background: "var(--gold-500)" }}
                        title={`${r.inProgress} en cours`} />
                    )}
                    {r.rejected > 0 && (
                      <div style={{ width: `${pct(r.rejected, r.submitted)}%`,
                                    background: "var(--red-500)" }}
                        title={`${r.rejected} rejetées`} />
                    )}
                  </div>

                  <div className="mt-4 flex flex-wrap gap-x-7 gap-y-2.5">
                    <Legend colour="var(--green-500)" value={r.accepted}
                      label="acceptées" total={r.submitted} />
                    {r.inProgress > 0 && (
                      <Legend colour="var(--gold-500)" value={r.inProgress}
                        label="en cours d'examen" total={r.submitted} />
                    )}
                    <Legend colour="var(--red-500)" value={r.rejected}
                      label="rejetées" total={r.submitted} />
                    {r.objectionsFiled > 0 && (
                      <Legend colour="rgba(255,255,255,.35)" value={r.objectionsFiled}
                        label={`réclamation${r.objectionsFiled > 1 ? "s" : ""}`}
                        total={r.submitted} />
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════
          WHAT THIS SESSION STILL NEEDS — only while it is running.

          The difference between a report and a tool. Each line is something
          an administrator can act on today, with the route to act on it.
          ══════════════════════════════════════════════════════════ */}
      {r && !r.closed && pendingWork > 0 && (
        <section className="space-y-2.5">
          <h3 className="px-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
            Ce que cette session attend
          </h3>

          {r.unclaimed > 0 && (
            <WorkRow
              tone="gold" Icon={Inbox}
              title={`${r.unclaimed} dossier${r.unclaimed > 1 ? "s" : ""} sans examinateur`}
              detail="Personne ne les a pris en charge dans la commission."
              action="Voir la commission"
              onAction={() => router.push(routes.admin.reviewers)}
            />
          )}

          {r.awaitingCorrection > 0 && (
            <WorkRow
              tone="gold" Icon={PenLine}
              title={`${r.awaitingCorrection} correction${r.awaitingCorrection > 1 ? "s" : ""} sans réponse`}
              detail={
                "Les candidats n'ont pas encore répondu. ⚠️ Avancer la session "
                + "hors de la phase de correction les fera rejeter automatiquement."
              }
            />
          )}

          {r.acceptedWithoutCard > 0 && (
            <WorkRow
              tone="green" Icon={IdCard}
              title={`${r.acceptedWithoutCard} carte${r.acceptedWithoutCard > 1 ? "s" : ""} à éditer`}
              detail={r.blockedFromCard > 0
                ? `Dont ${r.blockedFromCard} bloquée${r.blockedFromCard > 1 ? "s" : ""} : photographie, spécialité ou organe de presse manquant.`
                : "Candidatures acceptées, en attente d'édition."}
              action="Éditer"
              onAction={() => router.push(routes.admin.cards)}
            />
          )}
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          THE CONTESTED ONES

          Shown separately because the objection rate measures something the
          other figures do not: how often the commission's first decision did
          not hold. That is the closest thing the system has to a measure of
          its own review quality, and it should not be buried in a total.
          ══════════════════════════════════════════════════════════ */}
      {r && r.objectionsFiled > 0 && (
        <section className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--gold-tint)]">
              <Scale className="h-4 w-4 text-[var(--gold-700)]" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold text-[var(--green-900)]">
                Réclamations
              </p>
              <p className="text-[12px] text-[var(--slate)]">
                Rejets contestés par leur candidat, réexaminés par un autre
                membre de la commission.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-[var(--line)]">
            <Figure value={r.objectionsFiled} label="Déposées" />
            <Figure value={r.objectionsUpheld} label="Décision infirmée"
              note={r.objectionsFiled > 0
                ? `${pct(r.objectionsUpheld, r.objectionsFiled)} % des réclamations`
                : undefined}
              tone="var(--green-700)" />
            <Figure value={r.objectionsDismissed} label="Rejet confirmé"
              tone="var(--red-700)" />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          BY CATEGORY — what HAPA reports on
          ══════════════════════════════════════════════════════════ */}
      {r && r.byCategory.length > 0 && (
        <section className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
          <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
              <Users className="h-4 w-4 text-[var(--green-700)]" />
            </span>
            <p className="text-[14px] font-extrabold text-[var(--green-900)]">
              Par catégorie
            </p>
          </div>

          <ul className="divide-y divide-[var(--line)]">
            {r.byCategory.map((c) => (
              <li key={c.labelFr} className="px-5 py-3.5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                    {c.labelFr}
                  </p>
                  <p className="font-mono text-[12px] text-[var(--slate)]">
                    {c.submitted} déposée{c.submitted > 1 ? "s" : ""}
                    <span className="mx-1.5 opacity-40">·</span>
                    <span className="text-[var(--green-700)]">{c.accepted} acceptée{c.accepted > 1 ? "s" : ""}</span>
                    <span className="mx-1.5 opacity-40">·</span>
                    <span className="text-[var(--red-700)]">{c.rejected} rejetée{c.rejected > 1 ? "s" : ""}</span>
                  </p>
                </div>
                {/* A miniature of the cohort bar, per category — the same
                    encoding, so the eye reads it without relearning. */}
                <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-[#eef1ef]">
                  {c.accepted > 0 && (
                    <div style={{ width: `${pct(c.accepted, c.submitted)}%`,
                                  background: "var(--green-500)" }} />
                  )}
                  {c.rejected > 0 && (
                    <div style={{ width: `${pct(c.rejected, c.submitted)}%`,
                                  background: "var(--red-500)" }} />
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          THE COHORT, ONE BY ONE
          ══════════════════════════════════════════════════════════ */}
      <section className="overflow-hidden rounded-[18px] border border-[var(--line)] bg-white">
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
            <input
              type="search"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Nom, organe de presse, n° de carte…"
              aria-label="Rechercher un candidat"
              className="h-9 w-72 rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
            />
          </div>

          <div className="flex flex-wrap gap-1">
            {OUTCOME_FILTERS.map((f) => {
              const selected = outcome === f.key;
              return (
                <button
                  key={f.key || "all"}
                  type="button"
                  onClick={() => { setOutcome(f.key); setPage(1); }}
                  aria-pressed={selected}
                  className="rounded-lg px-3 py-1.5 text-[12px] font-bold transition-colors"
                  style={selected
                    ? { background: "var(--green-700)", color: "#fff" }
                    : { color: "var(--slate)" }}
                >
                  {f.label}
                </button>
              );
            })}
          </div>

          <p className="ml-auto text-[12px] text-[var(--slate)]">
            {filtered.length} candidat{filtered.length > 1 ? "s" : ""}
          </p>
        </div>

        {candidates.isLoading ? (
          <Skeleton className="m-5 h-40" />
        ) : filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-[13.5px] text-[var(--slate)]">
            {search || outcome
              ? "Aucun candidat ne correspond à ces critères."
              : "Aucune candidature pour cette session."}
          </p>
        ) : (
          <>
            <ul className="divide-y divide-[var(--line)]">
              {visible.map((c) => <CandidateRow key={c.applicationId} candidate={c} />)}
            </ul>
            <PaginationBar
              page={safePage}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={(s) => { setPageSize(s); setPage(1); }}
              itemNounSingular="candidat"
              itemNounPlural="candidats"
            />
          </>
        )}
      </section>
    </div>
  );
}

/* ══ pieces ══ */

function Legend({ colour, value, label, total }: {
  colour: string; value: number; label: string; total: number;
}) {
  return (
    <span className="flex items-baseline gap-2">
      <i className="h-2 w-2 flex-none translate-y-[-1px] rounded-full"
        style={{ background: colour }} aria-hidden="true" />
      <span className="font-mono text-[16px] font-extrabold leading-none">{value}</span>
      <span className="text-[12px] text-white/55">
        {label} · {pct(value, total)} %
      </span>
    </span>
  );
}

const WORK_TONES = {
  gold:  { border: "var(--gold-500)",  bg: "var(--gold-tint)",  fg: "var(--gold-700)",  chip: "var(--gold-700)" },
  green: { border: "var(--green-500)", bg: "var(--green-tint)", fg: "var(--green-700)", chip: "var(--green-600)" },
} as const;

function WorkRow({ tone, Icon, title, detail, action, onAction }: {
  tone: keyof typeof WORK_TONES;
  Icon: React.ElementType;
  title: string;
  detail: string;
  action?: string;
  onAction?: () => void;
}) {
  const t = WORK_TONES[tone];
  const content = (
    <>
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
        style={{ background: t.chip }}>
        <Icon className="h-4 w-4 text-white" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13.5px] font-extrabold" style={{ color: t.fg }}>
          {title}
        </span>
        <span className="block text-[12.5px] leading-relaxed" style={{ color: t.fg }}>
          {detail}
        </span>
      </span>
      {action && (
        <span className="inline-flex flex-none items-center gap-1.5 text-[12.5px] font-bold"
          style={{ color: t.fg }}>
          {action} <ArrowRight className="h-3.5 w-3.5" />
        </span>
      )}
    </>
  );

  return onAction ? (
    <button type="button" onClick={onAction}
      className="flex w-full flex-wrap items-center gap-4 rounded-[18px] border-l-[3px] px-5 py-4 text-left transition-shadow hover:shadow-[0_8px_24px_-16px_rgba(11,46,31,.5)]"
      style={{ borderLeftColor: t.border, background: t.bg }}>
      {content}
    </button>
  ) : (
    <div className="flex flex-wrap items-center gap-4 rounded-[18px] border-l-[3px] px-5 py-4"
      style={{ borderLeftColor: t.border, background: t.bg }}>
      {content}
    </div>
  );
}

function Figure({ value, label, note, tone }: {
  value: number; label: string; note?: string; tone?: string;
}) {
  return (
    <div className="px-5 py-4">
      <p className="font-mono text-[26px] font-extrabold leading-none"
        style={{ color: tone ?? "var(--green-900)" }}>
        {value}
      </p>
      <p className="mt-1.5 text-[11px] font-bold uppercase tracking-[0.13em] text-[var(--slate)]">
        {label}
      </p>
      {note && <p className="mt-0.5 text-[11.5px] text-[var(--muted-fg)]">{note}</p>}
    </div>
  );
}

function CandidateRow({ candidate }: { candidate: CandidateOutcome }) {
  const tone = OUTCOME_TONE[candidate.outcome];

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5">
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg"
        style={{ background: tone.bg }}>
        {candidate.outcome === "ACCEPTED" ? <Check className="h-4 w-4" style={{ color: tone.fg }} />
          : candidate.outcome === "REJECTED" ? <X className="h-4 w-4" style={{ color: tone.fg }} />
          : candidate.outcome === "PENDING" ? <Clock className="h-4 w-4" style={{ color: tone.fg }} />
          : <CircleDot className="h-4 w-4" style={{ color: tone.fg }} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
          {candidate.fullName}
          {candidate.cardNumber && (
            <span className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
              {candidate.cardNumber}
            </span>
          )}
          {/* A contested rejection is worth marking: it is the dossier a
              reader is most likely to be looking for. */}
          {candidate.objected && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--gold-700)]">
              <Scale className="h-2.5 w-2.5" /> réclamation
            </span>
          )}
        </p>
        <p className="flex flex-wrap items-center gap-x-2.5 text-[12px] text-[var(--slate)]">
          <span>{candidate.categoryLabelFr}</span>
          {candidate.institution && (
            <>
              <span className="opacity-40">·</span>
              <span>{candidate.institution}</span>
            </>
          )}
          {candidate.submittedAt && (
            <>
              <span className="opacity-40">·</span>
              <span>déposée le {longFr(candidate.submittedAt)}</span>
            </>
          )}
        </p>
      </div>

      <span className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        style={{ background: tone.bg, color: tone.fg }}>
        {candidate.statusLabelFr}
      </span>
    </li>
  );
}
