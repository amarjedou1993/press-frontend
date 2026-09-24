"use client";
// src/components/admin/ApproveRequestDialog.tsx

import { useEffect, useState } from "react";
import { ShieldCheck, AlertTriangle } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { InstitutionRequestResponse } from "@/lib/api/admin-institution-requests";
/**
 * Approuver une demande : créer le corps et son compte.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ LES NOMS PROPOSÉS SONT PRÉREMPLIS, PAS REPRIS.
 *
 * Le registre est celui du Ministère. La façon dont un corps écrit son propre
 * nom est une proposition : accents, majuscules, forme longue ou sigle. Le
 * champ arrive rempli pour qu'on corrige plutôt qu'on ne saisisse, et reste
 * modifiable parce que c'est le Ministère qui arrête l'intitulé officiel.
 *
 * ⚠️ ET LE CODE EST NEUF À CHAQUE FOIS.
 *
 * Rien ne le propose : il n'existe nulle part dans la demande, et un code
 * deviné à partir du nom se heurterait au premier homonyme. Le serveur refuse
 * un code déjà attribué.
 * ───────────────────────────────────────────────────────────────────────
 */
export function ApproveRequestDialog({
  open, onOpenChange, request, onApprove, approving, error,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  request: InstitutionRequestResponse | null;
  onApprove: (code: string, nameFr: string, nameAr: string) => void;
  approving: boolean;
  error?: string;
}) {
  const [code, setCode] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");
  const [local, setLocal] = useState<string>();

  useEffect(() => {
    if (!open || !request) return;
    setCode("");
    setNameFr(request.proposedNameFr);
    setNameAr(request.proposedNameAr);
    setLocal(undefined);
  }, [open, request]);

  function submit() {
    setLocal(undefined);
    if (!code.trim() || !nameFr.trim() || !nameAr.trim()) {
      setLocal("Indiquez le code et les deux noms officiels.");
      return;
    }
    onApprove(code.trim().toUpperCase(), nameFr.trim(), nameAr.trim());
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="pr-8">
          <DialogTitle>Approuver la demande</DialogTitle>
          <DialogDescription>
            Le corps sera enregistré et son compte ouvert immédiatement.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* ⚠️ RAPPELÉ AVANT L'ACTE, parce que l'approbation crée un accès.
              À l'instant où l'on valide, l'adresse ci-dessous peut se
              connecter et déposer des journalistes au nom de ce corps. */}
          <p className="flex items-start gap-2.5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>
              Un compte sera ouvert pour{" "}
              <b dir="ltr" className="font-mono font-bold">{request?.email}</b>, avec
              le mot de passe choisi lors de la demande. Il pourra déposer des
              journalistes dès sa connexion.
            </span>
          </p>

          {(request?.similarInstitutions.length ?? 0) > 0 && (
            <p className="flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span>
                <b className="font-bold">Nom proche d&apos;un corps déjà
                enregistré :</b>{" "}
                {request!.similarInstitutions.join(", ")}. Vérifiez qu&apos;il ne
                s&apos;agit pas du même organisme.
              </span>
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor="approve-code">Code</Label>
            <Input
              id="approve-code"
              value={code}
              dir="ltr"
              className="font-mono uppercase"
              placeholder="HAPA"
              onChange={(e) => { setCode(e.target.value); setLocal(undefined); }}
            />
            {/* ⚠️ Il figure dans le numéro des cartes de la série C et ne se
                change pas ensuite : le dire ici évite de le corriger après. */}
            <p className="text-[12px] leading-relaxed text-[var(--slate)]">
              Court, en majuscules, propre à ce corps. Il ne pourra pas être
              modifié.
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="approve-name-fr">Nom officiel (français)</Label>
            <Input
              id="approve-name-fr"
              value={nameFr}
              dir="auto"
              onChange={(e) => { setNameFr(e.target.value); setLocal(undefined); }}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="approve-name-ar">Nom officiel (arabe)</Label>
            <Input
              id="approve-name-ar"
              value={nameAr}
              dir="rtl"
              onChange={(e) => { setNameAr(e.target.value); setLocal(undefined); }}
            />
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
          <Button className="w-full sm:w-auto" onClick={submit} disabled={approving}>
            <ShieldCheck className="h-4 w-4 flex-none" />
            {approving ? "Enregistrement…" : "Approuver et ouvrir le compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
