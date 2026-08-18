"use client";

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

/** An official seal impression. */
function Seal({ className, stroke, label }: {
  className?: string; stroke: string; label: string;
}) {
  return (
    <svg className={className} viewBox="0 0 200 200" fill="none" aria-hidden="true">
      <defs>
        <path id="seal-arc" d="M100,100 m-64,0 a64,64 0 1,1 128,0" />
      </defs>
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
      <text fill={stroke} fontSize="7.5" fontWeight="700" letterSpacing="1.6"
        textAnchor="middle" x="100" y="112">{label}</text>
    </svg>
  );
}

/* ══════════════ the outcomes ══════════════ */

interface Palette {
  /** The header's engraved field. */
  field: string;
  ink: string;          // text on the field
  accent: string;       // seal, rules, icon plate
  softBg: string;       // the reason block
  softInk: string;
}

const ACCEPTED_PALETTE: Palette = {
  field: "linear-gradient(158deg, var(--green-900) 0%, #0e3d29 55%, #0b3524 100%)",
  ink: "#ffffff",
  accent: "var(--gold-500)",
  softBg: "var(--green-tint)",
  softInk: "var(--green-700)",
};

// Deep institutional burgundy, not an alarm red: this is a formal refusal,
// not an error message.
const REFUSED_PALETTE: Palette = {
  field: "linear-gradient(158deg, #4a1416 0%, #5e1a1d 55%, #451214 100%)",
  ink: "#ffffff",
  accent: "#e8b4b6",
  softBg: "var(--red-tint)",
  softInk: "var(--red-700)",
};

const PENDING_PALETTE: Palette = {
  field: "linear-gradient(158deg, #4a3c0e 0%, #5e4c12 55%, #43370d 100%)",
  ink: "#ffffff",
  accent: "var(--gold-500)",
  softBg: "var(--gold-tint)",
  softInk: "var(--gold-700)",
};

interface Outcome {
  palette: Palette;
  Icon: React.ElementType;
  sealLabel: string;
  kicker: string;        // the administrative act
  title: string;
  lede: string;
  reasonLabel?: string;
  next?: { heading: string; text: string; grave?: boolean };
}

function outcomeFor(status: ApplicationStatus): Outcome | null {
  switch (status) {
    case "ACCEPTED":
      return {
        palette: ACCEPTED_PALETTE, Icon: Check, sealLabel: "ACCORDÉE",
        kicker: "Notification de décision",
        title: "Votre demande a été acceptée",
        lede: "La commission d'examen a reconnu votre qualité de journaliste "
            + "professionnel. Votre carte de presse sera éditée par le MCACRP ",
        reasonLabel: "Observation de la commission",
        next: {
          heading: "Suite de la procédure",
          text: "Votre carte sera établie et vous serez informé par e-mail dès "
              + "qu'elle sera disponible. Aucune démarche de votre part n'est "
              + "nécessaire.",
        },
      };

    case "CARD_ISSUED":
      return {
        palette: ACCEPTED_PALETTE, Icon: IdCard, sealLabel: "ÉMISE",
        kicker: "Carte de presse",
        title: "Votre carte a été éditée",
        lede: "Votre carte de presse a été établie par le MCACRP et "
            + "porte un numéro officiel.",
        next: {
          heading: "Retrait de votre carte",
          text: "Les modalités de retrait vous ont été communiquées par e-mail.",
        },
      };

    case "REJECTED":
      return {
        palette: REFUSED_PALETTE, Icon: X, sealLabel: "REFUSÉE",
        kicker: "Notification de décision",
        title: "Votre demande n'a pas été retenue",
        lede: "Après examen de votre dossier, la commission n'a pas pu donner "
            + "une suite favorable à votre demande pour la présente session.",
        reasonLabel: "Motif de la décision",
        next: {
          heading: "Votre droit de réclamation",
          text: "Vous pouvez contester cette décision. Une réclamation peut être "
              + "déposée depuis votre espace pendant la phase de réclamation de "
              + "la session. Elle sera examinée par un membre de la commission "
              + "DIFFÉRENT de celui ayant rendu la présente décision.",
          grave: true,
        },
      };

    case "UNDER_RECLAMATION":
      return {
        palette: PENDING_PALETTE, Icon: Gavel, sealLabel: "EN COURS",
        kicker: "Réclamation",
        title: "Votre réclamation est en cours d'examen",
        lede: "Votre contestation a été enregistrée et transmise à un membre de "
            + "la commission différent de celui ayant rendu la décision initiale.",
        next: {
          heading: "Suite de la procédure",
          text: "Vous serez informé par e-mail de la décision définitive, qui "
              + "clôturera l'instruction de votre dossier pour cette session.",
        },
      };

    case "FINAL_REJECTION":
      return {
        palette: REFUSED_PALETTE, Icon: Scale, sealLabel: "DÉFINITIVE",
        kicker: "Décision définitive",
        title: "Votre réclamation n'a pas abouti",
        lede: "Après réexamen par un second membre de la commission, la décision "
            + "de rejet est confirmée. Cette décision met fin à l'instruction de "
            + "votre dossier pour la présente session.",
        reasonLabel: "Motif de la décision définitive",
        next: {
          heading: "Prochaine session",
          text: "Vous pourrez déposer une nouvelle demande lors d'une prochaine "
              + "session de candidature. Les conditions et le calendrier seront "
              + "publiés sur le site de le MCACRP.",
        },
      };

    default:
      return null;      // still in progress — the timeline tells that story
  }
}

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
  const outcome = outcomeFor(status);
  if (!outcome) return null;

  const decisive = decisiveReason(timeline, status);
  const { palette: p, Icon } = outcome;

  const decidedOn = decisive?.at
    ? new Date(decisive.at).toLocaleDateString("fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  // A decision reference, as an administrative act carries.
  const reference = applicationId && decisive?.at
    ? `MCACRP/${new Date(decisive.at).getFullYear()}/${String(applicationId).padStart(5, "0")}`
    : null;

  return (
    <section
      className="overflow-hidden rounded-2xl bg-white shadow-[0_24px_60px_-38px_rgba(11,46,31,.55)]"
      style={{ border: "1px solid var(--line)" }}
      aria-label="Notification de décision"
    >
      {/* ══ engraved header ══ */}
      <div className="relative overflow-hidden" style={{ background: p.field }}>
        {/* security print */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
          aria-hidden="true" />
        <Rosette className="pointer-events-none absolute -left-24 -top-20 h-72 w-72 opacity-[0.07]"
          stroke="#fff" />
        <Seal className="pointer-events-none absolute -right-6 top-1/2 h-44 w-44 -translate-y-1/2 opacity-[0.13]"
          stroke={p.accent} label={outcome.sealLabel} />

        <div className="relative px-7 py-7 sm:px-8 sm:py-8">
          {/* institutional line */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-[10px] font-extrabold uppercase tracking-[0.24em]"
              style={{ color: p.accent }}>
              {outcome.kicker}
            </span>
            <span className="h-3 w-px" style={{ background: `${p.accent}66` }} aria-hidden="true" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-white/45">
              Ministère de la Culture, des Arts,
de la Communication et des
Relations avec le Parlement
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
                {outcome.title}
              </h3>
              <p className="mt-2.5 max-w-2xl text-[14px] leading-relaxed text-white/70">
                {outcome.lede}
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
                    Référence
                  </dt>
                  <dd className="mt-0.5 font-mono text-[12.5px] text-white/85">
                    {reference}
                  </dd>
                </div>
              )}
              {decidedOn && (
                <div>
                  <dt className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/40">
                    Rendue le
                  </dt>
                  <dd className="mt-0.5 flex items-center gap-1.5 text-[12.5px] text-white/85">
                    <Clock className="h-3 w-3" /> {decidedOn}
                  </dd>
                </div>
              )}
            </dl>
          )}
        </div>
      </div>

      {/* ══ the reason, set apart as a considérant ══ */}
      {decisive?.text && outcome.reasonLabel && (
        <div className="px-7 py-6 sm:px-8">
          <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.18em]"
            style={{ color: p.softInk }}>
            <FileText className="h-3 w-3" />
            {outcome.reasonLabel}
          </p>

          <blockquote
            className="mt-3 rounded-r-xl border-l-[3px] px-5 py-4"
            style={{ borderColor: p.softInk, background: p.softBg }}
          >
            {/* pre-wrap: the justification carries its own line breaks, and
                rewrapping a legal reason changes how it reads. */}
            <p className="whitespace-pre-wrap text-[14px] leading-[1.75] text-[var(--ink)]">
              {decisive.text}
            </p>
          </blockquote>
        </div>
      )}

      {/* ══ what happens next ══ */}
      {outcome.next && (
        <div
          className="flex items-start gap-4 border-t px-7 py-5 sm:px-8"
          style={{
            borderColor: "var(--line)",
            background: outcome.next.grave ? p.softBg : "#fbfcfb",
          }}
        >
          <span
            className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
            style={{
              background: outcome.next.grave ? p.softInk : "var(--green-tint)",
              color: outcome.next.grave ? "#fff" : "var(--green-700)",
            }}
          >
            {outcome.next.grave ? <ShieldAlert className="h-4 w-4" />
                                : <Check className="h-4 w-4" />}
          </span>

          <div className="min-w-0">
            <p className="text-[12.5px] font-extrabold uppercase tracking-[0.1em]"
              style={{ color: outcome.next.grave ? p.softInk : "var(--green-700)" }}>
              {outcome.next.heading}
            </p>
            <p className="mt-1.5 max-w-3xl text-[13.5px] leading-relaxed"
              style={{ color: outcome.next.grave ? p.softInk : "var(--slate)" }}>
              {outcome.next.text}
            </p>
          </div>
        </div>
      )}

      {/* ══ national baseline ══ */}
      <div className="flex h-1.5" aria-hidden="true">
        <i className="flex-1 bg-[var(--green-500)]" />
        <i className="flex-1 bg-[var(--gold-500)]" />
        <i className="flex-1 bg-[var(--red-500)]" />
      </div>
    </section>
  );
}
