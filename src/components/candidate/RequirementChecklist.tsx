"use client";
// src/components/candidate/RequirementChecklist.tsx
// The centrepiece of the dossier page, so it is designed like one: a
// progress ring, requirement rows that read as satisfied or not at a glance,
// and alternative groups framed as the CHOICE they are.
//
// It renders the backend's readiness object directly — the object that
// decides is the object that explains, so the two cannot disagree.

import { Check, X, AlertCircle, Upload, Link2, Sparkles } from "lucide-react";
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
    <div className="relative h-[68px] w-[68px] flex-none">
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
          <Check className="h-6 w-6 text-[var(--green-600)]" />
        ) : (
          <>
            <span className="text-[15px] font-extrabold leading-none text-[var(--green-900)]">
              {satisfied}
            </span>
            <span className="text-[10px] font-semibold text-[var(--muted-fg)]">
              / {total}
            </span>
          </>
        )}
      </span>
    </div>
  );
}

function RequirementRow({
  requirement, onAdd, inGroup = false,
}: {
  requirement: RequirementResponse;
  onAdd?: (docType: DocumentType) => void;
  inGroup?: boolean;
}) {
  const { satisfied, labelFr, labelAr, required, provided, isFile, docType } = requirement;

  return (
    <div
      className="group flex items-center gap-3 rounded-xl px-3 py-3 transition-colors"
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
        <p className={`text-[13.5px] font-bold ${satisfied ? "text-[var(--green-900)]" : "text-[var(--ink)]"}`}>
          {labelFr}
          {required > 1 && (
            <span
              className="ml-2 rounded-full px-1.5 py-0.5 font-mono text-[10.5px] font-bold"
              style={{
                background: satisfied ? "var(--green-500)" : "var(--gold-tint)",
                color: satisfied ? "#fff" : "var(--gold-700)",
              }}
            >
              {provided}/{required}
            </span>
          )}
        </p>
        <p dir="rtl" className="text-[11.5px] text-[var(--muted-fg)]">{labelAr}</p>
      </div>

      {!satisfied && onAdd && (
        <button
          type="button"
          onClick={() => onAdd(docType)}
          className="flex-none rounded-lg bg-[var(--green-700)] px-3 py-1.5 text-[12px] font-bold text-white opacity-0 transition-opacity hover:bg-[var(--green-600)] focus-visible:opacity-100 group-hover:opacity-100 sm:opacity-100"
        >
          Ajouter
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
  // ── normalise before use ──
  // This component now has TWO callers with slightly different payloads:
  // the candidate's ReadinessResponse (blockers, canSubmit) and the
  // reviewer's CompletenessResult (neither — the commission does not submit
  // anything). On top of that, `spring.jackson.default-property-inclusion:
  // non_null` omits empty collections entirely, so they arrive as UNDEFINED
  // rather than []. Defaulting here is the difference between a report and
  // a crash.
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
      <div className="flex items-center gap-4 rounded-2xl border border-[var(--line)] bg-white p-4">
        <ProgressRing satisfied={satisfied} total={total} />
        <div className="min-w-0">
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            {documentsComplete
              ? "Toutes les pièces sont fournies"
              : `${total - satisfied} pièce${total - satisfied > 1 ? "s" : ""} à fournir`}
          </p>
          <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--slate)]">
            {documentsComplete
              ? "Vérifiez les autres conditions ci-dessous avant de soumettre."
              : "Ajoutez les documents demandés pour votre catégorie."}
          </p>
        </div>
      </div>

      {/* ── mandatory ── */}
      {mandatory.length > 0 && (
        <div>
          <div className="flex items-center gap-3">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
              Pièces obligatoires
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
          <div className="flex items-center gap-3">
            <p className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]">
              <Sparkles className="h-3 w-3" />
              Au choix — une seule suffit
            </p>
            <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
            {group.satisfied && (
              <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-500)] px-2 py-0.5 text-[10px] font-bold text-white">
                <Check className="h-2.5 w-2.5" /> Satisfait
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
                    ou
                  </p>
                )}
                <RequirementRow requirement={r} onAdd={onAdd} inGroup />
              </div>
            ))}
          </div>
        </div>
      ))}

      {/* ── blockers, in the server's own words ── */}
      {blockers.length > 0 && (
        <div className="overflow-hidden rounded-xl border border-[var(--gold-500)]/45 bg-[var(--gold-tint)]">
          <div className="flex items-center gap-2 border-b border-[var(--gold-500)]/30 px-4 py-2.5">
            <AlertCircle className="h-4 w-4 text-[var(--gold-700)]" />
            <p className="text-[12.5px] font-extrabold text-[var(--gold-700)]">
              {blockers.length === 1
                ? "Une condition reste à remplir"
                : `${blockers.length} conditions restent à remplir`}
            </p>
          </div>
          <ul className="divide-y divide-[var(--gold-500)]/20">
            {blockers.map((b) => (
              <li key={b.reason}
                className="flex items-start gap-2.5 px-4 py-2.5 text-[13px] leading-relaxed text-[var(--gold-700)]">
                <span className="mt-1.5 h-1.5 w-1.5 flex-none rounded-full bg-[var(--gold-500)]" />
                {b.message}
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
          <p className="text-[13.5px] font-bold text-[var(--green-700)]">
            Votre dossier est complet et peut être soumis à la commission.
          </p>
        </div>
      )}
    </div>
  );
}
