"use client";
// src/app/(admin)/admin/cards/revocations/page.tsx
// The Authority's decision queue.
//
// Each item here asks one question: should this journalist's accreditation
// end? So each is laid out as the two things needed to answer it — WHAT THE
// COMMISSION ALLEGES, and WHOSE CARD it concerns — rather than as a row in a
// table with a menu.
//
// A DECISION EITHER WAY IS EXPLAINED. Executing takes an optional note;
// DECLINING REQUIRES one, because a refusal the proposer cannot read is a
// refusal they will simply repeat.
//
// ───────────────────────────────────────────────────────────────────────
// NO CLIENT-SIDE CHECK ON WHO PROPOSED THIS.
//
// An earlier version disabled the buttons when the viewing administrator was
// the proposer. That rule is enforced in CardLifecycleService.executeRevocation
// — "le retrait d'une carte exige deux intervenants distincts" — tested by
// theProposerCannotExecuteTheirOwnProposal, and refused with a message that
// explains itself.
//
// Duplicating it here would be a SECOND implementation of a rule about who may
// end someone's accreditation, and the two could only ever drift apart. The
// proposer is named on every card; an administrator recognises their own
// proposal, and the server answers if they try anyway.
// ───────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Gavel, ShieldX, ShieldAlert, X, Clock, User, IdCard, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  getPendingProposals, executeRevocation, declineRevocation, lifecycleKeys,
  type ProposalResponse, type CardStatusResponse,
} from "@/lib/api/lifecycle";
import { cardKeys } from "@/lib/api/cards";
import { ApiError } from "@/lib/api/client";

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function RevocationQueuePage() {
  const qc = useQueryClient();

  const [deciding, setDeciding] = useState<
    { proposal: ProposalResponse; action: "execute" | "decline" } | null
  >(null);

  const pending = useQuery({
    queryKey: lifecycleKeys.pending,
    queryFn: getPendingProposals,
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
        style={{
          background:
            "radial-gradient(700px 340px at 88% -25%, rgba(215,25,32,.18), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div className="min-w-0 flex-1">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Retrait de cartes
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
              Propositions de la commission
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
              Le retrait d&apos;une carte est proposé par un membre de la
              commission et prononcé par la Haute Autorité. Il met fin à
              l&apos;accréditation de son titulaire.
            </p>
          </div>

          <div className="flex-none rounded-xl border border-white/15 bg-black/20 px-5 py-3.5 text-center">
            <p className="text-[26px] font-extrabold leading-none">
              {pending.isLoading ? "—" : (pending.data?.length ?? 0)}
            </p>
            <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em] text-white/50">
              en attente
            </p>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══ the queue ══ */}
      {pending.isLoading ? (
        <Skeleton className="h-48 w-full rounded-2xl" />
      ) : (pending.data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-40" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucune proposition en attente
          </p>
          <p className="mt-2 text-[13.5px] text-[var(--slate)]">
            Les propositions de retrait déposées par la commission
            apparaîtront ici.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {pending.data?.map((proposal) => (
            <article key={proposal.id}
              className="overflow-hidden rounded-2xl border-2 border-[var(--gold-500)]/50 bg-white">

              {/* what is alleged */}
              <div className="flex flex-wrap items-start gap-4 bg-[var(--gold-tint)] px-6 py-4">
                <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[var(--gold-700)]">
                  <Gavel className="h-5 w-5 text-white" />
                </span>

                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-[15px] font-extrabold text-[var(--gold-700)]">
                    {proposal.groundLabelFr}
                    {proposal.warrantsImmediateSuspension && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[var(--red-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--red-700)]">
                        <ShieldAlert className="h-2.5 w-2.5" />
                        carte déjà suspendue
                      </span>
                    )}
                  </p>
                  {/* The proposer is NAMED — which is what lets an
                      administrator recognise their own proposal without the
                      client re-implementing the two-hand rule. */}
                  <p className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12.5px] text-[var(--gold-700)]">
                    <span className="flex items-center gap-1.5">
                      <User className="h-3 w-3" />
                      Proposé par <b className="font-semibold">{proposal.proposedByName}</b>
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Clock className="h-3 w-3" />
                      {fmt(proposal.proposedAt)}
                    </span>
                  </p>
                </div>
              </div>

              {/* whose card */}
              <div className="flex flex-wrap items-center gap-4 border-b border-[var(--line)] px-6 py-3.5">
                <IdCard className="h-4 w-4 flex-none text-[var(--green-600)]" />
                <p className="min-w-0 flex-1 text-[13.5px]">
                  <b className="font-bold text-[var(--green-900)]">
                    {proposal.holderFullName}
                  </b>
                  <span className="ml-2 font-mono text-[11.5px] text-[var(--muted-fg)]">
                    {proposal.cardNumber}
                  </span>
                </p>
                {proposal.cardStatusLabelFr && (
                  <span className="flex-none rounded-full bg-[#eef1ef] px-2.5 py-1 text-[10.5px] font-bold text-[var(--slate)]">
                    {proposal.cardStatusLabelFr}
                  </span>
                )}
              </div>

              {/* the proposer's own words */}
              <div className="px-6 py-4">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                  Exposé des faits
                </p>
                <blockquote className="mt-2 whitespace-pre-wrap rounded-r-xl border-l-[3px] border-[var(--gold-700)] bg-[#fbfcfb] px-4 py-3 text-[13.5px] leading-[1.7] text-[var(--ink)]">
                  {proposal.statement}
                </blockquote>
              </div>

              {/* the decision */}
              <div className="flex flex-wrap items-center gap-3 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
                <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-[var(--slate)]">
                  Le retrait est <b>définitif</b>. Le titulaire devra déposer
                  une nouvelle candidature lors d&apos;une prochaine session.
                </p>
                <Button size="sm" variant="outline"
                  onClick={() => setDeciding({ proposal, action: "decline" })}>
                  <X className="h-3.5 w-3.5" /> Refuser
                </Button>
                <Button size="sm"
                  className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
                  onClick={() => setDeciding({ proposal, action: "execute" })}>
                  <ShieldX className="h-3.5 w-3.5" /> Prononcer le retrait
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <DecisionDialog
        deciding={deciding}
        onClose={() => setDeciding(null)}
        onDone={() => {
          qc.invalidateQueries({ queryKey: lifecycleKeys.pending });
          qc.invalidateQueries({ queryKey: lifecycleKeys.pendingCount });
          qc.invalidateQueries({ queryKey: cardKeys.registry });
          setDeciding(null);
        }}
      />
    </div>
  );
}

/* ══ the decision dialog ══ */

function DecisionDialog({
  deciding, onClose, onDone,
}: {
  deciding: { proposal: ProposalResponse; action: "execute" | "decline" } | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string>();

  const executing = deciding?.action === "execute";

  const close = () => { setNote(""); setError(undefined); onClose(); };

  /* The two acts return different shapes — executing gives the CARD's new
     status, declining gives the PROPOSAL. The union is honest about that;
     onSuccess uses neither payload. */
  const decide = useMutation<CardStatusResponse | ProposalResponse, unknown, void>({
    mutationFn: () =>
      executing
        ? executeRevocation(deciding!.proposal.id, note.trim() || undefined)
        : declineRevocation(deciding!.proposal.id, note.trim()),
    onSuccess: () => {
      toast.success(executing ? "Retrait prononcé" : "Proposition refusée", {
        description: executing
          ? "Le titulaire a été informé. La carte n'est plus valable."
          : "L'auteur de la proposition en sera informé.",
      });
      setNote("");
      setError(undefined);
      onDone();
    },
    onError: (e) =>
      // The server refuses a self-execution here, with a message naming the
      // rule. That is where the two-hand requirement is enforced, and the
      // administrator reads it in full.
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  function submit() {
    setError(undefined);
    // Optional on an execution, REQUIRED on a refusal.
    if (!executing && !note.trim()) {
      setError("Indiquez le motif du refus : l'auteur de la proposition doit "
             + "pouvoir en tenir compte.");
      return;
    }
    decide.mutate();
  }

  return (
    <Dialog open={!!deciding} onOpenChange={(o) => !o && close()}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[560px]">
        <DialogHeader className="flex-none">
          <DialogTitle>
            {executing ? "Prononcer le retrait de la carte" : "Refuser la proposition"}
          </DialogTitle>
          <DialogDescription>
            {executing ? (
              <>
                La carte {deciding?.proposal.cardNumber} de{" "}
                {deciding?.proposal.holderFullName} sera retirée
                définitivement. Le titulaire en sera informé, avec le motif.
              </>
            ) : (
              <>
                La proposition sera rejetée et toute suspension conservatoire
                levée. La carte de {deciding?.proposal.holderFullName}{" "}
                redeviendra valide.
              </>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {executing && (
            <div className="flex items-start gap-2.5 rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-3.5">
              <ShieldX className="mt-0.5 h-4 w-4 flex-none text-[var(--red-700)]" />
              <p className="text-[12.5px] leading-relaxed text-[var(--red-700)]">
                <b>Cette décision est définitive.</b> Une carte retirée ne peut
                pas être rétablie : son titulaire devra déposer une nouvelle
                candidature lors d&apos;une prochaine session.
              </p>
            </div>
          )}

          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="decision-note">
              {executing ? (
                <>Observation <span className="font-normal text-[var(--muted-fg)]">(facultative)</span></>
              ) : (
                "Motif du refus"
              )}
            </FieldLabel>
            <Textarea
              id="decision-note"
              rows={4}
              value={note}
              onChange={(e) => { setNote(e.target.value); setError(undefined); }}
              placeholder={executing
                ? "Remarque à joindre à la décision de retrait…"
                : "Exemple : l'attestation a été vérifiée et se révèle authentique."}
              aria-invalid={!!error}
            />
            <FieldDescription>
              {executing
                ? "Elle figurera dans la notification adressée au titulaire."
                : "Il sera communiqué à l'auteur de la proposition."}
            </FieldDescription>
            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] pt-4">
          <Button variant="outline" onClick={close}>Annuler</Button>
          <Button
            onClick={submit}
            disabled={decide.isPending}
            className={executing
              ? "bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
              : undefined}
          >
            {decide.isPending
              ? "Enregistrement…"
              : executing ? "Confirmer le retrait" : "Confirmer le refus"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
