"use client";
// src/components/candidate/RequirementChecklist.tsx
//
// What a dossier still needs, and what it already has.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ THE BLOCKERS ARE TRANSLATED FROM THEIR REASON, NOT DISPLAYED.
//
// The server sends both a `reason` constant and a finished sentence. The
// sentence is French — and one of them embeds a date formatted with
// Locale.FRENCH:
//
//     "La date limite de dépôt était le 15 mars 2026."
//
// Dropped into an Arabic screen that is a French date inside an Arabic
// paragraph. So the reason is the key, and `deadline` arrives as a DATE which
// this component formats in the reader's locale.
//
// The requirement rows show ONE label — the reader's. The French version
// printed the Arabic underneath as an ornament; once the page is genuinely
// available in Arabic that is redundant, and a little condescending.
// ───────────────────────────────────────────────────────────────────────

import { useFormatter, useLocale, useTranslations } from "next-intl";
import { Check, AlertCircle, Upload, Link2, Sparkles } from "lucide-react";
import type {
  ReadinessResponse, RequirementResponse, DocumentType,
} from "@/lib/api/applications";

/* ── the progress ring ── */
function ProgressRing({ satisfied, total }: { satisfied: number; total: number }) {
  const pct = total === 0 ? 0 : satisfied / total;
  const R = 26;
  const C = 2 * Math.PI * R;
  const complete = satisfied === total && total > 0;

  return (
    <div className="relative h-[60px] w-[60px] flex-none sm:h-[68px] sm:w-[68px]">
      {/* ⚠️ NOT mirrored under RTL. A progress ring is a gauge, not a
          sentence: it fills clockwise in both directions, the way a clock
          face or a fuel gauge does. */}
      <svg viewBox="0 0 68 68" className="h-full w-full -rotate-90">
        <circle cx="34" cy="34" r={R} fill="none" stroke="var(--line)" strokeWidth="6" />
        <circle
          cx="34" cy="34" r={R} fill="none"
          stroke={complete ? "var(--green-500)" : "var(--gold-500)"}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={C} strokeDashoffset={C * (1 - pct)}
          style={{ transition: "stroke-dashoffset .6s cubic-bezier(.16,1,.3,1)" }}
        />
      </svg>
      <span className="absolute inset-0 flex flex-col items-center justify-center">
        {complete ? (
          <Check className="h-5 w-5 text-[var(--green-600)] sm:h-6 sm:w-6" />
        ) : (
          <>
            <span className="font-mono text-[14px] font-extrabold leading-none text-[var(--green-900)] sm:text-[15px]">
              {satisfied}
            </span>
            <span className="font-mono text-[10px] font-semibold text-[var(--muted-fg)]">
              / {total}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

function RequirementRow({
  requirement, onAdd,
}: {
  requirement: RequirementResponse;
  onAdd?: (docType: DocumentType) => void;
}) {
  const t = useTranslations("checklist");
  const locale = useLocale();
  const { satisfied, labelFr, labelAr, required, provided, isFile, docType } = requirement;

  // ONE label — the reader's. The other was ornament.
  const label = (locale === "ar" ? labelAr : labelFr) ?? labelFr;

  return (
    <div
      className="group flex items-center gap-2.5 rounded-xl px-2.5 py-2.5 transition-colors sm:gap-3 sm:px-3 sm:py-3"
      style={{ background: satisfied ? "var(--green-tint)" : "transparent" }}
    >
      <span
        className="flex h-7 w-7 flex-none items-center justify-center rounded-lg transition-colors"
        style={{
          background: satisfied ? "var(--green-500)" : "#eef1ef",
          color: satisfied ? "#fff" : "var(--muted-fg)",
        }}
      >
        {satisfied ? <Check className="h-3.5 w-3.5" />
          : isFile ? <Upload className="h-3.5 w-3.5" /> : <Link2 className="h-3.5 w-3.5" />}
      </span>

      <div className="min-w-0 flex-1">
        <p className={`text-[13px] font-bold leading-snug sm:text-[13.5px] ${satisfied ? "text-[var(--green-900)]" : "text-[var(--ink)]"}`}>
          {label}
          {required > 1 && (
            // dir="ltr" on the ratio: "1/3" reads the same way in both
            // languages, and mirroring it would say 3/1.
            <span
              dir="ltr"
              className="ms-2 inline-block rounded-full px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
              style={{
                background: satisfied ? "var(--green-500)" : "var(--gold-tint)",
                color: satisfied ? "#fff" : "var(--gold-700)",
              }}
            >
              {provided}/{required}
            </span>
          )}
        </p>
      </div>

      {!satisfied && onAdd && (
        /*
         * ───────────────────────────────────────────────────────────────
         * ⚠️ ALWAYS VISIBLE. IT WAS INVISIBLE ON EVERY PHONE.
         *
         * The previous rule was:
         *
         *     opacity-0 … group-hover:opacity-100 sm:opacity-100
         *
         * which reads as "hidden until hovered, always shown from 640px up".
         * A touch screen has no hover — so below 640px this button existed,
         * occupied space, and was completely transparent.
         *
         * This is THE action of the candidate space: it is how a document
         * gets added to a dossier. A candidate on a phone saw a list of
         * things they were missing and no way to supply them.
         *
         * A hover-reveal is a desktop affordance. On a control this
         * important it should not have been one anywhere.
         * ───────────────────────────────────────────────────────────────
         */
        <button
          type="button"
          onClick={() => onAdd(docType)}
          className="min-h-9 flex-none rounded-lg bg-[var(--green-700)] px-3 py-2 text-[12px] font-bold text-white transition-colors hover:bg-[var(--green-600)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/40"
        >
          {t("add")}
        </button>
      )}
    </div>
  );
}

export function RequirementChecklist({
  readiness, onAdd, editable = true,
}: {
  /**
   * Accepts a PARTIAL payload: the reviewer's completeness report carries no
   * blockers or canSubmit, and Jackson omits empty collections. Every field
   * is defaulted below rather than assumed.
   */
  readiness: Partial<ReadinessResponse>;
  onAdd?: (docType: DocumentType) => void;
  editable?: boolean;
}) {
  const t = useTranslations("checklist");
  const tb = useTranslations("blockers");
  const format = useFormatter();

  // ── normalise before use ──
  // This component has TWO callers with slightly different payloads: the
  // candidate's ReadinessResponse (blockers, canSubmit) and the reviewer's
  // CompletenessResult (neither — the commission does not submit anything).
  // On top of that, `spring.jackson.default-property-inclusion: non_null`
  // omits empty collections entirely, so they arrive as UNDEFINED rather than
  // []. Defaulting here is the difference between a report and a crash.
  const mandatory = readiness?.mandatory ?? [];
  const groups = readiness?.alternativeGroups ?? [];
  const blockers = readiness?.blockers ?? [];
  const documentsComplete = readiness?.documentsComplete ?? false;
  const canSubmit = readiness?.canSubmit ?? false;

  // Every mandatory row plus every group counts as one item to satisfy.
  const total = mandatory.length + groups.length;
  const satisfied =
    mandatory.filter((r) => r.satisfied).length +
    groups.filter((g) => g.satisfied).length;

  return (
    <div className="space-y-5">
      {/* ── progress header ── */}
      <div className="flex items-center gap-3.5 rounded-2xl border border-[var(--line)] bg-white p-4 sm:gap-4">
        <ProgressRing satisfied={satisfied} total={total} />
        <div className="min-w-0">
          <p className="text-[13.5px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[14px]">
            {documentsComplete
              ? t("allProvided")
              : t("remaining", { count: total - satisfied })}
          </p>
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--slate)] sm:text-[12.5px]">
            {documentsComplete ? t("allProvidedBody") : t("remainingBody")}
          </p>
        </div>
      </div>

      {/* ── mandatory ── */}
      {mandatory.length > 0 && (
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              {t("mandatory")}
            </p>
            <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
          </div>
          <div className="mt-2 space-y-1">
            {mandatory.map((r) => (
              <RequirementRow key={r.docType} requirement={r} onAdd={onAdd} />
            ))}
          </div>
        </div>
      )}

      {/* ── alternative groups ── */}
      {groups.map((group) => (
        <div key={group.groupNumber}>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]">
              <Sparkles className="h-3 w-3 flex-none" />
              {t("anyOne")}
            </p>
            <span className="h-px min-w-4 flex-1 bg-[var(--line)]" aria-hidden="true" />
            {group.satisfied && (
              <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--green-500)] px-2 py-0.5 text-[10px] font-bold text-white">
                <Check className="h-2.5 w-2.5" /> {t("satisfied")}
              </span>
            )}
          </div>
          <div
            className="mt-2 space-y-1 rounded-xl border-2 border-dashed p-1.5 transition-colors"
            style={{
              borderColor: group.satisfied ? "var(--green-500)" : "var(--line)",
              background: group.satisfied ? "transparent" : "#fbfcfb",
            }}
          >
            {group.options.map((r, i) => (
              <div key={r.docType}>
                {i > 0 && (
                  <p className="py-0.5 text-center text-[10px] font-bold uppercase tracking-wider text-[var(--muted-fg)]">
                    {t("or")}
                  </p>
                )}
                <RequirementRow requirement={r} onAdd={onAdd} />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── blockers ──
          Translated from `reason`, never displayed from `message`. */}
      {blockers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--gold-500)]/45 bg-[var(--gold-tint)]">
          <div className="flex items-center gap-2 border-b border-[var(--gold-500)]/30 px-4 py-2.5">
            <AlertCircle className="h-4 w-4 flex-none text-[var(--gold-700)]" />
            <p className="text-[12.5px] font-extrabold text-[var(--gold-700)]">
              {t("conditions", { count: blockers.length })}
            </p>
          </div>
          <ul className="divide-y divide-[var(--gold-500)]/20">
            {blockers.map((b) => (
              <li key={b.reason}
                className="flex items-start gap-2.5 px-4 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)] sm:text-[13px]">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[var(--gold-500)]" />
                <span className="min-w-0">
                  {tb(b.reason, {
                    // Only DEADLINE_PASSED reads it; the other six ignore the
                    // parameter. Formatted HERE, so an Arabic page shows an
                    // Arabic date rather than the server's French one.
                    deadline: b.deadline
                      ? format.dateTime(new Date(b.deadline + "T00:00:00"), "long")
                      : "",
                  })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {canSubmit && editable && (
        <div
          className="flex items-center gap-3 rounded-xl p-4"
          style={{
            background: "linear-gradient(100deg, var(--green-tint), #f2fbf6)",
            border: "1px solid var(--green-500)",
          }}
        >
          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[var(--green-500)]">
            <Check className="h-4 w-4 text-white" />
          </span>
          <p className="text-[13px] font-bold leading-snug text-[var(--green-700)] sm:text-[13.5px]">
            {t("readyToSubmit")}
          </p>
        </div>
      )}
    </div>
  );
}
