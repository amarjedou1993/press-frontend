"use client";
// src/components/admin/HonourRenewDialog.tsx

import { useEffect, useState } from "react";
import { RefreshCw, Camera, Info } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";

/**
 * Renew an honour card.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ TWO FIELDS, AND ONE OF THEM IS OPTIONAL.
 *
 * The holder is not re-entered: their identity was verified at the first
 * grant, it does not change, and the signature is computed over it — a typo
 * here would be a card that scans as forged.
 *
 * What the Ministry decides is WHETHER the distinction continues, and until
 * when. The reason carries over unless it has changed.
 * ───────────────────────────────────────────────────────────────────────
 */
export function HonourRenewDialog({
  open, onOpenChange, card, onRenew, renewing,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  card: {
    cardNumber: string;
    fullName: string;
    expiresAt: string;
    grantReason: string;
    hasPhoto: boolean;
  } | null;
  onRenew: (expiresAt: string, grantReason: string) => void;
  renewing: boolean;
}) {
  const thisYear = new Date().getFullYear();
  const [expiresAt, setExpiresAt] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  /*
   * ───────────────────────────────────────────────────────────────────
   * ⚠️ THE TERM IS KEPT; THE START IS NOT.
   *
   * A distinction granted for two years is usually renewed for two, so the
   * default carries the term over — an administrator corrects a date, they
   * do not compose one.
   *
   * ⚠️ BUT "previous expiry + 2" LANDS IN THE PAST once the card has lapsed,
   * which is the commonest case for a renewal. The picker refuses past dates,
   * so the field would show a value it will not accept, and the server would
   * answer "expiryMustBeFuture" about a form nobody filled in.
   *
   * So the term runs from the LATER of the two. A card still valid keeps its
   * cycle — renewing early does not forfeit the remaining months. A lapsed
   * card starts its term today, which is the only date that means anything.
   * ───────────────────────────────────────────────────────────────────
   */
  useEffect(() => {
    if (!open || !card) return;

    const previous = new Date(card.expiresAt + "T00:00:00");
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const start = previous > today ? previous : today;
    const next = new Date(start);
    next.setFullYear(start.getFullYear() + 2);

    setExpiresAt(next.toISOString().slice(0, 10));
    setReason("");
    setError(undefined);
  }, [open, card]);

  /*
   * ⚠️ AN EXPIRED CARD IS RENEWED, NOT REFUSED.
   *
   * A lapsed distinction the Ministry decides to continue is exactly what a
   * renewal is for. Only a REVOKED card is refused, by the server — that is a
   * decision to undo, not a date that passed.
   */
  const lapsed = !!card && new Date(card.expiresAt + "T00:00:00") < new Date();

  function submit() {
    setError(undefined);
    if (!expiresAt) { setError("Indiquez la nouvelle date d'expiration."); return; }
    onRenew(expiresAt, reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[520px]">
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>Renouveler la carte d&apos;honneur</DialogTitle>
          <DialogDescription>
            <span dir="auto" className="user-text font-semibold">{card?.fullName}</span>
            {" — "}
            <span dir="ltr" className="font-mono">{card?.cardNumber}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-5">
          {/* ⚠️ WHAT HAPPENS TO THE OLD CARD, said before the act.
              It is retired the moment the new one is granted — a scan will
              show it as withdrawn. Discovered afterwards, that reads like a
              sanction on somebody the Ministry meant to honour. */}
          <p className="flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
            <RefreshCw className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>
              Une nouvelle carte sera établie. La carte{" "}
              <b dir="ltr" className="font-mono font-bold">{card?.cardNumber}</b>{" "}
              sera retirée à cet instant : toute vérification la signalera
              comme remplacée.
            </span>
          </p>

          {/* ⚠️ SAID, because the default date depends on it. An administrator
              who sees a term starting today, on a card they thought still ran
              until next year, should read why here rather than work it out. */}
          {lapsed && card && (
            <p className="text-[12.5px] leading-relaxed text-[var(--slate)]">
              Cette carte est échue depuis le{" "}
              {new Date(card.expiresAt + "T00:00:00").toLocaleDateString("fr-FR", {
                day: "numeric", month: "long", year: "numeric",
              })}
              . Le nouveau terme court à compter d&apos;aujourd&apos;hui.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="renew-expiry">Nouvelle date d&apos;expiration</Label>
            <DatePicker
              id="renew-expiry"
              value={expiresAt}
              onChange={(v) => { setExpiresAt(v); setError(undefined); }}
              disabled={(d) => d <= new Date()}
              fromYear={thisYear}
              toYear={thisYear + 10}
              defaultMonth={expiresAt ? new Date(expiresAt + "T00:00:00") : undefined}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="renew-reason">Motif de l&apos;octroi</Label>
            <Textarea
              id="renew-reason"
              rows={3}
              value={reason}
              placeholder={card?.grantReason}
              onChange={(e) => setReason(e.target.value)}
            />
            {/* ⚠️ The previous reason IS the placeholder, and blank means "the
                same". Retyping it invites a paraphrase that reads as a
                different decision in the register. */}
            <p className="text-[12px] leading-relaxed text-[var(--slate)]">
              Laissez vide pour reprendre le motif actuel.
            </p>
          </div>

          <p className="flex items-start gap-2.5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
            {card?.hasPhoto
              ? <Camera className="mt-0.5 h-3.5 w-3.5 flex-none" />
              : <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />}
            {/* ⚠️ SAID, because it is a choice with a cost either way. Forcing
                a new photograph burdens a distinguished figure; carrying it
                silently puts an old face on a new card. So it is carried and
                announced, and the Ministry decides. */}
            {card?.hasPhoto
              ? "La photographie de la carte actuelle sera reprise. Remplacez-la ensuite si elle date."
              : "La carte actuelle n'a pas de photographie : la nouvelle attendra la sienne avant production."}
          </p>

          {error && (
            <p className="rounded-lg bg-[var(--red-tint)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--red-700)]">
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-none flex-col gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="w-full sm:w-auto" onClick={submit} disabled={renewing}>
            <RefreshCw className="h-4 w-4 flex-none" />
            {renewing ? "Renouvellement…" : "Renouveler"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
