"use client";
// src/components/reviewer/DocumentInspector.tsx
// The evidence, viewable in place — now with VERSION HISTORY.
//
// After a correction round the dossier holds two rows for the same piece: the
// original the commission rejected, and the replacement. Showing them as a
// flat list would be actively misleading — the reviewer would see "two
// attestations" and wonder which counts.
//
// So documents are GROUPED BY TYPE, the current version is selected by
// default, and previous versions sit beneath it marked as superseded. On a
// FINAL round that comparison is the reviewer's whole task: did the candidate
// actually fix what was asked?

import { useMemo, useState } from "react";
import {
  FileText, Link2, ExternalLink, Download, AlertTriangle, Eye, Loader2, History,
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

  return (
    <object data={url} type="application/pdf" className="h-full w-full">
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

  /**
   * Group by type, newest version first. The list shows one entry per PIECE
   * OF EVIDENCE, not one per stored row — which is what a reviewer means by
   * "the attestation".
   */
  const groups = useMemo(() => {
    const byType = new Map<string, ReviewDocument[]>();
    for (const d of documents) {
      const list = byType.get(d.docType) ?? [];
      list.push(d);
      byType.set(d.docType, list);
    }
    return [...byType.entries()].map(([docType, versions]) => ({
      docType,
      label: versions[0].docTypeLabelFr,
      versions: versions.sort((a, b) => b.version - a.version),
      current: versions[0],
      hasHistory: versions.length > 1,
    }));
  }, [documents]);

  const [selected, setSelected] = useState<ReviewDocument | null>(
    groups[0]?.current ?? null
  );
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

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

  const corrected = groups.filter((g) => g.hasHistory).length;

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
      <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-4">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <FileText className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            Pièces justificatives
          </p>
          <p className="text-[12px] text-[var(--slate)]">
            {groups.length} pièce{groups.length > 1 ? "s" : ""}
            {corrected > 0 && (
              <> · {corrected} corrigée{corrected > 1 ? "s" : ""}</>
            )}
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-[290px_1fr]">
        {/* ── the list, one entry per piece ── */}
        <ul className="divide-y divide-[var(--line)] border-b border-[var(--line)] lg:border-b-0 lg:border-r">
          {groups.map((group) => {
            const open = expanded.has(group.docType);
            const currentActive = selected?.id === group.current.id;

            return (
              <li key={group.docType}>
                <button
                  type="button"
                  onClick={() => setSelected(group.current)}
                  className="flex w-full items-start gap-3 px-4 py-3.5 text-left transition-colors"
                  style={{ background: currentActive ? "var(--green-tint)" : "transparent" }}
                >
                  <span className="mt-0.5 flex h-7 w-7 flex-none items-center justify-center rounded-lg"
                    style={{
                      background: group.current.needsCorrection ? "var(--gold-tint)" : "#eef1ef",
                      color: group.current.needsCorrection ? "var(--gold-700)" : "var(--green-700)",
                    }}>
                    {group.current.kind === "FILE" ? <FileText className="h-3.5 w-3.5" />
                                                   : <Link2 className="h-3.5 w-3.5" />}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="block text-[13px] font-bold text-[var(--green-900)]">
                      {group.label}
                    </span>
                    <span className="block font-mono text-[10.5px] text-[var(--muted-fg)]">
                      v{group.current.version} ·{" "}
                      {new Date(group.current.uploadedAt).toLocaleDateString("fr-FR")}
                    </span>
                    {group.current.needsCorrection && (
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-[var(--gold-tint)] px-1.5 py-0.5 text-[9.5px] font-bold text-[var(--gold-700)]">
                        <AlertTriangle className="h-2.5 w-2.5" /> correction demandée
                      </span>
                    )}
                  </span>

                  {currentActive && (
                    <Eye className="mt-1 h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
                  )}
                </button>

                {/* ── previous versions ── */}
                {group.hasHistory && (
                  <div className="px-4 pb-3">
                    <button
                      type="button"
                      onClick={() => setExpanded((set) => {
                        const next = new Set(set);
                        next.has(group.docType) ? next.delete(group.docType)
                                                : next.add(group.docType);
                        return next;
                      })}
                      className="inline-flex items-center gap-1.5 text-[11.5px] font-bold text-[var(--gold-700)] hover:text-[var(--gold-500)]"
                    >
                      <History className="h-3 w-3" />
                      {open ? "Masquer" : "Voir"} la version précédente
                      {group.versions.length > 2 && ` (${group.versions.length - 1})`}
                    </button>

                    {open && (
                      <ul className="mt-2 space-y-1 border-l-2 border-[var(--line)] pl-3">
                        {group.versions.slice(1).map((old) => (
                          <li key={old.id}>
                            <button
                              type="button"
                              onClick={() => setSelected(old)}
                              className="w-full rounded-lg px-2 py-1.5 text-left transition-colors hover:bg-[#f2f5f3]"
                              style={{
                                background: selected?.id === old.id ? "#eef1ef" : "transparent",
                              }}
                            >
                              <span className="block font-mono text-[10.5px] text-[var(--muted-fg)]">
                                v{old.version} ·{" "}
                                {new Date(old.uploadedAt).toLocaleDateString("fr-FR")}
                              </span>
                              <span className="block text-[11px] font-semibold text-[var(--slate)]">
                                Version remplacée
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        {/* ── the preview ── */}
        <div className="flex min-h-[440px] flex-col bg-[#fbfcfb]">
          {selected && (
            <>
              <div className="flex items-center justify-between gap-3 border-b border-[var(--line)] px-4 py-2.5">
                <p className="flex min-w-0 items-center gap-2 truncate text-[12.5px] font-bold text-[var(--green-900)]">
                  {selected.docTypeLabelFr}
                  <span className="flex-none rounded-full bg-[#eef1ef] px-2 py-0.5 font-mono text-[10px] text-[var(--slate)]">
                    v{selected.version}
                  </span>
                  {/* A superseded version is the one the FIRST decision was
                      taken on — saying so prevents it being read as current. */}
                  {groups.find((g) => g.docType === selected.docType)?.current.id !== selected.id && (
                    <span className="flex-none rounded-full bg-[var(--gold-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--gold-700)]">
                      remplacée
                    </span>
                  )}
                </p>

                {selected.kind === "FILE" && (
                  <button type="button"
                    onClick={() => openProtectedFile(
                      reviewerDocumentPath(applicationId, selected.id),
                      token, selected.docTypeLabelFr)}
                    className="inline-flex flex-none items-center gap-1.5 rounded-lg border border-[var(--line)] bg-white px-2.5 py-1.5 text-[11.5px] font-semibold text-[var(--green-700)] hover:bg-[var(--green-tint)]">
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
