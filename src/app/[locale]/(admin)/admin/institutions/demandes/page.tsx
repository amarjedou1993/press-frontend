"use client";
// src/app/[locale]/(admin)/admin/institutions/demandes/page.tsx

import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft, Building2, Inbox, ShieldCheck, XCircle, Clock, Mail, Phone,
  UserRound, AlertTriangle, CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "@/i18n/navigation";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { RequestLetter } from "@/components/admin/RequestLetter";
import { ApproveRequestDialog } from "@/components/admin/ApproveRequestDialog";
import { RejectRequestDialog } from "@/components/admin/RejectRequestDialog";
import { statsKeys } from "@/lib/api/admin-stats";
import { institutionRegistryKeys } from "@/lib/api/admin-institutions";
import {
  listInstitutionRequests, approveInstitutionRequest, rejectInstitutionRequest,
  institutionRequestKeys, type InstitutionRequestStatus,
} from "@/lib/api/admin-institution-requests";

/**
 * Les vues de la file.
 *
 * ⚠️ TROIS STATUTS SUR CINQ, ET C'EST VOULU.
 *
 * SUBMITTED n'a pas d'adresse confirmée : le Ministère ne doit pas encore la
 * lire. EXPIRED est une demande morte de sa propre inaction. Ni l'une ni
 * l'autre n'appelle une décision, et leur donner un onglet ferait chercher du
 * travail là où il n'y en a pas.
 *
 * Le type est tiré d'ici plutôt que de InstitutionRequestStatus : les deux
 * statuts absents ne doivent pas pouvoir servir de portée.
 */
type Scope = "PENDING_REVIEW" | "APPROVED" | "REJECTED" | "ALL";

const SCOPES: Array<{ key: Scope; label: string }> = [
  { key: "PENDING_REVIEW", label: "À examiner" },
  { key: "APPROVED", label: "Approuvées" },
  { key: "REJECTED", label: "Refusées" },
  { key: "ALL", label: "Toutes" },
];


function stamp(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * Les demandes d'enregistrement, et leur examen.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ DEUX VOLETS, PAS UNE LISTE PUIS UN ÉCRAN.
 *
 * La file tient à gauche, la demande retenue s'ouvre à droite avec sa lettre.
 * Examiner, c'est comparer ce qui est déclaré à ce que la lettre porte — un
 * en-tête, une signature, un cachet — et passer d'un écran à l'autre pour
 * cela ferait perdre la comparaison à chaque aller-retour.
 *
 * ⚠️ ET LA LETTRE OCCUPE LA PLUS GRANDE PART. C'est la seule pièce qui
 * protège contre une demande déposée au nom d'un corps par quelqu'un qui n'en
 * fait pas partie. Reléguée en vignette, elle deviendrait une étape
 * facultative.
 * ───────────────────────────────────────────────────────────────────────
 */
export default function InstitutionRequestsPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const [scope, setScope] = useState<Scope>("PENDING_REVIEW");
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [decisionError, setDecisionError] = useState<string>();

  const requests = useQuery({
    queryKey: institutionRequestKeys.all,
    queryFn: () => listInstitutionRequests(),
  });

  const all = useMemo(() => requests.data ?? [], [requests.data]);

  const counts = useMemo(() => ({
    PENDING_REVIEW: all.filter((r) => r.status === "PENDING_REVIEW").length,
    APPROVED: all.filter((r) => r.status === "APPROVED").length,
    REJECTED: all.filter((r) => r.status === "REJECTED").length,
    ALL: all.length,
  }), [all]);

  const visible = useMemo(
    () => scope === "ALL" ? all : all.filter((r) => r.status === scope),
    [all, scope]);

  /*
   * ⚠️ RIEN N'EST SÉLECTIONNÉ D'OFFICE.
   *
   * Ouvrir la première demande ferait apparaître une lettre que personne n'a
   * demandé à voir, et un écran d'examen prêt à décider avant qu'on ait choisi
   * le dossier. On choisit, puis on lit.
   */
  const selected = all.find((r) => r.id === selectedId) ?? null;

  function refresh() {
    qc.invalidateQueries({ queryKey: institutionRequestKeys.all });
    // Le tableau de bord compte les demandes en attente, et le registre des
    // corps vient de gagner une ligne.
    qc.invalidateQueries({ queryKey: statsKeys.admin });
    qc.invalidateQueries({ queryKey: institutionRegistryKeys.all });
  }

  const approve = useMutation({
    mutationFn: (v: { code: string; nameFr: string; nameAr: string }) =>
      approveInstitutionRequest(selected!.id, v),
    onSuccess: (r) => {
      refresh();
      setApproving(false);
      setDecisionError(undefined);
      toast.success("Institution enregistrée", {
        description: `Le compte de ${r.proposedNameFr} est ouvert.`,
      });
    },
    onError: (e) => setDecisionError(
      e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  const reject = useMutation({
    mutationFn: (reason: string) => rejectInstitutionRequest(selected!.id, reason),
    onSuccess: () => {
      refresh();
      setRejecting(false);
      setDecisionError(undefined);
      toast.success("Demande refusée", { description: "Le motif a été envoyé." });
    },
    onError: (e) => setDecisionError(
      e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez."),
  });

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <Button variant="ghost" size="icon" className="flex-none"
          aria-label="Retour aux institutions"
          onClick={() => router.push(routes.admin.institutions)}>
          <ArrowLeft className="rtl-flip h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold leading-tight text-[var(--green-900)] sm:text-xl">
            Demandes d&apos;enregistrement
          </h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--slate)]">
            Un corps demande à être admis. L&apos;approbation crée le compte.
          </p>
        </div>
      </div>

      <div className="inline-flex flex-wrap rounded-xl bg-[#f2f5f3] p-1">
        {SCOPES.map((s) => {
          const on = scope === s.key;
          if (counts[s.key] === 0 && s.key !== "ALL" && !on) return null;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => { setScope(s.key); setSelectedId(null); }}
              aria-pressed={on}
              className="rounded-lg px-3.5 py-1.5 text-[12.5px] font-bold transition-all"
              style={on
                ? { background: "#fff", color: "var(--green-900)",
                    boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                : { color: "var(--slate)" }}
            >
              {s.label}
              <span className="ms-1.5 font-mono text-[10.5px] opacity-60">
                {counts[s.key]}
              </span>
            </button>
          );
        })}
      </div>

      {requests.isLoading ? (
        <Skeleton className="h-64 rounded-2xl" />
      ) : visible.length === 0 ? (
        <EmptyState scope={scope} />
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,340px)_1fr] lg:items-start">
          {/* ══ la file ══ */}
          <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            {visible.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  onClick={() => { setSelectedId(r.id); setDecisionError(undefined); }}
                  className="w-full px-4 py-3 text-start transition-colors"
                  style={selectedId === r.id
                    ? { background: "var(--green-tint)" } : undefined}
                >
                  <p dir="auto" className="truncate text-[13.5px] font-extrabold text-[var(--green-900)]">
                    {r.proposedNameFr}
                  </p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[12px] text-[var(--slate)]">
                    <span dir="auto" className="truncate">{r.contactName}</span>
                    <span className="opacity-50">·</span>
                    <span>{stamp(r.createdAt)}</span>
                  </p>
                  {r.similarInstitutions.length > 0 && r.status === "PENDING_REVIEW" && (
                    <p className="mt-1 flex items-center gap-1 text-[11.5px] font-semibold text-[var(--gold-700)]">
                      <AlertTriangle className="h-3 w-3 flex-none" />
                      Nom proche d&apos;un corps enregistré
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>

          {/* ══ l'examen ══ */}
          {selected ? (
            <div className="space-y-4">
              <div className="rounded-2xl border border-[var(--line)] bg-white p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p dir="auto" className="text-[16px] font-extrabold text-[var(--green-900)]">
                      {selected.proposedNameFr}
                    </p>
                    <p dir="rtl" className="mt-0.5 text-[14px] text-[var(--slate)]">
                      {selected.proposedNameAr}
                    </p>
                  </div>
                  <StatusChip status={selected.status} />
                </div>

                <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                  <Detail Icon={UserRound} label="Personne à contacter"
                    value={`${selected.contactName} — ${selected.contactRole}`} />
                  <Detail Icon={Mail} label="Adresse" value={selected.email} ltr />
                  <Detail Icon={Phone} label="Téléphone" value={selected.phone ?? "—"} ltr />
                  {/* ⚠️ La date de CONFIRMATION, pas celle du dépôt : c'est
                      elle qui rend la demande examinable. */}
                  <Detail Icon={CheckCircle2} label="Adresse confirmée le"
                    value={stamp(selected.verifiedAt)} />
                </dl>

                {selected.similarInstitutions.length > 0 && (
                  <p className="mt-4 flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
                    <span>
                      <b className="font-bold">Corps déjà enregistrés au nom
                      proche :</b> {selected.similarInstitutions.join(", ")}.
                    </span>
                  </p>
                )}

                {selected.status === "REJECTED" && selected.decisionReason && (
                  <p className="mt-4 rounded-lg bg-[var(--red-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--red-700)]">
                    <b className="font-bold">Refusée</b> le {stamp(selected.decidedAt)}
                    {selected.decidedByName ? ` par ${selected.decidedByName}` : ""} —{" "}
                    <span dir="auto">{selected.decisionReason}</span>
                  </p>
                )}

                {selected.status === "APPROVED" && (
                  <p className="mt-4 flex items-center gap-2 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] text-[var(--green-700)]">
                    <ShieldCheck className="h-3.5 w-3.5 flex-none" />
                    Approuvée le {stamp(selected.decidedAt)}
                    {selected.decidedByName ? ` par ${selected.decidedByName}` : ""}.
                  </p>
                )}

                {selected.status === "PENDING_REVIEW" && (
                  <div className="mt-5 flex flex-col gap-2 border-t border-[var(--line)] pt-4 sm:flex-row sm:justify-end">
                    <Button variant="outline" onClick={() => {
                      setDecisionError(undefined); setRejecting(true);
                    }}>
                      <XCircle className="h-4 w-4 flex-none" />
                      Refuser
                    </Button>
                    <Button onClick={() => {
                      setDecisionError(undefined); setApproving(true);
                    }}>
                      <ShieldCheck className="h-4 w-4 flex-none" />
                      Approuver
                    </Button>
                  </div>
                )}
              </div>

              <div className="h-[560px]">
                <RequestLetter requestId={selected.id} />
              </div>
            </div>
          ) : (
            <div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
              <div>
                <Building2 className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
                <p className="mt-4 text-[14px] font-extrabold text-[var(--green-900)]">
                  Choisissez une demande
                </p>
                <p className="mx-auto mt-2 max-w-xs text-[13px] leading-relaxed text-[var(--slate)]">
                  Sa lettre officielle s&apos;affichera ici, à côté des
                  informations déclarées.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      <ApproveRequestDialog
        open={approving}
        onOpenChange={(o) => !o && setApproving(false)}
        request={selected}
        onApprove={(code, nameFr, nameAr) => approve.mutate({ code, nameFr, nameAr })}
        approving={approve.isPending}
        error={decisionError}
      />

      <RejectRequestDialog
        open={rejecting}
        onOpenChange={(o) => !o && setRejecting(false)}
        request={selected}
        onReject={(reason) => reject.mutate(reason)}
        rejecting={reject.isPending}
        error={decisionError}
      />
    </div>
  );
}

/* ══ pièces ══ */

function Detail({
  Icon, label, value, ltr,
}: {
  Icon: React.ElementType;
  label: string;
  value: string;
  ltr?: boolean;
}) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--muted-fg)]">
        <Icon className="h-3 w-3 flex-none" />
        {label}
      </dt>
      <dd dir={ltr ? "ltr" : "auto"}
        className={`mt-0.5 text-[13.5px] text-[var(--green-900)] ${ltr ? "font-mono text-[12.5px]" : ""}`}>
        {value}
      </dd>
    </div>
  );
}

function StatusChip({ status }: { status: InstitutionRequestStatus }) {
  const tone = {
    PENDING_REVIEW: { label: "À examiner", bg: "var(--gold-tint)", fg: "var(--gold-700)", Icon: Clock },
    APPROVED: { label: "Approuvée", bg: "var(--green-tint)", fg: "var(--green-700)", Icon: ShieldCheck },
    REJECTED: { label: "Refusée", bg: "var(--red-tint)", fg: "var(--red-700)", Icon: XCircle },
    SUBMITTED: { label: "Adresse non confirmée", bg: "#eef1ef", fg: "var(--muted-fg)", Icon: Mail },
    EXPIRED: { label: "Expirée", bg: "#eef1ef", fg: "var(--muted-fg)", Icon: Clock },
  }[status];

  return (
    <span className="inline-flex flex-none items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold"
      style={{ background: tone.bg, color: tone.fg }}>
      <tone.Icon className="h-3 w-3 flex-none" />
      {tone.label}
    </span>
  );
}

function EmptyState({ scope }: { scope: Scope }) {
  /* ⚠️ Une file vide est l'état normal, pas un échec. Le dire autrement
     ferait chercher une erreur là où il n'y a que du travail fait. */
  const message = scope === "PENDING_REVIEW"
    ? { title: "Rien à examiner", body: "Aucune demande d'enregistrement n'attend votre décision." }
    : scope === "ALL"
      ? { title: "Aucune demande", body: "Les demandes déposées par des institutions apparaîtront ici." }
      : { title: "Aucune demande dans cette vue", body: "Changez d'onglet pour voir les autres." };

  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
      <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
      <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
        {message.title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
        {message.body}
      </p>
    </div>
  );
}
