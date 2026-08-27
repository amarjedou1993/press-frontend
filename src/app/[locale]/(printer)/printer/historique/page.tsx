"use client";
// src/app/[locale]/(printer)/printer/historique/page.tsx
//
// What this producer has produced.

import { useQuery } from "@tanstack/react-query";
import {
  History, FolderArchive, FileText, Inbox, CalendarRange,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Guilloche } from "@/components/public/patterns";
import { getPrintHistory, printerKeys, type RunSummary } from "@/lib/api/printer";

function stamp(iso: string) {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function PrinterHistoryPage() {
  const runs = useQuery({
    queryKey: printerKeys.history,
    queryFn: () => getPrintHistory(100),
  });

  const total = (runs.data ?? []).reduce((sum, r) => sum + r.cardCount, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
        style={{
          background:
            "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.13), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-20 -top-24 h-[280px] w-[280px] text-white opacity-[0.05]"
          rings={30}
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div>
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Historique
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
              Mes productions
            </h2>
            {/* ⚠️ WHAT THIS PAGE IS FOR, said plainly.
                It is not a log kept against the producer — it is the record
                they themselves need when someone asks "was Mr Fall's card in
                that batch?" three weeks later. */}
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
              Chaque lot que vous avez produit, avec sa date et son nombre de
              cartes.
            </p>
          </div>

          <div className="flex gap-3">
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="font-mono text-[26px] font-extrabold leading-none">
                {runs.isLoading ? "—" : (runs.data?.length ?? 0)}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                lots
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
              <p className="font-mono text-[26px] font-extrabold leading-none">
                {runs.isLoading ? "—" : total}
              </p>
              <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
                cartes
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

      {/* ══ the runs ══ */}
      <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
        <div className="flex items-center gap-3 border-b border-[var(--line)] px-5 py-4">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
            <History className="h-4 w-4 text-[var(--green-700)]" />
          </span>
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            Lots produits
          </p>
        </div>

        {runs.isLoading ? (
          <Skeleton className="m-5 h-32" />
        ) : (runs.data?.length ?? 0) === 0 ? (
          <div className="px-5 py-12 text-center">
            <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-40" />
            <p className="mt-4 text-[14px] font-extrabold text-[var(--green-900)]">
              Aucun lot produit
            </p>
            <p className="mt-2 text-[13px] text-[var(--slate)]">
              Vos productions apparaîtront ici.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-[var(--line)]">
            {runs.data?.map((run) => <RunRow key={run.id} run={run} />)}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ══ one run ══ */

function RunRow({ run }: { run: RunSummary }) {
  const assets = run.kind === "ASSETS";

  return (
    <li className="flex flex-wrap items-center gap-4 px-5 py-3.5">
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
        {/* ⚠️ TWO KINDS, TWO ICONS.
            ASSETS is what a producer takes — photograph, QR, preview. PDF is
            the signed card, which only the Ministry generates. A history that
            drew them alike would suggest this account had held the signed
            document. */}
        {assets
          ? <FolderArchive className="h-4 w-4 text-[var(--green-700)]" />
          : <FileText className="h-4 w-4 text-[var(--green-700)]" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="text-[13.5px] font-bold text-[var(--green-900)]">
          {run.cardCount} carte{run.cardCount > 1 ? "s" : ""}
          <span className="ms-2 text-[11.5px] font-normal text-[var(--muted-fg)]">
            {assets ? "ressources de production" : "carte signée"}
          </span>
        </p>
        <p className="flex flex-wrap items-center gap-x-3 text-[12px] text-[var(--slate)]">
          <span>{stamp(run.printedAt)}</span>
          {run.sessionLabel && (
            <span className="flex items-center gap-1">
              <CalendarRange className="h-3 w-3 opacity-60" />
              {run.sessionLabel}
            </span>
          )}
        </p>
      </div>

      <span dir="ltr" className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
        n° {run.id}
      </span>
    </li>
  );
}
