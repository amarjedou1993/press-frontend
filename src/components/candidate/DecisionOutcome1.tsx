"use client";
// src/components/candidate/DecisionOutcome.tsx
//
// The formal notification of a decision — the single most consequential
// screen a candidate sees, and the one they may print or forward.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ THE REASON IS FREE TEXT IN AN UNKNOWN LANGUAGE.
//
// A commission member writes their justification in French or in Arabic —
// their choice, and the system never translates it. So an Arabic reader may
// open a French refusal, and the reverse.
//
// `dir="auto"` is the only correct handling: the browser reads the first
// strong directional character and sets direction from it. Without it, an
// Arabic paragraph inside an LTR block renders with its punctuation at the
// wrong end — on the grounds of a refusal, which is not a place for a
// rendering fault.
//
// The surrounding notice IS translated: the act, the heading, the procedure
// that follows. Only the member's own words are left as written.
// ───────────────────────────────────────────────────────────────────────

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Check, X, IdCard, Scale, Gavel, ShieldAlert, Clock, FileText } from "lucide-react";
import type { ApplicationStatus, TimelineEntry } from "@/lib/api/applications";

/* ══════════════ engraving ══════════════ */

/** A guilloche rosette — the lathe pattern used on certificates and notes. */
function Rosette({ className, stroke }: { className?: string; stroke: string }) {
  return (
    <svg className={className} viewBox="0 0 400 400" fill="none" aria-hidden="true">
      <g stroke={stroke} strokeWidth="0.6">
        {Array.from({ length: 36 }).map((_, i) => (
          <ellipse key={i} cx="200" cy="200" rx="185" ry="58"
            transform={`rotate(${(i * 180) / 36} 200 200)`} />
        ))}
      </g>
    </svg>
  );
}

/**
 * An official seal impression.
 *
 * ⚠️ THE MONOGRAM STAYS LATIN, THE LABEL TRANSLATES. "MCACRP" is an emblem —
 * the same object as the coat of arms — while "ACCORDÉE" is a word describing
 * what happened, and an Arabic reader should read it.
 *
 * And letterSpacing goes to ZERO for Arabic: tracking separates joined
 * letterforms, and a seal is exactly where that would be most visible.
 */
function Seal({ className, stroke, label, arabic }: {
  className?: string; stroke: string; label: string; arabic: boolean;
}) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <g stroke={stroke} fill="none">
        <circle cx="100" cy="100" r="88" strokeWidth="2.5" />
        <circle cx="100" cy="100" r="80" strokeWidth="0.8" />
        <circle cx="100" cy="100" r="60" strokeWidth="0.8" strokeDasharray="3 4" />
        {Array.from({ length: 48 }).map((_, i) => (
          <line key={i} x1="100" y1="12" x2="100" y2="22" strokeWidth="1.2"
            transform={`rotate(${i * 7.5} 100 100)`} />
        ))}
      </g>
      <text fill={stroke} fontSize="13" fontWeight="800" letterSpacing="3"
        textAnchor="middle" x="100" y="96">MCACRP</text>
      <text
        fill={stroke}
        fontSize={arabic ? "9" : "7.5"}
        fontWeight="700"
        letterSpacing={arabic ? "0" : "1.6"}
        textAnchor="middle" x="100" y={arabic ? "114" : "112"}
        direction={arabic ? "rtl" : "ltr"}
      >
        {label}
      </text>
    </svg>
  );
}

/* ══════════════ the outcomes ══════════════ */

interface Palette {
  /** The header's engraved field. */
  field: string;
  accent: string;       // seal, rules, icon plate
  softBg: string;       // the reason block
  softInk: string;
}

const ACCEPTED_PALETTE: Palette = {
  field: "linear-gradient(158deg, var(--green-900) 0%, #0e3d29 55%, #0b3524 100%)",
  accent: "var(--gold-500)",
  softBg: "var(--green-tint)",
  softInk: "var(--green-700)",
};

// Deep institutional burgundy, not an alarm red: this is a formal refusal,
// not an error message.
const REFUSED_PALETTE: Palette = {
  field: "linear-gradient(158deg, #4a1416 0%, #5e1a1d 55%, #451214 100%)",
  accent: "#e8b4b6",
  softBg: "var(--red-tint)",
  softInk: "var(--red-700)",
};

const PENDING_PALETTE: Palette = {
  field: "linear-gradient(158deg, #4a3c0e 0%, #5e4c12 55%, #43370d 100%)",
  accent: "var(--gold-500)",
  softBg: "var(--gold-tint)",
  softInk: "var(--gold-700)",
};

/**
 * Only the VISUAL shape lives here now; every word comes from the catalogue,
 * under the status's own name.
 */
interface Outcome {
  palette: Palette;
  Icon: React.ElementType;
  /** Whether the notice carries the member's written reason. */
  hasReason: boolean;
  /** A grave "what next" — the objection right, set apart. */
  grave: boolean;
}

const OUTCOMES: Partial<Record<ApplicationStatus, Outcome>> = {
  ACCEPTED: {
    palette: ACCEPTED_PALETTE, Icon: Check, hasReason: true, grave: false,
  },
  CARD_ISSUED: {
    palette: ACCEPTED_PALETTE, Icon: IdCard, hasReason: false, grave: false,
  },
  REJECTED: {
    palette: REFUSED_PALETTE, Icon: X, hasReason: true, grave: true,
  },
  UNDER_RECLAMATION: {
    palette: PENDING_PALETTE, Icon: Gavel, hasReason: false, grave: false,
  },
  FINAL_REJECTION: {
    palette: REFUSED_PALETTE, Icon: Scale, hasReason: true, grave: false,
  },
};

/** The reason recorded on the transition that produced this status. */
function decisiveReason(timeline: TimelineEntry[], status: ApplicationStatus) {
  for (let i = timeline.length - 1; i >= 0; i--) {
    const entry = timeline[i];
    if (entry.toStatus === status && entry.justification?.trim()) {
      return { text: entry.justification.trim(), at: entry.at };
    }
  }
  const last = timeline[timeline.length - 1];
  return last ? { text: null, at: last.at } : null;
}

/* ══════════════ the notice ══════════════ */

export function DecisionOutcome({
  status,
  timeline,
  applicationId,
}: {
  status: ApplicationStatus;
  timeline: TimelineEntry[];
  applicationId?: number;
}) {
  const t = useTranslations("decision");
  const locale = useLocale();
  const format = useFormatter();
  const arabic = locale === "ar";

  const outcome = OUTCOMES[status];
  if (!outcome) return null;   // still in progress — the timeline tells that story

  const decisive = decisiveReason(timeline, status);
  const { palette: p, Icon } = outcome;

  const decidedOn = decisive?.at
    ? format.dateTime(new Date(decisive.at), "long")
    : null;

  // A decision reference, as an administrative act carries.
  //
  // ⚠️ NOT translated and NOT mirrored. It is an identifier: the candidate may
  // quote it in a letter or read it down a telephone, and it must be the same
  // string whichever language they were reading.
  const reference = applicationId && decisive?.at
    ? `MCACRP/${new Date(decisive.at).getFullYear()}/${String(applicationId).padStart(5, "0")}`
    : null;

  return (
    <section
      className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-38px_rgba(11,46,31,.55)]"
      style={{ border: "1px solid var(--line)" }}
      aria-label={t("ariaLabel")}
    >
      {/* ══ engraved header ══ */}
      <div className="relative overflow-hidden" style={{ background: p.field }}>
        {/* security print */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
          aria-hidden="true" />
        <Rosette className="rtl-mirror pointer-events-none absolute -left-24 -top-20 h-72 w-72 opacity-[0.07]"
          stroke="#fff" />
        <Seal
          className="rtl-mirror pointer-events-none absolute -right-6 top-1/2 h-44 w-44 -translate-y-1/2 opacity-[0.13]"
          stroke={p.accent}
          label={t(`${status}.seal`)}
          arabic={arabic}
        />

        <div className="relative px-7 py-7 sm:px-8 sm:py-8">
          {/* institutional line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.24em]"
              style={{ color: p.accent }}>
              {t(`${status}.kicker`)}
            </span>
            <span className="h-3 w-px" style={{ background: `${p.accent}66` }} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {t("ministry")}
            </span>
          </div>

          <div className="mt-5 flex items-start gap-4">
            <span
              className="flex h-12 w-12 flex-none items-center justify-center rounded-xl"
              style={{
                background: `${p.accent}22`,
                boxShadow: `inset 0 0 0 1.5px ${p.accent}`,
              }}
            >
              <Icon className="h-6 w-6" style={{ color: p.accent }} />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-[22px] font-extrabold leading-tight text-white sm:text-[25px]">
                {t(`${status}.title`)}
              </h3>
              <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-white/70">
                {t(`${status}.lede`)}
              </p>
            </div>
          </div>

          {/* the act's identifiers */}
          {(reference || decidedOn) && (
            <dl className="mt-6 flex flex-wrap gap-x-8 gap-y-3 border-t pt-4"
              style={{ borderColor: "rgba(255,255,255,.14)" }}>
              {reference && (
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                    {t("reference")}
                  </dt>
                  <dd dir="ltr" className="mt-0.5 font-mono text-[12.5px] text-white/85">
                    {reference}
                  </dd>
                </div>
              )}
              {decidedOn && (
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                    {t("decidedOn")}
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/85">
                    <Clock className="h-3 w-3 flex-none" /> {decidedOn}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {/* ══ the reason, set apart as a considérant ══ */}
      {decisive?.text && outcome.hasReason && (
        <div className="px-7 py-6 sm:px-8">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: p.softInk }}>
            <FileText className="h-3 w-3 flex-none" />
            {t(`${status}.reasonLabel`)}
          </p>

          <blockquote
            className="mt-3 rounded-e-xl border-s-[3px] px-5 py-4"
            style={{ borderColor: p.softInk, background: p.softBg }}
          >
            {/* ⚠️ dir="auto" — the member wrote this in French or in Arabic,
                and the system does not translate an administrative act.
                pre-wrap: the justification carries its own line breaks, and
                rewrapping a legal reason changes how it reads. */}
            <p
              dir="auto"
              className="user-text whitespace-pre-wrap text-[14px] leading-[1.75] text-[var(--ink)]"
            >
              {decisive.text}
            </p>
          </blockquote>
        </div>
      )}

      {/* ══ what happens next ══ */}
      <div
        className="flex items-start gap-4 border-t px-7 py-5 sm:px-8"
        style={{
          borderColor: "var(--line)",
          background: outcome.grave ? p.softBg : "#fbfcfb",
        }}
      >
        <span
          className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
          style={{
            background: outcome.grave ? p.softInk : "var(--green-tint)",
            color: outcome.grave ? "#fff" : "var(--green-700)",
          }}
        >
          {outcome.grave ? <ShieldAlert className="h-4 w-4" />
                         : <Check className="h-4 w-4" />}
        </span>

        <div className="min-w-0">
          <p className="text-[12.5px] font-extrabold uppercase tracking-[0.1em]"
            style={{ color: outcome.grave ? p.softInk : "var(--green-700)" }}>
            {t(`${status}.nextHeading`)}
          </p>
          <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed"
            style={{ color: outcome.grave ? p.softInk : "var(--slate)" }}>
            {t.rich(`${status}.nextBody`, { b: (c) => <b className="font-bold">{c}</b> })}
          </p>
        </div>
      </div>

      {/* ══ national baseline ══ */}
      <div className="flex h-1.5" aria-hidden="true">
        <i className="flex-1 bg-[var(--green-500)]" />
        <i className="flex-1 bg-[var(--gold-500)]" />
        <i className="flex-1 bg-[var(--red-500)]" />
      </div>
    </section>
  );
}
