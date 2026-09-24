"use client";
// src/components/admin/RejectRequestDialog.tsx

import { useEffect, useState } from "react";
import { XCircle, Mail } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { InstitutionRequestResponse } from "@/lib/api/admin-institution-requests";
/** Motifs les plus fréquents, proposés pour être complétés. */
const SUGGESTIONS = [
  "La lettre fournie n'est pas sur papier à en-tête, ou n'est ni signée ni cachetée.",
  "La lettre ne permet pas d'établir que le signataire engage l'organisme.",
  "L'organisme est déjà enregistré ; utilisez le compte existant.",
  "Les éléments fournis sont insuffisants pour identifier l'organisme.",
];

/**
 * Refuser une demande.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ LE MOTIF PART PAR COURRIEL, ET C'EST TOUT CE QUE LE DEMANDEUR RECEVRA.
 *
 * Il n'a pas de compte, donc pas d'écran où lire la décision : la phrase
 * écrite ici est l'intégralité de ce qu'il saura. Un refus qui ne dit pas
 * pourquoi est un refus auquel personne ne peut répondre — alors que la
 * réponse attendue, la plupart du temps, est une nouvelle demande avec la
 * pièce qui manquait.
 *
 * Les motifs proposés sont des points de départ, pas des cases : ils se
 * complètent, et c'est souvent la précision ajoutée qui rend le refus utile.
 * ───────────────────────────────────────────────────────────────────────
 */
export function RejectRequestDialog({
  open, onOpenChange, request, onReject, rejecting, error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InstitutionRequestResponse | null;
  onReject: (reason: string) => void;
  rejecting: boolean;
  error?: string;
}) {
  const [reason, setReason] = useState("");
  const [local, setLocal] = useState<string>();

  useEffect(() => {
    if (!open) return;
    setReason("");
    setLocal(undefined);
  }, [open]);

  function submit() {
    setLocal(undefined);
    if (!reason.trim()) {
      setLocal("Indiquez le motif du refus.");
      return;
    }
    onReject(reason.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="pr-8">
          <DialogTitle>Refuser la demande</DialogTitle>
          <DialogDescription dir="auto">
            {request?.proposedNameFr}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <p className="flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
            <Mail className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>
              Ce motif sera envoyé à{" "}
              <b dir="ltr" className="font-mono font-bold">{request?.email}</b>. Le
              demandeur n&apos;a pas de compte : c&apos;est la seule explication
              qu&apos;il recevra.
            </span>
          </p>

          <div className="space-y-2">
            <Label htmlFor="reject-reason">Motif</Label>
            <Textarea
              id="reject-reason"
              rows={4}
              dir="auto"
              value={reason}
              onChange={(e) => { setReason(e.target.value); setLocal(undefined); }}
            />
          </div>

          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
              Motifs courants
            </p>
            <div className="flex flex-col gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => { setReason(s); setLocal(undefined); }}
                  className="rounded-lg border border-[var(--line)] px-3 py-2 text-start text-[12.5px] leading-relaxed text-[var(--slate)] transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {(local ?? error) && (
            <p className="rounded-lg bg-[var(--red-tint)] px-3.5 py-2.5 text-[12.5px] font-medium text-[var(--red-700)]">
              {local ?? error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button variant="destructive" className="w-full sm:w-auto"
            onClick={submit} disabled={rejecting}>
            <XCircle className="h-4 w-4 flex-none" />
            {rejecting ? "Envoi…" : "Refuser et notifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
