"use client";
// src/components/candidate/DecisionOutcome.tsx
//
// The formal notification of a decision — the single most consequential
// screen a candidate sees, and the one they may print or forward.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ THE APPLICATION'S STATUS IS NOT THE CARD'S STATUS.
//
// A dossier reaches CARD_ISSUED and stays there for ever. What happens to the
// card afterwards — suspension, withdrawal, expiry — is recorded on the CARD,
// and the application never moves again.
//
// So a holder whose card had been withdrawn was still being shown "Your card
// has been issued", in green, with the ministry's seal on it. The system was
// congratulating someone it had just sanctioned.
//
// This component now takes the card's status too, and the card's state wins:
// what a holder needs to know is what their credential is worth TODAY.
// ───────────────────────────────────────────────────────────────────────

import { useFormatter, useLocale, useTranslations } from "next-intl";
import {
  Check, X, IdCard, Scale, Gavel, ShieldAlert, ShieldOff, Clock, FileText,
} from "lucide-react";
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
 * ⚠️ THE MONOGRAM STAYS LATIN, THE LABEL TRANSLATES, AND ARABIC GETS NO
 * TRACKING — it would separate joined letterforms, and a seal is where that
 * would be most visible.
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
  field: string;
  accent: string;
  softBg: string;
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
 * Ash, for a card that simply reached its date.
 *
 * ⚠️ EXPIRY IS NOT A SANCTION. Every card expires; the holder did nothing
 * wrong. Burgundy here would tell someone they had been punished for the
 * passage of time.
 */
const LAPSED_PALETTE: Palette = {
  field: "linear-gradient(158deg, #2b3833 0%, #222d29 55%, #1b2420 100%)",
  accent: "#b9c4bd",
  softBg: "#f3f4f3",
  softInk: "#4b5563",
};

interface Outcome {
  palette: Palette;
  Icon: React.ElementType;
  /** Whether the notice carries a written reason. */
  hasReason: boolean;
  /** A grave "what next" — set apart in the sanction's own colour. */
  grave: boolean;
}

/** Keyed on the APPLICATION's status. */
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

/**
 * Keyed on the CARD's status, and these OVERRIDE the above.
 *
 * A withdrawn card is the holder's present reality; the acceptance that
 * preceded it is history.
 */
const CARD_OUTCOMES: Record<string, Outcome> = {
  SUSPENDED: {
    palette: PENDING_PALETTE, Icon: ShieldAlert, hasReason: true, grave: true,
  },
  REVOKED: {
    palette: REFUSED_PALETTE, Icon: ShieldOff, hasReason: true, grave: true,
  },
  EXPIRED: {
    palette: LAPSED_PALETTE, Icon: Clock, hasReason: false, grave: false,
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
  /**
   * The card's own status, when one exists.
   *
   * ⚠️ WITHOUT THIS the component cannot tell an issued card from a withdrawn
   * one: the application says CARD_ISSUED in both cases.
   */
  cardStatus,
  /** Why the card is in that state — the Authority's own words. */
  cardStatusReason,
  /** When the card's status last changed. */
  cardStatusChangedAt,
}: {
  status: ApplicationStatus;
  timeline: TimelineEntry[];
  applicationId?: number;
  cardStatus?: string | null;
  cardStatusReason?: string | null;
  cardStatusChangedAt?: string | null;
}) {
  const t = useTranslations("decision");
  const locale = useLocale();
  const format = useFormatter();
  const arabic = locale === "ar";

  /* ── which notice, and about what ── */

  // The card's state wins where it says something the application cannot.
  const cardOverride = cardStatus && CARD_OUTCOMES[cardStatus];
  const outcome = cardOverride ?? OUTCOMES[status];
  if (!outcome) return null;   // still in progress — the timeline tells that story

  /** The catalogue block: "card.REVOKED" or the application status's own. */
  const key = cardOverride ? `card.${cardStatus}` : status;

  const decisive = decisiveReason(timeline, status);

  // A card notice quotes the CARD's reason and date; an application notice
  // quotes the decision's.
  const reasonText = cardOverride ? cardStatusReason : decisive?.text;
  const dateSource = cardOverride ? cardStatusChangedAt : decisive?.at;

  const { palette: p, Icon } = outcome;
  const decidedOn = dateSource ? format.dateTime(new Date(dateSource), "long") : null;

  // A decision reference, as an administrative act carries.
  //
  // ⚠️ NOT translated and NOT mirrored: the holder may quote it in a letter
  // or read it down a telephone, and it must be the same string whichever
  // language they were reading.
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
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
          aria-hidden="true" />
        <Rosette className="rtl-mirror pointer-events-none absolute -left-28 -top-24 h-56 w-56 opacity-[0.07] sm:-left-24 sm:-top-20 sm:h-72 sm:w-72"
          stroke="#fff" />
        {/*
          ⚠️ SMALLER AND FURTHER OUT ON A PHONE.

          At 176px positioned 24px off the edge, the seal covered from x=175
          to the corner — and on a 327px panel the headline starts at 92. The
          impression sat behind the sentence telling someone their card had
          been withdrawn.

          On a desktop it is a corner ornament; the smaller size restores that
          relationship rather than removing the seal, which is part of what
          makes this read as a formal notice.
        */}
        <Seal
          className="rtl-mirror pointer-events-none absolute -right-14 top-1/2 h-32 w-32 -translate-y-1/2 opacity-[0.13] sm:-right-6 sm:h-44 sm:w-44"
          stroke={p.accent}
          label={t(`${key}.seal`)}
          arabic={arabic}
        />

        <div className="relative px-5 py-6 sm:px-8 sm:py-8">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.24em]"
              style={{ color: p.accent }}>
              {t(`${key}.kicker`)}
            </span>
            <span className="h-3 w-px" style={{ background: `${p.accent}66` }} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              {t("ministry")}
            </span>
          </div>

          <div className="mt-5 flex items-start gap-3.5 sm:gap-4">
            <span
              className="flex h-11 w-11 flex-none items-center justify-center rounded-xl sm:h-12 sm:w-12"
              style={{
                background: `${p.accent}22`,
                boxShadow: `inset 0 0 0 1.5px ${p.accent}`,
              }}
            >
              <Icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: p.accent }} />
            </span>

            <div className="min-w-0 flex-1">
              <h3 className="text-[19px] font-extrabold leading-tight text-white sm:text-[25px]">
                {t(`${key}.title`)}
              </h3>
              <p className="mt-2.5 max-w-2xl text-[13.5px] leading-relaxed text-white/70 sm:text-[14px]">
                {t(`${key}.lede`)}
              </p>
            </div>
          </div>

          {(reference || decidedOn) && (
            <dl className="mt-5 flex flex-wrap gap-x-6 gap-y-3 border-t pt-4 sm:mt-6 sm:gap-x-8"
              style={{ borderColor: "rgba(255,255,255,.14)" }}>
              {reference && (
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                    {t("reference")}
                  </dt>
                  {/* ⚠️ break-all: a reference is one unbreakable token
                      ("MCACRP/2026/00042") and it must wrap rather than push
                      the date column off the panel. */}
                  <dd dir="ltr" className="mt-0.5 break-all font-mono text-[12px] text-white/85 sm:text-[12.5px]">
                    {reference}
                  </dd>
                </div>
              )}
              {decidedOn && (
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                    {cardOverride ? t("changedOn") : t("decidedOn")}
                  </dt>
                  <dd className="mt-0.5 flex items-start gap-1.5 text-[12px] leading-snug text-white/85 sm:text-[12.5px]">
                    <Clock className="mt-0.5 h-3 w-3 flex-none" /> {decidedOn}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {/* ══ the reason, set apart as a considérant ══ */}
      {reasonText && outcome.hasReason && (
        <div className="px-5 py-5 sm:px-8 sm:py-6">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: p.softInk }}>
            <FileText className="h-3 w-3 flex-none" />
            {t(`${key}.reasonLabel`)}
          </p>

          <blockquote
            className="mt-3 rounded-e-xl border-s-[3px] px-4 py-3.5 sm:px-5 sm:py-4"
            style={{ borderColor: p.softInk, background: p.softBg }}
          >
            {/* ⚠️ dir="auto" — written by a member or by the Authority, in
                whichever language they use, and never translated.
                pre-wrap: the text carries its own line breaks, and rewrapping
                a legal reason changes how it reads. */}
            {/* ⚠️ break-words. pre-wrap keeps the line breaks the author
                typed but does nothing for one long token, and a refusal is
                exactly where an article or a document is cited by URL.

                This is the most consequential paragraph in the candidate
                space: it is what a rejection is argued against. It cannot be
                the text that runs off the edge of a phone. */}
            <p
              dir="auto"
              className="user-text whitespace-pre-wrap break-words text-[13.5px] leading-[1.75] text-[var(--ink)] sm:text-[14px]"
            >
              {reasonText}
            </p>
          </blockquote>
        </div>
      )}

      {/* ══ what happens next ══ */}
      <div
        className="flex items-start gap-3.5 border-t px-5 py-5 sm:gap-4 sm:px-8"
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
          <p className="text-[12px] font-extrabold uppercase leading-snug tracking-[0.1em] sm:text-[12.5px]"
            style={{ color: outcome.grave ? p.softInk : "var(--green-700)" }}>
            {t(`${key}.nextHeading`)}
          </p>
          <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed sm:text-[13.5px]"
            style={{ color: outcome.grave ? p.softInk : "var(--slate)" }}>
            {t.rich(`${key}.nextBody`, { b: (c) => <b className="font-bold">{c}</b> })}
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
