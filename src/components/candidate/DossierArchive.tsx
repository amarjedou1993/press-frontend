"use client";
// src/components/candidate/DossierArchive.tsx
//
// The dossier as a record, after a decision. Collapsed by default — the
// decision is what matters now — but OPEN after a refusal, because that is
// exactly when a candidate goes looking for what they submitted.
//
// ⚠️ THE SUMMARY LINE NAMES THE OUTCOME.
//
// It used to read "4 pièces · 7 étapes" whatever had happened: the same
// neutral line above a rejection and above an issued card. A candidate
// scanning a collapsed panel learned nothing about which one they were
// looking at, and had to open it to find out.

import { useFormatter, useTranslations } from "next-intl";
import { FileText, Link2, History, ChevronDown, Download } from "lucide-react";
import { openProtectedFile } from "@/lib/api/files";
import { useAuthStore } from "@/lib/auth";
import { StatusTimeline } from "./StatusTimeline";
import type {
  DocumentResponse, TimelineEntry, ApplicationStatus,
} from "@/lib/api/applications";
import { STATUS_KIND } from "@/lib/api/applications";

export function DossierArchive({
  applicationId,
  documents,
  timeline,
  /**
   * The dossier's final status — so the summary can say how it ended.
   * Optional: an archive without one simply counts, as before.
   */
  status,
  /** True after a refusal — the candidate is likely to need this. */
  defaultOpen = false,
}: {
  applicationId: number;
  documents: DocumentResponse[];
  timeline: TimelineEntry[];
  status?: ApplicationStatus;
  defaultOpen?: boolean;
}) {
  const t = useTranslations("archive");
  const ts = useTranslations("applicationStatus");
  const td = useTranslations("documentType");
  const format = useFormatter();
  const token = useAuthStore((s) => s.token);

  if (documents.length === 0 && timeline.length === 0) return null;

  const kind = status ? STATUS_KIND[status] : null;

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white [&[open]_.chevron]:rotate-180"
    >
      <summary
        className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 transition-colors hover:bg-[var(--green-tint)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/40"
      >
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <History className="h-4 w-4 text-[var(--green-700)]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-extrabold text-[var(--green-900)]">
            {t("title")}
          </span>
          <span className="block text-[12px] text-[var(--slate)]">
            {t("pieces", { count: documents.length })}
            {timeline.length > 0 && <> · {t("steps", { count: timeline.length })}</>}
          </span>
        </span>

        {/* ⚠️ THE OUTCOME, in the panel's own header.
            A collapsed archive above a refusal now says so, in the refusal's
            colour, without being opened. */}
        {status && kind && (
          <span
            className="flex-none rounded-full px-3 py-1 text-[11px] font-bold"
            style={{
              background: `var(--st-${kind}-bg)`,
              color: `var(--st-${kind}-fg)`,
            }}
          >
            {ts(status)}
          </span>
        )}

        {/* The chevron points DOWN in both directions: it opens a panel
            below, which is a vertical movement — not a reading direction. */}
        <ChevronDown className="chevron h-4 w-4 flex-none text-[var(--muted-fg)] transition-transform duration-200" />
      </summary>

      <div className="border-t border-[var(--line)]">
        {/* ── the pieces ── */}
        {documents.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              {t("piecesFiled")}
            </p>

            <ul className="mt-3 divide-y divide-[var(--line)]">
              {documents.map((d) => (
                <li key={d.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#eef1ef] text-[var(--green-700)]">
                    {d.kind === "FILE" ? <FileText className="h-4 w-4" />
                                       : <Link2 className="h-4 w-4" />}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                      {td(d.docType)}
                      {d.version > 1 && (
                        // dir="ltr": "v2" is a version mark, not a word.
                        <span dir="ltr" className="ms-1.5 inline-block font-mono text-[11px] text-[var(--muted-fg)]">
                          v{d.version}
                        </span>
                      )}
                    </p>

                    {d.url ? (
                      // dir="ltr": a URL's slashes and dots reorder in an RTL
                      // paragraph, and a scrambled address is unusable.
                      <a href={d.url} target="_blank" rel="noopener noreferrer"
                        dir="ltr"
                        className="block truncate text-start text-[12.5px] text-[var(--green-700)] underline underline-offset-2">
                        {d.url}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() => openProtectedFile(
                          `/api/applications/${applicationId}/documents/${d.id}/file`,
                          token, td(d.docType))}
                        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--green-700)] underline underline-offset-2"
                      >
                        <Download className="h-3 w-3 flex-none" /> {t("open")}
                      </button>
                    )}

                    {d.observation && (
                      /* ⚠️ dir="auto" — a commission member wrote this. */
                      <p dir="auto"
                        className="user-text mt-1.5 whitespace-pre-wrap rounded-lg bg-[var(--gold-tint)] px-2.5 py-1.5 text-[12.5px] text-[var(--gold-700)]">
                        <b>{t("observation")}</b> {d.observation}
                      </p>
                    )}
                  </div>

                  <span dir="ltr" className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
                    {format.dateTime(new Date(d.uploadedAt), "short")}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── the history ──
            The rejection and its justification are HERE, in the timeline:
            StatusTimeline renders every transition with the reason recorded
            on it, dir="auto", in the member's own words. */}
        {timeline.length > 0 && (
          <div className="border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              {t("courseOfReview")}
            </p>
            <div className="mt-5">
              <StatusTimeline entries={timeline} />
            </div>
          </div>
        )}
      </div>
    </details>
  );
}
