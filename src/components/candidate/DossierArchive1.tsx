// "use client";


// import { FileText, Link2, History, ChevronDown, Download } from "lucide-react";
// import { openProtectedFile } from "@/lib/api/files";
// import { useAuthStore } from "@/lib/auth";
// import { StatusTimeline } from "./StatusTimeline";
// import type { DocumentResponse, TimelineEntry } from "@/lib/api/applications";

// export function DossierArchive({
//   applicationId,
//   documents,
//   timeline,
//   /** True after a refusal — the candidate is likely to need this. */
//   defaultOpen = false,
// }: {
//   applicationId: number;
//   documents: DocumentResponse[];
//   timeline: TimelineEntry[];
//   defaultOpen?: boolean;
// }) {
//   const token = useAuthStore((s) => s.token);

//   if (documents.length === 0 && timeline.length === 0) return null;

//   return (
//     <details
//       open={defaultOpen}
//       className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white [&[open]_.chevron]:rotate-180"
//     >
//       <summary
//         className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 transition-colors hover:bg-[var(--green-tint)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/40"
//       >
//         <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
//           <History className="h-4 w-4 text-[var(--green-700)]" />
//         </span>

//         <span className="min-w-0 flex-1">
//           <span className="block text-[14px] font-extrabold text-[var(--green-900)]">
//             Historique et pièces du dossier
//           </span>
//           <span className="block text-[12px] text-[var(--slate)]">
//             {documents.length} pièce{documents.length > 1 ? "s" : ""}
//             {timeline.length > 0 && (
//               <> · {timeline.length} étape{timeline.length > 1 ? "s" : ""}</>
//             )}
//           </span>
//         </span>

//         <ChevronDown className="chevron h-4 w-4 flex-none text-[var(--muted-fg)] transition-transform duration-200" />
//       </summary>

//       <div className="border-t border-[var(--line)]">
//         {/* ── the pieces ── */}
//         {documents.length > 0 && (
//           <div className="px-6 py-5">
//             <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
//               Pièces déposées
//             </p>

//             <ul className="mt-3 divide-y divide-[var(--line)]">
//               {documents.map((d) => (
//                 <li key={d.id} className="flex items-start gap-3 py-3">
//                   <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#eef1ef] text-[var(--green-700)]">
//                     {d.kind === "FILE" ? <FileText className="h-4 w-4" />
//                                        : <Link2 className="h-4 w-4" />}
//                   </span>

//                   <div className="min-w-0 flex-1">
//                     <p className="text-[13.5px] font-semibold text-[var(--ink)]">
//                       {d.docTypeLabelFr}
//                       {d.version > 1 && (
//                         <span className="ml-1.5 font-mono text-[11px] text-[var(--muted-fg)]">
//                           v{d.version}
//                         </span>
//                       )}
//                     </p>

//                     {d.url ? (
//                       <a href={d.url} target="_blank" rel="noopener noreferrer"
//                         className="truncate text-[12.5px] text-[var(--green-700)] underline underline-offset-2">
//                         {d.url}
//                       </a>
//                     ) : (
//                       <button
//                         type="button"
//                         onClick={() => openProtectedFile(
//                           `/api/applications/${applicationId}/documents/${d.id}/file`,
//                           token, d.docTypeLabelFr)}
//                         className="inline-flex items-center gap-1 text-[12.5px] text-[var(--green-700)] underline underline-offset-2"
//                       >
//                         <Download className="h-3 w-3" /> Consulter
//                       </button>
//                     )}

//                     {d.observation && (
//                       <p className="mt-1.5 rounded-lg bg-[var(--gold-tint)] px-2.5 py-1.5 text-[12.5px] text-[var(--gold-700)]">
//                         <b>Observation :</b> {d.observation}
//                       </p>
//                     )}
//                   </div>

//                   <span className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
//                     {new Date(d.uploadedAt).toLocaleDateString("fr-FR")}
//                   </span>
//                 </li>
//               ))}
//             </ul>
//           </div>
//         )}

//         {/* ── the history ── */}
//         {timeline.length > 0 && (
//           <div className="border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-5">
//             <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
//               Déroulé de l&apos;instruction
//             </p>
//             <div className="mt-5">
//               <StatusTimeline entries={timeline} />
//             </div>
//           </div>
//         )}
//       </div>
//     </details>
//   );
// }


"use client";

import {
  FileText,
  Link2,
  History,
  ChevronDown,
  Download,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";

import { openProtectedFile } from "@/lib/api/files";
import { useAuthStore } from "@/lib/auth";
import { StatusTimeline } from "./StatusTimeline";
import type {
  DocumentResponse,
  TimelineEntry,
} from "@/lib/api/applications";

export function DossierArchive({
  applicationId,
  documents,
  timeline,
  /** True after a refusal — the candidate is likely to need this. */
  defaultOpen = false,
}: {
  applicationId: number;
  documents: DocumentResponse[];
  timeline: TimelineEntry[];
  defaultOpen?: boolean;
}) {
  const token = useAuthStore((s) => s.token);

  const t = useTranslations("archive");
  const format = useFormatter();

  if (documents.length === 0 && timeline.length === 0) return null;

  return (
    <details
      open={defaultOpen}
      className="group overflow-hidden rounded-2xl border border-[var(--line)] bg-white [&[open]_.chevron]:rotate-180"
    >
      <summary className="flex cursor-pointer list-none items-center gap-3 px-6 py-4 transition-colors hover:bg-[var(--green-tint)]/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--green-500)]/40">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <History className="h-4 w-4 text-[var(--green-700)]" />
        </span>

        <span className="min-w-0 flex-1">
          <span className="block text-[14px] font-extrabold text-[var(--green-900)]">
            {t("title")}
          </span>

          <span className="block text-[12px] text-[var(--slate)]">
            {t("pieces", { count: documents.length })}

            {timeline.length > 0 && (
              <> · {t("steps", { count: timeline.length })}</>
            )}
          </span>
        </span>

        <ChevronDown className="chevron h-4 w-4 flex-none text-[var(--muted-fg)] transition-transform duration-200" />
      </summary>

      <div className="border-t border-[var(--line)]">
        {/* ── Pieces ── */}
        {documents.length > 0 && (
          <div className="px-6 py-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              {t("piecesFiled")}
            </p>

            <ul className="mt-3 divide-y divide-[var(--line)]">
              {documents.map((d) => (
                <li key={d.id} className="flex items-start gap-3 py-3">
                  <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg bg-[#eef1ef] text-[var(--green-700)]">
                    {d.kind === "FILE" ? (
                      <FileText className="h-4 w-4" />
                    ) : (
                      <Link2 className="h-4 w-4" />
                    )}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="text-[13.5px] font-semibold text-[var(--ink)]">
                      {d.docTypeLabelFr}

                      {d.version > 1 && (
                        <span className="ml-1.5 font-mono text-[11px] text-[var(--muted-fg)]">
                          v{d.version}
                        </span>
                      )}
                    </p>

                    {d.url ? (
                      <a
                        href={d.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[12.5px] text-[var(--green-700)] underline underline-offset-2"
                      >
                        {d.url}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={() =>
                          openProtectedFile(
                            `/api/applications/${applicationId}/documents/${d.id}/file`,
                            token,
                            d.docTypeLabelFr,
                          )
                        }
                        className="inline-flex items-center gap-1 text-[12.5px] text-[var(--green-700)] underline underline-offset-2"
                      >
                        <Download className="h-3 w-3" />
                        {t("open")}
                      </button>
                    )}

                    {d.observation && (
                      <p className="mt-1.5 rounded-lg bg-[var(--gold-tint)] px-2.5 py-1.5 text-[12.5px] text-[var(--gold-700)]">
                        <b>{t("observation")}</b> {d.observation}
                      </p>
                    )}
                  </div>

                  <span className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
                    {format.dateTime(new Date(d.uploadedAt), {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* ── History ── */}
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