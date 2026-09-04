"use client";
// src/components/admin/HonourCardTile.tsx

import { useRef } from "react";
import {
  Camera, Upload, Pencil, Lock, ShieldAlert, ShieldCheck, ShieldOff, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { HonourPhoto } from "./HonourPhoto";
import type { HonourCardResponse } from "@/lib/api/honour";

export const STATUS_TONE: Record<string, { bg: string; fg: string; Icon: React.ElementType }> = {
  VALID:     { bg: "var(--green-tint)", fg: "var(--green-700)", Icon: ShieldCheck },
  EXPIRED:   { bg: "#eef1ef",           fg: "var(--muted-fg)",  Icon: Clock },
  SUSPENDED: { bg: "var(--gold-tint)",  fg: "var(--gold-700)",  Icon: ShieldAlert },
  REVOKED:   { bg: "var(--red-tint)",   fg: "var(--red-700)",   Icon: ShieldOff },
};

export function toneOf(card: HonourCardResponse) {
  return STATUS_TONE[card.expired && card.status === "VALID" ? "EXPIRED" : card.status]
    ?? STATUS_TONE.VALID;
}

export function longFr(iso?: string | null) {
  if (!iso) return "—";
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

/**
 * One honour card, in the grid.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ THE PHOTOGRAPH IS THE WHOLE POINT OF THIS VIEW.
 *
 * A grid of initials would say exactly what the list says, in three times the
 * space. What the grid answers that the list cannot is "are these forty faces
 * the right forty" — the question after a bulk import, and the one an
 * administrator has no other way to ask.
 *
 * So the tile is mostly photograph, and a card without one is a gold panel
 * that reads as a gap rather than as a portrait.
 * ───────────────────────────────────────────────────────────────────────
 */
export function HonourCardTile({
  card, onEdit, onStatus, onPhoto, uploading,
}: {
  card: HonourCardResponse;
  onEdit: () => void;
  onStatus: () => void;
  onPhoto: (file: File) => void;
  uploading: boolean;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const tone = toneOf(card);

  return (
    <li className="group relative overflow-hidden rounded-2xl border border-[var(--line)] bg-white transition-shadow hover:shadow-[0_18px_40px_-26px_rgba(11,46,31,.5)]">
      {/* ⚠️ 3:4, the ratio PhotoStorageService enforces. A tile of another
          shape would crop the face the card will actually print. */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-[#eef1ef]">
        <HonourPhoto
          cardId={card.id}
          hasPhoto={card.hasPhoto}
          alt={card.fullName}
          className="h-full w-full"
        />

        <span className="absolute left-2.5 top-2.5 rounded-full px-2 py-0.5 text-[10px] font-bold shadow-sm"
          style={{ background: tone.bg, color: tone.fg }}>
          {card.statusLabelFr}
        </span>

        {card.produced && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-white/90 p-1.5 shadow-sm"
            title={card.cannotEditReasonFr ?? undefined}>
            <Lock className="h-3 w-3 text-[var(--muted-fg)]" />
          </span>
        )}
      </div>

      <div className="space-y-2 p-3.5">
        <div className="min-w-0">
          <p dir="auto" className="truncate text-[13.5px] font-extrabold text-[var(--green-900)]">
            {card.fullName}
          </p>
          <p dir="ltr" className="font-mono text-[11px] text-[var(--muted-fg)]">
            {card.cardNumber}
          </p>
        </div>

        <p className="truncate text-[12px] text-[var(--slate)]">
          {card.categoryLabelFr ?? "—"}
        </p>
        <p className="text-[11.5px] text-[var(--muted-fg)]">
          jusqu&apos;au {longFr(card.expiresAt)}
        </p>

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

        <div className="flex items-center gap-1 pt-1">
          {/* ⚠️ Filled while the photograph is missing — the same rule as the
              list. It is the blocking step, and it should look like one. */}
          <Button
            size="xs"
            variant={card.hasPhoto ? "outline" : "default"}
            className="flex-1"
            disabled={uploading || card.produced}
            onClick={() => fileInput.current?.click()}
            title={card.produced
              ? card.cannotEditReasonFr ?? undefined
              : card.hasPhoto ? "Remplacer la photographie" : "Ajouter la photographie"}
          >
            {card.hasPhoto ? <Camera className="h-3 w-3" /> : <Upload className="h-3 w-3" />}
            {card.hasPhoto ? "Photo" : "Requise"}
          </Button>

          <button
            type="button"
            onClick={onEdit}
            disabled={card.produced}
            title={card.produced ? card.cannotEditReasonFr ?? undefined : "Modifier"}
            aria-label={`Modifier la carte ${card.cardNumber}`}
            className="flex-none rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)] disabled:cursor-not-allowed disabled:opacity-40"
          >
            <Pencil className="h-3 w-3" />
          </button>

          {card.status !== "REVOKED" && (
            <button
              type="button"
              onClick={onStatus}
              title={card.status === "SUSPENDED" ? "Rétablir" : "Suspendre ou retirer"}
              aria-label={`Statut de la carte ${card.cardNumber}`}
              className="flex-none rounded-lg p-1.5 transition-colors hover:bg-[#f2f5f3]"
              style={{ color: card.status === "SUSPENDED" ? "var(--green-700)" : "var(--gold-700)" }}
            >
              {card.status === "SUSPENDED"
                ? <ShieldCheck className="h-3 w-3" />
                : <ShieldAlert className="h-3 w-3" />}
            </button>
          )}
        </div>
      </div>
    </li>
  );
}
