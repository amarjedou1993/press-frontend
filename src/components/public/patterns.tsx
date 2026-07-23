// src/components/public/patterns.tsx
// The visual vocabulary of official documents, as pure SVG server components:
// guilloche rosettes, an engraved seal, microprint rules, paper grain.
// No images, no client JS — a few kilobytes that make the page look printed
// rather than templated, and stay sharp at any zoom on any connection.

/* ── Guilloche rosette ───────────────────────────────────────────
   The interference pattern on banknotes and certificates: many ellipses
   rotated about a common centre. Mathematically generated, so it costs
   ~1KB and scales infinitely. */
export function Guilloche({
  className = "",
  rings = 42,
  stroke = "currentColor",
  opacity = 0.5,
}: {
  className?: string;
  rings?: number;
  stroke?: string;
  opacity?: number;
}) {
  return (
    <svg viewBox="0 0 400 400" className={className} aria-hidden="true" fill="none">
      <g stroke={stroke} strokeWidth="0.5" opacity={opacity}>
        {Array.from({ length: rings }).map((_, i) => (
          <ellipse
            key={i}
            cx="200"
            cy="200"
            rx="185"
            ry="62"
            transform={`rotate(${(i * 180) / rings} 200 200)`}
          />
        ))}
      </g>
      <g stroke={stroke} strokeWidth="0.4" opacity={opacity * 0.7}>
        {Array.from({ length: Math.round(rings / 2) }).map((_, i) => (
          <ellipse
            key={i}
            cx="200"
            cy="200"
            rx="120"
            ry="118"
            transform={`rotate(${(i * 360) / (rings / 2)} 200 200)`}
          />
        ))}
      </g>
    </svg>
  );
}

/* ── Guilloche wave band ─────────────────────────────────────────
   The horizontal woven band across a certificate. Layered sine paths. */
export function GuillocheBand({
  className = "",
  stroke = "currentColor",
  lines = 7,
  opacity = 0.35,
}: {
  className?: string;
  stroke?: string;
  lines?: number;
  opacity?: number;
}) {
  return (
    <svg
      viewBox="0 0 1200 80"
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
      fill="none"
    >
      <g stroke={stroke} strokeWidth="0.7" opacity={opacity}>
        {Array.from({ length: lines }).map((_, i) => {
          const y = 12 + i * 8;
          const amp = 16 - i * 1.2;
          return (
            <path
              key={i}
              d={`M0 ${y} C 100 ${y - amp}, 200 ${y + amp}, 300 ${y} S 500 ${y - amp}, 600 ${y} S 800 ${y + amp}, 900 ${y} S 1100 ${y - amp}, 1200 ${y}`}
            />
          );
        })}
      </g>
    </svg>
  );
}

/* ── Official seal ───────────────────────────────────────────────
   Engraved concentric rings, text following a circular path, the
   national mark at the centre. The device that says "issued by an
   authority" faster than any words. */
export function OfficialSeal({
  className = "",
  color = "var(--gold-500)",
  id = "seal",
}: {
  className?: string;
  color?: string;
  id?: string;
}) {
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <defs>
        <path id={`${id}-top`} d="M100,100 m-74,0 a74,74 0 1,1 148,0" fill="none" />
        <path id={`${id}-bottom`} d="M100,100 m-64,0 a64,64 0 1,0 128,0" fill="none" />
      </defs>
      <g stroke={color} fill="none">
        <circle cx="100" cy="100" r="92" strokeWidth="1.2" opacity="0.55" />
        <circle cx="100" cy="100" r="86" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="78" strokeWidth="0.8" opacity="0.5" />
        <circle cx="100" cy="100" r="52" strokeWidth="1.6" strokeDasharray="3 4" opacity="0.75" />
        {/* radiating engraved ticks */}
        {Array.from({ length: 60 }).map((_, i) => (
          <line
            key={i}
            x1="100" y1="16" x2="100" y2="23"
            strokeWidth="0.9"
            opacity={i % 5 === 0 ? 0.9 : 0.35}
            transform={`rotate(${i * 6} 100 100)`}
          />
        ))}
      </g>
      <text fill={color} fontSize="11.5" fontWeight="700" letterSpacing="3.4">
        <textPath href={`#${id}-top`} startOffset="50%" textAnchor="middle">
          HAUTE AUTORITÉ DE LA PRESSE
        </textPath>
      </text>
      <text fill={color} fontSize="10.5" fontWeight="600" letterSpacing="2.6" opacity="0.85">
        <textPath href={`#${id}-bottom`} startOffset="50%" textAnchor="middle">
          RÉPUBLIQUE ISLAMIQUE DE MAURITANIE
        </textPath>
      </text>
      {/* national mark at centre */}
      <g transform="translate(100 100)">
        <rect x="-13" y="-11" width="7" height="22" rx="3.5" fill="var(--green-500)" />
        <rect x="-3.5" y="-11" width="7" height="22" rx="3.5" fill="var(--gold-500)" />
        <rect x="6" y="-11" width="7" height="22" rx="3.5" fill="var(--red-500)" />
      </g>
    </svg>
  );
}

/* ── Microprint rule ─────────────────────────────────────────────
   The hairline of repeated micro-text along a document's edge. Real
   security printing; here it doubles as a section divider. */
export function MicroprintRule({
  text = "HAPA · ACCRÉDITATION PRESSE · RÉPUBLIQUE ISLAMIQUE DE MAURITANIE · ",
  className = "",
  repeat = 6,
}: {
  text?: string;
  className?: string;
  repeat?: number;
}) {
  return (
    <div
      className={`overflow-hidden whitespace-nowrap font-mono text-[6.5px] leading-none tracking-[0.3em] ${className}`}
      aria-hidden="true"
    >
      {text.repeat(repeat)}
    </div>
  );
}

/* ── Paper grain ─────────────────────────────────────────────────
   A turbulence filter: the faint tooth of printed stock. Keeps large
   dark areas from looking like flat digital fills. */
export function Grain({ className = "", opacity = 0.5 }: { className?: string; opacity?: number }) {
  return (
    <svg className={className} aria-hidden="true">
      <filter id="grain-filter">
        <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="3" stitchTiles="stitch" />
        <feColorMatrix type="saturate" values="0" />
      </filter>
      <rect width="100%" height="100%" filter="url(#grain-filter)" opacity={opacity} />
    </svg>
  );
}

/* ── Tricolour rule ──────────────────────────────────────────────
   The national palette as a structural element, used to open and close
   major sections. */
export function TricolorRule({ className = "", thin = false }: { className?: string; thin?: boolean }) {
  return (
    <div className={`flex ${thin ? "h-[3px]" : "h-1.5"} w-full overflow-hidden ${className}`} aria-hidden="true">
      <i className="flex-1 bg-[var(--green-500)]" />
      <i className="flex-1 bg-[var(--gold-500)]" />
      <i className="flex-1 bg-[var(--red-500)]" />
    </div>
  );
}

/* ── Section overline ────────────────────────────────────────────
   Numbered label + rule: the typographic signature of an official
   document, and what gives the page its editorial rhythm. */
export function Overline({
  index,
  children,
  tone = "dark",
}: {
  index?: string;
  children: React.ReactNode;
  tone?: "dark" | "light";
}) {
  const color = tone === "light" ? "text-[var(--gold-500)]" : "text-[var(--green-700)]";
  const rule = tone === "light" ? "bg-white/20" : "bg-[var(--line)]";
  return (
    <div className="flex items-center gap-4">
      {index && (
        <span className={`font-mono text-[11px] font-bold ${color}`}>{index}</span>
      )}
      <span className={`text-[10.5px] font-bold uppercase tracking-[0.22em] ${color}`}>
        {children}
      </span>
      <span className={`h-px flex-1 ${rule}`} aria-hidden="true" />
    </div>
  );
}
