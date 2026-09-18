"use client";
// src/components/admin/PvRangeDialog.tsx

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { FileText, CalendarRange } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import { useAuthStore } from "@/lib/auth";

/**
 * Choose the period a procès-verbal covers.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ THE ADMINISTRATOR CHOOSES, AND NOTHING IS REMEMBERED.
 *
 * The alternative was marking cards as "already in a PV" and generating
 * whatever remained. It fails the first time somebody spots an error: the
 * second attempt comes back empty, and the repair is a database edit.
 *
 * A range chosen here can be run again and gives the same names — which is
 * what makes the document evidence rather than a printout. The range is
 * printed in its heading for the same reason.
 * ───────────────────────────────────────────────────────────────────────
 */
export function PvRangeDialog({
  open, onOpenChange, title, description, onDownload,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** Receives ISO dates; the caller knows which series it is asking for. */
  onDownload: (from: string, to: string, token: string | null) => Promise<unknown>;
}) {
  const token = useAuthStore((s) => s.token);
  const thisYear = new Date().getFullYear();

  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  /*
   * ⚠️ DEFAULTED TO THE YEAR TO DATE, not left empty.
   *
   * A PV is almost always asked for over a period the administrator is
   * already thinking in — a semester, a year. Two empty fields make them
   * compose the obvious answer; the obvious answer offered makes them correct
   * it when it is wrong.
   */
  useEffect(() => {
    if (!open) return;
    setFrom(`${thisYear}-01-01`);
    setTo(new Date().toISOString().slice(0, 10));
    setError(undefined);
  }, [open, thisYear]);

  async function submit() {
    setError(undefined);
    if (!from || !to) { setError("Indiquez les deux dates."); return; }
    if (to < from) { setError("La date de fin précède la date de début."); return; }

    setBusy(true);
    try {
      await onDownload(from, to, token);
      onOpenChange(false);
    } catch (e) {
      /*
       * ⚠️ The server's own message. "Aucune carte sur la période retenue"
       * names a real state — an empty range, not a failure — and sending the
       * administrator to change the dates is the only useful answer.
       */
      setError(e instanceof Error ? e.message : "Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader className="pr-8">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="pv-from">Du</Label>
              <DatePicker
                id="pv-from"
                value={from}
                onChange={(v) => { setFrom(v); setError(undefined); }}
                fromYear={2020}
                toYear={thisYear + 1}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pv-to">Au</Label>
              <DatePicker
                id="pv-to"
                value={to}
                onChange={(v) => { setTo(v); setError(undefined); }}
                fromYear={2020}
                toYear={thisYear + 1}
              />
            </div>
          </div>

          {/* ⚠️ WHAT THE DOCUMENT WILL SAY, before it is produced.
              The heading carries the range; saying so here means an
              administrator who meant a semester and typed a year notices
              before the file is signed. */}
          <p className="flex items-start gap-2.5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
            <CalendarRange className="mt-0.5 h-3.5 w-3.5 flex-none" />
            Le procès-verbal portera cette période en titre et pourra être
            régénéré à l&apos;identique. Il recense les cartes délivrées sur
            l&apos;intervalle, quel que soit leur statut actuel.
          </p>

          {error && (
            <p className="rounded-lg bg-[var(--red-tint)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--red-700)]">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="w-full sm:w-auto" onClick={submit} disabled={busy}>
            <FileText className="h-4 w-4 flex-none" />
            {busy ? "Établissement…" : "Établir le procès-verbal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
