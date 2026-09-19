"use client";
// src/app/[locale]/(printer)/printer/historique/page.tsx
//
// What this producer has produced.

import { useQuery } from "@tanstack/react-query";
import {
  History, FolderArchive, FileText, Inbox, CalendarRange,
  Printer,
  Award,
  Building2,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Guilloche, OfficialSeal } from "@/components/public/patterns";
import {
  getPrintHistory, downloadRunRecap, printerKeys, type RunSummary,
} from "@/lib/api/printer";
import { useAuthStore } from "@/lib/auth";
import { toast } from "sonner";

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
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.13), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-24 -top-28 h-[220px] w-[220px] text-white sm:-right-20 sm:-top-24 sm:h-[300px] sm:w-[300px]"
          rings={30}
          opacity={0.09}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:items-end sm:gap-6 sm:px-7 sm:pb-7 sm:pt-7">
          <div className="flex min-w-0 flex-1 items-start gap-4 sm:gap-5">
            <span className="relative mt-1 hidden h-[54px] w-[54px] flex-none items-center justify-center sm:flex">
              <span className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true" />
              <OfficialSeal className="relative h-full w-full"
                color="var(--gold-500)" id="printer-history-seal" />
            </span>

            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                Historique
              </p>
              <h2 className="engraved-dark mt-2 text-[22px] font-extrabold leading-tight tracking-tight sm:text-[27px] sm:leading-none">
                Mes productions
              </h2>
              {/* ⚠️ WHAT THIS PAGE IS FOR, said plainly.
                  It is not a log kept against the producer — it is the record
                  they themselves need when someone asks "was Mr Fall's card in
                  that batch?" three weeks later. */}
              <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-white/50 sm:text-[13.5px]">
                Chaque lot que vous avez produit, avec sa date et son nombre de
                cartes.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-stretch gap-3 sm:w-auto sm:flex-none sm:items-end">
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center sm:flex-none">
              <p className="font-mono text-[28px] font-extrabold leading-none">
                {runs.isLoading ? "—" : (runs.data?.length ?? 0)}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                lots
              </p>
            </div>
            <div className="flex flex-1 flex-col justify-center rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center sm:flex-none">
              <p className="font-mono text-[28px] font-extrabold leading-none">
                {runs.isLoading ? "—" : total}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
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


function RunRow({ run }: { run: RunSummary }) {
  const token = useAuthStore((s) => s.token);
  const assets = run.kind === "ASSETS";

  /*
   * ⚠️ THE SERIES, NAMED — because `kind` cannot name it.
   *
   * Three series leave this building as ASSETS. Without the chip, a run of
   * HAPA's staff and a run of honour cards read as the same line, and a
   * producer asked in January what they made in November has no way to say.
   *
   * The session label already does this job for ordinary cards; the other two
   * had nothing.
   */
  const series = {
    CARD:          { label: "Session",       Icon: Printer,    tone: "var(--green-700)" },
    HONOUR:        { label: "Honneur",       Icon: Award,      tone: "var(--gold-700)" },
    INSTITUTIONAL: { label: "Institution",   Icon: Building2,  tone: "var(--green-700)" },
  }[run.series] ?? { label: "Session", Icon: Printer, tone: "var(--green-700)" };

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
        <p className="flex flex-wrap items-center gap-2 text-[13.5px] font-bold text-[var(--green-900)]">
          {run.cardCount} carte{run.cardCount > 1 ? "s" : ""}
          <span
            className="inline-flex items-center gap-1 rounded-full bg-[#f2f5f3] px-2 py-0.5 text-[10.5px] font-bold"
            style={{ color: series.tone }}
          >
            <series.Icon className="h-2.5 w-2.5 flex-none" />
            {series.label}
          </span>
          <span className="text-[11.5px] font-normal text-[var(--muted-fg)]">
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

      {/*
        ⚠️ SUR LA LIGNE, PAS DANS UN MENU.

        Le bordereau accompagne une remise physique : une pile de cartes qu'on
        porte au Ministère. Il se réimprime le jour où quelqu'un demande ce
        qui est sorti en novembre — et ce jour-là, la ligne de novembre est ce
        qu'on regarde.
      */}
      <button
        type="button"
        onClick={() => downloadRunRecap(run.id, token).catch((e) =>
          toast.error("Bordereau indisponible", {
            description: e instanceof Error ? e.message : "Réessayez.",
          }))}
        title="Bordereau de remise"
        aria-label={`Bordereau du lot n° ${run.id}`}
        className="flex-none rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
      >
        <FileText className="h-3.5 w-3.5" />
      </button>
    </li>
  );
}