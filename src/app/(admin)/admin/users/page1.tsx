"use client";
// src/app/(admin)/admin/users/page.tsx
// Reviewer management on the shared DataTable: search, sortable columns,
// pagination. Row actions are plain icon buttons (no asChild anywhere).

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ColumnDef } from "@tanstack/react-table";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { DataTable } from "@/components/ui/data-table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ReviewerDialog } from "@/components/admin/ReviewerDialog";
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

  const { data: reviewers, isLoading } = useQuery({
    queryKey: reviewerKeys.all,
    queryFn: listReviewers,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: reviewerKeys.all });
  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const create = useMutation({
    mutationFn: (v: any) => createReviewer(v),
    onSuccess: (r) => {
      refresh(); setDialogOpen(false);
      toast.success("Réviseur créé", { description: `${r.fullName} peut désormais se connecter.` });
    },
    onError: (e) => toast.error("Création impossible", { description: errText(e) }),
  });

  const update = useMutation({
    mutationFn: (v: any) => updateReviewer(editing!.id, v),
    onSuccess: (r) => {
      refresh(); setDialogOpen(false); setEditing(null);
      toast.success("Réviseur modifié", { description: `${r.fullName} a été mis à jour.` });
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: number; enabled: boolean }) => setReviewerEnabled(v.id, v.enabled),
    onSuccess: (r) => {
      refresh();
      toast.success(r.enabled ? "Compte activé" : "Compte désactivé", {
        description: r.enabled
          ? `${r.fullName} peut se connecter.`
          : `${r.fullName} ne peut plus se connecter.`,
      });
    },
    onError: (e) => toast.error("Action impossible", { description: errText(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deleteReviewer(id),
    onSuccess: (res) => {
      refresh(); setDeleting(null);
      if (res.outcome === "DELETED") {
        toast.success("Réviseur supprimé", { description: res.message });
      } else {
        toast.warning("Réviseur archivé", { description: res.message });
      }
    },
    onError: (e) => { setDeleting(null); toast.error("Suppression impossible", { description: errText(e) }); },
  });

  const columns: ColumnDef<ReviewerResponse>[] = [
    {
      accessorKey: "fullName",
      header: "Réviseur",
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className={`flex items-center gap-3 ${r.enabled ? "" : "opacity-60"}`}>
            <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full text-[12px] font-bold"
              style={{ background: "var(--green-tint)", color: "var(--green-700)" }}>
              {initials(r.fullName)}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--ink)]">{r.fullName}</p>
              <p className="truncate text-xs text-[var(--slate)]">{r.email}</p>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "phone",
      header: "Téléphone",
      size: 160,
      cell: ({ row }) => (
        <span className="font-mono text-xs text-[var(--muted-fg)]">
          {row.original.phone || "—"}
        </span>
      ),
    },
    {
      accessorKey: "enabled",
      header: "Statut",
      size: 130,
      cell: ({ row }) =>
        row.original.enabled ? (
          <Badge variant="secondary">Actif</Badge>
        ) : (
          <Badge variant="outline">Désactivé</Badge>
        ),
    },
    {
      id: "toggle",
      header: "Actif",
      size: 90,
      enableSorting: false,
      cell: ({ row }) => (
        <Switch
          checked={row.original.enabled}
          onCheckedChange={(v) => toggle.mutate({ id: row.original.id, enabled: v })}
          aria-label={row.original.enabled ? "Désactiver le compte" : "Activer le compte"}
          title={row.original.enabled
            ? "Désactiver : le réviseur ne pourra plus se connecter"
            : "Activer : rendre l'accès au réviseur"}
        />
      ),
    },
    {
      id: "actions",
      header: "",
      size: 110,
      enableSorting: false,
      cell: ({ row }) => {
        const r = row.original;
        return (
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="icon" title="Modifier"
              aria-label={`Modifier ${r.fullName}`}
              onClick={() => { setEditing(r); setDialogOpen(true); }}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" title="Supprimer"
              aria-label={`Supprimer ${r.fullName}`}
              className="text-[var(--red-500)] hover:bg-[var(--red-tint)] hover:text-[var(--red-700)]"
              onClick={() => setDeleting(r)}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-[var(--green-900)]">
            Commission d&apos;examen
          </h2>
          <p className="mt-1 text-sm text-[var(--slate)]">
            Gérez les comptes des membres qui examinent les candidatures.
          </p>
        </div>
        <Button onClick={() => { setEditing(null); setDialogOpen(true); }}>
          <Plus className="h-4 w-4" /> Nouveau réviseur
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={reviewers ?? []}
        isLoading={isLoading}
        searchPlaceholder="Rechercher un réviseur…"
        emptyState={
          <div>
            <Users className="mx-auto h-8 w-8 text-[var(--muted-fg)]" />
            <p className="mt-3 text-sm font-semibold text-[var(--ink)]">Aucun réviseur</p>
            <p className="mt-1 text-xs text-[var(--slate)]">
              Créez le premier membre de la commission.
            </p>
            <Button className="mt-4" size="sm"
              onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Nouveau réviseur
            </Button>
          </div>
        }
      />

      <ReviewerDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        reviewer={editing}
        submitting={create.isPending || update.isPending}
        onSubmit={(v) => (editing ? update.mutate(v) : create.mutate(v))}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce réviseur ?</AlertDialogTitle>
            <AlertDialogDescription>
              Le compte de <b>{deleting?.fullName}</b> sera supprimé.
              <br />
              <span className="mt-2 block">
                Si ce réviseur a déjà rendu des décisions, son compte sera
                <b> désactivé et conservé</b> au lieu d&apos;être supprimé —
                l&apos;historique des décisions doit rester traçable.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
              onClick={() => deleting && remove.mutate(deleting.id)}
              disabled={remove.isPending}>
              {remove.isPending ? "Suppression…" : "Confirmer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
