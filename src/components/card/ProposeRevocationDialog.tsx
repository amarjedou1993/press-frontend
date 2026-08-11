"use client";
// src/components/card/ProposeRevocationDialog.tsx
// A commission member proposing that a card be withdrawn.
//
// THIS DOES NOT WITHDRAW THE CARD, and the screen says so twice — in the
// description and again above the button. A member who believes they have
// just ended someone's accreditation, and has not, will not follow up; one who
// believes they have merely filed a note, and has triggered an immediate
// suspension, will be surprised in the other direction.
//
// So the two consequences are stated plainly:
//   · the Authority decides, not the proposer
//   · SOME GROUNDS SUSPEND THE CARD IMMEDIATELY, and the form says which,
//     the moment one is chosen

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Gavel, AlertTriangle, Check, Send, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  getRevocationGrounds, proposeRevocation, lifecycleKeys, MIN_STATEMENT_LENGTH,
} from "@/lib/api/lifecycle";
import { ApiError } from "@/lib/api/client";

export function ProposeRevocationDialog({
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
  const qc = useQueryClient();
  const [groundId, setGroundId] = useState<number | null>(null);
  const [statement, setStatement] = useState("");
  const [error, setError] = useState<string>();

  const grounds = useQuery({
    queryKey: lifecycleKeys.grounds,
    queryFn: getRevocationGrounds,
    enabled: open,
  });

  const chosen = grounds.data?.find((g) => g.id === groundId);
  const length = statement.trim().length;
  const tooShort = length < MIN_STATEMENT_LENGTH;
  const ready = groundId !== null && !tooShort;

  const close = () => {
    setGroundId(null);
    setStatement("");
    setError(undefined);
    onOpenChange(false);
  };

  const propose = useMutation({
    mutationFn: () => proposeRevocation({
      cardId: cardId!,
      groundId: groundId!,
      statement: statement.trim(),
    }),
    onSuccess: (proposal) => {
      qc.invalidateQueries({ queryKey: lifecycleKeys.mine });
      qc.invalidateQueries({ queryKey: lifecycleKeys.pending });
      toast.success("Proposition transmise", {
        description: proposal.warrantsImmediateSuspension
          ? "La carte est suspendue à titre conservatoire dans l'attente de la décision."
          : "La Haute Autorité statuera sur votre proposition.",
      });
      close();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  function submit() {
    setError(undefined);
    if (!groundId) { setError("Sélectionnez un motif."); return; }
    if (tooShort) {
      setError(`Exposez les faits en ${MIN_STATEMENT_LENGTH} caractères au minimum.`);
      return;
    }
    propose.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[600px]">
        <DialogHeader className="flex-none">
          <DialogTitle className="flex items-center gap-2">
            <Gavel className="h-4 w-4 text-[var(--gold-700)]" />
            Proposer le retrait de la carte {cardNumber}
          </DialogTitle>
          <DialogDescription>
            Votre proposition sera transmise à la Haute Autorité, qui décidera.
            <b> Elle ne retire pas la carte par elle-même.</b>
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-1">
          {holderFullName && (
            <p className="rounded-xl bg-[#fbfcfb] px-4 py-2.5 text-[13px] text-[var(--slate)]">
              Titulaire : <b className="font-semibold text-[var(--ink)]">{holderFullName}</b>
            </p>
          )}

          {/* ── the ground ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              Motif du retrait
            </p>

            {grounds.isLoading ? (
              <Skeleton className="mt-3 h-40 w-full" />
            ) : (
              <div className="mt-3 space-y-2">
                {grounds.data?.map((g) => {
                  const selected = groundId === g.id;
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => { setGroundId(g.id); setError(undefined); }}
                      aria-pressed={selected}
                      className="flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-colors"
                      style={{
                        borderColor: selected ? "var(--gold-500)" : "var(--line)",
                        background: selected ? "var(--gold-tint)" : "white",
                      }}
                    >
                      <span className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2"
                        style={{
                          borderColor: selected ? "var(--gold-700)" : "var(--line)",
                          background: selected ? "var(--gold-700)" : "transparent",
                        }}>
                        {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                      </span>

                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="text-[13.5px] font-bold text-[var(--green-900)]">
                            {g.labelFr}
                          </span>
                          {/* Stated on the OPTION, before it is chosen — a
                              member should know the consequence while deciding
                              which ground applies, not after. */}
                          {g.warrantsImmediateSuspension && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--red-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--red-700)]">
                              <ShieldAlert className="h-2.5 w-2.5" />
                              suspension immédiate
                            </span>
                          )}
                        </span>
                        <span dir="rtl" className="block text-[12px] text-[var(--muted-fg)]">
                          {g.labelAr}
                        </span>
                        {g.hintFr && (
                          <span className="mt-1 block text-[12px] leading-snug text-[var(--slate)]">
                            {g.hintFr}
                          </span>
                        )}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── the statement ── */}
          <div>
            <label htmlFor="revocation-statement"
              className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              Exposé des faits
            </label>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--slate)]">
              L&apos;autorité qui décidera du retrait se prononcera sur ce que
              vous écrivez ici. Soyez précis et factuel.
            </p>

            <Textarea
              id="revocation-statement"
              rows={5}
              className="mt-3"
              value={statement}
              onChange={(e) => { setStatement(e.target.value); setError(undefined); }}
              placeholder="Exemple : l'attestation de travail produite au dossier est un faux, confirmé par l'employeur cité le 3 avril."
              aria-invalid={!!error}
            />

            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-[11.5px]"
                style={{ color: tooShort ? "var(--muted-fg)" : "var(--green-700)" }}>
                {length} / {MIN_STATEMENT_LENGTH} caractères minimum
              </p>
              {!tooShort && (
                <p className="inline-flex items-center gap-1 text-[11.5px] font-semibold text-[var(--green-700)]">
                  <Check className="h-3 w-3" /> longueur suffisante
                </p>
              )}
            </div>
          </div>

          {/* ── what happens on submit, stated before it does ── */}
          {chosen?.warrantsImmediateSuspension && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-3.5">
              <ShieldAlert className="mt-0.5 h-4 w-4 flex-none text-[var(--red-700)]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--red-700)]">
                Ce motif entraîne la <b>suspension immédiate</b> de la carte, à
                titre conservatoire, dès le dépôt de votre proposition. Elle
                sera levée si la Haute Autorité ne retient pas le retrait.
              </p>
            </div>
          )}

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium text-[var(--red-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-none flex-col gap-3 border-t border-[var(--line)] pt-4 sm:flex-row sm:items-center">
          <p className="flex flex-1 items-start gap-2 text-left text-[12px] leading-relaxed text-[var(--slate)]">
            <Gavel className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--muted-fg)]" />
            Le retrait est prononcé par la Haute Autorité, sur votre
            proposition. Vous pourrez la retirer tant qu&apos;elle n&apos;a pas
            été examinée.
          </p>
          <div className="flex flex-none gap-2">
            <Button variant="outline" onClick={close}>Annuler</Button>
            <Button onClick={submit} disabled={!ready || propose.isPending}
              className="bg-[var(--gold-700)] text-white hover:bg-[var(--gold-500)] hover:text-[var(--green-900)]">
              <Send className="h-4 w-4" />
              {propose.isPending ? "Envoi…" : "Transmettre la proposition"}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
