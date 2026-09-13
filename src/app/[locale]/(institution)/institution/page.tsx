"use client";
// src/app/[locale]/(institution)/institution/page.tsx

import { useEffect, useMemo, useRef, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Camera, Upload, Users2, Search, Inbox,
  FileSpreadsheet, Check, Clock, Lock, ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PaginationBar } from "@/components/ui/pagination-bar";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Guilloche, OfficialSeal } from "@/components/public/patterns";
import {
  getInstitution, listStaff, fileStaff, updateStaff, withdrawStaff,
  uploadStaffPhoto, institutionKeys,
  type FilingResponse, type FilingBody,
} from "@/lib/api/institutional";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth";
import { StaffDialog } from "@/components/institution/StaffDialog";
import { StaffImportDialog } from "@/components/institution/StaffImportDialog";
import {
  StaffFilters, DEFAULT_ROLL_FILTERS,
  type RollFilterState, type RollScope,
} from "@/components/institution/StaffFilters";

/**
 * The four scopes, as predicates.
 *
 * ⚠️ DEFINED ONCE, and used for both the counts and the filtering — so a tab
 * can never disagree with what it opens.
 */
const IN_SCOPE: Record<RollScope, (r: FilingResponse) => boolean> = {
  all: () => true,
  noPhoto: (r) => !r.hasPhoto,
  awaiting: (r) => !r.granted,
  granted: (r) => r.granted,
};

export default function InstitutionStaffPage() {
  const t = useTranslations("institution");
  const locale = useLocale();
  const arabic = locale === "ar";
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [editing, setEditing] = useState<FilingResponse | null>(null);
  const [withdrawing, setWithdrawing] = useState<FilingResponse | null>(null);
  const [filters, setFilters] = useState<RollFilterState>(DEFAULT_ROLL_FILTERS);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const institution = useQuery({
    queryKey: institutionKeys.me,
    queryFn: getInstitution,
  });
  const staff = useQuery({
    queryKey: institutionKeys.staff,
    queryFn: listStaff,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: institutionKeys.staff });
  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : t("tryAgain");

  const all = useMemo(() => staff.data ?? [], [staff.data]);

  /*
   * ⚠️ THREE COUNTS, AND THE MIDDLE ONE IS THE ACTIONABLE ONE.
   *
   * "Granted" is the Ministry's doing and needs nothing. "Awaiting" is out of
   * the institution's hands too — it is waiting on the Ministry. What an
   * institution can actually act on is the filings with no photograph, and
   * those are the ones whose cards will sit at the printer undone.
   */
  /*
   * ⚠️ ONE SET OF COUNTS, FROM THE PREDICATES ABOVE.
   *
   * They previously lived here as three separate filters, and the tabs would
   * have been a fourth definition of the same questions. A tab whose count
   * disagrees with what it opens is worse than no tab.
   */
  const counts = useMemo(() => ({
    all: all.length,
    noPhoto: all.filter(IN_SCOPE.noPhoto).length,
    awaiting: all.filter(IN_SCOPE.awaiting).length,
    granted: all.filter(IN_SCOPE.granted).length,
  }), [all]);

  const filtered = useMemo(() => {
    const term = filters.search.trim().toLowerCase();
    return all.filter((r) => {
      if (!IN_SCOPE[filters.scope](r)) return false;
      if (!term) return true;
      return r.fullName.toLowerCase().includes(term)
          || r.identityNumber.toLowerCase().includes(term)
          || (r.cardNumber ?? "").toLowerCase().includes(term)
          || (r.jobTitle ?? "").toLowerCase().includes(term);
    });
  }, [all, filters]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const visible = filtered.slice((safePage - 1) * pageSize, safePage * pageSize);

  /*
   * ⚠️ BACK TO PAGE ONE WHENEVER THE SET CHANGES.
   *
   * An institution on page four who selects "sans photo" — three filings —
   * would otherwise see an empty list and conclude there are none.
   */
  useEffect(() => { setPage(1); }, [filters]);

  const file = useMutation({
    mutationFn: (body: FilingBody) => fileStaff(body),
    onSuccess: (row) => {
      refresh();
      setDialogOpen(false);
      // ⚠️ The next step is NAMED. A filing without a photograph produces a
      // card that never reaches the printer, and nothing else here says so.
      toast.success(t("filedTitle", { name: row.fullName }), {
        description: t("filedBody"),
      });
    },
    onError: (e) => toast.error(t("filingFailed"), { description: errText(e) }),
  });

  const update = useMutation({
    mutationFn: (body: FilingBody) => updateStaff(editing!.id, body),
    onSuccess: () => {
      refresh();
      setDialogOpen(false);
      setEditing(null);
      toast.success(t("updated"));
    },
    onError: (e) => toast.error(t("updateFailed"), { description: errText(e) }),
  });

  const withdraw = useMutation({
    mutationFn: () => withdrawStaff(withdrawing!.id),
    onSuccess: () => {
      refresh();
      setWithdrawing(null);
      toast.success(t("withdrawn"));
    },
    onError: (e) => {
      setWithdrawing(null);
      toast.error(t("withdrawFailed"), { description: errText(e) });
    },
  });

  const photo = useMutation({
    mutationFn: (v: { id: number; file: File }) =>
      uploadStaffPhoto(v.id, v.file, token),
    onSuccess: () => {
      refresh();
      toast.success(t("photoSaved"));
    },
    onError: (e) => toast.error(t("photoFailed"), {
      description: e instanceof Error ? e.message : t("tryAgain"),
    }),
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
          <div className="flex w-full min-w-0 items-start gap-4 sm:w-auto sm:flex-1">
            <span className="relative mt-1 hidden h-[54px] w-[54px] flex-none items-center justify-center sm:flex">
              <span className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true" />
              <OfficialSeal className="relative h-full w-full"
                color="var(--gold-500)" id="institution-seal" />
            </span>

            <div className="min-w-0">
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                {t("eyebrow")}
              </p>
                  {/* ⚠️ The body's own name, in the reader's language.
                  It was hardcoded to nameFr — so an Arabic reader saw the
                  institution named in French on the one heading that says
                  whose space this is. Both names are already on the
                  response. */}
              <h2 dir="auto" className="engraved-dark mt-2 text-[20px] font-extrabold leading-tight tracking-tight sm:text-[25px]">
                {(arabic
                  ? institution.data?.nameAr ?? institution.data?.nameFr
                  : institution.data?.nameFr) ?? t("title")}
              </h2>
              <p className="mt-2.5 max-w-md text-[13px] leading-relaxed text-white/50">
                {t("lede")}
              </p>
            </div>
          </div>

          <div className="flex w-full flex-wrap items-stretch gap-3 sm:w-auto sm:flex-none sm:items-end">
            <div className="flex flex-none flex-col justify-center rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center">
              <p className="font-mono text-[28px] font-extrabold leading-none">
                {staff.isLoading ? "—" : counts.granted}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                {t("grantedCount")}
              </p>
            </div>

            {/* ⚠️ Only when non-zero, and it is a BUTTON — the one number on
                this screen the institution can do something about. */}
            {counts.noPhoto > 0 && (
              <button
                type="button"
                /* ⚠️ It called setSearch("") — which did nothing at all.
                   The count is the one number on this screen the institution
                   can act on; pressing it should go there. */
                onClick={() => setFilters({ ...filters, scope: "noPhoto" })}
                className="flex flex-none flex-col justify-center rounded-xl border border-[var(--gold-500)]/40 bg-black/25 px-5 py-3.5 text-center transition-colors hover:bg-black/40"
              >
                <p className="font-mono text-[28px] font-extrabold leading-none text-[var(--gold-500)]">
                  {counts.noPhoto}
                </p>
                <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                  {t("noPhotoCount")}
                </p>
              </button>
            )}

            <button
              type="button"
              onClick={() => setImportOpen(true)}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 self-end rounded-xl border border-white/25 px-4 text-[13px] font-bold text-white transition-colors hover:border-white/45 hover:bg-white/10 sm:flex-none"
            >
              <FileSpreadsheet className="h-4 w-4 flex-none" />
              {t("import")}
            </button>

            <button
              type="button"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="inline-flex h-11 flex-1 items-center justify-center gap-2 self-end rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)] shadow-[0_8px_24px_-10px_rgba(255,215,0,.7)] transition-all hover:bg-[#ffe14d] sm:flex-none"
            >
              <Plus className="h-4 w-4 flex-none" />
              {t("fileOne")}
            </button>
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ⚠️ WHAT HAPPENS NEXT, said once and plainly.
          An institution that files staff and hears nothing will assume the
          system lost them. The Ministry's step is invisible from here, so it
          has to be stated. */}
      {counts.awaiting > 0 && (
        <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
          <Clock className="mt-0.5 h-3.5 w-3.5 flex-none" />
          <span>{t.rich("awaitingNote", {
            count: counts.awaiting,
            b: (c) => <b className="font-bold">{c}</b>,
          })}</span>
        </p>
      )}

      <StaffFilters value={filters} onChange={setFilters} counts={counts} />

      {/* ══ the roll ══ */}
      {staff.isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => <Skeleton key={i} className="h-[92px] rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-12 text-center">
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {filters.search.trim() ? t("noneMatch")
              : filters.scope === "noPhoto" ? t("noneNoPhoto")
              : t("noneTitle")}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            {filters.search.trim() ? t("noneMatchBody")
              /* ⚠️ An empty "sans photo" is good news, and must not read as a
                 failed search. */
              : filters.scope === "noPhoto" ? t("noneNoPhotoBody")
              : t("noneBody")}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
          <ul className="divide-y divide-[var(--line)]">
            {visible.map((row) => (
              <StaffRow
                key={row.id}
                row={row}
                onEdit={() => { setEditing(row); setDialogOpen(true); }}
                onWithdraw={() => setWithdrawing(row)}
                onPhoto={(f) => photo.mutate({ id: row.id, file: f })}
                uploading={photo.isPending}
              />
            ))}
          </ul>

          {/* ⚠️ The same PaginationBar the reviewer, the printer and the
              honour register use. A fourth implementation would be a fourth
              set of page sizes and a fourth way of saying "25 of 212". */}
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

      <StaffDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        filing={editing}
        onSubmit={(body) => (editing ? update.mutate(body) : file.mutate(body))}
        submitting={file.isPending || update.isPending}
      />

      <StaffImportDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImported={refresh}
      />

      {/* ══ withdraw ══ */}
      <AlertDialog open={!!withdrawing} onOpenChange={(o) => !o && setWithdrawing(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("withdrawTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("withdrawBody", { name: withdrawing?.fullName ?? "" })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">
              {t("cancel")}
            </AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-[var(--red-500)] text-white hover:bg-[var(--red-700)] sm:w-auto"
              disabled={withdraw.isPending}
              onClick={() => withdraw.mutate()}
            >
              {withdraw.isPending ? t("withdrawing") : t("withdrawAction")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══ one filing ══ */

function StaffRow({
  row, onEdit, onWithdraw, onPhoto, uploading,
}: {
  row: FilingResponse;
  onEdit: () => void;
  onWithdraw: () => void;
  onPhoto: (file: File) => void;
  uploading: boolean;
}) {
  const t = useTranslations("institution");
  const format = useFormatter();
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    /* ⚠️ No border or radius of its own: the row now sits inside a framed
       list, and a card inside a card draws two lines where one is meant. */
    <li>
      <div className="flex flex-wrap items-center gap-x-3.5 gap-y-3 px-5 py-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
          style={{
            background: row.granted ? "var(--green-tint)" : "#eef1ef",
            color: row.granted ? "var(--green-700)" : "var(--muted-fg)",
          }}>
          {row.granted ? <ShieldCheck className="h-5 w-5" /> : <Users2 className="h-5 w-5" />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14px] font-extrabold text-[var(--green-900)]">
            <span dir="auto" className="user-text">{row.fullName}</span>
            {row.cardNumber && (
              <span dir="ltr" className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
                {row.cardNumber}
              </span>
            )}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--slate)]">
            <span dir="ltr" className="font-mono">{row.identityNumber}</span>
            {row.jobTitle && <span dir="auto" className="user-text">{row.jobTitle}</span>}
          </p>
        </div>

        {/* ⚠️ The state in a word. "Déposé" is not a failure — it is the
            Ministry's turn, and a row that looked like an error would send an
            institution chasing something that is simply pending. */}
        <span className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold"
          style={row.granted
            ? { background: "var(--green-tint)", color: "var(--green-700)" }
            : { background: "#f2f5f3", color: "var(--slate)" }}>
          {row.granted ? t("statusGranted") : t("statusFiled")}
        </span>

        <div className="flex flex-none items-center gap-1">
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onPhoto(f);
              e.target.value = "";
            }}
          />

          {/* ⚠️ ALWAYS ENABLED, even after the grant — the one control here
              that is. The Ministry grants without waiting for photographs,
              and a card without one never reaches the printer. */}
          <Button
            size="sm"
            variant={row.hasPhoto ? "outline" : "default"}
            disabled={uploading}
            onClick={() => fileInput.current?.click()}
            title={row.hasPhoto ? t("replacePhoto") : t("addPhoto")}
          >
            {row.hasPhoto ? <Camera className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
            {row.hasPhoto ? t("photo") : t("photoRequired")}
          </Button>

          <button
            type="button"
            onClick={onEdit}
            disabled={row.granted}
            title={row.granted ? t("grantedLocked") : t("edit")}
            aria-label={t("edit")}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {row.granted ? <Lock className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>

          {/* ⚠️ Only before the grant. Once a card exists it is the Ministry's
              to revoke — an institution cannot delete a credential out of the
              register. */}
          {!row.granted && (
            <button
              type="button"
              onClick={onWithdraw}
              title={t("withdrawAction")}
              aria-label={t("withdrawAction")}
              className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-500)]"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {row.granted && row.expiresAt && (
        <div className="flex items-center gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-2.5 text-[12px] text-[var(--slate)]">
          <Check className="h-3 w-3 flex-none text-[var(--green-600)]" />
          {t("validUntil", {
            date: format.dateTime(new Date(row.expiresAt + "T00:00:00"), "long"),
          })}
        </div>
      )}
    </li>
  );
}
