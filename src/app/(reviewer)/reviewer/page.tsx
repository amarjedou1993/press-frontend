"use client";
// src/app/(reviewer)/reviewer/page.tsx
// The commission's working screen.
//
// Built for the real case: a national press corps produces hundreds of
// dossiers per session, and one member works through them in an afternoon.
// So it offers
//   · the SHAPE of the queue, not just its size
//   · two densities — cards to scan, rows for volume
//   · filters that show what they are doing, and undo one at a time
//   · CLAIM WITHOUT LEAVING the list
//   · KEYBOARD NAVIGATION: ↑ ↓ ← → to move, Enter to open, C to claim
//
// Sorted by longest wait by default: that is the fair order, and the one the
// review deadline cares about.

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, Scale, Search, Inbox, Keyboard } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { PoolStats } from "@/components/reviewer/PoolStats";
import { DossierCard } from "@/components/reviewer/DossierCard";
import { DossierRow } from "@/components/reviewer/DossierRow";
import {
  PoolFilters, DEFAULT_FILTERS,
  type PoolFilterState, type Density, type UrgencyBand,
} from "@/components/reviewer/PoolFilters";
import {
  getPool, getMyFiles, claimApplication, reviewKeys, type PoolItem,
} from "@/lib/api/review";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

function bandOf(days: number): Exclude<UrgencyBand, ""> {
  if (days >= 7) return "late";
  if (days >= 3) return "ageing";
  return "fresh";
}

export default function ReviewerHomePage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<PoolFilterState>(DEFAULT_FILTERS);
  const [density, setDensity] = useState<Density>("grid");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);
  const [focusIndex, setFocusIndex] = useState(-1);

  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);

  const pool = useQuery({ queryKey: reviewKeys.pool, queryFn: getPool });
  const mine = useQuery({ queryKey: reviewKeys.myFiles, queryFn: getMyFiles });

  const loading = pool.isLoading || mine.isLoading;
  const poolItems = useMemo(() => pool.data ?? [], [pool.data]);
  const myItems = useMemo(() => mine.data ?? [], [mine.data]);

  const claim = useMutation({
    mutationFn: (id: number) => claimApplication(id),
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: reviewKeys.pool });
      qc.invalidateQueries({ queryKey: reviewKeys.myFiles });
      toast.success("Dossier pris en charge", {
        description: "Vous seul pouvez désormais vous prononcer sur ce dossier.",
        action: {
          label: "Ouvrir",
          onClick: () => router.push(`${routes.reviewer.home}/${id}`),
        },
      });
    },
    onError: (e) =>
      toast.error("Prise en charge impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      }),
  });

  // A claimed dossier leaves the pool, so "all" is a union, not a filter.
  const allItems = useMemo(() => {
    const seen = new Set(myItems.map((i) => i.applicationId));
    return [...myItems, ...poolItems.filter((i) => !seen.has(i.applicationId))];
  }, [myItems, poolItems]);

  const myIds = useMemo(
    () => new Set(myItems.map((i) => i.applicationId)), [myItems]);

  const source: PoolItem[] =
    filters.scope === "mine" ? myItems
    : filters.scope === "pool" ? poolItems
    : allItems;

  // Options come FROM THE DATA, so a filter can never offer an empty result.
  const categories = useMemo(
    () => [...new Set(allItems.map((i) => i.categoryLabelFr))].filter(Boolean).sort(),
    [allItems]);
  const rounds = useMemo(
    () => [...new Set(allItems.map((i) => i.roundLabelFr))].filter(Boolean).sort(),
    [allItems]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();

    const result = source.filter((item) => {
      if (filters.category && item.categoryLabelFr !== filters.category) return false;
      if (filters.round && item.roundLabelFr !== filters.round) return false;
      if (filters.urgency && bandOf(item.waitingDays) !== filters.urgency) return false;
      if (term) {
        const haystack = `${item.candidateFullName} ${item.applicationId}`.toLowerCase();
        if (!haystack.includes(term)) return false;
      }
      return true;
    });

    return result.sort((a, b) => {
      switch (filters.sort) {
        case "waiting_asc": return a.waitingDays - b.waitingDays;
        case "name_asc":
          return a.candidateFullName.localeCompare(b.candidateFullName, "fr");
        case "name_desc":
          return b.candidateFullName.localeCompare(a.candidateFullName, "fr");
        default: return b.waitingDays - a.waitingDays;
      }
    });
  }, [source, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  const changeFilters = (next: PoolFilterState) => {
    setFilters(next);
    setPage(1);
    setFocusIndex(-1);
  };

  /* ── keyboard navigation ──
     A queue is worked through, not browsed. Arrows move, Enter opens, C
     claims — so a member can clear twenty files without touching the mouse. */
  const columns = density === "grid" ? 3 : 1;

  const move = useCallback((delta: number) => {
    setFocusIndex((current) => {
      const next = Math.max(0, Math.min(visible.length - 1, current + delta));
      itemRefs.current[next]?.focus();
      itemRefs.current[next]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
      return next;
    });
  }, [visible.length]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      // Never hijack typing.
      const target = event.target as HTMLElement | null;
      if (target && ["INPUT", "SELECT", "TEXTAREA"].includes(target.tagName)) return;
      if (visible.length === 0) return;

      switch (event.key) {
        case "ArrowDown": event.preventDefault(); move(columns); break;
        case "ArrowUp": event.preventDefault(); move(-columns); break;
        case "ArrowRight": event.preventDefault(); move(1); break;
        case "ArrowLeft": event.preventDefault(); move(-1); break;
        case "c":
        case "C": {
          const item = visible[focusIndex];
          if (item && item.claimedBy === null) {
            event.preventDefault();
            claim.mutate(item.applicationId);
          }
          break;
        }
        default: break;
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [visible, focusIndex, columns, move, claim]);

  const open = (id: number) => router.push(`${routes.reviewer.home}/${id}`);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      {/* ── hero ── */}
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
        <svg className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 opacity-[0.06]"
          viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <g stroke="#fff" strokeWidth="0.6">
            {Array.from({ length: 30 }).map((_, i) => (
              <ellipse key={i} cx="200" cy="200" rx="180" ry="62"
                transform={`rotate(${(i * 180) / 30} 200 200)`} />
            ))}
          </g>
        </svg>

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Commission d&apos;examen
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
              Examen des candidatures
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
              Prenez un dossier en charge pour l&apos;examiner. Vous en serez
              seul responsable jusqu&apos;à votre décision.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="text-[26px] font-extrabold leading-none">
                {loading ? "—" : myItems.length}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                mes dossiers
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="text-[26px] font-extrabold leading-none">
                {loading ? "—" : poolItems.length}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                en attente
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

      {/* ── the shape of the queue ── */}
      {!loading && (
        <PoolStats
          items={poolItems}
          onFocusBand={(band) =>
            changeFilters({ ...filters, scope: "pool", urgency: band ?? "" })}
        />
      )}

      {/* ── filters ── */}
      <PoolFilters
        value={filters}
        onChange={changeFilters}
        categories={categories}
        rounds={rounds}
        counts={{ pool: poolItems.length, mine: myItems.length, all: allItems.length }}
        density={density}
        onDensityChange={(d) => { setDensity(d); setFocusIndex(-1); }}
      />

      {/* ── the collection ── */}
      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-56 rounded-2xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          hasSource={source.length > 0}
          scope={filters.scope}
          onReset={() => changeFilters({ ...DEFAULT_FILTERS, scope: filters.scope })}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-[#fbfcfb]">
          {density === "grid" ? (
            <div className="grid gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
              {visible.map((item, i) => (
                <DossierCard
                  key={item.applicationId}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  item={item}
                  mine={myIds.has(item.applicationId)}
                  focused={focusIndex === i}
                  claiming={claim.isPending && claim.variables === item.applicationId}
                  onOpen={() => open(item.applicationId)}
                  onClaim={() => claim.mutate(item.applicationId)}
                />
              ))}
            </div>
          ) : (
            <div className="divide-y divide-[var(--line)] bg-white">
              {visible.map((item, i) => (
                <DossierRow
                  key={item.applicationId}
                  ref={(el) => { itemRefs.current[i] = el; }}
                  item={item}
                  mine={myIds.has(item.applicationId)}
                  focused={focusIndex === i}
                  claiming={claim.isPending && claim.variables === item.applicationId}
                  onOpen={() => open(item.applicationId)}
                  onClaim={() => claim.mutate(item.applicationId)}
                />
              ))}
            </div>
          )}

          <PaginationBar
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={(p) => { setPage(p); setFocusIndex(-1); }}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); setFocusIndex(-1); }}
            itemNounSingular="dossier"
            itemNounPlural="dossiers"
          />
        </div>
      )}

      {/* ── the shortcuts, stated rather than hidden ── */}
      {!loading && filtered.length > 0 && (
        <p className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[11.5px] text-[var(--muted-fg)]">
          <span className="inline-flex items-center gap-1.5 font-semibold">
            <Keyboard className="h-3 w-3" /> Raccourcis
          </span>
          <Shortcut keys="↑ ↓ ← →" label="naviguer" />
          <Shortcut keys="Entrée" label="ouvrir" />
          <Shortcut keys="C" label="prendre en charge" />
        </p>
      )}
    </div>
  );
}

function Shortcut({ keys, label }: { keys: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <kbd className="rounded border border-[var(--line)] bg-white px-1.5 py-0.5 font-mono text-[10.5px] text-[var(--slate)]">
        {keys}
      </kbd>
      {label}
    </span>
  );
}

function EmptyState({
  hasSource, scope, onReset,
}: {
  hasSource: boolean;
  scope: string;
  onReset: () => void;
}) {
  if (hasSource) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
        <Search className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-40" />
        <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
          Aucun résultat
        </p>
        <p className="mt-2 text-[13.5px] text-[var(--slate)]">
          Aucun dossier ne correspond à ces filtres.
        </p>
        <button type="button" onClick={onReset}
          className="mt-4 text-[12.5px] font-bold text-[var(--green-700)] underline underline-offset-2">
          Effacer les filtres
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
      {scope === "mine" ? (
        <>
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-40" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucun dossier en charge
          </p>
          <p className="mt-2 text-[13.5px] text-[var(--slate)]">
            Prenez un dossier de la file commune pour commencer.
          </p>
        </>
      ) : (
        <>
          <Scale className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-40" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucun dossier en attente
          </p>
          <p className="mt-2 text-[13.5px] text-[var(--slate)]">
            Tous les dossiers soumis ont été pris en charge.
          </p>
        </>
      )}
    </div>
  );
}
