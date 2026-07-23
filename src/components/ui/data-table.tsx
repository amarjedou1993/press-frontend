"use client";
// src/components/ui/data-table.tsx
// Reusable datatable built on TanStack Table: global search, sortable
// columns, pagination, empty/loading states. Every admin list uses this
// instead of hand-rolling a <table>.

import { useState } from "react";
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
  ChevronsUpDown, ArrowUp, ArrowDown, Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  /** Placeholder for the global search box; omit to hide the box. */
  searchPlaceholder?: string;
  /** Rendered when there are no rows at all. */
  emptyState?: React.ReactNode;
  pageSize?: number;
  /** Page-size choices offered to the user. */
  pageSizeOptions?: number[];
  /** Optional node rendered on the toolbar's right (e.g. a create button). */
  toolbarAction?: React.ReactNode;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  searchPlaceholder,
  emptyState,
  pageSize = 10,
  pageSizeOptions = [5, 10, 25, 50],
  toolbarAction,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = useState("");

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize } },
  });

  const rows = table.getRowModel().rows;
  const total = table.getFilteredRowModel().rows.length;
  const { pageIndex, pageSize: currentSize } = table.getState().pagination;
  const rangeFrom = total === 0 ? 0 : pageIndex * currentSize + 1;
  const rangeTo = Math.min((pageIndex + 1) * currentSize, total);

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      {(searchPlaceholder || toolbarAction) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          {searchPlaceholder && (
            <div className="relative w-full max-w-xs">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-fg)]" />
              <Input
                value={globalFilter}
                onChange={(e) => setGlobalFilter(e.target.value)}
                placeholder={searchPlaceholder}
                // Explicit surface: the shared Input inherits a transparent
                // background in some shadcn builds, which reads as "broken"
                // against the paper-coloured page.
                className="border-[var(--line)] bg-white pl-9 shadow-sm"
                aria-label={searchPlaceholder}
              />
            </div>
          )}
          {toolbarAction}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-[var(--line)] bg-white">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="bg-[var(--green-tint)]/50 hover:bg-[var(--green-tint)]/50">
                {hg.headers.map((header) => {
                  const sortable = header.column.getCanSort();
                  const dir = header.column.getIsSorted();
                  return (
                    <TableHead key={header.id} style={{ width: header.getSize() !== 150 ? header.getSize() : undefined }}
                      className="text-[11px] font-bold uppercase tracking-wider text-[var(--green-700)]">
                      {header.isPlaceholder ? null : sortable ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="inline-flex items-center gap-1.5 transition-colors hover:text-[var(--green-900)]"
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          {dir === "asc" ? <ArrowUp className="h-3 w-3" />
                            : dir === "desc" ? <ArrowDown className="h-3 w-3" />
                            : <ChevronsUpDown className="h-3 w-3 opacity-40" />}
                        </button>
                      ) : (
                        flexRender(header.column.columnDef.header, header.getContext())
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading &&
              [0, 1, 2, 3].map((i) => (
                <TableRow key={i}>
                  <TableCell colSpan={columns.length} className="py-3">
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && rows.length === 0 && (
              <TableRow className="hover:bg-transparent">
                <TableCell colSpan={columns.length} className="py-14 text-center">
                  {globalFilter ? (
                    <p className="text-sm text-[var(--slate)]">
                      Aucun résultat pour «&nbsp;{globalFilter}&nbsp;».
                    </p>
                  ) : (
                    emptyState ?? (
                      <p className="text-sm text-[var(--slate)]">Aucune donnée.</p>
                    )
                  )}
                </TableCell>
              </TableRow>
            )}

            {!isLoading &&
              rows.map((row) => (
                <TableRow key={row.id} className="transition-colors hover:bg-[var(--green-tint)]/40">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {!isLoading && total > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-4 px-1">
          {/* Page size */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--slate)]">Afficher</span>
            <Select
              value={String(table.getState().pagination.pageSize)}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger
                size="sm"
                className="h-8 w-[72px] border-[var(--line)] bg-white text-xs font-semibold"
                aria-label="Nombre d'éléments par page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((n) => (
                  <SelectItem key={n} value={String(n)} className="text-xs">
                    {n}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-xs text-[var(--slate)]">par page</span>
          </div>

          {/* Range summary */}
          <p className="text-xs text-[var(--slate)]">
            <b className="font-semibold text-[var(--ink)]">{rangeFrom}–{rangeTo}</b>{" "}
            sur <b className="font-semibold text-[var(--ink)]">{total}</b>
            {globalFilter ? " (filtrés)" : ""}
          </p>

          {/* Page controls */}
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline" size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="Première page" title="Première page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="sm" className="h-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <span className="px-1 text-xs font-semibold text-[var(--slate)]">
              {table.getState().pagination.pageIndex + 1} / {table.getPageCount() || 1}
            </span>
            <Button
              variant="outline" size="sm" className="h-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline" size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="Dernière page" title="Dernière page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
