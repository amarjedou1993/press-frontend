"use client";
// src/components/admin/SessionPvDialog.tsx

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { FileText, Plus, X, Users } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { getCommissioners, downloadSessionPv, pvKeys } from "@/lib/api/pv";
import { useAuthStore } from "@/lib/auth";

/**
 * Confirm who sat, then produce the session's procès-verbal.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ THE MEMBERS ARE CONFIRMED, NOT DEDUCED.
 *
 * The system could have read the reviewers who decided dossiers in this
 * session. It would be wrong: IT RECORDS DECISIONS, NOT SITTINGS.
 *
 * A member who ruled on three files from home did not sit. A member present
 * all day who signed nothing would appear nowhere. Deriving one from the
 * other invents a fact nobody observed — on a document that serves as proof.
 *
 * So the list is offered, ticked, and corrected by the person who knows who
 * was in the room.
 * ───────────────────────────────────────────────────────────────────────
 */
export function SessionPvDialog({
  open, onOpenChange, sessionId, sessionLabel,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId: number;
  sessionLabel: string;
}) {
  const token = useAuthStore((s) => s.token);

  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [extra, setExtra] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();

  const reviewers = useQuery({
    queryKey: pvKeys.commissioners,
    queryFn: getCommissioners,
    enabled: open,
  });

  /* ⚠️ Ticked by default: the usual case is that everyone sat, and unticking
     an absentee is less work than ticking four present members. */
  useEffect(() => {
    if (!open || !reviewers.data) return;
    setSelected(new Set(reviewers.data.map((r) => r.fullName)));
    setExtra([]);
    setDraft("");
    setError(undefined);
  }, [open, reviewers.data]);

  const toggle = (name: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(name) ? next.delete(name) : next.add(name);
    return next;
  });

  const names = [...selected, ...extra];

  async function submit() {
    setError(undefined);
    setBusy(true);
    try {
      await downloadSessionPv(sessionId, names, token);
      onOpenChange(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Réessayez.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-[520px]">
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>Procès-verbal de la session</DialogTitle>
          <DialogDescription>{sessionLabel}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div>
            <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              <Users className="h-3 w-3 flex-none" />
              Membres ayant siégé
            </p>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-[var(--slate)]">
              Leurs noms figureront au procès-verbal, chacun avec sa ligne de
              signature. Décochez les absents.
            </p>
          </div>

          <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
            {reviewers.data?.map((r) => (
              <li key={r.id}>
                <label className="flex cursor-pointer items-center gap-3 px-4 py-2.5">
                  <Checkbox
                    checked={selected.has(r.fullName)}
                    onCheckedChange={() => toggle(r.fullName)}
                  />
                  <span className="text-[13.5px] font-semibold text-[var(--green-900)]">
                    {r.fullName}
                  </span>
                </label>
              </li>
            ))}

            {/* ⚠️ Names the system does not hold — a president of the sitting,
                a rapporteur. A commission is not the same set as the reviewer
                accounts, and a PV that could only name accounts would be
                incomplete on exactly the sittings that matter. */}
            {extra.map((name) => (
              <li key={name} className="flex items-center gap-3 px-4 py-2.5">
                <span className="flex h-4 w-4 flex-none items-center justify-center">
                  <span className="h-2 w-2 rounded-full bg-[var(--green-600)]" />
                </span>
                <span className="min-w-0 flex-1 text-[13.5px] font-semibold text-[var(--green-900)]">
                  {name}
                </span>
                <button
                  type="button"
                  onClick={() => setExtra((p) => p.filter((n) => n !== name))}
                  aria-label={`Retirer ${name}`}
                  className="rounded p-1 text-[var(--muted-fg)] hover:text-[var(--red-500)]"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

          <div className="flex gap-2">
            <Input
              value={draft}
              placeholder="Ajouter un membre non enregistré"
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && draft.trim()) {
                  e.preventDefault();
                  setExtra((p) => [...p, draft.trim()]);
                  setDraft("");
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="flex-none"
              disabled={!draft.trim()}
              onClick={() => { setExtra((p) => [...p, draft.trim()]); setDraft(""); }}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* ⚠️ An empty list is allowed, and says what it produces.
              A PV is signed on paper; a commission whose members were not
              recorded still signs. Blank lines are a usable document. */}
          {names.length === 0 && (
            <p className="rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              Aucun membre sélectionné : le procès-verbal comportera des lignes
              de signature vierges.
            </p>
          )}

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
          <Button className="w-full sm:w-auto" onClick={submit} disabled={busy}>
            <FileText className="h-4 w-4 flex-none" />
            {busy ? "Établissement…" : "Établir le procès-verbal"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
