"use client";
// src/components/reviewer/DocumentInspector.tsx
// The evidence, viewable IN PLACE.
//
// A reviewer who must download each file, find it, open it, and come back
// will not read them all — so the pieces are previewed beside the list.
// Images render directly; PDFs go in an <object>, which uses the browser's
// own viewer and needs no dependency.
//
// Everything is fetched with the session token: these endpoints reject
// unauthenticated requests, so a plain src attribute would show nothing.

import { useState } from "react";
import {
  FileText, Link2, ExternalLink, Download, AlertTriangle, Eye, Loader2,
} from "lucide-react";
import { useAuthenticatedFile, openProtectedFile } from "@/lib/api/files";
import { useAuthStore } from "@/lib/auth";
import { reviewerDocumentPath, type ReviewDocument } from "@/lib/api/review";

function Preview({ applicationId, document }: {
  applicationId: number;
  document: ReviewDocument;
}) {
  const { url, loading } = useAuthenticatedFile(
    document.kind === "FILE" ? reviewerDocumentPath(applicationId, document.id) : null
  );

  if (document.kind === "LINK") {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 p-8 text-center">
        <Link2 className="h-8 w-8 text-[var(--muted-fg)] opacity-40" />
        <p className="max-w-sm break-all text-[13px] text-[var(--slate)]">{document.url}</p>
        <a href={document.url ?? "#"} target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--green-700)] px-3.5 py-2 text-[12.5px] font-bold text-white hover:bg-[var(--green-600)]">
          <ExternalLink className="h-3.5 w-3.5" /> Ouvrir la publication
        </a>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--green-600)]" />
      </div>
    );
  }
  if (!url) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-center">
        <p className="text-[13px] text-[var(--muted-fg)]">
          Ce fichier n&apos;a pas pu être chargé.
        </p>
      </div>
    );
  }

  // The blob URL carries no filename, so sniff on the document type instead.
  const isImage = /\.(jpe?g|png)$/i.test(document.docTypeLabelFr) || false;

  return (
    <object data={url} type="application/pdf" className="h-full w-full">
      {/* Fallback covers images and any browser without a PDF viewer. */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={document.docTypeLabelFr}
        className="mx-auto max-h-full max-w-full object-contain" />
    </object>
  );
}

export function DocumentInspector({
  applicationId,
  documents,
}: {
  applicationId: number;
  documents: ReviewDocument[];
}) {
  const token = useAuthStore((s) => s.token);
  const [selected, setSelected] = useState<ReviewDocument | null>(documents[0] ?? null);

  if (documents.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-10 text-center">
        <FileText className="mx-auto h-8 w-8 text-[var(--muted-fg)] opacity-40" />
        <p className="mt-3 text-[13.5px] text-[var(--slate)]">
          Aucune pièce jointe à ce dossier.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <FileText className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div>
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            Pièces justificatives
          </p>
          <p className="text-[12px] text-[var(--slate)]">
            {documents.length} pièce{documents.length > 1 ? "s" : ""} au dossier
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[260px_1fr]">
        {/* ── the list ── */}
        <ul className="divide-y divide-[var(--line)] border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          {documents.map((d) => {
            const active = selected?.id === d.id;
            return (
              <li key={d.id}>
                <button
                  type="button"
                  onClick={() => setSelected(d)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors"
                  style={{ background: active ? "var(--green-tint)" : "transparent" }}
                >
                  <span
                    className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg"
                    style={{
                      background: d.needsCorrection ? "var(--gold-tint)" : "#eef1ef",
                      color: d.needsCorrection ? "var(--gold-700)" : "var(--green-700)",
                    }}
                  >
                    {d.kind === "FILE" ? <FileText className="h-3.5 w-3.5" />
                                       : <Link2 className="h-3.5 w-3.5" />}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-[var(--green-900)]">
                      {d.docTypeLabelFr}
                      {d.version > 1 && (
                        <span className="ml-1.5 font-mono text-[10.5px] text-[var(--muted-fg)]">
                          v{d.version}
                        </span>
                      )}
                    </span>
                    <span className="block font-mono text-[10.5px] text-[var(--muted-fg)]">
                      {new Date(d.uploadedAt).toLocaleDateString("fr-FR")}
                    </span>
                    {d.needsCorrection && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--gold-700)]">
                        <AlertTriangle className="h-2.5 w-2.5" /> Correction demandée
                      </span>
                    )}
                  </span>
                  {active && <Eye className="mt-1 h-3.5 w-3.5 flex-none text-[var(--green-600)]" />}
                </button>
              </li>
            );
          })}
        </ul>

        {/* ── the preview ── */}
        <div className="flex min-h-[440px] flex-col bg-[#fbfcfb]">
          {selected && (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
                <p className="truncate text-[12.5px] font-bold text-[var(--green-900)]">
                  {selected.docTypeLabelFr}
                </p>
                {selected.kind === "FILE" && (
                  <button
                    type="button"
                    onClick={() => openProtectedFile(
                      reviewerDocumentPath(applicationId, selected.id),
                      token, selected.docTypeLabelFr)}
                    className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--green-700)] hover:bg-[var(--green-tint)]"
                  >
                    <Download className="h-3 w-3" /> Ouvrir
                  </button>
                )}
              </div>

              {selected.needsCorrection && selected.observation && (
                <p className="border-b border-[var(--gold-500)]/30 bg-[var(--gold-tint)] px-4 py-2.5 text-[12.5px] text-[var(--gold-700)]">
                  <b>Observation :</b> {selected.observation}
                </p>
              )}

              <div className="min-h-0 flex-1">
                <Preview applicationId={applicationId} document={selected} />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
