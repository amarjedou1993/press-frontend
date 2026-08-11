"use client";
// src/components/card/CardStatusActions.tsx
// Suspending and reinstating a card, for the Authority.
//
// SUSPENSION IS THE AUTHORITY'S ALONE, and immediate — precautionary and
// REVERSIBLE. It needs no proposal from the commission, and that is the design
// rather than an oversight: waiting for a committee while a stolen card
// circulates helps nobody, and an unwarranted suspension can be undone.
//
// REVOCATION IS NOT HERE AT ALL. It is terminal, so it requires a commission
// proposal first — the same two hands that granted the card. The panel below
// says so, because an administrator who finds only "suspend" on this screen
// should know why, not wonder whether something is broken.

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ShieldAlert, ShieldCheck, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { suspendCard, reinstateCard } from "@/lib/api/lifecycle";
import { cardKeys } from "@/lib/api/cards";
import { lifecycleKeys } from "@/lib/api/lifecycle";
import { ApiError } from "@/lib/api/client";

export function CardStatusActions({
  cardId,
  cardNumber,
  holderFullName,
  status,
  open,
  onOpenChange,
}: {
  cardId: number | null;
  cardNumber?: string;
  holderFullName?: string;
  status?: string;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const qc = useQueryClient();
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();

  // Reinstating applies only to a SUSPENDED card — a revoked one is never
  // reinstated, and the server refuses it too.
  const suspending = status !== "SUSPENDED";

  const close = () => {
    setReason("");
    setError(undefined);
    onOpenChange(false);
  };

  const act = useMutation({
    mutationFn: () =>
      suspending
        ? suspendCard(cardId!, reason.trim())
        : reinstateCard(cardId!, reason.trim()),

    onSuccess: (card) => {
      qc.invalidateQueries({ queryKey: cardKeys.registry });
      qc.invalidateQueries({ queryKey: lifecycleKeys.pending });
      if (cardId !== null) {
        qc.invalidateQueries({ queryKey: lifecycleKeys.history(cardId) });
      }

      // ⚠️ `card` may be undefined: a controller method returning void sends
      // 200 with an empty body, and apiFetch correctly resolves that to
      // undefined. Reading a field off it would throw HERE, inside onSuccess —
      // and TanStack routes such a throw to onError, so a SUCCESSFUL
      // suspension would report a generic failure while the card was already
      // suspended. The optional chain is what keeps the outcome honest.
      const number = card?.cardNumber ?? cardNumber ?? "";

      toast.success(suspending ? "Carte suspendue" : "Carte rétablie", {
        description: number
          ? `${number} — le titulaire a été informé par e-mail.`
          : "Le titulaire a été informé par e-mail.",
      });
      close();
    },

    onError: (e) =>
      setError(
        e instanceof ApiError
          ? (e.problem.detail ?? e.message)
          : "L'enregistrement a échoué. Vérifiez votre connexion et réessayez."
      ),
  });

  function submit() {
    setError(undefined);
    if (!reason.trim()) {
      setError("Indiquez le motif : il sera communiqué au titulaire.");
      return;
    }
    act.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[520px]">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-2">
            {suspending ? (
              <>
                <ShieldAlert className="h-4 w-4 text-[var(--gold-700)]" />
                Suspendre la carte {cardNumber}
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4 text-[var(--green-700)]" />
                Rétablir la carte {cardNumber}
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {suspending
              ? `La carte de ${holderFullName ?? "ce titulaire"} apparaîtra comme suspendue à toute vérification, avec effet immédiat.`
              : `La carte de ${holderFullName ?? "ce titulaire"} redeviendra valide et apparaîtra comme telle à toute vérification.`}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {suspending && (
            <div className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] p-3.5">
              <Info className="mt-0.5 h-4 w-4 flex-none text-[var(--gold-700)]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                Une suspension est <b>conservatoire et réversible</b> : vous
                pouvez la prononcer seul, et la lever de la même manière.
                <br />
                Le <b>retrait définitif</b> d&apos;une carte suit une autre
                voie : il est proposé par un membre de la commission, puis
                prononcé par la Haute Autorité.
              </p>
            </div>
          )}

          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="status-reason">Motif</FieldLabel>
            <Textarea
              id="status-reason"
              rows={4}
              value={reason}
              onChange={(e) => { setReason(e.target.value); setError(undefined); }}
              placeholder={
                suspending
                  ? "Exemple : carte déclarée volée par son titulaire le 12 mars."
                  : "Exemple : vérification concluante, la carte peut reprendre effet."
              }
              aria-invalid={!!error}
            />
            <FieldDescription>
              Ce motif est communiqué au titulaire par e-mail et figure dans
              l&apos;historique de la carte.
            </FieldDescription>
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] pt-4">
          <Button variant="outline" onClick={close}>Annuler</Button>
          <Button
            onClick={submit}
            disabled={act.isPending}
            className={suspending
              ? "bg-[var(--gold-700)] text-white hover:bg-[var(--gold-500)] hover:text-[var(--green-900)]"
              : undefined}
          >
            {act.isPending
              ? "Enregistrement…"
              : suspending ? "Suspendre la carte" : "Rétablir la carte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
