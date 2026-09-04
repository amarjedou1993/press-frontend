"use client";
// src/components/candidate/IssuedCardPreview.tsx

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

/**
 * The card as it will be printed.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ EVERY DIMENSION IS IN cqw — PER CENT OF THE CARD'S OWN WIDTH.
 *
 * This is a rendering of a physical object, and a physical object does not
 * reflow. Its proportions are the whole of its likeness: the seal sits where
 * it sits, the photograph is the fraction of the width that it is, the
 * machine line runs the length it runs.
 *
 * Sized in pixels, the card scaled and its contents did not. At the 400px it
 * was designed for the layout fitted with room to spare; on a 320px screen
 * the card became 171px tall while its contents still needed about 145 —
 * and the machine-readable line pushed out through the tricolour edge.
 *
 * Container query units solve it exactly rather than approximately: 3cqw is
 * three per cent of the card, at any card size. Breakpoints could not, because
 * the card's width follows its column, not the viewport.
 *
 * ⚠️ THE DESIGN WIDTH IS 400px. Every value below is (pixels ÷ 4) cqw, so a
 * measurement taken from the printed specification converts by dividing by
 * four.
 * ───────────────────────────────────────────────────────────────────────
 */
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
      className={`relative mx-auto aspect-[1.586] w-full max-w-[400px] overflow-hidden rounded-2xl ${className}`}
      style={{
        // ⚠️ Set in style rather than as a utility class, so it works
        // regardless of whether this project's Tailwind build ships the
        // container-query plugin. The cqw values below depend on it.
        containerType: "inline-size",
        background: "linear-gradient(158deg,#fffdf6 0%,#f5f1e4 60%,#efe9d8 100%)",
        boxShadow: "0 28px 55px -30px rgba(11,46,31,.55), inset 0 0 0 1px rgba(11,46,31,.08)",
      }}
      role="img"
      aria-label={issued ? "Votre carte de presse" : "Aperçu de votre carte de presse"}
    >
      {/* the shared rosette, not a fourth hand-copied one */}
      <Guilloche
        className="pointer-events-none absolute -right-[16cqw] -top-[20cqw] h-[64cqw] w-[64cqw] text-[var(--green-700)]"
        opacity={0.1}
      />

      {/* SPÉCIMEN, until it is real — promising a document that does not yet
          exist is worse than showing nothing. */}
      {!issued && (
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="rotate-[-16deg] text-[10.5cqw] font-extrabold tracking-[0.24em] text-[var(--green-900)] opacity-[0.07]">
            SPÉCIMEN
          </span>
        </span>
      )}

      <div className="relative flex h-full flex-col p-[5cqw]">
        {/* ── authority ── */}
        <div className="flex items-start justify-between gap-[3cqw] border-b-2 border-[var(--green-500)] pb-[2cqw]">
          <div className="min-w-0">
            <p className="text-[3cqw] font-extrabold tracking-[0.12em] text-[var(--green-700)]">
              MCACRP
            </p>
            <p className="mt-[0.5cqw] max-w-[42.5cqw] text-[1.5cqw] font-bold uppercase leading-[1.5] tracking-[0.09em] text-[var(--muted-fg)]">
              Ministère de la Culture, des Arts,
              <br />
              de la Communication et des
              <br />
              Relations avec le Parlement
            </p>
          </div>
          {/* text-end, not text-right: the card is not mirrored, but a logical
              property costs nothing and survives a future bilingual variant. */}
          <div className="flex-none text-end">
            <p dir="rtl" lang="ar" className="text-[2.5cqw] font-semibold leading-snug text-[var(--green-700)]">
              بطاقة صحفية
            </p>
            <p className="mt-[0.5cqw] text-[1.75cqw] font-bold uppercase tracking-[0.1em] text-[var(--green-700)]">
              Carte de presse
            </p>
          </div>
        </div>
        <div className="h-px w-full bg-[var(--gold-500)]/80" aria-hidden="true" />

        {/* ── holder ── */}
        <div className="mt-[3cqw] flex flex-1 gap-[4cqw]">
          <div
            className="h-[21.5cqw] w-[16.5cqw] flex-none overflow-hidden rounded-lg border"
            style={{ borderColor: "rgba(0,169,92,.35)", background: "var(--green-tint)" }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-[7cqw] w-[7cqw] text-[var(--green-600)] opacity-45" />
              </div>
            )}
          </div>

          <dl className="min-w-0 flex-1 space-y-[1.5cqw]">
            {rows.map((row) => (
              <div
                key={row.label}
                className="flex items-baseline gap-[2cqw] border-b border-dotted border-[var(--line)] pb-[0.5cqw]"
              >
                <dt className="w-[14.5cqw] flex-none text-[1.6cqw] font-bold uppercase tracking-[0.13em] text-[var(--green-700)]/75">
                  {row.label}
                </dt>
                <dd
                  className={`truncate text-[2.25cqw] ${
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

        {/* ── machine line ──
            ⚠️ This is the element that overflowed. It sits last in a flex
            column whose contents were fixed while the card shrank, so it was
            pushed through the tricolour edge at the foot. */}
        <p className="mt-[1.5cqw] overflow-hidden whitespace-nowrap font-mono text-[1.6cqw] tracking-[0.2em] text-[var(--muted-fg)]">
          MCACRP&lt;RIM&lt;PRESSE&lt;&lt;
          {(fullName || "").toUpperCase().replace(/\s+/g, "<") || "SPECIMEN"}
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-[1.5cqw]" aria-hidden="true">
        <i className="flex-1 bg-[var(--green-500)]" />
        <i className="flex-1 bg-[var(--gold-500)]" />
        <i className="flex-1 bg-[var(--red-500)]" />
      </div>
    </div>
  );
}
