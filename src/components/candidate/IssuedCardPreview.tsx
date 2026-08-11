"use client";
// src/components/candidate/IssuedCardPreview.tsx
// The thing that was actually being decided.
//
// After an acceptance, a status card is a thin reward for a process that took
// weeks. This shows the credential itself — the candidate's own name and
// photograph in the shape the card will take — so the outcome is the OBJECT,
// not a sentence about the object.
//
// Shown only on ACCEPTED and CARD_ISSUED. Marked SPÉCIMEN until the card is
// actually issued, because promising a document that does not yet exist is
// worse than showing nothing.

import { User } from "lucide-react";
import { useAuthenticatedFile } from "@/lib/api/files";

export function IssuedCardPreview({
  fullName,
  nni,
  categoryLabel,
  issued,
  cardNumber,
  validUntil,
}: {
  fullName: string;
  nni?: string | null;
  categoryLabel?: string | null;
  /** True once the card really exists (CARD_ISSUED). */
  issued: boolean;
  cardNumber?: string | null;
  validUntil?: string | null;
}) {
  const { url: photoUrl } = useAuthenticatedFile("/api/me/photo");
  const dash = "—————————";

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex items-center gap-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
          {issued ? "Votre carte de presse" : "Aperçu de votre carte"}
        </p>
        <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
      </div>

      <div
        className="relative mt-4 aspect-[1.586] w-full overflow-hidden rounded-2xl"
        style={{
          background: "linear-gradient(158deg,#fffdf6 0%,#f5f1e4 60%,#efe9d8 100%)",
          boxShadow: "0 28px 55px -30px rgba(11,46,31,.55), inset 0 0 0 1px rgba(11,46,31,.08)",
        }}
        role="img"
        aria-label={issued ? "Votre carte de presse" : "Aperçu de votre carte de presse"}
      >
        {/* guilloche */}
        <svg className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 opacity-[0.09]"
          viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <g stroke="var(--green-700)" strokeWidth="0.7">
            {Array.from({ length: 30 }).map((_, i) => (
              <ellipse key={i} cx="200" cy="200" rx="180" ry="58"
                transform={`rotate(${(i * 180) / 30} 200 200)`} />
            ))}
          </g>
        </svg>

        {/* SPÉCIMEN, until it is real */}
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
              <p dir="rtl" className="text-[10px] font-semibold leading-snug text-[var(--green-700)]">
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
              {[
                ["Nom", fullName || dash, false],
                ["NNI", nni || dash, true],
                ["Catégorie", categoryLabel || dash, false],
                ["N° carte", cardNumber || (issued ? dash : "à l'édition"), true],
                ["Validité", validUntil || (issued ? dash : "à l'édition"), true],
              ].map(([label, value, mono]) => (
                <div key={label as string}
                  className="flex items-baseline gap-2 border-b border-dotted border-[var(--line)] pb-[2px]">
                  <dt className="w-[58px] flex-none text-[6.5px] font-bold uppercase tracking-[0.13em] text-[var(--green-700)]/75">
                    {label as string}
                  </dt>
                  <dd className={`truncate text-[9px] text-[var(--ink)]/85 ${mono ? "font-mono" : "font-semibold"}`}>
                    {value as string}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          {/* ── machine line ── */}
          <p className="mt-1.5 overflow-hidden whitespace-nowrap font-mono text-[6.5px] tracking-[0.2em] text-[var(--muted-fg)]">
            MCACPR&lt;RIM&lt;PRESSE&lt;&lt;{(fullName || "").toUpperCase().replace(/\s+/g, "<") || "SPECIMEN"}
          </p>
        </div>

        {/* national baseline */}
        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </div>

      <p className="mt-4 text-[12px] leading-relaxed text-[var(--slate)]">
        {issued
          ? "Votre carte porte un numéro officiel et engage le MCACRP."
          : "Aperçu indicatif. La carte définitive est éditée par le MCACPR, avec un "
            + "numéro officiel et une date de validité."}
      </p>
    </div>
  );
}
