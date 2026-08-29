"use client";
// src/app/[locale]/(admin)/admin/honour/page.tsx

import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Award, Search, Camera, ShieldAlert, ShieldCheck, ShieldOff,
  Clock, Lock, Upload, Inbox,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Textarea } from "@/components/ui/textarea";
import { HonourCardDialog } from "@/components/admin/HonourCardDialog";
import { Guilloche, OfficialSeal } from "@/components/public/patterns";
import {
  listHonourCards, grantHonourCard, updateHonourCard, setHonourCardStatus,
  uploadHonourPhoto, honourKeys, type HonourCardResponse, type GrantBody,
} from "@/lib/api/honour";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth";

const STATUS_TONE: Record<string, { bg: string; fg: string; Icon: React.ElementType }> = {
  VALID:     { bg: "var(--green-tint)", fg: "var(--green-700)", Icon: ShieldCheck },
  EXPIRED:   { bg: "#eef1ef",           fg: "var(--muted-fg)",  Icon: Clock },
  SUSPENDED: { bg: "var(--gold-tint)",  fg: "var(--gold-700)",  Icon: ShieldAlert },
  REVOKED:   { bg: "var(--red-tint)",   fg: "var(--red-700)",   Icon: ShieldOff },
};

function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

export default function HonourCardsPage() {
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HonourCardResponse | null>(null);
  const [statusFor, setStatusFor] = useState<HonourCardResponse | null>(null);
  const [statusReason, setStatusReason] = useState("");
  const [search, setSearch] = useState("");

  const cards = useQuery({ queryKey: honourKeys.all, queryFn: listHonourCards });

  const refresh = () => qc.invalidateQueries({ queryKey: honourKeys.all });
  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const active = useMemo(
    () => (cards.data ?? []).filter((c) => c.status === "VALID" && !c.expired).length,
    [cards.data]
  );

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (cards.data ?? []).filter((c) => !term
      || c.fullName.toLowerCase().includes(term)
      || c.cardNumber.toLowerCase().includes(term)
      || (c.institution ?? "").toLowerCase().includes(term));
  }, [cards.data, search]);

  const grant = useMutation({
    mutationFn: (body: GrantBody) => grantHonourCard(body),
    onSuccess: (card) => {
      refresh(); setDialogOpen(false);
      // ⚠️ The next step is NAMED. A card without a photograph cannot be
      // produced, and nothing else on this screen would say so.
      toast.success(`Carte ${card.cardNumber} accordée`, {
        description: "Ajoutez maintenant la photographie : sans elle, la carte ne peut pas être produite.",
      });
    },
    onError: (e) => toast.error("Octroi impossible", { description: errText(e) }),
  });

  const update = useMutation({
    mutationFn: (body: GrantBody) => updateHonourCard(editing!.id, body),
    onSuccess: () => {
      refresh(); setDialogOpen(false); setEditing(null);
      toast.success("Carte modifiée", { description: "Les informations ont été re-signées." });
    },
    onError: (e) => toast.error("Modification impossible", { description: errText(e) }),
  });

  const status = useMutation({
    mutationFn: (v: { id: number; status: "VALID" | "SUSPENDED" | "REVOKED"; reason?: string }) =>
      setHonourCardStatus(v.id, v.status, v.reason),
    onSuccess: (card) => {
      refresh(); setStatusFor(null); setStatusReason("");
      toast.success(`Carte ${card.statusLabelFr.toLowerCase()}`);
    },
    onError: (e) => {
      toast.error("Modification impossible", { description: errText(e) });
    },
  });

  const photo = useMutation({
    mutationFn: (v: { id: number; file: File }) => uploadHonourPhoto(v.id, v.file, token),
    onSuccess: () => {
      refresh();
      toast.success("Photographie enregistrée");
    },
    onError: (e) => toast.error("Téléversement impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
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
        <Guilloche
          className="pointer-events-none absolute -left-40 -top-36 h-[440px] w-[440px] text-white opacity-[0.05]"
          rings={40}
        />
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true" />

        <div className="relative z-10 flex flex-wrap items-end justify-between gap-6 p-7">
          <div className="flex items-start gap-5">
            <span className="relative mt-1 flex h-[54px] w-[54px] flex-none items-center justify-center">
              <OfficialSeal className="absolute inset-0 h-full w-full"
                color="var(--gold-500)" id="honour-seal" />
              <Award className="relative h-5 w-5 text-[var(--gold-500)]" />
            </span>
            <div>
              <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-[var(--gold-500)]">
                Série B
              </p>
              <h2 className="engraved-dark mt-2 text-[27px] font-extrabold leading-none tracking-tight">
                Cartes d&apos;honneur
              </h2>
              {/* ⚠️ WHAT THIS SCREEN IS, said plainly. These cards skip the
                  examination every other card requires — the sentence below
                  is what makes that visible to whoever uses the screen. */}
              <p className="mt-2.5 max-w-md text-[13.5px] leading-relaxed text-white/50">
                Accordées par le Ministère sans examen de la commission. Elles
                n&apos;apparaissent pas au registre public.
              </p>
            </div>
          </div>

          <div className="flex items-end gap-3">
            <div className="rounded-xl border border-white/15 bg-black/25 px-5 py-3.5 text-center">
              <p className="font-mono text-[30px] font-extrabold leading-none">
                {cards.isLoading ? "—" : active}
              </p>
              <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/45">
                en cours
              </p>
            </div>

            <button
              type="button"
              onClick={() => { setEditing(null); setDialogOpen(true); }}
              className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)]
                         shadow-[0_8px_24px_-10px_rgba(255,215,0,.7)] transition-all hover:bg-[#ffe14d]
                         focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--green-900)]"
            >
              <Plus className="h-4 w-4" />
              Accorder une carte
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
            placeholder="Nom, n° de carte, organe…"
            aria-label="Rechercher une carte"
            className="h-10 w-72 rounded-xl border border-[var(--line)] bg-white pl-10 pr-3 text-[13.5px] outline-none focus-visible:border-[var(--green-500)] focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/25"
          />
        </div>
        <p className="ml-auto font-mono text-[11px] uppercase tracking-[0.14em] text-[var(--muted-fg)]">
          {filtered.length} carte{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* ══ the cards ══ */}
      {cards.isLoading ? (
        <div className="space-y-3">
          {[0, 1].map((i) => <Skeleton key={i} className="h-[104px] rounded-2xl" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <Inbox className="mx-auto h-9 w-9 text-[var(--muted-fg)] opacity-45" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            {search ? "Aucune carte ne correspond" : "Aucune carte d'honneur"}
          </p>
          <p className="mx-auto mt-2 max-w-sm text-[13.5px] leading-relaxed text-[var(--slate)]">
            {search
              ? "Vérifiez l'orthographe, ou effacez la recherche."
              : "Les cartes accordées sans examen apparaîtront ici."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {filtered.map((card) => (
            <HonourRow
              key={card.id}
              card={card}
              onEdit={() => { setEditing(card); setDialogOpen(true); }}
              onStatus={() => { setStatusFor(card); setStatusReason(""); }}
              onPhoto={(file) => photo.mutate({ id: card.id, file })}
              uploading={photo.isPending}
            />
          ))}
        </ul>
      )}

      <HonourCardDialog
        open={dialogOpen}
        onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditing(null); }}
        card={editing}
        onSubmit={(body) => (editing ? update.mutate(body) : grant.mutate(body))}
        submitting={grant.isPending || update.isPending}
      />

      {/* ══ suspend / revoke / restore ══ */}
      <AlertDialog open={!!statusFor} onOpenChange={(o) => !o && setStatusFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Carte {statusFor?.cardNumber}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {statusFor?.status === "VALID"
                ? "Suspendre une carte la rend immédiatement invalide au contrôle. Le retrait est définitif."
                : "Rétablir cette carte la rendra de nouveau valide au contrôle."}
            </AlertDialogDescription>
          </AlertDialogHeader>

          {statusFor?.status !== "VALID" ? (
            <p className="text-[13px] leading-relaxed text-[var(--ink)]">
              Motif enregistré : <span dir="auto" className="font-medium">
                {statusFor?.statusReason ?? "—"}
              </span>
            </p>
          ) : (
            <div className="space-y-2">
              <label htmlFor="statusReason" className="text-[13px] font-semibold">
                Motif
              </label>
              {/* ⚠️ Required by the server on anything but a restoration: a
                  withdrawal without a reason is one the holder cannot
                  contest. */}
              <Textarea
                id="statusReason"
                rows={3}
                dir="auto"
                value={statusReason}
                onChange={(e) => setStatusReason(e.target.value)}
                placeholder="Pourquoi cette carte est suspendue ou retirée."
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            {statusFor?.status === "VALID" ? (
              <>
                <Button
                  variant="outline"
                  disabled={status.isPending || !statusReason.trim()}
                  onClick={() => statusFor && status.mutate({
                    id: statusFor.id, status: "SUSPENDED", reason: statusReason })}
                >
                  Suspendre
                </Button>
                <AlertDialogAction
                  disabled={status.isPending || !statusReason.trim()}
                  className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
                  onClick={() => statusFor && status.mutate({
                    id: statusFor.id, status: "REVOKED", reason: statusReason })}
                >
                  Retirer
                </AlertDialogAction>
              </>
            ) : statusFor?.status === "SUSPENDED" ? (
              <AlertDialogAction
                disabled={status.isPending}
                onClick={() => statusFor && status.mutate({
                  id: statusFor.id, status: "VALID", reason: statusFor.statusReason ?? undefined })}
              >
                Rétablir
              </AlertDialogAction>
            ) : null}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

/* ══ one honour card ══ */

function HonourRow({
  card, onEdit, onStatus, onPhoto, uploading,
}: {
  card: HonourCardResponse;
  onEdit: () => void;
  onStatus: () => void;
  onPhoto: (file: File) => void;
  uploading: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const tone = STATUS_TONE[card.expired && card.status === "VALID" ? "EXPIRED" : card.status]
    ?? STATUS_TONE.VALID;

  return (
    <li className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex flex-wrap items-center gap-4 px-5 py-4">
        <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl"
          style={{ background: tone.bg }}>
          <tone.Icon className="h-5 w-5" style={{ color: tone.fg }} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-2 text-[14.5px] font-extrabold text-[var(--green-900)]">
            <span dir="auto">{card.fullName}</span>
            <span dir="ltr" className="font-mono text-[11.5px] font-normal text-[var(--muted-fg)]">
              {card.cardNumber}
            </span>
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[12px] text-[var(--slate)]">
            <span>{card.categoryLabelFr ?? "—"}</span>
            {card.institution && <span dir="auto">{card.institution}</span>}
            <span className="opacity-60">jusqu&apos;au {longFr(card.expiresAt)}</span>
            <span className="opacity-60">accordée par {card.grantedByName}</span>
          </p>
        </div>

        <span className="flex-none rounded-full px-2.5 py-1 text-[10.5px] font-bold"
          style={{ background: tone.bg, color: tone.fg }}>
          {card.statusLabelFr}
        </span>

        <div className="flex flex-none items-center gap-1">
          {/* ⚠️ THE PHOTOGRAPH IS THE BLOCKING STEP, so it is the loudest
              control on the row while it is missing. A card without one
              cannot be produced, and nothing else here would say so. */}
          <input
            ref={fileInput}
            type="file"
            accept="image/jpeg,image/png"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) onPhoto(file);
              e.target.value = "";
            }}
          />
          <Button
            size="sm"
            variant={card.hasPhoto ? "outline" : "default"}
            disabled={uploading || card.produced}
            onClick={() => fileInput.current?.click()}
            title={card.produced
              ? card.cannotEditReasonFr ?? undefined
              : card.hasPhoto ? "Remplacer la photographie" : "Ajouter la photographie"}
          >
            {card.hasPhoto ? <Camera className="h-3.5 w-3.5" /> : <Upload className="h-3.5 w-3.5" />}
            {card.hasPhoto ? "Photo" : "Photo requise"}
          </Button>

          <button
            type="button"
            onClick={onEdit}
            disabled={card.produced}
            title={card.produced ? card.cannotEditReasonFr ?? undefined : "Modifier"}
            aria-label={`Modifier la carte ${card.cardNumber}`}
            className="rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {card.produced ? <Lock className="h-3.5 w-3.5" /> : <Pencil className="h-3.5 w-3.5" />}
          </button>

          {/* ⚠️ Available even on a produced card, unlike an edit. The card
              already in circulation is precisely the one that must be
              stoppable when it is lost. */}
          {card.status !== "REVOKED" && (
            <button
              type="button"
              onClick={onStatus}
              title={card.status === "SUSPENDED" ? "Rétablir" : "Suspendre ou retirer"}
              aria-label={`Statut de la carte ${card.cardNumber}`}
              className="rounded-lg p-2 transition-colors hover:bg-white"
              style={{ color: card.status === "SUSPENDED" ? "var(--green-700)" : "var(--gold-700)" }}
            >
              {card.status === "SUSPENDED"
                ? <ShieldCheck className="h-3.5 w-3.5" />
                : <ShieldAlert className="h-3.5 w-3.5" />}
            </button>
          )}
        </div>
      </div>

      {/* ── why it exists, and why it can no longer change ── */}
      <div className="space-y-2 border-t border-[var(--line)] bg-[#fbfcfb] px-5 py-3">
        <p className="text-[12.5px] leading-relaxed text-[var(--slate)]">
          <span className="font-bold text-[var(--green-700)]">Motif : </span>
          <span dir="auto">{card.grantReason}</span>
        </p>

        {card.cannotEditReasonFr && (
          <p className="flex items-start gap-2 text-[12px] leading-relaxed text-[var(--muted-fg)]">
            <Lock className="mt-0.5 h-3 w-3 flex-none" />
            {card.cannotEditReasonFr}
          </p>
        )}

        {card.statusReason && card.status !== "VALID" && (
          <p className="flex items-start gap-2 text-[12px] leading-relaxed"
            style={{ color: tone.fg }}>
            <tone.Icon className="mt-0.5 h-3 w-3 flex-none" />
            <span dir="auto">{card.statusReason}</span>
          </p>
        )}
      </div>
    </li>
  );
}
