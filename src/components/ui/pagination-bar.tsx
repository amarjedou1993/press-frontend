"use client";

import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

const PAGE_SIZES = [12, 24, 48, 96] as const;

export function PaginationBar({
  page,
  pageSize,
  total,
  onPageChange,
  onPageSizeChange,
  itemNounSingular = "élément",
  itemNounPlural = "éléments",
}: {
  page: number;                 // 1-based
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  itemNounSingular?: string;
  itemNounPlural?: string;
}) {
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  // A window of page numbers around the current one — 137 pages of buttons
  // helps nobody.
  const window: (number | "gap")[] = [];
  const push = (n: number) => { if (!window.includes(n)) window.push(n); };
  push(1);
  if (page - 2 > 2) window.push("gap");
  for (let n = Math.max(2, page - 1); n <= Math.min(pageCount - 1, page + 1); n++) push(n);
  if (page + 2 < pageCount - 1) window.push("gap");
  if (pageCount > 1) push(pageCount);

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] px-5 py-3.5">
      <p className="text-[12.5px] text-[var(--slate)]">
        {total === 0 ? (
          <>Aucun {itemNounSingular}</>
        ) : (
          <>
            <b className="font-semibold text-[var(--ink)]">{from}–{to}</b>
            {" "}sur{" "}
            <b className="font-semibold text-[var(--ink)]">{total}</b>{" "}
            {total > 1 ? itemNounPlural : itemNounSingular}
          </>
        )}
      </p>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-[12.5px] text-[var(--slate)]">
          Par page
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="rounded-lg border border-[var(--line)] bg-white px-2 py-1 text-[12.5px] font-semibold text-[var(--ink)] outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]"
          >
            {PAGE_SIZES.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>

        <div className="flex items-center gap-1">
          <PageButton
            label="Première page"
            disabled={page === 1}
            onClick={() => onPageChange(1)}
          >
            <ChevronsLeft className="h-3.5 w-3.5" />
          </PageButton>
          <PageButton
            label="Page précédente"
            disabled={page === 1}
            onClick={() => onPageChange(page - 1)}
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </PageButton>

          {window.map((entry, i) =>
            entry === "gap" ? (
              <span key={`gap-${i}`} className="px-1 text-[12px] text-[var(--muted-fg)]">…</span>
            ) : (
              <button
                key={entry}
                type="button"
                onClick={() => onPageChange(entry)}
                aria-current={entry === page ? "page" : undefined}
                className="h-7 min-w-7 rounded-lg px-2 text-[12.5px] font-bold transition-colors"
                style={
                  entry === page
                    ? { background: "var(--green-700)", color: "#fff" }
                    : { color: "var(--slate)" }
                }
              >
                {entry}
              </button>
            )
          )}

          <PageButton
            label="Page suivante"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </PageButton>
          <PageButton
            label="Dernière page"
            disabled={page >= pageCount}
            onClick={() => onPageChange(pageCount)}
          >
            <ChevronsRight className="h-3.5 w-3.5" />
          </PageButton>
        </div>
      </div>
    </div>
  );
}

function PageButton({
  children, label, disabled, onClick,
}: {
  children: React.ReactNode;
  label: string;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)] disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}
