"use client";
// src/app/[locale]/(admin)/admin/institutions/[id]/agents/page.tsx

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, ShieldCheck, Camera, CameraOff, AlertTriangle, Clock, Inbox,
  Search, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import { useRouter } from "@/i18n/navigation";
import { GrantDialog } from "@/components/admin/GrantDialog";
import {
  InstitutionalStaffFilters, DEFAULT_STAFF_FILTERS,
  type StaffFilterState, type StaffScope,
} from "@/components/admin/InstitutionalStaffFilters";
import {
  listInstitutionStaff, institutionalKeys, type AdminCardResponse,
} from "@/lib/api/admin-institutional";
import { listInstitutions, institutionRegistryKeys } from "@/lib/api/admin-institutions";
import { routes } from "@/lib/routes";

/**
 * The four scopes, as predicates.
 *
 * ⚠️ DEFINED ONCE, and used for both the counts and the filtering — so a tab
 * can never disagree with what it opens.
 */
const IN_SCOPE: Record<StaffScope, (c: AdminCardResponse) => boolean> = {
  all: () => true,
  awaiting: (c) => !c.granted && c.grantable,
  granted: (c) => c.granted,
  blocked: (c) => !c.granted && !c.grantable,
};

export default function InstitutionAgentsPage() {
  const params = useParams<{ id: string }>();
  const institutionId = Number(params.id);
  const router = useRouter();
  const qc = useQueryClient();

  const [filters, setFilters] = useState<StaffFilterState>(DEFAULT_STAFF_FILTERS);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [granting, setGranting] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const staff = useQuery({
    queryKey: institutionalKeys.staff(institutionId),
    queryFn: () => listInstitutionStaff(institutionId),
  });
  const institutions = useQuery({
    queryKey: institutionRegistryKeys.all,
    queryFn: listInstitutions,
  });

  const institution = institutions.data?.find((i) => i.id === institutionId);
  const all = useMemo(() => staff.data ?? [], [staff.data]);

  const counts = useMemo(() => ({
    all: all.length,
    awaiting: all.filter(IN_SCOPE.awaiting).length,
    granted: all.filter(IN_SCOPE.granted).length,
    blocked: all.filter(IN_SCOPE.blocked).length,
  }), [all]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return all.filter((c) => {
      if (!IN_SCOPE[filters.scope](c)) return false;
      if (!term) return true;
      return c.fullName.toLowerCase().includes(term)
          || c.identityNumber.toLowerCase().includes(term)
          || (c.cardNumber ?? "").toLowerCase().includes(term)
          || (c.jobTitle ?? "").toLowerCase().includes(term);
    });
  }, [all, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /* ⚠️ Back to page one when the set changes: an administrator on page four
     who selects "Bloquées" — three rows — would otherwise see an empty list
     and conclude there are none. */
  useEffect(() => { setPage(1); }, [filters]);

  /* ── selection ── */

  const selectedCards = useMemo(
    () => all.filter((c) => selected.has(c.id)), [all, selected]);

  /**
   * ⚠️ SELECTION SURVIVES PAGING AND FILTERING — AND SAYS SO.
   *
   * Selecting across pages is the whole point of batching: an administrator
   * works through two hundred rows and grants once. But a selection that
   * silently spans a boundary is how the wrong batch gets granted — filter to
   * "en attente", select forty, switch to "octroyées", press Octroyer.
   *
   * So the bar counts what is out of view, and the dialog lists every card by
   * name before anything is taken.
   */
  const visibleIds = useMemo(() => new Set(visible.map((c) => c.id)), [visible]);
  const hiddenSelected = selectedCards.filter((c) => !visibleIds.has(c.id)).length;

  const grantableOnPage = visible.filter((c) => !c.granted && c.grantable);
  const allOnPageSelected =
    grantableOnPage.length > 0 && grantableOnPage.every((c) => selected.has(c.id));

  const toggle = (id: number) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 pb-28">
      {/* ══ heading ══ */}
      <div className="flex items-start gap-2 sm:items-center sm:gap-3">
        <Button variant="ghost" size="icon" className="flex-none"
          aria-label="Retour aux institutions"
          onClick={() => router.push(routes.admin.institutions)}>
          <ArrowLeft className="rtl-flip h-4 w-4" />
        </Button>
        <div className="min-w-0">
          <h2 className="text-[18px] font-extrabold leading-tight text-[var(--green-900)] sm:text-xl">
            {institution?.nameFr ?? "Agents"}
          </h2>
          <p className="mt-0.5 text-[13px] leading-snug text-[var(--slate)]">
            {counts.granted} octroyée{counts.granted > 1 ? "s" : ""}
            {counts.awaiting > 0 && ` · ${counts.awaiting} en attente`}
          </p>
        </div>
      </div>

      {/* ⚠️ Announced, not discovered after acting. */}
      {counts.blocked > 0 && filters.scope !== "blocked" && (
        <button
          type="button"
          onClick={() => setFilters({ ...filters, scope: "blocked" })}
          className="flex w-full items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-start text-[12.5px] leading-relaxed text-[var(--gold-700)] transition-colors hover:bg-[var(--gold-tint)]/70"
        >
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" />
          <span>
            <b className="font-bold">
              {counts.blocked} fiche{counts.blocked > 1 ? "s" : ""} ne peu
              {counts.blocked > 1 ? "vent" : "t"} pas être octroyée
              {counts.blocked > 1 ? "s" : ""}
            </b>{" "}
            en l&apos;état. Le motif est indiqué sur chaque ligne.
          </span>
        </button>
      )}

      <InstitutionalStaffFilters
        value={filters}
        onChange={setFilters}
        counts={counts}
      />

      {/* ══ the roll ══ */}
      {staff.isLoading ? (
        <div className="space-y-2">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[68px] rounded-xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          scope={filters.scope}
          searching={!!filters.search.trim()}
          onReset={() => setFilters(DEFAULT_STAFF_FILTERS)}
        />
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          {/* ⚠️ "Tout sélectionner" acts on THIS PAGE's grantable rows only.
              A control that silently reached two hundred rows would be the
              same silent boundary the action bar exists to prevent. */}
          {grantableOnPage.length > 0 && (
            <label className="flex cursor-pointer items-center gap-2.5 border-b border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5 text-[12.5px] font-semibold text-[var(--slate)]">
              <Checkbox
                checked={allOnPageSelected}
                onCheckedChange={(checked) => setSelected((prev) => {
                  const next = new Set(prev);
                  grantableOnPage.forEach((c) =>
                    checked ? next.add(c.id) : next.delete(c.id));
                  return next;
                })}
              />
              Sélectionner les {grantableOnPage.length} octroyables de cette page
            </label>
          )}

          <ul className="divide-y divide-[var(--line)]">
            {visible.map((card) => (
              <AgentRow
                key={card.id}
                card={card}
                selected={selected.has(card.id)}
                onToggle={() => toggle(card.id)}
              />
            ))}
          </ul>

          <PaginationBar
            page={safePage}
            pageSize={pageSize}
            total={filtered.length}
            onPageChange={setPage}
            onPageSizeChange={(size) => { setPageSize(size); setPage(1); }}
            itemNounSingular="agent"
            itemNounPlural="agents"
          />
        </div>
      )}

      {/* ══ the action bar ══ */}
      {selected.size > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--line)] bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-3 gap-y-2 px-5 py-3.5">
            <p className="min-w-0 flex-1 text-[13px] font-semibold text-[var(--green-900)]">
              {selected.size} fiche{selected.size > 1 ? "s" : ""} sélectionnée
              {selected.size > 1 ? "s" : ""}
              {/* ⚠️ THE INVISIBLE PART, NAMED.
                  Without this line an administrator who filtered, selected,
                  then changed the filter would grant a set they can no longer
                  see — and the report afterwards would be the first they
                  heard of it. */}
              {hiddenSelected > 0 && (
                <span className="ms-2 inline-flex items-center gap-1 text-[12px] font-normal text-[var(--gold-700)]">
                  <EyeOff className="h-3 w-3 flex-none" />
                  dont {hiddenSelected} hors de la vue actuelle
                </span>
              )}
            </p>
            <Button variant="outline" size="sm" onClick={() => setSelected(new Set())}>
              Tout désélectionner
            </Button>
            <Button size="sm" onClick={() => setGranting(true)}>
              <ShieldCheck className="h-4 w-4 flex-none" />
              Octroyer
            </Button>
          </div>
        </div>
      )}

      <GrantDialog
        open={granting}
        onOpenChange={setGranting}
        institutionName={institution?.nameFr ?? ""}
        cards={selectedCards}
        onGranted={() => {
          qc.invalidateQueries({ queryKey: institutionalKeys.staff(institutionId) });
          qc.invalidateQueries({ queryKey: institutionRegistryKeys.all });
          setSelected(new Set());
          setGranting(false);
        }}
      />
    </div>
  );
}

/* ══ empty states ══ */

function EmptyState({
  scope, searching, onReset,
}: {
  scope: StaffScope;
  searching: boolean;
  onReset: () => void;
}) {
  /* ⚠️ An empty "en attente" is the finished state, not a failed search.
     The same panel saying "aucun agent ne correspond" would report a
     completed roll as a miss. */
  const message = searching
    ? { Icon: Search, title: "Aucun agent ne correspond",
        body: "Vérifiez l'orthographe, ou effacez la recherche." }
    : scope === "awaiting"
      ? { Icon: ShieldCheck, title: "Rien n'attend d'octroi",
          body: "Toutes les fiches octroyables de cette institution ont leur carte." }
      : scope === "blocked"
        ? { Icon: ShieldCheck, title: "Aucune fiche bloquée",
            body: "Toutes les fiches déposées peuvent être octroyées." }
        : { Icon: Inbox, title: "Cette institution n'a rien déposé",
            body: "Les agents déposés apparaîtront ici, en attente d'octroi." };

  return (
    <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
      <message.Icon className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
      <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
        {message.title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
        {message.body}
      </p>
      {searching && (
        <button type="button" onClick={onReset}
          className="mt-4 text-[12.5px] font-bold text-[var(--green-700)] underline underline-offset-2">
          Effacer les filtres
        </button>
      )}
    </div>
  );
}

/* ══ one agent ══ */

function AgentRow({
  card, selected, onToggle,
}: {
  card: AdminCardResponse;
  selected: boolean;
  onToggle: () => void;
}) {
  const selectable = !card.granted && card.grantable;

  return (
    <li style={{ background: selected ? "var(--green-tint)" : undefined }}>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-2 px-5 py-3">
        {/* ⚠️ An ungrantable row carries NO checkbox — not a disabled one.
            A greyed box invites the click and then refuses it; the reason
            takes its place, which is the only thing that moves the row on. */}
        <span className="flex h-8 w-8 flex-none items-center justify-center">
          {selectable ? (
            <Checkbox checked={selected} onCheckedChange={onToggle}
              aria-label={`Sélectionner ${card.fullName}`} />
          ) : card.granted ? (
            <ShieldCheck className="h-4 w-4 text-[var(--green-600)]" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-[var(--gold-700)]" />
          )}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5 text-[13.5px] font-bold text-[var(--green-900)]">
            <span dir="auto" className="user-text">{card.fullName}</span>
            <span dir="ltr" className="font-mono text-[11px] font-normal text-[var(--muted-fg)]">
              {card.identityNumber}
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5 text-[12px] text-[var(--slate)]">
            {card.jobTitle && <span dir="auto" className="user-text">{card.jobTitle}</span>}
            {card.categoryLabelFr && <span>{card.categoryLabelFr}</span>}
          </p>
        </div>

        <span className="flex-none"
          title={card.hasPhoto ? "Photographie fournie" : "Photographie manquante"}>
          {card.hasPhoto
            ? <Camera className="h-3.5 w-3.5 text-[var(--green-600)]" />
            : <CameraOff className="h-3.5 w-3.5 text-[var(--gold-700)]" />}
        </span>

        {card.granted && (
          <span dir="ltr" className="flex-none font-mono text-[11.5px] font-bold text-[var(--green-700)]">
            {card.cardNumber}
          </span>
        )}
      </div>

      {!card.granted && card.cannotGrantReasonFr && (
        <p className="bg-[var(--gold-tint)]/50 px-5 py-2 text-[12px] leading-relaxed text-[var(--gold-700)]">
          {card.cannotGrantReasonFr}
        </p>
      )}

      {card.granted && card.expiresAt && (
        <p className="flex items-center gap-2 bg-[#fbfcfb] px-5 py-2 text-[12px] text-[var(--slate)]">
          <Clock className="h-3 w-3 flex-none" />
          Valable jusqu&apos;au {card.expiresAt}
        </p>
      )}
    </li>
  );
}
