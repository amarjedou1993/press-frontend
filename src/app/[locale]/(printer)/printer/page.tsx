"use client";
// src/app/[locale]/(printer)/printer/page.tsx
//
// The production queue: one session at a time, one archive per run.

import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Printer, FolderArchive, Loader2, Search, CalendarRange, Building2,
  Briefcase, RotateCcw, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { Guilloche } from "@/components/public/patterns";
import {
  getPrintableSessions, getPrintableCards, downloadPrinterArchive,
  printerKeys, type PrintableCard,
} from "@/lib/api/printer";
import { useAuthStore } from "@/lib/auth";

function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function PrinterPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [sessionId, setSessionId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const sessions = useQuery({
    queryKey: printerKeys.sessions,
    queryFn: getPrintableSessions,
  });

  /**
   * The newest session, chosen for them.
   *
   * ⚠️ A producer opening this screen has one job, and it is almost always
   * the current cohort. An empty select with "choose a session" is a click
   * that adds nothing — they would choose the same one every time.
   */
  useEffect(() => {
    if (sessionId === null && sessions.data && sessions.data.length > 0) {
      setSessionId(sessions.data[0].sessionId);
    }
  }, [sessions.data, sessionId]);

  const cards = useQuery({
    queryKey: printerKeys.cards(sessionId ?? 0),
    queryFn: () => getPrintableCards(sessionId!),
    enabled: sessionId !== null,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cards.data ?? []).filter((c) => {
      if (!term) return true;
      return c.holderFullName.toLowerCase().includes(term)
          || c.cardNumber.toLowerCase().includes(term)
          || (c.institution ?? "").toLowerCase().includes(term);
    });
  }, [cards.data, search]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const allSelected = filtered.length > 0
    && filtered.every((c) => selected.has(c.cardId));

  /** Cards that have already been out at least once. */
  const reprints = useMemo(
    () => [...selected].filter((id) =>
      (cards.data ?? []).find((c) => c.cardId === id)?.producedCount ?? 0),
    [selected, cards.data]
  );

  const archive = useMutation({
    mutationFn: () => downloadPrinterArchive([...selected], sessionId, token),
    onSuccess: ({ included, skipped }) => {
      // The counts move: a produced card now shows "produite 1×".
      qc.invalidateQueries({ queryKey: printerKeys.cards(sessionId ?? 0) });
      qc.invalidateQueries({ queryKey: printerKeys.history });
      setSelected(new Set());

      if (skipped > 0) {
        // ⚠️ Omissions are NAMED. A producer who receives 37 folders instead
        // of 40 must learn it here rather than by counting.
        toast.warning(`${included} carte(s) exportée(s), ${skipped} sans pièces`, {
          description: "Les cartes omises n'ont ni photographie ni aperçu.",
        });
      } else {
        toast.success(`${included} carte(s) exportée(s)`, {
          description: "L'archive contient un dossier par carte.",
        });
      }
    },
    onError: (e) => toast.error("Export impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
    }),
  });

  const currentSession = sessions.data?.find((s) => s.sessionId === sessionId);

  const toggle = (cardId: number) => {
    const next = new Set(selected);
    next.has(cardId) ? next.delete(cardId) : next.add(cardId);
    setSelected(next);
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
        <Guilloche
          className="pointer-events-none absolute -right-20 -top-24 h-[300px] w-[300px] text-white opacity-[0.06]"
          rings={34}
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Production
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
              Cartes à produire
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
              Chaque carte est fournie avec sa photographie, son code de
              vérification et un aperçu de référence.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="font-mono text-[26px] font-extrabold leading-none">
                {cards.isLoading ? "—" : filtered.length}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                dans la session
              </p>
            </div>
            {selected.size > 0 && (
              <div className="rounded-xl border border-[var(--gold-500)]/40 bg-black/20 px-5 py-3.5 text-center">
                <p className="font-mono text-[26px] font-extrabold leading-none text-[var(--gold-500)]">
                  {selected.size}
                </p>
                <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                  sélectionnées
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

      {/* ══ nothing to produce ══ */}
      {!sessions.isLoading && (sessions.data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucune carte à produire
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            Les cartes apparaissent ici dès que le Ministère les a éditées.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {/* ── the session, then everything else ── */}
          <div className="flex flex-wrap items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
            <div className="relative">
              <CalendarRange className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
              <select
                value={sessionId ?? ""}
                onChange={(e) => {
                  setSessionId(Number(e.target.value));
                  setPage(1);
                  // ⚠️ CLEARED on a session change. Keeping the selection
                  // would leave cards ticked that are no longer on screen,
                  // and "Produire (40)" would export a set nobody can see.
                  setSelected(new Set());
                }}
                aria-label="Session"
                className="h-9 rounded-lg border border-[var(--green-500)] bg-white pl-9 pr-3 text-[13px] font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
              >
                {sessions.data?.map((s) => (
                  <option key={s.sessionId} value={s.sessionId}>
                    {s.label ?? `Session ${s.sessionId}`} — {s.cardCount}
                  </option>
                ))}
              </select>
            </div>

            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
              <input
                type="search"
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Nom, n° de carte, organe…"
                aria-label="Rechercher une carte"
                className="h-9 w-64 rounded-lg border border-[var(--line)] bg-white pl-9 pr-3 text-[13px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
              />
            </div>

            <Button
              className="ml-auto"
              size="sm"
              disabled={selected.size === 0 || archive.isPending}
              onClick={() => archive.mutate()}
            >
              {archive.isPending
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <FolderArchive className="h-3.5 w-3.5" />}
              Produire {selected.size > 0 && `(${selected.size})`}
            </Button>
          </div>

          {cards.isLoading ? (
            <Skeleton className="m-5 h-32" />
          ) : filtered.length === 0 ? (
            <p className="px-5 py-12 text-center text-[13.5px] text-[var(--slate)]">
              {search
                ? "Aucune carte ne correspond à cette recherche."
                : "Aucune carte valable dans cette session."}
            </p>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-4 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={() => setSelected(
                    allSelected ? new Set() : new Set(filtered.map((c) => c.cardId)))}
                  aria-label="Tout sélectionner"
                />
                <span className="text-[12px] font-semibold text-[var(--slate)]">
                  {allSelected
                    ? "Tout désélectionner"
                    : `Sélectionner les ${filtered.length} carte${filtered.length > 1 ? "s" : ""}`}
                  {search && " correspondant à la recherche"}
                </span>

                {/* ⚠️ SAID, NOT BLOCKED.
                    A reprint is normal — a jam, a spent ribbon. Nothing here
                    prevents it; this line only makes sure it is not
                    accidental. */}
                {reprints.length > 0 && (
                  <span className="ml-auto inline-flex items-center gap-1.5 rounded-full bg-[var(--gold-tint)] px-3 py-1 text-[11.5px] font-bold text-[var(--gold-700)]">
                    <RotateCcw className="h-3 w-3" />
                    {reprints.length} déjà produite{reprints.length > 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <ul className="divide-y divide-[var(--line)]">
                {visible.map((card) => (
                  <CardRow
                    key={card.cardId}
                    card={card}
                    selected={selected.has(card.cardId)}
                    onToggle={() => toggle(card.cardId)}
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
    </div>
  );
}

/* ══ one card to produce ══ */

function CardRow({
  card, selected, onToggle,
}: {
  card: PrintableCard;
  selected: boolean;
  onToggle: () => void;
}) {
  const produced = card.producedCount > 0;

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5"
      style={{ background: selected ? "var(--green-tint)" : undefined }}>
      <Checkbox
        checked={selected}
        onCheckedChange={onToggle}
        aria-label={`Sélectionner la carte ${card.cardNumber}`}
      />

      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl"
        style={{ background: produced ? "var(--gold-tint)" : "var(--green-tint)" }}>
        <Printer className="h-4 w-4"
          style={{ color: produced ? "var(--gold-700)" : "var(--green-700)" }} />
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
          <span className="opacity-60">jusqu&apos;au {longFr(card.expiresAt)}</span>
        </p>
      </div>

      {/* ⚠️ THE COUNT, BEFORE THE CHOICE.
          Not a warning and not a block. A producer selecting forty cards
          should see which have been out before at the moment they choose —
          which is the control that needs no permission gate behind it. */}
      {produced && (
        <span className="flex-none rounded-full bg-[var(--gold-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--gold-700)]">
          produite {card.producedCount}×
        </span>
      )}
    </li>
  );
}
