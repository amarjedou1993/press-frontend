"use client";
// src/components/admin/GrantDialog.tsx

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldCheck, CalendarClock, Check, X, CameraOff } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { DatePicker } from "@/components/ui/date-picker";
import {
  grantMany, type AdminCardResponse, type GrantBatchResult,
} from "@/lib/api/admin-institutional";
import { ApiError } from "@/lib/api/client";

/**
 * Grant a selection of filings.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ ONE EXPIRY FOR THE WHOLE SELECTION, AND IT IS THE ONLY FIELD.
 *
 * An institution's staff are accredited together and should lapse together —
 * the same reasoning that takes an ordinary card's expiry from its session
 * rather than from its issuance date. Granted one at a time with different
 * terms, renewal stops being a cycle and becomes a continuous chore.
 *
 * ⚠️ AND THE NUMBERS ARE TAKEN HERE, NOT AT FILING.
 *
 * Which is why this dialog confirms rather than simply submitting: a C number
 * spent on a grant that should not have happened leaves a permanent gap in a
 * register whose numbering is its own evidence.
 * ───────────────────────────────────────────────────────────────────────
 */
export function GrantDialog({
  open, onOpenChange, institutionName, cards, onGranted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institutionName: string;
  cards: AdminCardResponse[];
  onGranted: () => void;
}) {
  const thisYear = new Date().getFullYear();

  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState<string>();
  const [result, setResult] = useState<GrantBatchResult | null>(null);

  useEffect(() => {
    if (!open) return;
    setExpiresAt("");
    setError(undefined);
    setResult(null);
  }, [open]);

  const withoutPhoto = cards.filter((c) => !c.hasPhoto).length;

  const grant = useMutation({
    mutationFn: () => grantMany(cards.map((c) => c.id), expiresAt),
    onSuccess: (data) => {
      setResult(data);
      if (data.failed === 0) {
        toast.success(
          `${data.granted} carte${data.granted > 1 ? "s" : ""} octroyée${data.granted > 1 ? "s" : ""}`);
      }
    },
    onError: (e) => setError(
      e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  function submit() {
    setError(undefined);
    if (!expiresAt) { setError("Indiquez la date d'expiration."); return; }
    grant.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => {
      // ⚠️ Closing after a grant refreshes the roll — the rows behind this
      // dialog now carry card numbers, and leaving them stale would show an
      // administrator filings they have already granted.
      if (!o && result) onGranted();
      onOpenChange(o);
    }}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-[540px]">
        {/*
          ⚠️ THE HOUSE SHELL, NOT A COLOURED HEADER.

          This dialog had a green ground and a tricolour rule — handsome, and
          wrong for two reasons.

          The visible one: shadcn's close button is text-muted-foreground,
          which on that green was invisible until hovered. A dialog whose
          dismissal cannot be seen is one people close with Escape or not at
          all.

          The real one: HonourCardDialog and StaffDialog both use this plain
          header, and the three do the same kind of work. One dialog in its
          own style is not a style — it is the odd one out, and the invisible
          close was what that looked like from outside.
        */}
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>
            {result ? "Octroi terminé" : "Octroyer les cartes"}
          </DialogTitle>
          <DialogDescription>
            {result
              ? `${result.granted} carte${result.granted > 1 ? "s" : ""} établie${result.granted > 1 ? "s" : ""}.`
              : `${cards.length} agent${cards.length > 1 ? "s" : ""} — ${institutionName}`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          {!result ? (
            <div className="space-y-5">
              <div>
                <label htmlFor="grant-expiry"
                  className="flex items-center gap-2 text-[13px] font-semibold text-[var(--green-900)]">
                  <CalendarClock className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
                  Date d&apos;expiration
                </label>
                {/* ⚠️ FUTURE ONLY, and the same component the honour dialog
                    uses — one date control across this administration. */}
                <div className="mt-2">
                  <DatePicker
                    id="grant-expiry"
                    value={expiresAt}
                    onChange={(v) => { setExpiresAt(v); setError(undefined); }}
                    invalid={!!error}
                    disabled={(d) => d <= new Date()}
                    fromYear={thisYear}
                    toYear={thisYear + 10}
                    defaultMonth={new Date(thisYear + 2, 0)}
                  />
                </div>
                <p className="mt-2 text-[12.5px] leading-relaxed text-[var(--slate)]">
                  Elle vaut pour les {cards.length} cartes de cet octroi. Les
                  agents d&apos;une institution expirent ensemble, comme une
                  session fait expirer une promotion.
                </p>
              </div>

              {/* ⚠️ SAID BEFORE THE ACT, not discovered after.
                  A card granted without a photograph is valid and will not
                  reach the printer — which is the right behaviour, and not
                  one the Ministry should learn from an empty print queue. */}
              {withoutPhoto > 0 && (
                <p className="flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                  <CameraOff className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  <span>
                    <b className="font-bold">
                      {withoutPhoto} carte{withoutPhoto > 1 ? "s" : ""} sans photographie.
                    </b>{" "}
                    Elles seront établies et attendront leur image :
                    l&apos;institution la fournit, et elles n&apos;apparaissent
                    chez l&apos;imprimeur qu&apos;ensuite.
                  </span>
                </p>
              )}

              <div>
                <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                  Cartes à établir
                </p>
                <ul className="max-h-64 divide-y divide-[var(--line)] overflow-y-auto rounded-xl border border-[var(--line)]">
                  {cards.map((c) => (
                    <li key={c.id} className="flex items-center gap-3 px-4 py-2.5">
                      <span dir="auto" className="user-text min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--green-900)]">
                        {c.fullName}
                      </span>
                      <span dir="ltr" className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
                        {c.identityNumber}
                      </span>
                      {!c.hasPhoto && (
                        <CameraOff className="h-3 w-3 flex-none text-[var(--gold-700)]" />
                      )}
                    </li>
                  ))}
                </ul>
              </div>

              {error && (
                <p className="rounded-lg bg-[var(--red-tint)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--red-700)]">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* ⚠️ FAILURES FIRST AND NAMED. An administrator reading
                  "37 octroyées" and closing has lost the three that did not. */}
              {result.failed > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red-700)]">
                    Non octroyées
                  </p>
                  <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                    {result.outcomes.filter((o) => !o.granted).map((o) => (
                      <li key={o.id} className="flex items-start gap-3 px-4 py-3">
                        <X className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--red-700)]" />
                        <div className="min-w-0 flex-1">
                          <p dir="auto" className="user-text text-[13px] font-bold text-[var(--green-900)]">
                            {o.fullName}
                          </p>
                          <p className="text-[12px] leading-relaxed text-[var(--red-700)]">
                            {o.failureFr}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                {result.outcomes.filter((o) => o.granted).map((o) => (
                  <li key={o.id} className="flex items-center gap-3 px-4 py-2.5">
                    <Check className="h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
                    <span dir="auto" className="user-text min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--green-900)]">
                      {o.fullName}
                    </span>
                    <span dir="ltr" className="flex-none font-mono text-[11.5px] font-bold text-[var(--green-700)]">
                      {o.cardNumber}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-none flex-col gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4 sm:flex-row">
          {result ? (
            <Button className="w-full sm:w-auto" onClick={() => { onGranted(); onOpenChange(false); }}>
              Terminer
            </Button>
          ) : (
            <>
              <Button variant="outline" className="w-full sm:w-auto"
                onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button className="w-full sm:w-auto" onClick={submit}
                disabled={grant.isPending || !expiresAt}>
                <ShieldCheck className="h-4 w-4 flex-none" />
                {grant.isPending
                  ? "Octroi…"
                  : `Octroyer ${cards.length} carte${cards.length > 1 ? "s" : ""}`}
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
