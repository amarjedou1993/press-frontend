"use client";
// src/components/reviewer/DecisionPanel.tsx
// Where a professional accreditation is decided.
//
// TWO PRINCIPLES SHAPE THIS COMPONENT.
//
// 1. THE SERVER DECIDES WHAT IS POSSIBLE. Every button's availability comes
//    from `actions`, and when something is unavailable the server's own
//    French reason is shown. The UI never recomputes the rules — notably the
//    legal one, that a file may not be rejected as incomplete unless a
//    correction was requested first.
//
// 2. A DECISION IS NOT A CLICK. Rejection demands a ground and a
//    justification the candidate will read; a correction demands that
//    specific pieces be named. Both dialogs refuse to submit until the
//    reviewer has actually said something useful.

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Check, X, PenLine, Lock, Hand, Undo2, AlertTriangle, Camera, Scale, Gavel,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  claimApplication, releaseApplication, approveApplication, rejectApplication,
  requestCorrection, getRejectionGrounds, reviewKeys,
  type Examination, type RejectionGroundName, type DocumentFlagInput,
} from "@/lib/api/review";
import { ApiError } from "@/lib/api/client";

export function DecisionPanel({ examination }: { examination: Examination }) {
  const qc = useQueryClient();
  const id = examination.applicationId;
  const { actions } = examination;

  const [dialog, setDialog] = useState<null | "approve" | "reject" | "correction">(null);

  /** On this round the decision is terminal, and the buttons say so. */
  const reclamation = examination.status === "UNDER_RECLAMATION";

  const refresh = (data: Examination) => {
    qc.setQueryData(reviewKeys.examination(id), data);
    qc.invalidateQueries({ queryKey: reviewKeys.pool });
    qc.invalidateQueries({ queryKey: reviewKeys.myFiles });
  };

  const fail = (e: unknown) =>
    toast.error("Action impossible", {
      description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
    });

  const claim = useMutation({
    mutationFn: () => claimApplication(id),
    onSuccess: (d) => {
      refresh(d);
      toast.success("Dossier pris en charge", {
        description: "Vous seul pouvez désormais vous prononcer sur ce dossier.",
      });
    },
    onError: fail,
  });

  const release = useMutation({
    mutationFn: () => releaseApplication(id),
    onSuccess: (d) => {
      refresh(d);
      toast.success("Dossier remis dans la file");
    },
    onError: fail,
  });

  /* ── the claim state governs everything below ── */
  if (!examination.claimedByMe) {
    return (
      <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
            <Scale className="h-4 w-4 text-[var(--green-700)]" />
          </span>
          <div>
            <p className="text-[14px] font-extrabold text-[var(--green-900)]">Décision</p>
            <p className="text-[12px] text-[var(--slate)]">{examination.currentRoundLabelFr}</p>
          </div>
        </div>

        {/* Three states, in order of precedence: BARRED by V1.3 §J, free to
            claim, or held by someone else. The barred case comes first
            because it is a rule about WHO may decide, not about availability
            — and a reviewer must see the reason, not a button that silently
            refuses. */}
        {actions.barredAsAuthor ? (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-4">
            <Gavel className="mt-0.5 h-4 w-4 flex-none text-[var(--red-700)]" />
            <div>
              <p className="text-[12.5px] font-extrabold text-[var(--red-700)]">
                Vous ne pouvez pas examiner cette réclamation
              </p>
              <p className="mt-1 text-[13px] leading-relaxed text-[var(--red-700)]">
                {actions.barredReason
                  ?? "Vous avez rendu la décision contestée. Le règlement impose "
                   + "qu'une réclamation soit examinée par un autre membre de la "
                   + "commission."}
              </p>
              <p className="mt-2 text-[12.5px] text-[var(--red-700)]/80">
                Vous conservez l&apos;accès au dossier en consultation.
              </p>
            </div>
          </div>
        ) : actions.canClaim ? (
          <>
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--slate)]">
              Prenez ce dossier en charge pour pouvoir vous prononcer. Il sera
              retiré de la file commune et vous en serez seul responsable.
            </p>
            <Button className="mt-4 w-full" size="lg"
              onClick={() => claim.mutate()} disabled={claim.isPending}>
              <Hand className="h-4 w-4" />
              {claim.isPending ? "Prise en charge…" : "Prendre en charge"}
            </Button>
          </>
        ) : (
          <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] p-4">
            <Lock className="mt-0.5 h-4 w-4 flex-none text-[var(--gold-700)]" />
            <p className="text-[13px] leading-relaxed text-[var(--gold-700)]">
              Ce dossier est pris en charge par{" "}
              <b className="font-bold">{examination.claimedByName ?? "un autre membre"}</b>
              {examination.claimedAt && (
                <> depuis le {new Date(examination.claimedAt).toLocaleDateString("fr-FR")}</>
              )}. Vous pouvez le consulter, mais seul son responsable peut se
              prononcer.
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="rounded-2xl border-2 border-[var(--green-500)] bg-white p-6">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-500)]">
            <Scale className="h-4 w-4 text-white" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[14px] font-extrabold text-[var(--green-900)]">
              Votre décision
            </p>
            <p className="text-[12px] text-[var(--slate)]">
              {examination.currentRoundLabelFr}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          <Button className="w-full justify-start" size="lg"
            onClick={() => setDialog("approve")}>
            <Check className="h-4 w-4" />
            {reclamation ? "Annuler le rejet et accepter" : "Accepter la candidature"}
          </Button>

          {/* Not offered on a reclamation: the single correction round was
              spent long before the objection was filed. */}
          {!reclamation && (
            <>
              <Button
                className="w-full justify-start border-[var(--gold-500)] text-[var(--gold-700)] hover:bg-[var(--gold-tint)]"
                variant="outline" size="lg"
                disabled={!actions.canRequestCorrection}
                onClick={() => setDialog("correction")}
              >
                <PenLine className="h-4 w-4" /> Demander une correction
              </Button>
              {!actions.canRequestCorrection && actions.correctionUnavailableReason && (
                <p className="px-1 text-[11.5px] leading-snug text-[var(--muted-fg)]">
                  {actions.correctionUnavailableReason}
                </p>
              )}
            </>
          )}

          <Button
            className="w-full justify-start border-[var(--red-500)]/40 text-[var(--red-500)] hover:bg-[var(--red-tint)]"
            variant="outline" size="lg"
            onClick={() => setDialog("reject")}
          >
            <X className="h-4 w-4" />
            {reclamation ? "Confirmer le rejet (définitif)" : "Rejeter la candidature"}
          </Button>
        </div>

        <button
          type="button"
          onClick={() => release.mutate()}
          disabled={release.isPending}
          className="mt-5 inline-flex w-full items-center justify-center gap-1.5 text-[12.5px] font-semibold text-[var(--muted-fg)] hover:text-[var(--ink)]"
        >
          <Undo2 className="h-3.5 w-3.5" />
          {release.isPending ? "…" : "Remettre dans la file commune"}
        </button>
      </div>

      <ApproveDialog id={id} open={dialog === "approve"}
        onClose={() => setDialog(null)} onDone={refresh} />
      <RejectDialog id={id} open={dialog === "reject"}
        onClose={() => setDialog(null)} onDone={refresh} final={reclamation} />
      <CorrectionDialog examination={examination} open={dialog === "correction"}
        onClose={() => setDialog(null)} onDone={refresh} />
    </>
  );
}

/* ══════════════════ approve ══════════════════ */

function ApproveDialog({ id, open, onClose, onDone }: {
  id: number; open: boolean; onClose: () => void;
  onDone: (d: Examination) => void;
}) {
  const [note, setNote] = useState("");

  const approve = useMutation({
    mutationFn: () => approveApplication(id, note.trim() || undefined),
    onSuccess: (d) => {
      onDone(d); onClose(); setNote("");
      toast.success("Candidature acceptée", {
        description: "Le candidat a été informé par e-mail.",
      });
    },
    onError: (e) => toast.error("Action impossible", {
      description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
    }),
  });

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {/* Fixed header, scrollable body, pinned footer. The confirm button
          must never be pushed off-screen — a decision the reviewer cannot
          reach is a decision they will take somewhere else, or not at all. */}
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[480px]">
        <DialogHeader className="flex-none">
          <DialogTitle>Accepter cette candidature ?</DialogTitle>
          <DialogDescription>
            Le dossier sera marqué accepté et le candidat informé par e-mail.
            Sa carte pourra ensuite être éditée par le MCACRP.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-1">
          <Field>
            <FieldLabel htmlFor="approve-note">
              Observation <span className="font-normal text-[var(--muted-fg)]">(facultative)</span>
            </FieldLabel>
            <Textarea id="approve-note" rows={3} value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Remarque à joindre à la décision…" />
            <FieldDescription>
              Elle figurera dans l&apos;historique du dossier et dans l&apos;e-mail
              envoyé au candidat.
            </FieldDescription>
          </Field>
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] pt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button onClick={() => approve.mutate()} disabled={approve.isPending}>
            {approve.isPending ? "Enregistrement…" : "Confirmer l'acceptation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════ reject ══════════════════ */

function RejectDialog({ id, open, onClose, onDone, final = false }: {
  id: number; open: boolean; onClose: () => void;
  onDone: (d: Examination) => void;
  /** True on a reclamation: the rejection is terminal. */
  final?: boolean;
}) {
  const [ground, setGround] = useState<RejectionGroundName | null>(null);
  const [justification, setJustification] = useState("");
  const [error, setError] = useState<string>();

  // The grounds come from the server, WITH their availability — the legal
  // rule about incompleteness lives there, not here.
  const grounds = useQuery({
    queryKey: reviewKeys.grounds(id),
    queryFn: () => getRejectionGrounds(id),
    enabled: open,
  });

  const reject = useMutation({
    mutationFn: () => rejectApplication(id, ground!, justification.trim()),
    onSuccess: (d) => {
      onDone(d); onClose();
      setGround(null); setJustification(""); setError(undefined);
      toast.success(final ? "Rejet définitif enregistré" : "Candidature rejetée", {
        description: final
          ? "Le candidat a été informé. L'instruction du dossier est close."
          : "Le candidat a été informé, avec le motif et son droit de réclamation.",
      });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  function submit() {
    setError(undefined);
    if (!ground) { setError("Sélectionnez un motif de rejet."); return; }
    if (justification.trim().length < 20) {
      setError(
        "Détaillez la justification (20 caractères minimum). Le candidat doit "
      + "comprendre ce qui lui est reproché pour pouvoir exercer son droit de réclamation."
      );
      return;
    }
    reject.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[560px]">
        <DialogHeader className="flex-none">
          <DialogTitle>
            {final ? "Confirmer le rejet définitivement" : "Rejeter cette candidature"}
          </DialogTitle>
          <DialogDescription>
            {final
              ? "Le rejet deviendra DÉFINITIF. Le droit de réclamation a été "
                + "exercé et aucun autre examen n'est prévu pour cette session."
              : "Le candidat sera informé du motif et pourra déposer une "
                + "réclamation, qui sera examinée par un autre membre de la commission."}
          </DialogDescription>
        </DialogHeader>

        {/* min-h-0 is load-bearing: without it a flex child refuses to
            shrink below its content, and the body never scrolls. */}
        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {/* ── the grounds ── */}
          <Field>
            <FieldLabel>Motif du rejet</FieldLabel>
            <div className="space-y-2">
              {grounds.data?.map((g) => {
                const selected = ground === g.value;
                const disabled = !g.availableNow;
                return (
                  <button
                    key={g.value}
                    type="button"
                    disabled={disabled}
                    onClick={() => { setGround(g.value); setError(undefined); }}
                    className="flex w-full items-start gap-3 rounded-xl border-2 p-3.5 text-left transition-colors disabled:cursor-not-allowed disabled:opacity-55"
                    style={{
                      borderColor: selected ? "var(--red-500)" : "var(--line)",
                      background: selected ? "var(--red-tint)" : "white",
                    }}
                  >
                    <span
                      className="mt-0.5 flex h-4 w-4 flex-none items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: selected ? "var(--red-500)" : "var(--line)",
                        background: selected ? "var(--red-500)" : "transparent",
                      }}
                    >
                      {selected && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13.5px] font-bold text-[var(--green-900)]">
                        {g.labelFr}
                      </span>
                      <span className="block text-[12px] leading-snug text-[var(--slate)]">
                        {g.descriptionFr}
                      </span>
                      {disabled && (
                        <span className="mt-1.5 flex items-start gap-1.5 text-[11.5px] font-semibold leading-snug text-[var(--gold-700)]">
                          <Lock className="mt-0.5 h-3 w-3 flex-none" />
                          Indisponible : une correction doit d&apos;abord avoir été
                          demandée au candidat.
                        </span>
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </Field>

          {/* ── the justification ── */}
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="reject-justification">
              Justification <span className="text-[var(--red-500)]">*</span>
            </FieldLabel>
            <Textarea
              id="reject-justification"
              rows={5}
              value={justification}
              onChange={(e) => { setJustification(e.target.value); setError(undefined); }}
              placeholder="Exposez précisément les motifs de la décision…"
              aria-invalid={!!error}
            />
            <FieldDescription>
              Ce texte est transmis TEL QUEL au candidat et figure dans
              l&apos;historique du dossier. Il fonde son droit de réclamation.
            </FieldDescription>
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] pt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
            onClick={submit}
            disabled={reject.isPending}
          >
            {reject.isPending ? "Enregistrement…" : "Confirmer le rejet"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══════════════════ request correction ══════════════════ */

function CorrectionDialog({ examination, open, onClose, onDone }: {
  examination: Examination; open: boolean; onClose: () => void;
  onDone: (d: Examination) => void;
}) {
  const id = examination.applicationId;

  const [summary, setSummary] = useState("");
  const [flags, setFlags] = useState<Record<number, string>>({});
  const [photoFlagged, setPhotoFlagged] = useState(false);
  const [photoObservation, setPhotoObservation] = useState("");
  const [error, setError] = useState<string>();

  const mutation = useMutation({
    mutationFn: () => {
      const documents: DocumentFlagInput[] = Object.entries(flags)
        .filter(([, observation]) => observation.trim())
        .map(([documentId, observation]) => ({
          documentId: Number(documentId),
          observation: observation.trim(),
        }));
      return requestCorrection(id, {
        summary: summary.trim(),
        documents,
        photoNeedsCorrection: photoFlagged,
        photoObservation: photoFlagged ? photoObservation.trim() : null,
      });
    },
    onSuccess: (d) => {
      onDone(d); onClose();
      setSummary(""); setFlags({}); setPhotoFlagged(false); setPhotoObservation("");
      toast.success("Correction demandée", {
        description: "Le dossier est retourné au candidat, qui a été informé par e-mail.",
      });
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  function toggle(documentId: number, checked: boolean) {
    setFlags((current) => {
      const next = { ...current };
      if (checked) next[documentId] = next[documentId] ?? "";
      else delete next[documentId];
      return next;
    });
    setError(undefined);
  }

  function submit() {
    setError(undefined);
    const named = Object.entries(flags).filter(([, o]) => o.trim());

    if (!summary.trim()) { setError("Résumez ce que le candidat doit corriger."); return; }
    if (named.length === 0 && !photoFlagged) {
      setError(
        "Signalez au moins une pièce à corriger : une demande sans pièce "
      + "identifiée ne dit pas au candidat quoi faire."
      );
      return;
    }
    // A flagged piece with no observation is the same problem, one level down.
    const flaggedWithoutText = Object.entries(flags).filter(([, o]) => !o.trim());
    if (flaggedWithoutText.length > 0) {
      setError("Indiquez ce qui ne va pas pour chaque pièce cochée.");
      return;
    }
    if (photoFlagged && !photoObservation.trim()) {
      setError("Indiquez ce qui ne va pas avec la photographie.");
      return;
    }
    mutation.mutate();
  }

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[600px]">
        <DialogHeader className="flex-none">
          <DialogTitle>Demander une correction</DialogTitle>
          <DialogDescription>
            Le dossier retourne au candidat, qui pourra remplacer UNIQUEMENT
            les pièces signalées. Une seule correction est prévue par le
            règlement.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto px-1 py-1">
          <Field>
            <FieldLabel htmlFor="correction-summary">
              Résumé <span className="text-[var(--red-500)]">*</span>
            </FieldLabel>
            <Textarea id="correction-summary" rows={3} value={summary}
              onChange={(e) => { setSummary(e.target.value); setError(undefined); }}
              placeholder="Ce que le candidat doit corriger, en une ou deux phrases…" />
            <FieldDescription>
              Transmis au candidat par e-mail.
            </FieldDescription>
          </Field>

          {/* ── per-document flags ── */}
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              Pièces à corriger
            </p>
            <div className="mt-2 space-y-2">
              {examination.documents.map((d) => {
                const checked = d.id in flags;
                return (
                  <div key={d.id}
                    className="rounded-xl border p-3.5 transition-colors"
                    style={{
                      borderColor: checked ? "var(--gold-500)" : "var(--line)",
                      background: checked ? "var(--gold-tint)" : "white",
                    }}
                  >
                    <label className="flex items-start gap-3">
                      <Checkbox checked={checked}
                        onCheckedChange={(v) => toggle(d.id, v === true)} />
                      <span className="min-w-0 flex-1">
                        <span className="block text-[13.5px] font-bold text-[var(--green-900)]">
                          {d.docTypeLabelFr}
                        </span>
                        <span className="block font-mono text-[10.5px] text-[var(--muted-fg)]">
                          v{d.version} · {new Date(d.uploadedAt).toLocaleDateString("fr-FR")}
                        </span>
                      </span>
                    </label>

                    {checked && (
                      <Textarea
                        className="mt-3"
                        rows={2}
                        value={flags[d.id]}
                        onChange={(e) => {
                          setFlags({ ...flags, [d.id]: e.target.value });
                          setError(undefined);
                        }}
                        placeholder="Ce qui ne va pas avec cette pièce…"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── the photograph gets its own flag ── */}
          <div
            className="rounded-xl border p-3.5 transition-colors"
            style={{
              borderColor: photoFlagged ? "var(--gold-500)" : "var(--line)",
              background: photoFlagged ? "var(--gold-tint)" : "white",
            }}
          >
            <label className="flex items-start gap-3">
              <Checkbox checked={photoFlagged}
                onCheckedChange={(v) => { setPhotoFlagged(v === true); setError(undefined); }} />
              <span className="min-w-0 flex-1">
                <span className="flex items-center gap-1.5 text-[13.5px] font-bold text-[var(--green-900)]">
                  <Camera className="h-3.5 w-3.5" /> Photographie d&apos;identité
                </span>
                <span className="block text-[11.5px] leading-snug text-[var(--slate)]">
                  La seule pièce impossible à corriger après impression de la carte.
                </span>
              </span>
            </label>

            {photoFlagged && (
              <Textarea className="mt-3" rows={2} value={photoObservation}
                onChange={(e) => { setPhotoObservation(e.target.value); setError(undefined); }}
                placeholder="Fond non uni, visage partiellement masqué, photo floue…" />
            )}
          </div>

          {error && (
            <p className="flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium text-[var(--red-700)]">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {error}
            </p>
          )}
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] pt-4">
          <Button variant="outline" onClick={onClose}>Annuler</Button>
          <Button
            className="bg-[var(--gold-700)] text-white hover:bg-[var(--gold-500)] hover:text-[var(--green-900)]"
            onClick={submit}
            disabled={mutation.isPending}
          >
            {mutation.isPending ? "Envoi…" : "Demander la correction"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
