"use client";
// src/components/candidate/IssuedCardPreview.tsx
// The thing that was actually being decided.
//
// After an acceptance, a status card is a thin reward for a process that took
// weeks. This shows the credential itself — the holder's own name, photograph,
// number and validity — so the outcome is the OBJECT, not a sentence about it.
//
// ───────────────────────────────────────────────────────────────────────
// THREE CHANGES.
//
// 1. IT NOW RECEIVES THE FIELDS IT ALWAYS RENDERED. Both call sites passed
//    categoryLabel={null} and omitted cardNumber and validUntil, because no
//    endpoint returned them — so an ISSUED card displayed "à l'édition" where
//    its own number should have been. /api/me/card supplies them.
//
// 2. IT NO LONGER DRAWS ITS OWN PANEL. The component wrapped itself in a
//    bordered box with a heading, and every caller wrapped it again — a card,
//    inside a card, inside a card. It now renders the credential alone and
//    lets the page frame it.
//
// 3. IT IS SIZED. At full container width the card was enormous; a credential
//    is a small object and reads as one. maxWidth 460 by default.
// ───────────────────────────────────────────────────────────────────────

import { User } from "lucide-react";
import { Guilloche } from "@/components/public/patterns";
import { useAuthenticatedFile } from "@/lib/api/files";

function fmt(iso?: string | null) {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? iso + "T00:00:00" : iso);
  return isNaN(d.getTime()) ? null : d.toLocaleDateString("fr-FR", {
    day: "2-digit", month: "2-digit", year: "numeric",
  });
}

export function IssuedCardPreview({
  fullName,
  nni,
  categoryLabel,
  issued,
  cardNumber,
  validUntil,
  className = "",
}: {
  fullName: string;
  nni?: string | null;
  categoryLabel?: string | null;
  /** True once the card really exists (CARD_ISSUED). */
  issued: boolean;
  cardNumber?: string | null;
  validUntil?: string | null;
  className?: string;
}) {
  const { url: photoUrl } = useAuthenticatedFile("/api/me/photo");
  const dash = "—————————";
  const pending = "à l'édition";

  const rows: { label: string; value: string; mono: boolean }[] = [
    { label: "Nom", value: fullName || dash, mono: false },
    { label: "NNI", value: nni || dash, mono: true },
    { label: "Catégorie", value: categoryLabel || (issued ? dash : pending), mono: false },
    { label: "N° carte", value: cardNumber || (issued ? dash : pending), mono: true },
    { label: "Validité", value: fmt(validUntil) || (issued ? dash : pending), mono: true },
  ];

  return (
    <div
      // className={`relative aspect-[1.586] w-full overflow-hidden rounded-2xl ${className}`}
      className={`relative mx-auto aspect-[1.586] w-full max-w-[400px] overflow-hidden rounded-2xl ${className}`}
      style={{
        background: "linear-gradient(158deg,#fffdf6 0%,#f5f1e4 60%,#efe9d8 100%)",
        boxShadow: "0 28px 55px -30px rgba(11,46,31,.55), inset 0 0 0 1px rgba(11,46,31,.08)",
      }}
      role="img"
      aria-label={issued ? "Votre carte de presse" : "Aperçu de votre carte de presse"}
    >
      {/* the shared rosette, not a fourth hand-copied one */}
      <Guilloche
        className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 text-[var(--green-700)]"
        opacity={0.1}
      />

      {/* SPÉCIMEN, until it is real — promising a document that does not yet
          exist is worse than showing nothing. */}
      {!issued && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="rotate-[-16deg] text-[42px] font-extrabold tracking-[0.24em] text-[var(--green-900)] opacity-[0.07]">
            SPÉCIMEN
          </span>
        </span>
      )}

      <div className="relative flex h-full flex-col p-5">
        {/* ── authority ── */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-[var(--green-500)] pb-2">
          <div>
            <p className="text-[12px] font-extrabold tracking-[0.12em] text-[var(--green-700)]">
              MCACRP
            </p>
            <p className="mt-0.5 max-w-[170px] text-[6px] font-bold uppercase leading-[1.5] tracking-[0.09em] text-[var(--muted-fg)]">
              Ministère de la Culture, des Arts,
              <br />
              de la Communication et des
              <br />
              Relations avec le Parlement
            </p>
          </div>
          <div className="text-right">
            <p dir="rtl" lang="ar" className="text-[10px] font-semibold leading-snug text-[var(--green-700)]">
              بطاقة صحفية
            </p>
            <p className="mt-0.5 text-[7px] font-bold uppercase tracking-[0.1em] text-[var(--green-700)]">
              Carte de presse
            </p>
          </div>
        </div>
        <div className="h-px w-full bg-[var(--gold-500)]/80" aria-hidden="true" />

        {/* ── holder ── */}
        <div className="mt-3 flex flex-1 gap-4">
          <div
            className="h-[86px] w-[66px] flex-none overflow-hidden rounded-lg border"
            style={{ borderColor: "rgba(0,169,92,.35)", background: "var(--green-tint)" }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-7 w-7 text-[var(--green-600)] opacity-45" />
              </div>
            )}
          </div>

          <dl className="min-w-0 flex-1 space-y-[6px]">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline gap-2 border-b border-dotted border-[var(--line)] pb-[2px]"
              >
                <dt className="w-[58px] flex-none text-[6.5px] font-bold uppercase tracking-[0.13em] text-[var(--green-700)]/75">
                  {row.label}
                </dt>
                <dd
                  className={`truncate text-[9px] ${
                    row.mono ? "font-mono" : "font-semibold"
                  } ${row.value === pending
                      ? "italic text-[var(--muted-fg)]"
                      : "text-[var(--ink)]/85"}`}
                >
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        {/* ── machine line ── */}
        <p className="mt-1.5 overflow-hidden whitespace-nowrap font-mono text-[6.5px] tracking-[0.2em] text-[var(--muted-fg)]">
          MCACRP&lt;RIM&lt;PRESSE&lt;&lt;
          {(fullName || "").toUpperCase().replace(/\s+/g, "<") || "SPECIMEN"}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
        <i className="flex-1 bg-[var(--green-500)]" />
        <i className="flex-1 bg-[var(--gold-500)]" />
        <i className="flex-1 bg-[var(--red-500)]" />
      </div>
    </div>
  );
}
