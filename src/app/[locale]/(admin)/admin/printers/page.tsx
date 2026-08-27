"use client";
// src/app/[locale]/(admin)/admin/printers/page.tsx
//
// Producer accounts.

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Printer, Search, Mail, Phone, CircleDot, ShieldOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { PrinterDialog } from "@/components/admin/PrinterDialog";
import { Guilloche } from "@/components/public/patterns";
import {
  listPrinters, createPrinter, updatePrinter, setPrinterEnabled,
  deletePrinter, printerAccountKeys, type PrinterResponse,
} from "@/lib/api/admin-printers";
import { ApiError } from "@/lib/api/client";

export default function PrintersPage() {
  const qc = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<PrinterResponse | null>(null);
  const [deleting, setDeleting] = useState<PrinterResponse | null>(null);
  const [search, setSearch] = useState("");

  const { data: printers, isLoading } = useQuery({
    queryKey: printerAccountKeys.all,
    queryFn: listPrinters,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: printerAccountKeys.all });
  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const active = useMemo(
    () => (printers ?? []).filter((p) => p.enabled).length,
    [printers]
  );

  const ordered = useMemo(() => {
    const term = search.trim().toLowerCase();
    const list = (printers ?? []).filter((p) => !term
      || p.fullName.toLowerCase().includes(term)
      || p.email.toLowerCase().includes(term));
    // Active first: a disabled account is a record, an active one is a
    // contractor currently holding access.
    return [...list].sort((a, b) =>
      Number(b.enabled) - Number(a.enabled)
      || a.fullName.localeCompare(b.fullName, "fr"));
  }, [printers, search]);

  const create = useMutation({
    mutationFn: (v: any) => createPrinter(v),
    onSuccess: (p) => {
      refresh(); setDialogOpen(false);
      toast.success("Compte créé", {
        description: `${p.fullName} peut désormais produire les cartes.`,
      });
    },
    onError: (e) => toast.error("Création impossible", { description: errText(e) }),
  });

  const update = useMutation({
    mutationFn: (v: any) => updatePrinter(editing!.id, v),
    onSuccess: (p) => {
      refresh(); setDialogOpen(false); setEditing(null);
      toast.success("Compte modifié", { description: `${p.fullName} a été mis à jour.` });
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const toggle = useMutation({
    mutationFn: (v: { id: number; enabled: boolean }) => setPrinterEnabled(v.id, v.enabled),
    onSuccess: (p) => {
      refresh();
      toast.success(p.enabled ? "Accès rétabli" : "Accès suspendu", {
        description: p.enabled
          ? `${p.fullName} peut de nouveau accéder aux cartes à produire.`
          : `${p.fullName} ne peut plus se connecter ni accéder à aucune carte.`,
      });
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => deletePrinter(id),
    onSuccess: (result) => {
      refresh(); setDeleting(null);
      // ⚠️ The server says WHICH happened, and so does the toast. An
      // administrator told "deleted" when the account was archived will look
      // for it again — and find it still listed.
      toast.success(
        result.outcome === "DELETED" ? "Compte supprimé" : "Compte désactivé",
        { description: result.message });
    },
    onError: (e) => {
      setDeleting(null);
      toast.error("Suppression impossible", { description: errText(e) });
    },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-4">
      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.13), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <Guilloche
          className="pointer-events-none absolute -left-44 -top-40 h-[460px] w-[460px] text-white opacity-[0.05]"
          rings={42}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div className="flex items-start gap-5">
            <span className="mt-1 flex h-[52px] w-[52px] flex-none items-center justify-center rounded-2xl bg-white/10">
              <Printer className="h-6 w-6 text-[var(--gold-500)]" />
            </span>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                Production
              </p>
              <h2 className="engraved-dark mt-2 text-[27px] font-extrabold leading-none tracking-tight">
                Comptes d&apos;impression
              </h2>
              {/* ⚠️ WHAT THE ACCOUNT IS FOR, and what it is not.
                  A producer is usually outside the Ministry. This screen is
                  where their access begins and — more importantly — where it
                  ends, which is the argument for giving them an account
                  rather than sending them files. */}
              <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-white/50">
                Ces comptes accèdent aux ressources de production, jamais à la
                carte signée. Leur accès se retire d&apos;un geste.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center">
              <p className="font-mono text-[30px] font-extrabold leading-none">
                {isLoading ? "—" : active}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                actifs
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)]
                         shadow-[0_8px_24px_-10px_rgba(255,215,0,.7)] transition-all
                         hover:bg-[#ffe14d]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-900)]"
            >
              <Plus className="h-4 w-4" />
              Créer un compte
            </button>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ══ search ══ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-fg)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom ou adresse e-mail…"
            aria-label="Rechercher un compte"
            className="h-10 w-72 rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
          />
        </div>
        <p className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          {ordered.length} compte{ordered.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* ══ the accounts ══ */}
      {isLoading ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-[124px] rounded-2xl" />)}
        </div>
      ) : ordered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Printer className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {search ? "Aucun compte ne correspond" : "Aucun compte d'impression"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            {search
              ? "Vérifiez l'orthographe, ou effacez la recherche."
              : "Créez un compte pour l'imprimeur chargé de fabriquer les cartes."}
          </p>
          {!search && (
            <Button className="mt-5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" /> Créer un compte
            </Button>
          )}
        </div>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {ordered.map((printer) => (
            <AccountCard
              key={printer.id}
              printer={printer}
              onEdit={() => { setEditing(printer); setDialogOpen(true); }}
              onDelete={() => setDeleting(printer)}
              onToggle={(enabled) => toggle.mutate({ id: printer.id, enabled })}
              toggling={toggle.isPending}
            />
          ))}
        </ul>
      )}

      <PrinterDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        printer={editing}
        onSubmit={(v) => (editing ? update.mutate(v) : create.mutate(v))}
        submitting={create.isPending || update.isPending}
      />

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer le compte de {deleting?.fullName} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Ce compte ne pourra plus se connecter ni accéder à aucune carte.
            </AlertDialogDescription>
          </AlertDialogHeader>

          {/* ⚠️ OUTSIDE the description, and it is the thing to read.
              A producer who has produced cannot be destroyed: print_runs
              records who took cards out of the building, and that line must
              stay resolvable. */}
          <p className="text-[13px] font-medium leading-relaxed text-[var(--ink)]">
            Si ce compte a déjà produit des cartes, il sera <b>désactivé</b>{" "}
            plutôt que supprimé : l&apos;historique de production doit rester
            consultable.
          </p>

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleting && remove.mutate(deleting.id)}
              disabled={remove.isPending}
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
            >
              {remove.isPending ? "Suppression…" : "Supprimer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══ one account ══ */

function AccountCard({
  printer, onEdit, onDelete, onToggle, toggling,
}: {
  printer: PrinterResponse;
  onEdit: () => void;
  onDelete: () => void;
  onToggle: (enabled: boolean) => void;
  toggling: boolean;
}) {
  const on = printer.enabled;

  return (
    <li
      className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-all hover:shadow-[0_14px_36px_-24px_rgba(11,46,31,.65)]"
      style={{ opacity: on ? 1 : 0.72 }}
    >
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
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
          style={{ background: on ? "var(--green-tint)" : "#eef1ef" }}>
          {on
            ? <Printer className="h-5 w-5 text-[var(--green-700)]" />
            : <ShieldOff className="h-5 w-5 text-[var(--muted-fg)]" />}
        </span>

        <div className="min-w-0 flex-1">
          <p dir="auto" className="truncate text-[15px] font-extrabold leading-tight text-[var(--green-900)]">
            {printer.fullName}
          </p>

          <p className="mt-1.5 flex items-center gap-1.5 truncate text-[12px] text-[var(--slate)]">
            <Mail className="h-3 w-3 flex-none opacity-55" />
            <span dir="ltr" className="truncate">{printer.email}</span>
          </p>
          {printer.phone && (
            <p className="mt-0.5 flex items-center gap-1.5 text-[12px] text-[var(--slate)]">
              <Phone className="h-3 w-3 flex-none opacity-55" />
              <span dir="ltr">{printer.phone}</span>
            </p>
          )}

          <p className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-bold"
            style={{ color: on ? "var(--green-700)" : "var(--muted-fg)" }}>
            <CircleDot className="h-3 w-3" />
            {on ? "Accès actif" : "Accès suspendu"}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5">
        <Switch
          checked={on}
          disabled={toggling}
          onCheckedChange={onToggle}
          aria-label={on ? "Suspendre l'accès" : "Rétablir l'accès"}
        />
        <span className="text-[11.5px] font-semibold text-[var(--slate)]">
          {on ? "Actif" : "Inactif"}
        </span>

        <span className="ml-auto flex items-center gap-1">
          <button type="button" onClick={onEdit}
            title="Modifier"
            aria-label={`Modifier ${printer.fullName}`}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]">
            <Pencil className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onDelete}
            title="Supprimer le compte"
            aria-label={`Supprimer ${printer.fullName}`}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-700)]">
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </span>
      </div>
    </li>
  );
}
