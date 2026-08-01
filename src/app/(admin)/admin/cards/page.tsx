"use client";
// src/app/(admin)/admin/cards/page.tsx
// Issuing cards, for the super admin.
//
// The commission decides who is entitled to a card; the Authority issues it.
// Keeping those hands separate is what makes the credential HAPA's act rather
// than one reviewer's — hence SUPER_ADMIN only.
//
// THREE THINGS THIS SCREEN DOES THAT A PLAIN LIST WOULD NOT.
//
// 1. IT SHOWS BLOCKERS BEFORE THE BATCH RUNS. A candidate with no photograph
//    is marked here, not discovered inside a failure list after two hundred
//    cards were attempted.
//
// 2. IT REPORTS EVERY OUTCOME BY NAME. "199 issued, 1 failed" is useless; the
//    administrator needs to know WHO failed and WHY, so they can fix it and
//    re-run — which is safe, because issuance is idempotent.
//
// 3. IT ASKS ABOUT THE PRINTER. Interleaved or sequential is not a preference,
//    it is a property of the machine the PDF is going to.

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  IdCard, Printer, FileSpreadsheet, AlertTriangle, Check, X,
  Layers, Camera, Loader2, ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getIssuable, getRegistry, issueCards, downloadCardPdf, downloadBatchPdf,
  downloadRegistry, cardKeys,
  type BatchResult, type PageLayout,
} from "@/lib/api/cards";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

const STATUS_TONE: Record<string, { bg: string; fg: string }> = {
  VALID:     { bg: "var(--green-tint)", fg: "var(--green-700)" },
  EXPIRED:   { bg: "#eef1ef",           fg: "var(--muted-fg)" },
  SUSPENDED: { bg: "var(--gold-tint)",  fg: "var(--gold-700)" },
  REVOKED:   { bg: "var(--red-tint)",   fg: "var(--red-700)" },
};

export default function AdminCardsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [selectedCards, setSelectedCards] = useState<Set<number>>(new Set());
  const [layout, setLayout] = useState<PageLayout>("SEQUENTIAL");
  const [confirmIssue, setConfirmIssue] = useState(false);
  const [result, setResult] = useState<BatchResult | null>(null);

  const issuable = useQuery({ queryKey: cardKeys.issuable, queryFn: getIssuable });
  const registry = useQuery({ queryKey: cardKeys.registry, queryFn: getRegistry });

  const ready = useMemo(
    () => (issuable.data ?? []).filter((i) => !i.blockerFr),
    [issuable.data]
  );
  const blocked = useMemo(
    () => (issuable.data ?? []).filter((i) => i.blockerFr),
    [issuable.data]
  );

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

  const toggle = (set: Set<number>, id: number, apply: (s: Set<number>) => void) => {
    const next = new Set(set);
    next.has(id) ? next.delete(id) : next.add(id);
    apply(next);
  };

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
              carte éditée par la Haute Autorité.
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
              {ready.length} prête{ready.length > 1 ? "s" : ""}
              {blocked.length > 0 && <> · {blocked.length} bloquée{blocked.length > 1 ? "s" : ""}</>}
            </p>
          </div>

          {ready.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelected(
                  selected.size === ready.length
                    ? new Set()
                    : new Set(ready.map((i) => i.applicationId)))}
                className="text-[12.5px] font-semibold text-[var(--green-700)] underline underline-offset-2"
              >
                {selected.size === ready.length ? "Tout désélectionner" : "Tout sélectionner"}
              </button>
              <Button size="sm" disabled={selected.size === 0}
                onClick={() => setConfirmIssue(true)}>
                <IdCard className="h-3.5 w-3.5" />
                Éditer {selected.size > 0 && `(${selected.size})`}
              </Button>
            </div>
          )}
        </div>

        {issuable.isLoading ? (
          <Skeleton className="m-5 h-24" />
        ) : (issuable.data?.length ?? 0) === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-[var(--slate)]">
            Aucune candidature acceptée n&apos;attend de carte.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {ready.map((item) => (
              <li key={item.applicationId}
                className="flex items-center gap-4 px-5 py-3.5">
                <Checkbox
                  checked={selected.has(item.applicationId)}
                  onCheckedChange={() =>
                    toggle(selected, item.applicationId, setSelected)}
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
                <Camera className="h-4 w-4 flex-none text-[var(--green-600)]" />
              </li>
            ))}

            {/* Blocked ones, listed but not selectable — the reason is here,
                before a batch runs, not inside its failure list. */}
            {blocked.map((item) => (
              <li key={item.applicationId}
                className="flex items-start gap-4 bg-[var(--gold-tint)]/40 px-5 py-3.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-[var(--gold-700)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                    {item.candidateFullName}
                  </p>
                  <p className="text-[12.5px] text-[var(--gold-700)]">{item.blockerFr}</p>
                </div>
              </li>
            ))}
          </ul>
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
              {registry.data?.length ?? 0} carte(s) éditée(s)
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Not a preference — a property of the machine the PDF goes to. */}
            <label className="flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
              Disposition
              <select
                value={layout}
                onChange={(e) => setLayout(e.target.value as PageLayout)}
                className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-[12px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/30"
              >
                <option value="SEQUENTIAL">Rectos puis versos (imprimante à cartes)</option>
                <option value="INTERLEAVED">Recto/verso alterné (recto-verso bureau)</option>
              </select>
            </label>

            <Button size="sm" variant="outline"
              disabled={selectedCards.size === 0 || printBatch.isPending}
              onClick={() => printBatch.mutate()}>
              {printBatch.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Printer className="h-3.5 w-3.5" />}
              Imprimer {selectedCards.size > 0 && `(${selectedCards.size})`}
            </Button>

            <Button size="sm" variant="outline"
              disabled={exportRegistry.isPending}
              onClick={() => exportRegistry.mutate()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Exporter
            </Button>
          </div>
        </div>

        {registry.isLoading ? (
          <Skeleton className="m-5 h-24" />
        ) : (registry.data?.length ?? 0) === 0 ? (
          <p className="px-5 py-10 text-center text-[13.5px] text-[var(--slate)]">
            Aucune carte éditée pour le moment.
          </p>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {registry.data?.map((card) => {
              const tone = STATUS_TONE[card.status] ?? STATUS_TONE.VALID;
              return (
                <li key={card.cardId} className="flex items-center gap-4 px-5 py-3.5">
                  <Checkbox
                    checked={selectedCards.has(card.cardId)}
                    onCheckedChange={() =>
                      toggle(selectedCards, card.cardId, setSelectedCards)}
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

                  <button
                    type="button"
                    onClick={() => downloadCardPdf(card.cardId, card.cardNumber, token)}
                    title="Télécharger cette carte"
                    aria-label={`Télécharger la carte ${card.cardNumber}`}
                    className="flex-none rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                </li>
              );
            })}
          </ul>
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
    </div>
  );
}
