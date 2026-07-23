// src/components/public/PressCard.tsx
// The specimen — the product as the hero. Every device here is borrowed from
// real credential printing: guilloche under the data, an engraved seal, a
// SPECIMEN watermark, an MRZ strip, microprint, and a slow holographic sheen.
// Pure CSS/SVG: no image, sharp at any size, a few kilobytes.

import { Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule } from "./patterns";

export function PressCard({ className = "" }: { className?: string }) {
  return (
    <div className={`press-card-wrap ${className}`}>
      <article
        className="press-card relative aspect-[1.586] w-full overflow-hidden rounded-[18px] bg-white"
        style={{
          boxShadow:
            "0 50px 90px -30px rgba(0,0,0,.6), 0 18px 40px -20px rgba(0,0,0,.4), inset 0 0 0 1px rgba(11,46,31,.08)",
        }}
        role="img"
        aria-label="Carte de presse HAPA — spécimen"
      >
        {/* guilloche rosette behind everything */}
        <Guilloche
          className="pointer-events-none absolute -right-16 -top-20 h-[280px] w-[280px] text-[var(--green-700)]"
          opacity={0.1}
        />
        {/* woven band across the data zone */}
        <GuillocheBand
          className="pointer-events-none absolute inset-x-0 bottom-10 h-16 text-[var(--green-600)]"
          opacity={0.13}
        />

        {/* SPECIMEN watermark */}
        <span
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <span className="-rotate-[24deg] text-[52px] font-extrabold tracking-[0.22em] text-[var(--green-900)] opacity-[0.045]">
            SPÉCIMEN
          </span>
        </span>

        <div className="relative z-10 flex h-full flex-col p-[5.5%]">
          {/* ── header ── */}
          <header className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2.5">
              <span className="mt-0.5 inline-flex items-center gap-[2px]" aria-hidden="true">
                <i className="h-[13px] w-[3px] rounded-full bg-[var(--green-500)]" />
                <i className="h-[13px] w-[3px] rounded-full bg-[var(--gold-500)]" />
                <i className="h-[13px] w-[3px] rounded-full bg-[var(--red-500)]" />
              </span>
              <div>
                <p className="text-[13px] font-extrabold leading-none tracking-[0.1em] text-[var(--green-800,#0f4a30)]">
                  HAPA
                </p>
                <p className="mt-1 max-w-[168px] text-[6px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[var(--muted-fg)]">
                  Haute Autorité de la Presse et de l&apos;Audiovisuel
                </p>
              </div>
            </div>
            <p
              dir="rtl"
              className="text-right text-[10.5px] font-semibold leading-[1.5] text-[var(--green-700)]"
            >
              السلطة العليا للصحافة
              <br />
              والسمعيات البصرية
            </p>
          </header>

          <div className="mt-2 h-[2px] w-full bg-[var(--green-500)]" aria-hidden="true" />
          <div className="h-px w-full bg-[var(--gold-500)]/80" aria-hidden="true" />

          {/* ── title ── */}
          <div className="mt-3 flex items-baseline justify-between gap-3">
            <h3 className="text-[15px] font-extrabold tracking-[0.06em] text-[var(--green-900)]">
              CARTE DE PRESSE
            </h3>
            <span dir="rtl" className="text-[13px] font-bold text-[var(--green-900)]">
              بطاقة صحفية
            </span>
          </div>

          {/* ── body ── */}
          <div className="mt-3 flex flex-1 gap-4">
            {/* portrait frame */}
            <div className="relative flex-none">
              <div
                className="flex h-[92px] w-[74px] items-center justify-center rounded-[7px] border border-[var(--green-500)]/35"
                style={{
                  background:
                    "linear-gradient(150deg, var(--green-tint), #ffffff 70%)",
                }}
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
                  stroke="var(--green-600)" strokeWidth="1.5" opacity="0.5"
                  strokeLinecap="round" aria-hidden="true">
                  <circle cx="12" cy="8" r="4" />
                  <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
                </svg>
              </div>
              <MicroprintRule
                className="mt-1 w-[74px] text-[var(--green-700)] opacity-45"
                text="HAPA·RIM·"
                repeat={4}
              />
            </div>

            {/* data fields */}
            <dl className="min-w-0 flex-1 space-y-[7px] pt-0.5">
              {[
                ["Nom / الاسم", "————————————"],
                ["Catégorie", "————————————"],
                ["N° de carte", "HAPA-2026-000000"],
                ["Validité", "31 / 12 / 2027"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2 border-b border-dotted border-[var(--line)] pb-[3px]">
                  <dt className="w-[70px] flex-none text-[6.5px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]/75">
                    {label}
                  </dt>
                  <dd className="truncate font-mono text-[9px] text-[var(--ink)]/80">{value}</dd>
                </div>
              ))}
            </dl>

            {/* seal */}
            <OfficialSeal
              className="h-[86px] w-[86px] flex-none self-center opacity-90"
              color="var(--gold-700)"
              id="card-seal"
            />
          </div>

          {/* ── MRZ ── */}
          <div className="mt-2 rounded-[3px] bg-[var(--green-900)]/[0.04] px-2 py-1">
            <p className="overflow-hidden whitespace-nowrap font-mono text-[7.5px] leading-[1.6] tracking-[0.24em] text-[var(--ink)]/45">
              P&lt;RIMHAPA&lt;&lt;PRESSE&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;
              <br />
              HAPA2026000000&lt;9MRT&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;&lt;2
            </p>
          </div>
        </div>

        {/* holographic sheen */}
        <span className="press-card-sheen pointer-events-none absolute inset-0" aria-hidden="true" />

        {/* national baseline */}
        <TricolorRule className="absolute inset-x-0 bottom-0" />
      </article>
    </div>
  );
}
