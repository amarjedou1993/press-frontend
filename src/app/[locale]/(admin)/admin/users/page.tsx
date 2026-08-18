"use client";
// src/app/(admin)/admin/users/page.tsx
//
// ───────────────────────────────────────────────────────────────────────
// THIS IS THE COMMISSION, NOT A USER TABLE.
//
// These are the people who decide whether a journalist is accredited. A
// spreadsheet of rows says they are records; a roll of members says they are
// an institution — which is what they are, and what the règlement treats them
// as.
//
// So each member is a CARD bearing the state seal, and the screen opens with
// the one fact that governs everything else: HOW MANY ARE ACTIVE.
//
// ONE RULE MAKES THAT NUMBER MATTER. A reclamation must be examined by a
// member OTHER than the author of the contested decision. With a single
// active member the objection right cannot be honoured at all — ObjectionService
// refuses at filing, and a rejected journalist discovers it instead of the
// Authority. That warning belongs here, where it can be acted on, and it is
// the reason this page has a hero rather than a header.
// ───────────────────────────────────────────────────────────────────────

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Users, Search, ShieldAlert, Mail, Phone,
  CircleDot, ScanLine,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReviewerDialog } from "@/components/admin/ReviewerDialog";
import { OfficialSeal, Guilloche, MicroprintRule } from "@/components/public/patterns";
import {
  listReviewers, createReviewer, updateReviewer, setReviewerEnabled,
  deleteReviewer, reviewerKeys, type ReviewerResponse,
} from "@/lib/api/admin";
import { ApiError } from "@/lib/api/client";

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export default function ReviewersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ReviewerResponse | null>(null);
  const [deleting, setDeleting] = useState<ReviewerResponse | null>(null);
  const [search, setSearch] = useState("");

  const { data: reviewers, isLoading } = useQuery({
    queryKey: reviewerKeys.all,
    queryFn: listReviewers,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: reviewerKeys.all });
  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const active = useMemo(
    () => (reviewers ?? []).filter((r) => r.enabled).length,
    [reviewers]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = reviewers ?? [];
    if (!term) return list;
    return list.filter((r) =>
      r.fullName.toLowerCase().includes(term)
      || r.email.toLowerCase().includes(term));
  }, [reviewers, search]);

  // Active first: a disabled member is a record, an active one is a colleague
  // currently deciding cases.
  const ordered = useMemo(
    () => [...filtered].sort((a, b) =>
      Number(b.enabled) - Number(a.enabled)
      || a.fullName.localeCompare(b.fullName, "fr")),
    [filtered]
  );

  const create = useMutation({
    mutationFn: (v: any) => createReviewer(v),
    onSuccess: (r) => {
      refresh(); setDialogOpen(false);
      toast.success("Membre nommé", {
        description: `${r.fullName} peut désormais examiner des dossiers.`,
      });
    },
    onError: (e) => toast.error("Nomination impossible", { description: errText(e) }),
  });

  const update = useMutation({
    mutationFn: (v: any) => updateReviewer(editing!.id, v),
    onSuccess: (r) => {
      refresh(); setDialogOpen(false); setEditing(null);
      toast.success("Membre modifié", { description: `${r.fullName} a été mis à jour.` });
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: number; enabled: boolean }) => setReviewerEnabled(v.id, v.enabled),
    onSuccess: (r) => {
      refresh();
      toast.success(r.enabled ? "Membre réactivé" : "Membre suspendu", {
        description: r.enabled
          ? `${r.fullName} peut de nouveau examiner des dossiers.`
          : `${r.fullName} ne peut plus se connecter ni examiner de dossier.`,
      });
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteReviewer(id),
    onSuccess: () => {
      refresh(); setDeleting(null);
      toast.success("Membre retiré de la commission");
    },
    onError: (e) => {
      setDeleting(null);
      toast.error("Retrait impossible", { description: errText(e) });
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-4">

      {/* ══════════════════════════════════════════════════════════
          THE COMMISSION — its size is the fact that governs the rest.
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.13), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <Guilloche
          className="pointer-events-none absolute -left-44 -top-40 h-[480px] w-[480px] text-white opacity-[0.05]"
          rings={44}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 px-7 pb-7 pt-7">
          <div className="flex items-start gap-5">
            <span className="relative mt-1 flex h-[58px] w-[58px] flex-none items-center justify-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true"
              />
              <OfficialSeal className="relative h-full w-full"
                color="var(--gold-500)" id="commission-seal" />
            </span>

            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                Commission d&apos;examen
              </p>
              <h2 className="engraved-dark mt-2 text-[27px] font-extrabold leading-none tracking-tight">
                Membres de la commission
              </h2>
              <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-white/50">
                Ils examinent les candidatures et se prononcent sur chacune.
                Leurs décisions engagent l&apos;autorité.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center">
              <p className="font-mono text-[30px] font-extrabold leading-none"
                style={{ color: active < 2 ? "var(--gold-500)" : "#fff" }}>
                {isLoading ? "—" : active}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                en fonction
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)]
                         shadow-[0_8px_24px_-10px_rgba(255,215,0,.7)] transition-all
                         hover:bg-[#ffe14d] hover:shadow-[0_10px_28px_-10px_rgba(255,215,0,.85)]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-900)]"
            >
              <Plus className="h-4 w-4" />
              Nommer un membre
            </button>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══ the quorum rule ══
          Not a nicety: with one active member the objection right cannot be
          honoured at all, and it fails at the worst possible moment — when a
          rejected journalist tries to exercise it. */}
      {!isLoading && active < 2 && (
        <div className="flex items-start gap-3.5 rounded-2xl border-2 border-[var(--gold-500)]/60 bg-[var(--gold-tint)] px-5 py-4">
          <ShieldAlert className="mt-0.5 h-5 w-5 flex-none text-[var(--gold-700)]" />
          <div>
            <p className="text-[13.5px] font-extrabold text-[var(--gold-700)]">
              La commission doit compter au moins deux membres en fonction
            </p>
            <p className="mt-1 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              Une réclamation est examinée par un membre <b>autre que
              l&apos;auteur de la décision contestée</b>. Avec un seul membre,
              un candidat rejeté ne pourra pas exercer son droit de recours et
              sa réclamation sera refusée au dépôt.
            </p>
          </div>
        </div>
      )}

      {/* ══ search ══ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-fg)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou adresse e-mail…"
            aria-label="Rechercher un membre"
            className="h-10 w-72 rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
          />
        </div>
        <p className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          {ordered.length} membre{ordered.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* ══ the roll ══ */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[132px] rounded-2xl" />
          ))}
        </div>
      ) : ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Users className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {search ? "Aucun membre ne correspond" : "La commission est vide"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            {search
              ? "Vérifiez l'orthographe, ou effacez la recherche."
              : "Nommez au moins deux membres : aucune candidature ne peut être examinée sans eux."}
          </p>
          {!search && (
            <Button className="mt-5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Nommer un membre
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ordered.map((reviewer) => (
            <MemberCard
              key={reviewer.id}
              reviewer={reviewer}
              onEdit={() => { setEditing(reviewer); setDialogOpen(true); }}
              onDelete={() => setDeleting(reviewer)}
              onToggle={(enabled) => toggle.mutate({ id: reviewer.id, enabled })}
              toggling={toggle.isPending}
            />
          ))}
        </ul>
      )}

      <ReviewerDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        reviewer={editing}
        onSubmit={(v) => (editing ? update.mutate(v) : create.mutate(v))}
        submitting={create.isPending || update.isPending}
        // pending={create.isPending || update.isPending}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Retirer {deleting?.fullName} de la commission ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ce membre ne pourra plus se connecter ni examiner de dossier.
              Les décisions qu&apos;il a déjà rendues restent inscrites au
              registre : elles engagent l&apos;autorité, pas seulement lui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate(deleting.id)}
              disabled={remove.isPending}
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
            >
              {remove.isPending ? "Retrait…" : "Retirer le membre"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ONE MEMBER

   A card rather than a row: these are people holding an office, and the
   seal behind the monogram says whose authority they exercise. A disabled
   member is desaturated rather than hidden — they remain on the roll, and
   their past decisions remain in the register.
   ══════════════════════════════════════════════════════════════════ */

function MemberCard({
  reviewer, onEdit, onDelete, onToggle, toggling,
}: {
  reviewer: ReviewerResponse;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  toggling: boolean;
}) {
  const on = reviewer.enabled;

  return (
    <li
      className="group relative overflow-hidden rounded-2xl border bg-white transition-all hover:shadow-[0_14px_36px_-24px_rgba(11,46,31,.65)]"
      style={{
        borderColor: on ? "var(--line)" : "var(--line)",
        opacity: on ? 1 : 0.72,
      }}
    >
      {/* the edge states the office */}
      <span
        className="absolute inset-y-0 left-0 w-[3px]"
        style={{
          background: on
            ? "linear-gradient(180deg, var(--gold-500), var(--green-500))"
            : "var(--line)",
        }}
        aria-hidden="true"
      />

      <div className="flex items-start gap-4 py-5 pl-6 pr-5">
        {/* monogram struck over the seal */}
        <span className="relative flex h-[52px] w-[52px] flex-none items-center justify-center">
          <OfficialSeal
            className="absolute inset-0 h-full w-full"
            color={on ? "var(--green-700)" : "var(--muted-fg)"}
            id={`member-seal-${reviewer.id}`}
          />
          <span
            className="relative flex h-[30px] w-[30px] items-center justify-center rounded-full text-[11.5px] font-extrabold"
            style={{
              background: on ? "var(--green-900)" : "var(--muted-fg)",
              color: "#fff",
            }}
          >
            {initials(reviewer.fullName)}
          </span>
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-extrabold leading-tight text-[var(--green-900)]">
            {reviewer.fullName}
          </p>

          <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12px] text-[var(--slate)]">
            <Mail className="h-3 w-3 flex-none opacity-55" />
            <span className="truncate">{reviewer.email}</span>
          </p>
          {reviewer.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
              <Phone className="h-3 w-3 flex-none opacity-55" />
              {reviewer.phone}
            </p>
          )}

          <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold"
            style={{ color: on ? "var(--green-700)" : "var(--muted-fg)" }}>
            <CircleDot className="h-3 w-3" />
            {on ? "En fonction" : "Suspendu"}
          </p>
        </div>
      </div>

      {/* actions, in their own register */}
      <div className="flex items-center gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
        <Switch
          checked={on}
          disabled={toggling}
          onCheckedChange={onToggle}
          aria-label={on ? "Suspendre ce membre" : "Réactiver ce membre"}
        />
        <span className="text-[11.5px] font-semibold text-[var(--slate)]">
          {on ? "Actif" : "Inactif"}
        </span>

        <span className="ml-auto flex items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Modifier"
            aria-label={`Modifier ${reviewer.fullName}`}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={onDelete}
            title="Retirer de la commission"
            aria-label={`Retirer ${reviewer.fullName}`}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-700)]"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>

      <MicroprintRule
        className="pb-1.5 text-center text-[var(--green-700)] opacity-[0.08]"
        repeat={12}
      />
    </li>
  );
}
