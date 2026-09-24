"use client";
// src/app/[locale]/(admin)/admin/institutions/page.tsx
//
// The register of bodies that file their own journalists.

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Building2, Search, Inbox, KeyRound, ShieldOff, ShieldCheck,
  Users2, ChevronRight, AlertTriangle, Mail, UserPlus,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useRouter } from "@/i18n/navigation";
import { Guilloche } from "@/components/public/patterns";
import { InstitutionDialog } from "@/components/admin/InstitutionDialog";
import { InstitutionAccountDialog } from "@/components/admin/InstitutionAccountDialog";
import {
  listInstitutions, createInstitution, updateInstitution,
  setInstitutionActive, setInstitutionAccountEnabled,
  institutionRegistryKeys, type InstitutionResponse, type InstitutionBody,
} from "@/lib/api/admin-institutions";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import {
  listInstitutionRequests, institutionRequestKeys,
} from "@/lib/api/admin-institution-requests";
import { PvRangeDialog } from "@/components/admin/PvRangeDialog";
import { downloadInstitutionalPv } from "@/lib/api/pv";

export default function InstitutionsPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [pvOpen, setPvOpen] = useState(false);
  const [editing, setEditing] = useState<InstitutionResponse | null>(null);
  const [accountFor, setAccountFor] = useState<InstitutionResponse | null>(null);
  const [deactivating, setDeactivating] = useState<InstitutionResponse | null>(null);
  const [search, setSearch] = useState("");

  const { data: institutions, isLoading } = useQuery({
    queryKey: institutionRegistryKeys.all,
    queryFn: listInstitutions,
  });

  /*
   * ⚠️ LA FILE EST ANNONCÉE ICI, MAIS ELLE N'Y VIT PAS.
   *
   * Un administrateur qui ouvre le registre des corps doit voir qu'une
   * demande attend — sinon elle dort jusqu'à ce que quelqu'un pense à la
   * chercher. Mais l'examen demande de la place : la lettre officielle se lit
   * en grand, et on ne tranche pas trois dossiers en survolant une liste.
   *
   * Le registre annonce ; l'écran des demandes examine.
   */
  const pending = useQuery({
    queryKey: institutionRequestKeys.pending,
    queryFn: () => listInstitutionRequests("PENDING_REVIEW"),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: institutionRegistryKeys.all });
  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const all = useMemo(() => institutions ?? [], [institutions]);

  /*
   * ⚠️ THE COUNT THAT MATTERS IS "REGISTERED BUT UNABLE TO FILE".
   *
   * A body with no account is inert: it exists in the register, it appears
   * on this screen, and nobody at that institution can do anything. It is
   * the one state here that looks finished and is not.
   */
  const withoutAccount = useMemo(
    () => all.filter((i) => i.accountId == null).length, [all]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return all.filter((i) => !term
      || i.nameFr.toLowerCase().includes(term)
      || i.nameAr.includes(term)
      || i.code.toLowerCase().includes(term)
      || (i.accountEmail ?? "").toLowerCase().includes(term));
  }, [all, search]);

  const create = useMutation({
    mutationFn: (body: InstitutionBody) => createInstitution(body),
    onSuccess: (row) => {
      refresh();
      setDialogOpen(false);
      /*
       * ⚠️ THE NEXT STEP IS NAMED, because the body is not yet usable.
       *
       * A registered institution with no account is a row nobody can act on —
       * and an administrator who created one and stopped would have no way of
       * knowing that from the screen alone.
       */
      toast.success(`${row.nameFr} enregistrée`, {
        description: "Créez maintenant son compte : sans lui, l'institution ne peut rien déposer.",
      });
      setAccountFor(row);
    },
    onError: (e) => toast.error("Enregistrement impossible", { description: errText(e) }),
  });

  const update = useMutation({
    mutationFn: (body: InstitutionBody) => updateInstitution(editing!.id, body),
    onSuccess: () => {
      refresh();
      setDialogOpen(false);
      setEditing(null);
      toast.success("Institution modifiée");
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const toggleActive = useMutation({
    mutationFn: (v: { id: number; active: boolean }) =>
      setInstitutionActive(v.id, v.active),
    onSuccess: (row) => {
      refresh();
      setDeactivating(null);
      toast.success(row.active ? "Institution réactivée" : "Institution désactivée", {
        description: row.active
          ? undefined
          : "Elle ne peut plus déposer. Les cartes déjà octroyées restent valables.",
      });
    },
    onError: (e) => {
      setDeactivating(null);
      toast.error("Modification impossible", { description: errText(e) });
    },
  });

  const toggleAccount = useMutation({
    mutationFn: (v: { id: number; enabled: boolean }) =>
      setInstitutionAccountEnabled(v.id, v.enabled),
    onSuccess: (row) => {
      refresh();
      toast.success(row.accountEnabled ? "Accès rétabli" : "Accès suspendu");
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-4">
      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-36px_rgba(11,46,31,.9)]"
        style={{
          background:
            "radial-gradient(760px 380px at 84% -30%, rgba(255,215,0,.15), transparent 62%), linear-gradient(155deg, #0b2e1f 0%, #0e3d29 58%, #0a2b1d 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />
        <Guilloche
          className="pointer-events-none absolute -right-24 -top-28 h-[220px] w-[220px] text-white sm:h-[300px] sm:w-[300px]"
          rings={34}
          opacity={0.1}
        />

        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 px-5 pb-6 pt-6 sm:items-end sm:px-7 sm:pb-7 sm:pt-7">
          <div className="flex min-w-0 flex-1 items-start gap-4">
            <span className="mt-1 hidden h-[46px] w-[46px] flex-none items-center justify-center rounded-xl bg-white/10 sm:flex">
              <Building2 className="h-5 w-5 text-[var(--gold-500)]" />
            </span>
            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                Registre
              </p>
              <h2 className="engraved-dark mt-2 text-[22px] font-extrabold leading-tight tracking-tight sm:text-[26px]">
                Institutions
              </h2>
              {/* ⚠️ WHAT THIS SCREEN AUTHORISES, said plainly. A body admitted
                  here files staff whose cards the Ministry then grants — the
                  account is the authorisation, and it is issued from here. */}
              <p className="mt-2.5 max-w-lg text-[13px] leading-relaxed text-white/50">
                Corps admis à déposer leurs propres journalistes. Le compte est
                délivré par le Ministère : il ne se crée jamais tout seul.
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-stretch gap-3 sm:w-auto sm:flex-none sm:items-end">
            {withoutAccount > 0 && (
              <div className="flex flex-none flex-col justify-center rounded-xl border border-[var(--gold-500)]/40 bg-black/25 px-5 py-3.5 text-center">
                <p className="font-mono text-[26px] font-extrabold leading-none text-[var(--gold-500)]">
                  {withoutAccount}
                </p>
                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                  sans compte
                </p>
              </div>
            )}

            {/*
              ⚠️ LE PV À CÔTÉ DES AUTRES ACTIONS, ET PAS SUR UNE PAGE DÉDIÉE.

              Une rubrique « Documents » regrouperait par FORMAT — ce qu'un
              système produit. Les écrans regroupent par SUJET — ce qu'une
              administration fait. Un administrateur ne pense pas « il me faut
              un docx » ; il pense « il me faut le relevé des cartes institutionnelles », et il est
              déjà ici quand la question se pose.

              Le test : où irait le quatrième PV ? Sur l'écran des retraits, il
              serait évident. Dans une page « Documents », il faudrait d'abord
              se souvenir qu'elle existe.
            */}
            <button
              type="button"
              onClick={() => setPvOpen(true)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 self-end rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition-colors hover:border-white/45 hover:bg-white/10
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-900)]
                         sm:flex-none"
            >
              <FileText className="h-4 w-4 flex-none" />
              Procès-verbal
            </button>

            <button
              type="button"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 self-end rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)] shadow-[0_8px_24px_-10px_rgba(255,215,0,.7)] transition-all hover:bg-[#ffe14d] sm:flex-none"
            >
              <Plus className="h-4 w-4 flex-none" />
              Enregistrer une institution
            </button>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ⚠️ SOUS LE BANDEAU, PAS DANS LA LISTE. Une demande n'est pas encore
          un corps enregistré : la mêler au registre ferait figurer parmi les
          institutions quelque chose que le Ministère n'a pas admis. */}
      {(pending.data?.length ?? 0) > 0 && (
        <button
          type="button"
          onClick={() => router.push(routes.admin.institutionRequests)}
          className="flex w-full items-center gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-start text-[12.5px] leading-relaxed text-[var(--gold-700)] transition-colors hover:bg-[var(--gold-tint)]/70"
        >
          <FileText className="h-3.5 w-3.5 flex-none" />
          <span className="min-w-0 flex-1">
            <b className="font-bold">
              {pending.data!.length} demande{pending.data!.length > 1 ? "s" : ""}
              {" "}d&apos;enregistrement
            </b>{" "}
            attend{pending.data!.length > 1 ? "ent" : ""} votre examen.
          </span>
          <ChevronRight className="rtl-flip h-4 w-4 flex-none" />
        </button>
      )}

      {/* ══ search ══ */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="pointer-events-none absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted-fg)]" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Nom, code, adresse…"
            aria-label="Rechercher une institution"
            className="h-10 w-full rounded-xl border border-[var(--line)] bg-white ps-10 pe-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25 sm:w-72"
          />
        </div>
        <p className="ms-auto font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          {filtered.length} institution{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* ══ the register ══ */}
      {isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-[128px] rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {search ? "Aucune institution ne correspond" : "Aucune institution enregistrée"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            {search
              ? "Vérifiez l'orthographe, ou effacez la recherche."
              : "Une institution admise ici dépose ses propres journalistes ; le Ministère octroie leurs cartes."}
          </p>
          {!search && (
            <Button className="mt-5" onClick={() => { setEditing(null); setDialogOpen(true); }}>
              <Plus className="h-4 w-4" />
              Enregistrer une institution
            </Button>
          )}
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((institution) => (
            <InstitutionCard
              key={institution.id}
              institution={institution}
              onEdit={() => { setEditing(institution); setDialogOpen(true); }}
              onAccount={() => setAccountFor(institution)}
              onToggleAccount={(enabled) =>
                toggleAccount.mutate({ id: institution.id, enabled })}
              onDeactivate={() => setDeactivating(institution)}
              onReactivate={() =>
                toggleActive.mutate({ id: institution.id, active: true })}
              onStaff={() => router.push(routes.admin.institutionalStaff(institution.id))}
            />
          ))}
        </ul>
      )}

      <InstitutionDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        institution={editing}
        onSubmit={(body) => (editing ? update.mutate(body) : create.mutate(body))}
        submitting={create.isPending || update.isPending}
      />

      <InstitutionAccountDialog
        open={!!accountFor}
        onOpenChange={(o) => !o && setAccountFor(null)}
        institution={accountFor}
        onDone={() => { refresh(); setAccountFor(null); }}
      />

      {/* ══ deactivation ══ */}
      <AlertDialog open={!!deactivating} onOpenChange={(o) => !o && setDeactivating(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Désactiver {deactivating?.nameFr} ?
            </AlertDialogTitle>
            {/* ⚠️ WHAT SURVIVES IS STATED FIRST. An administrator hesitating
                here is wondering whether they are about to invalidate cards
                people carry. They are not, and the sentence says so before
                the consequence. */}
            <AlertDialogDescription>
              Les cartes déjà octroyées restent valables et restent au registre.
              L&apos;institution ne pourra plus déposer de nouveaux agents, et son
              compte ne pourra plus rien créer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-[var(--red-500)] text-white hover:bg-[var(--red-700)] sm:w-auto"
              disabled={toggleActive.isPending}
              onClick={() => deactivating
                && toggleActive.mutate({ id: deactivating.id, active: false })}
            >
              Désactiver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <PvRangeDialog
        open={pvOpen}
        onOpenChange={setPvOpen}
        title="Procès-verbal des cartes institutionnelles"
        description="Les cartes octroyées sur la période retenue, toutes institutions confondues."
        onDownload={downloadInstitutionalPv}
      />
    </div>
  );
}

/* ══ one institution ══ */

function InstitutionCard({
  institution, onEdit, onAccount, onToggleAccount, onDeactivate, onReactivate, onStaff,
}: {
  institution: InstitutionResponse;
  onEdit: () => void;
  onAccount: () => void;
  onToggleAccount: (enabled: boolean) => void;
  onDeactivate: () => void;
  onReactivate: () => void;
  onStaff: () => void;
}) {
  const hasAccount = institution.accountId != null;
  const awaiting = institution.staffFiled - institution.staffGranted;

  return (
    <li
      className="overflow-hidden rounded-2xl border bg-white transition-opacity"
      style={{
        borderColor: institution.active ? "var(--line)" : "var(--line)",
        opacity: institution.active ? 1 : 0.72,
      }}
    >
      {/* ── the body ── */}
      <div className="flex flex-wrap items-start gap-x-4 gap-y-3 px-5 py-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
          style={{
            background: institution.active ? "var(--green-tint)" : "#eef1ef",
            color: institution.active ? "var(--green-700)" : "var(--muted-fg)",
          }}>
          <Building2 className="h-5 w-5" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-extrabold text-[var(--green-900)]">
            {institution.nameFr}
            <span dir="ltr" className="font-mono text-[11px] font-normal text-[var(--muted-fg)]">
              {institution.code}
            </span>
            {!institution.active && (
              <span className="rounded-full bg-[#f2f5f3] px-2 py-0.5 text-[10.5px] font-bold text-[var(--slate)]">
                Désactivée
              </span>
            )}
          </p>
          {/* ⚠️ The Arabic name is shown, not hidden behind an edit form. It
              is printed on nothing — but it is how the body is named in the
              candidate-facing half of the system, and an administrator should
              be able to see it is right. */}
          <p dir="rtl" lang="ar" className="mt-0.5 text-[12.5px] text-[var(--slate)]">
            {institution.nameAr}
          </p>
        </div>

        <div className="flex flex-none items-center gap-1">
          <button
            type="button"
            onClick={onEdit}
            title="Modifier"
            aria-label={`Modifier ${institution.nameFr}`}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
          >
            <Pencil className="h-3.5 w-3.5" />
          </button>
          {institution.active ? (
            <button
              type="button"
              onClick={onDeactivate}
              title="Désactiver"
              aria-label={`Désactiver ${institution.nameFr}`}
              className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-500)]"
            >
              <ShieldOff className="h-3.5 w-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onReactivate}
              title="Réactiver"
              aria-label={`Réactiver ${institution.nameFr}`}
              className="rounded-lg p-2 text-[var(--green-700)] transition-colors hover:bg-[var(--green-tint)]"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* ── the account ── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-3 border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-3.5">
        {hasAccount ? (
          <>
            <Mail className="h-3.5 w-3.5 flex-none text-[var(--muted-fg)]" />
            <p dir="ltr" className="min-w-0 flex-1 truncate text-[12.5px] text-[var(--slate)]">
              {institution.accountEmail}
            </p>

            <label className="flex flex-none items-center gap-2 text-[12px] font-semibold text-[var(--slate)]">
              <Switch
                checked={institution.accountEnabled}
                onCheckedChange={onToggleAccount}
                aria-label="Accès au compte"
              />
              {institution.accountEnabled ? "Accès actif" : "Accès suspendu"}
            </label>

            <Button size="sm" variant="outline" className="flex-none" onClick={onAccount}>
              <KeyRound className="h-3.5 w-3.5" />
              Mot de passe
            </Button>
          </>
        ) : (
          /*
           * ⚠️ NOT A BLANK LINE. A body with no account cannot file anything —
           * it is registered and inert, which is the one state on this screen
           * that looks finished and is not.
           */
          <>
            <AlertTriangle className="h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />
            <p className="min-w-0 flex-1 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              Aucun compte : cette institution ne peut rien déposer.
            </p>
            <Button size="sm" className="flex-none" onClick={onAccount}>
              <UserPlus className="h-3.5 w-3.5" />
              Créer le compte
            </Button>
          </>
        )}
      </div>

      {/* ── the roll ── */}
      {institution.staffFiled > 0 && (
        <button
          type="button"
          onClick={onStaff}
          className="flex w-full items-center gap-3 border-t border-[var(--line)] px-5 py-3 text-start transition-colors hover:bg-[var(--green-tint)]/40"
        >
          <Users2 className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
          <span className="min-w-0 flex-1 text-[12.5px] text-[var(--slate)]">
            <b className="font-bold text-[var(--green-900)]">{institution.staffGranted}</b>
            {" "}carte{institution.staffGranted > 1 ? "s" : ""} octroyée
            {institution.staffGranted > 1 ? "s" : ""}
            {/* ⚠️ The waiting count is the actionable half, and it is the
                Ministry that is holding it up. */}
            {awaiting > 0 && (
              <>
                {" · "}
                <b className="font-bold text-[var(--gold-700)]">{awaiting}</b>
                {" en attente d'octroi"}
              </>
            )}
          </span>
          <ChevronRight className="rtl-flip h-4 w-4 flex-none text-[var(--muted-fg)]" />
        </button>
      )}
    </li>
  );
}
