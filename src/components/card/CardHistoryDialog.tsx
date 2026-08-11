"use client";
// src/components/card/CardHistoryDialog.tsx
// A card's whole life, and the acts that shaped it.
//
// For a regulator this IS the defence of a withdrawal — not documentation of
// it. If a revocation is ever challenged, what HAPA can show is precisely
// this: who acted, WHO PROPOSED IT, on what ground, in what words, and when.
//
// So the entry for a revocation names BOTH HANDS. A withdrawal recorded with
// one name looks like an administrative act against a journalist; one showing
// a commission proposal executed by the Authority does not.

import { useQuery } from "@tanstack/react-query";
import {
  History, ShieldCheck, ShieldAlert, ShieldX, User, Gavel, Clock,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { getCardHistory, lifecycleKeys } from "@/lib/api/lifecycle";

const TONE: Record<string, { bg: string; fg: string; Icon: React.ElementType }> = {
  VALID:     { bg: "var(--green-tint)", fg: "var(--green-700)", Icon: ShieldCheck },
  SUSPENDED: { bg: "var(--gold-tint)",  fg: "var(--gold-700)",  Icon: ShieldAlert },
  REVOKED:   { bg: "var(--red-tint)",   fg: "var(--red-700)",   Icon: ShieldX },
};

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export function CardHistoryDialog({
  cardId,
  cardNumber,
  holderFullName,
  open,
  onOpenChange,
}: {
  cardId: number | null;
  cardNumber?: string;
  holderFullName?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const history = useQuery({
    queryKey: lifecycleKeys.history(cardId ?? 0),
    queryFn: () => getCardHistory(cardId!),
    enabled: open && cardId !== null,
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[620px]">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4 text-[var(--green-700)]" />
            Historique de la carte {cardNumber}
          </DialogTitle>
          <DialogDescription>
            {holderFullName
              ? `Toutes les décisions portant sur la carte de ${holderFullName}.`
              : "Toutes les décisions portant sur cette carte."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-1 py-1">
          {history.isLoading ? (
            <Skeleton className="h-32 w-full" />
          ) : (history.data?.length ?? 0) === 0 ? (
            <p className="py-8 text-center text-[13.5px] text-[var(--slate)]">
              Aucun changement de statut depuis l&apos;édition.
            </p>
          ) : (
            <ol className="relative space-y-4 border-l-2 border-[var(--line)] pl-6">
              {history.data?.map((entry, i) => {
                const tone = TONE[entry.toStatus] ?? TONE.VALID;
                return (
                  <li key={i} className="relative">
                    {/* the marker sits ON the rule */}
                    <span
                      className="absolute -left-[31px] flex h-6 w-6 items-center justify-center rounded-full"
                      style={{ background: tone.bg, boxShadow: `0 0 0 3px #fff` }}
                    >
                      <tone.Icon className="h-3 w-3" style={{ color: tone.fg }} />
                    </span>

                    <div className="rounded-xl border border-[var(--line)] bg-white p-4">
                      <p className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full px-2.5 py-1 text-[11px] font-bold"
                          style={{ background: tone.bg, color: tone.fg }}>
                          {entry.toStatusLabelFr}
                        </span>
                        {entry.fromStatus && (
                          <span className="text-[11.5px] text-[var(--muted-fg)]">
                            depuis {entry.fromStatus.toLowerCase()}
                          </span>
                        )}
                        <span className="ml-auto flex items-center gap-1 text-[11.5px] text-[var(--muted-fg)]">
                          <Clock className="h-3 w-3" />
                          {fmt(entry.at)}
                        </span>
                      </p>

                      {/* whitespace-pre-wrap: a revocation's reason carries the
                          proposer's own words, with their line breaks. */}
                      <p className="mt-2.5 whitespace-pre-wrap rounded-lg bg-[#fbfcfb] px-3 py-2.5 text-[13px] leading-relaxed text-[var(--ink)]">
                        {entry.reason}
                      </p>

                      {/* BOTH HANDS, where there are two. */}
                      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-[var(--line)] pt-2.5">
                        <span className="flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
                          <User className="h-3 w-3 text-[var(--green-600)]" />
                          Décidé par <b className="font-semibold">{entry.actorName}</b>
                        </span>
                        {entry.proposedByName && (
                          <span className="flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
                            <Gavel className="h-3 w-3 text-[var(--gold-700)]" />
                            Sur proposition de{" "}
                            <b className="font-semibold">{entry.proposedByName}</b>
                          </span>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
