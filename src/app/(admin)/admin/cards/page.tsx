"use client";
// src/app/(admin)/admin/cards/page.tsx
// Issuing cards, for the super admin.
//
// The commission decides who is entitled to a card; the Authority issues it.
// Keeping those hands separate is what makes the credential an institutional
// act rather than one reviewer's — hence SUPER_ADMIN only.
//
// BUILT FOR VOLUME. A national press corps produces hundreds of cards per
// session, and an administrator works through them in an afternoon. So both
// lists carry search, filters, pagination and select-all — a screen that
// requires two hundred individual clicks is a screen nobody uses correctly.
//
// ONE NUANCE THAT MATTERS: "select all" selects everything MATCHING THE
// CURRENT FILTER, not merely the visible page. The count says so explicitly,
// because a select-all that silently covers only one page is how someone
// prints forty cards believing they printed two hundred.

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IdCard, Printer, FileSpreadsheet, AlertTriangle, Check, X,
  Layers, Camera, Loader2, Search, ExternalLink, Download,
  History,
  ShieldCheck,
  ShieldAlert,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getIssuable, getRegistry, issueCards, downloadCardPdf, downloadBatchPdf,
  downloadRegistry, cardKeys,
  type BatchResult, type PageLayout, type CardItem,
} from "@/lib/api/cards";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { CardHistoryDialog } from "@/components/card/CardHistoryDialog";
import { CardStatusActions } from "@/components/card/CardStatusActions";

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  VALID:     { bg: "var(--green-tint)", fg: "var(--green-700)" },
  EXPIRED:   { bg: "#eef1ef",           fg: "var(--muted-fg)" },
  SUSPENDED: { bg: "var(--gold-tint)",  fg: "var(--gold-700)" },
  REVOKED:   { bg: "var(--red-tint)",   fg: "var(--red-700)" },
};

const STATUS_FILTERS = [
  { key: "",          label: "Tous les statuts" },
  { key: "VALID",     label: "Valides" },
  { key: "EXPIRED",   label: "Expirées" },
  { key: "SUSPENDED", label: "Suspendues" },
  { key: "REVOKED",   label: "Retirées" },
];

export default function AdminCardsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  /* ── issuable list ── */
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [issuableSearch, setIssuableSearch] = useState("");
  const [issuablePage, setIssuablePage] = useState(1);
  const [issuablePageSize, setIssuablePageSize] = useState(20);

  /* ── registry ── */
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [registrySearch, setRegistrySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [registryPage, setRegistryPage] = useState(1);
  const [registryPageSize, setRegistryPageSize] = useState(12);

  const [layout, setLayout] = useState<PageLayout>("SHARED_BACK");
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);

  const issuable = useQuery({ queryKey: cardKeys.issuable, queryFn: getIssuable });
  const registry = useQuery({ queryKey: cardKeys.registry, queryFn: getRegistry });

   // Which card the history / status dialogs are acting on.
  const [historyFor, setHistoryFor] = useState<CardItem | null>(null);
  const [statusFor, setStatusFor] = useState<CardItem | null>(null);

  /* ══ issuable: filtered, then paged ══ */

  const ready = useMemo(() => {
    const term = issuableSearch.trim().toLowerCase();
    return (issuable.data ?? [])
      .filter((i) => !i.blockerFr)
      .filter((i) => !term
        || i.candidateFullName.toLowerCase().includes(term)
        || i.identityNumber.toLowerCase().includes(term));
  }, [issuable.data, issuableSearch]);

  const blocked = useMemo(
    () => (issuable.data ?? []).filter((i) => i.blockerFr),
    [issuable.data]
  );

  const readyPageCount = Math.max(1, Math.ceil(ready.length / issuablePageSize));
  const readySafePage = Math.min(issuablePage, readyPageCount);
  const readyVisible = ready.slice(
    (readySafePage - 1) * issuablePageSize, readySafePage * issuablePageSize);

  /* ══ registry: filtered, then paged ══ */

  const filteredCards = useMemo(() => {
    const term = registrySearch.trim().toLowerCase();
    return (registry.data ?? []).filter((c) => {
      if (statusFilter && c.status !== statusFilter) return false;
      if (!term) return true;
      return c.holderFullName.toLowerCase().includes(term)
          || c.cardNumber.toLowerCase().includes(term)
          || (c.categoryLabelFr ?? "").toLowerCase().includes(term);
    });
  }, [registry.data, registrySearch, statusFilter]);

  const cardPageCount = Math.max(1, Math.ceil(filteredCards.length / registryPageSize));
  const cardSafePage = Math.min(registryPage, cardPageCount);
  const cardsVisible = filteredCards.slice(
    (cardSafePage - 1) * registryPageSize, cardSafePage * registryPageSize);

  /* ══ mutations ══ */

  const issue = useMutation({
    mutationFn: () => issueCards([...selected]),
    onSuccess: (batch) => {
      setResult(batch);
      setSelected(new Set());
      setConfirmIssue(false);
      qc.invalidateQueries({ queryKey: cardKeys.issuable });
      qc.invalidateQueries({ queryKey: cardKeys.registry });

      if (batch.failed === 0) {
        toast.success(`${batch.issued} carte${batch.issued > 1 ? "s" : ""} éditée${batch.issued > 1 ? "s" : ""}`);
      } else {
        toast.warning(`${batch.issued} éditée(s), ${batch.failed} en échec`, {
          description: "Le détail figure ci-dessous.",
        });
      }
    },
    onError: (e) => {
      setConfirmIssue(false);
      toast.error("Édition impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      });
    },
  });

  const printBatch = useMutation({
    mutationFn: () => downloadBatchPdf([...selectedCards], layout, token),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: cardKeys.registry });   // print_count moved
      toast.success(`${selectedCards.size} carte(s) prête(s) à imprimer`);
    },
    onError: (e) => toast.error("Impression impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
    }),
  });

  const exportRegistry = useMutation({
    mutationFn: () => downloadRegistry(token),
    onError: (e) => toast.error("Export impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
    }),
  });

  /* ══ selection helpers ══ */

  const toggle = (set: Set<number>, id: number, apply: (s: Set<number>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    apply(next);
  };

  // Select-all covers everything MATCHING THE FILTER, not just this page.
  const allReadySelected = ready.length > 0
    && ready.every((i) => selected.has(i.applicationId));
  const allCardsSelected = filteredCards.length > 0
    && filteredCards.every((c) => selectedCards.has(c.cardId));

  const openVerification = (token_: string) =>
    window.open(`/verifier/${token_}`, "_blank", "noopener,noreferrer");

  return (
    <div className="mx-auto max-w-6xl space-y-6">
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

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Édition des cartes
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
              Cartes de presse
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
              Les candidatures acceptées par la commission donnent lieu à une
              carte éditée par le MCACRP.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="text-[26px] font-extrabold leading-none">
                {issuable.isLoading ? "—" : ready.length}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                à éditer
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="text-[26px] font-extrabold leading-none">
                {registry.isLoading ? "—" : (registry.data?.length ?? 0)}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                éditées
              </p>
            </div>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══ the batch report ══ */}
      {result && (
        <div className="overflow-hidden rounded-2xl border-2 bg-white"
          style={{ borderColor: result.failed > 0 ? "var(--gold-500)" : "var(--green-500)" }}>
          <div className="flex items-center gap-3 px-6 py-4"
            style={{ background: result.failed > 0 ? "var(--gold-tint)" : "var(--green-tint)" }}>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
              style={{ background: result.failed > 0 ? "var(--gold-700)" : "var(--green-600)" }}>
              {result.failed > 0 ? <AlertTriangle className="h-4 w-4 text-white" />
                                 : <Check className="h-4 w-4 text-white" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-extrabold"
                style={{ color: result.failed > 0 ? "var(--gold-700)" : "var(--green-700)" }}>
                {result.issued} carte{result.issued > 1 ? "s" : ""} éditée{result.issued > 1 ? "s" : ""}
                {result.failed > 0 && <> · {result.failed} en échec</>}
              </p>
              <p className="text-[12.5px]"
                style={{ color: result.failed > 0 ? "var(--gold-700)" : "var(--green-700)" }}>
                {result.failed > 0
                  ? "Corrigez les dossiers en échec puis relancez — l'édition est idempotente."
                  : "Les titulaires ont été informés par e-mail."}
              </p>
            </div>
            <button type="button" onClick={() => setResult(null)}
              aria-label="Fermer le rapport"
              className="flex-none rounded-lg p-1.5 text-[var(--muted-fg)] hover:bg-white/60">
              <X className="h-4 w-4" />
            </button>
          </div>

          {result.failed > 0 && (
            <ul className="divide-y divide-[var(--line)]">
              {result.outcomes.filter((o) => !o.issued).map((o) => (
                <li key={o.applicationId} className="flex items-start gap-3 px-6 py-3">
                  <X className="mt-0.5 h-4 w-4 flex-none text-[var(--red-500)]" />
                  <div className="min-w-0">
                    <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                      {o.candidateFullName}
                      <span className="ml-2 font-mono text-[11px] text-[var(--muted-fg)]">
                        n° {o.applicationId}
                      </span>
                    </p>
                    <p className="text-[12.5px] text-[var(--red-700)]">{o.failureReason}</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* ══ blocked, above the working list ══
          These need a fix elsewhere — a photograph, a specialisation — so
          they are surfaced separately rather than sitting inert among rows
          the administrator is trying to select. */}
      {blocked.length > 0 && (
        <div className="overflow-hidden rounded-2xl border border-[var(--gold-500)]/50 bg-[var(--gold-tint)]">
          <div className="flex items-center gap-3 px-5 py-3.5">
            <AlertTriangle className="h-4 w-4 flex-none text-[var(--gold-700)]" />
            <p className="text-[13.5px] font-extrabold text-[var(--gold-700)]">
              {blocked.length} candidature{blocked.length > 1 ? "s" : ""} acceptée
              {blocked.length > 1 ? "s" : ""} ne peut{blocked.length > 1 ? "vent" : ""} pas
              encore donner lieu à une carte
            </p>
          </div>
          <ul className="divide-y divide-[var(--gold-500)]/25 border-t border-[var(--gold-500)]/25">
            {blocked.map((item) => (
              <li key={item.applicationId} className="flex items-start gap-3 px-5 py-2.5">
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-bold text-[var(--green-900)]">
                    {item.candidateFullName}
                  </span>
                  <span className="block text-[12px] text-[var(--gold-700)]">
                    {item.blockerFr}
                  </span>
                </span>
                <span className="flex-none font-mono text-[11px] text-[var(--gold-700)]/70">
                  n° {item.applicationId}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ══ awaiting a card ══ */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
            <IdCard className="h-4 w-4 text-[var(--green-700)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold text-[var(--green-900)]">
              Candidatures acceptées, en attente de carte
            </p>
            <p className="text-[12px] text-[var(--slate)]">
              {ready.length} prête{ready.length > 1 ? "s" : ""} à éditer
              {selected.size > 0 && (
                <span className="font-semibold text-[var(--green-700)]">
                  {" "}· {selected.size} sélectionnée{selected.size > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
            <input
              type="search"
              value={issuableSearch}
              onChange={(e) => { setIssuableSearch(e.target.value); setIssuablePage(1); }}
              placeholder="Nom ou NNI…"
              aria-label="Rechercher une candidature"
              className="h-9 w-52 rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
            />
          </div>

          <Button size="sm" disabled={selected.size === 0}
            onClick={() => setConfirmIssue(true)}>
            <IdCard className="h-3.5 w-3.5" />
            Éditer {selected.size > 0 && `(${selected.size})`}
          </Button>
        </div>

        {issuable.isLoading ? (
          <Skeleton className="m-5 h-24" />
        ) : ready.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-[var(--slate)]">
            {issuableSearch
              ? "Aucune candidature ne correspond à cette recherche."
              : "Aucune candidature acceptée n'attend de carte."}
          </p>
        ) : (
          <>
            {/* select-all header */}
            <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
              <Checkbox
                checked={allReadySelected}
                onCheckedChange={() => setSelected(
                  allReadySelected
                    ? new Set()
                    : new Set(ready.map((i) => i.applicationId)))}
                aria-label="Tout sélectionner"
              />
              <span className="text-[12px] font-semibold text-[var(--slate)]">
                {allReadySelected
                  ? "Tout désélectionner"
                  : `Sélectionner les ${ready.length} candidature${ready.length > 1 ? "s" : ""}`}
                {issuableSearch && " correspondant à la recherche"}
              </span>
            </div>

            <ul className="divide-y divide-[var(--line)]">
              {readyVisible.map((item) => (
                <li key={item.applicationId}
                  className="flex items-center gap-4 px-5 py-3"
                  style={{ background: selected.has(item.applicationId)
                    ? "var(--green-tint)" : undefined }}>
                  <Checkbox
                    checked={selected.has(item.applicationId)}
                    onCheckedChange={() =>
                      toggle(selected, item.applicationId, setSelected)}
                    aria-label={`Sélectionner ${item.candidateFullName}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                      {item.candidateFullName}
                    </p>
                    <p className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--slate)]">
                      {item.categoryLabelFr}
                      <span className="opacity-40">·</span>
                      <span className="font-mono">{item.identityNumber}</span>
                    </p>
                  </div>
                  <Camera className="h-4 w-4 flex-none text-[var(--green-600)]"
                    aria-label="Photographie présente" />
                </li>
              ))}
            </ul>

            <PaginationBar
              page={readySafePage}
              pageSize={issuablePageSize}
              total={ready.length}
              onPageChange={setIssuablePage}
              onPageSizeChange={(size) => { setIssuablePageSize(size); setIssuablePage(1); }}
              itemNounSingular="candidature"
              itemNounPlural="candidatures"
            />
          </>
        )}
      </div>

      {/* ══ the registry ══ */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="flex flex-wrap items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
            <Layers className="h-4 w-4 text-[var(--green-700)]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold text-[var(--green-900)]">
              Registre des cartes
            </p>
            <p className="text-[12px] text-[var(--slate)]">
              {filteredCards.length} carte{filteredCards.length > 1 ? "s" : ""}
              {(registrySearch || statusFilter) && ` sur ${registry.data?.length ?? 0}`}
              {selectedCards.size > 0 && (
                <span className="font-semibold text-[var(--green-700)]">
                  {" "}· {selectedCards.size} sélectionnée{selectedCards.size > 1 ? "s" : ""}
                </span>
              )}
            </p>
          </div>

          <Button size="sm" variant="outline"
            disabled={exportRegistry.isPending}
            onClick={() => exportRegistry.mutate()}>
            <FileSpreadsheet className="h-3.5 w-3.5" />
            Exporter tout
          </Button>
        </div>

        {/* filters */}
        <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-5 py-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
            <input
              type="search"
              value={registrySearch}
              onChange={(e) => { setRegistrySearch(e.target.value); setRegistryPage(1); }}
              placeholder="Nom, n° de carte, catégorie…"
              aria-label="Rechercher une carte"
              className="h-9 w-64 rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setRegistryPage(1); }}
            aria-label="Filtrer par statut"
            className="h-9 rounded-lg border bg-white px-3 text-[13px] outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
            style={{ borderColor: statusFilter ? "var(--green-500)" : "var(--line)" }}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.key} value={s.key}>{s.label}</option>
            ))}
          </select>

          {(registrySearch || statusFilter) && (
            <button type="button"
              onClick={() => { setRegistrySearch(""); setStatusFilter(""); setRegistryPage(1); }}
              className="text-[12px] font-semibold text-[var(--muted-fg)] underline underline-offset-2 hover:text-[var(--ink)]">
              effacer les filtres
            </button>
          )}

          {/* Not a preference — a property of the machine the PDF goes to. */}
          <label className="ml-auto flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
            Disposition
            <select
              value={layout}
              onChange={(e) => setLayout(e.target.value as PageLayout)}
              className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/30"
            >
              <option value="SHARED_BACK">Rectos + un seul verso</option>
              <option value="SEQUENTIAL">Rectos puis tous les versos</option>
              <option value="INTERLEAVED">Recto/verso alterné</option>
            </select>
          </label>

          <Button size="sm"
            disabled={selectedCards.size === 0 || printBatch.isPending}
            onClick={() => printBatch.mutate()}>
            {printBatch.isPending
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <Printer className="h-3.5 w-3.5" />}
            Imprimer {selectedCards.size > 0 && `(${selectedCards.size})`}
          </Button>
        </div>

        {registry.isLoading ? (
          <Skeleton className="m-5 h-24" />
        ) : filteredCards.length === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-[var(--slate)]">
            {registrySearch || statusFilter
              ? "Aucune carte ne correspond à ces filtres."
              : "Aucune carte éditée pour le moment."}
          </p>
        ) : (
          <>
            {/* select-all header */}
            <div className="flex items-center gap-4 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
              <Checkbox
                checked={allCardsSelected}
                onCheckedChange={() => setSelectedCards(
                  allCardsSelected
                    ? new Set()
                    : new Set(filteredCards.map((c) => c.cardId)))}
                aria-label="Tout sélectionner"
              />
              {/* Says FILTERED, not "this page": a select-all that silently
                  covers one page is how someone prints forty cards believing
                  they printed two hundred. */}
              <span className="text-[12px] font-semibold text-[var(--slate)]">
                {allCardsSelected
                  ? "Tout désélectionner"
                  : `Sélectionner les ${filteredCards.length} carte${filteredCards.length > 1 ? "s" : ""}`}
                {(registrySearch || statusFilter) && " correspondant aux filtres"}
              </span>
            </div>

            <ul className="divide-y divide-[var(--line)]">
              {cardsVisible.map((card) => (
                // <CardRow
                //   key={card.cardId}
                //   card={card}
                //   selected={selectedCards.has(card.cardId)}
                //   onToggle={() => toggle(selectedCards, card.cardId, setSelectedCards)}
                //   onDownload={() => downloadCardPdf(card.cardId, card.cardNumber, token)}
                // />
                <CardRow
                  key={card.cardId}
                  card={card}
                  selected={selectedCards.has(card.cardId)}
                  onToggle={() => toggle(selectedCards, card.cardId, setSelectedCards)}
                  onDownload={() => downloadCardPdf(card.cardId, card.cardNumber, token)}
                  onHistory={() => setHistoryFor(card)}
                  onStatus={() => setStatusFor(card)}
                />
              ))}
            </ul>

            <PaginationBar
              page={cardSafePage}
              pageSize={registryPageSize}
              total={filteredCards.length}
              onPageChange={setRegistryPage}
              onPageSizeChange={(size) => { setRegistryPageSize(size); setRegistryPage(1); }}
              itemNounSingular="carte"
              itemNounPlural="cartes"
            />
          </>
        )}
      </div>

      <AlertDialog open={confirmIssue} onOpenChange={setConfirmIssue}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Éditer {selected.size} carte{selected.size > 1 ? "s" : ""} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Chaque carte recevra un numéro officiel et une signature
              électronique. Les titulaires seront informés par e-mail.
              <br />
              <span className="mt-2 block font-medium text-[var(--ink)]">
                Le numéro attribué est définitif : il figure sur un document
                officiel et ne peut pas être réattribué.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => issue.mutate()} disabled={issue.isPending}>
              {issue.isPending ? "Édition…" : "Confirmer l'édition"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CardHistoryDialog
        cardId={historyFor?.cardId ?? null}
        cardNumber={historyFor?.cardNumber}
        holderFullName={historyFor?.holderFullName}
        open={!!historyFor}
        onOpenChange={(o) => !o && setHistoryFor(null)}
      />

      <CardStatusActions
        cardId={statusFor?.cardId ?? null}
        cardNumber={statusFor?.cardNumber}
        holderFullName={statusFor?.holderFullName}
        status={statusFor?.status}
        open={!!statusFor}
        onOpenChange={(o) => !o && setStatusFor(null)}
      />
    </div>
  );
}

/* ══ one row of the registry ══ */

// function CardRow({
//   card, selected, onToggle, onDownload,
// }: {
//   card: CardItem;
//   selected: boolean;
//   onToggle: () => void;
//   onDownload: () => void;
// }) {
function CardRow({
  card, selected, onToggle, onDownload, onHistory, onStatus,
}: {
  card: CardItem;
  selected: boolean;
  onToggle: () => void;
  onDownload: () => void;
  onHistory: () => void;
  onStatus: () => void;
}) {
  const tone = STATUS_TONE[card.status] ?? STATUS_TONE.VALID;

  return (
    <li className="flex items-center gap-4 px-5 py-3"
      style={{ background: selected ? "var(--green-tint)" : undefined }}>
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        aria-label={`Sélectionner la carte ${card.cardNumber}`}
      />

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
          {card.holderFullName}
          <span className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
            {card.cardNumber}
          </span>
        </p>
        <p className="text-[12px] text-[var(--slate)]">
          {card.categoryLabelFr}
          <span className="mx-1.5 opacity-40">·</span>
          valable jusqu&apos;au{" "}
          {new Date(card.expiresAt).toLocaleDateString("fr-FR")}
          {card.printCount > 0 && (
            <>
              <span className="mx-1.5 opacity-40">·</span>
              imprimée {card.printCount}×
            </>
          )}
        </p>
      </div>

      <span className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold"
        style={{ background: tone.bg, color: tone.fg }}>
        {card.statusLabelFr}
      </span>

      {/* <button
        type="button"
        onClick={onDownload}
        title="Télécharger cette carte"
        aria-label={`Télécharger la carte ${card.cardNumber}`}
        className="flex-none rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-white hover:text-[var(--green-700)]"
      >
        <Download className="h-4 w-4" />
      </button> */}
        <div className="flex flex-none items-center gap-1">
        <button
          type="button"
          onClick={onHistory}
          title="Historique de la carte"
          aria-label={`Historique de la carte ${card.cardNumber}`}
          className="rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-white hover:text-[var(--green-700)]"
        >
          <History className="h-4 w-4" />
        </button>

        {/* Suspension is the Authority's alone and reversible. Revocation is
            NOT here — it requires a commission proposal first, and that
            absence is the design. A revoked card offers neither. */}
        {card.status !== "REVOKED" && (
          <button
            type="button"
            onClick={onStatus}
            title={card.status === "SUSPENDED" ? "Rétablir la carte" : "Suspendre la carte"}
            aria-label={`${card.status === "SUSPENDED" ? "Rétablir" : "Suspendre"} la carte ${card.cardNumber}`}
            className="rounded-lg p-1.5 transition-colors hover:bg-white"
            style={{ color: card.status === "SUSPENDED"
              ? "var(--green-700)" : "var(--gold-700)" }}
          >
            {card.status === "SUSPENDED"
              ? <ShieldCheck className="h-4 w-4" />
              : <ShieldAlert className="h-4 w-4" />}
          </button>
        )}

        <button
          type="button"
          onClick={onDownload}
          title="Télécharger cette carte"
          aria-label={`Télécharger la carte ${card.cardNumber}`}
          className="rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-white hover:text-[var(--green-700)]"
        >
          <Download className="h-4 w-4" />
        </button>
      </div>
    </li>
  );
}
