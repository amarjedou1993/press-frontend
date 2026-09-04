"use client";
// src/components/admin/HonourImportDialog.tsx
//
// Granting a batch of honour cards from a spreadsheet.

import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, Download, Camera, CameraOff, AlertTriangle,
  Check, X, Loader2, ShieldAlert,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  previewHonourImport, commitHonourImport, downloadHonourTemplate,
  type ImportPreview, type ImportRow, type CommitResult,
} from "@/lib/api/honour-import";
import { useAuthStore } from "@/lib/auth";

type Stage = "choose" | "review" | "done";

export function HonourImportDialog({
  open,
  onOpenChange,
  onCommitted,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called after a successful commit, so the register refreshes. */
  onCommitted: () => void;
}) {
  const token = useAuthStore((s) => s.token);
  const fileInput = useRef<HTMLInputElement>(null);

  const [stage, setStage] = useState<Stage>("choose");
  /**
   * ⚠️ THE FILE IS HELD HERE between the two steps.
   *
   * The administrator picks it once; the browser posts it twice. Holding the
   * File object rather than asking again is what makes the server's re-parse
   * invisible — and the re-parse is the check that the confirmed set is still
   * the set being granted.
   */
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<ImportPreview | null>(null);
  const [result, setResult] = useState<CommitResult | null>(null);

  // Reset on every open, so a second import never inherits the first's report.
  useEffect(() => {
    if (open) return;
    setStage("choose");
    setFile(null);
    setPreview(null);
    setResult(null);
  }, [open]);

  const parse = useMutation({
    mutationFn: (chosen: File) => previewHonourImport(chosen, token),
    onSuccess: (data, chosen) => {
      setFile(chosen);
      setPreview(data);
      setStage("review");
    },
    onError: (e) => toast.error("Lecture impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
    }),
  });

  const commit = useMutation({
    mutationFn: () => commitHonourImport(
      file!,
      (preview?.rows ?? []).filter((r) => !r.errorFr).map((r) => r.identityNumber),
      token),
    onSuccess: (data) => {
      setResult(data);
      setStage("done");
      onCommitted();
    },
    onError: (e) => toast.error("Import impossible", {
      description: e instanceof Error ? e.message : "Réessayez.",
    }),
  });

  const valid = useMemo(
    () => (preview?.rows ?? []).filter((r) => !r.errorFr), [preview]);
  const rejected = useMemo(
    () => (preview?.rows ?? []).filter((r) => r.errorFr), [preview]);
  const withoutPhoto = useMemo(
    () => valid.filter((r) => !r.hasPhoto).length, [valid]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>
            {stage === "done" ? "Import terminé" : "Importer des cartes d'honneur"}
          </DialogTitle>
          <DialogDescription>
            {stage === "choose"
              ? "Un classeur et un dossier de photographies, dans une seule archive .zip."
              : stage === "review"
                ? "Rien n'a encore été créé. Vérifiez, puis validez."
                : "Les cartes ont été accordées."}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">

          {/* ══ 1 · choose ══ */}
          {stage === "choose" && (
            <div className="space-y-5">
              {/* ⚠️ THE TEMPLATE COMES FIRST, before the upload control.
                  A format nobody can produce is a feature nobody can use, and
                  an administrator who has not seen the columns will upload
                  something that fails on the first row. */}
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-[#fbfcfb] px-5 py-4">
                <FileSpreadsheet className="h-5 w-5 flex-none text-[var(--green-700)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                    Commencez par le modèle
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--slate)]">
                    Il contient les colonnes attendues, la liste des catégories
                    et la convention de nommage des photographies.
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none"
                  onClick={() => downloadHonourTemplate(token).catch((e) =>
                    toast.error("Téléchargement impossible", {
                      description: e instanceof Error ? e.message : "Réessayez.",
                    }))}
                >
                  <Download className="h-3.5 w-3.5" />
                  Modèle .xlsx
                </Button>
              </div>

              <div className="rounded-xl bg-[var(--green-tint)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                  Structure de l&apos;archive
                </p>
                <pre className="mt-2.5 font-mono text-[12px] leading-relaxed text-[var(--green-900)]">
{`import.zip
├── cartes.xlsx
└── photos/
    ├── 1234567890.jpg
    └── 9876543210.jpg`}
                </pre>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
                  Chaque photographie porte le NNI ou le numéro de passeport de
                  son titulaire. 10 Mo maximum, une quarantaine de cartes.
                </p>
              </div>

              <input
                ref={fileInput}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) parse.mutate(chosen);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={parse.isPending}
                className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[var(--line)] px-6 py-10 transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40 disabled:opacity-60"
              >
                {parse.isPending
                  ? <Loader2 className="h-7 w-7 animate-spin text-[var(--green-600)]" />
                  : <Upload className="h-7 w-7 text-[var(--green-600)]" />}
                <span className="text-[13.5px] font-bold text-[var(--green-900)]">
                  {parse.isPending ? "Lecture de l'archive…" : "Choisir une archive .zip"}
                </span>
                <span className="text-[12.5px] text-[var(--slate)]">
                  Rien ne sera créé : vous verrez d&apos;abord ce qui serait fait.
                </span>
              </button>
            </div>
          )}

          {/* ══ 2 · review ══ */}
          {stage === "review" && preview && (
            <div className="space-y-5">
              {/* ⚠️ THE ARCHIVE'S OWN PROBLEMS FIRST, above the rows. A
                  refused entry or a second workbook is not a row error, and
                  burying it under forty lines hides it. */}
              {preview.fileErrorsFr.length > 0 && (
                <div className="rounded-xl bg-[var(--red-tint)] px-5 py-4">
                  <p className="flex items-center gap-2 text-[12.5px] font-bold text-[var(--red-700)]">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    Problèmes dans l&apos;archive
                  </p>
                  <ul className="mt-2 space-y-1">
                    {preview.fileErrorsFr.map((error, i) => (
                      <li key={i} className="text-[12.5px] leading-relaxed text-[var(--red-700)]">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3">
                <Tally value={valid.length} label="à accorder" tone="green" />
                <Tally value={preview.rowsWithPhoto} label="avec photo" tone="plain" />
                <Tally value={rejected.length} label="refusées" tone="red" />
              </div>

              {/* ⚠️ SAID BEFORE THE CONFIRMATION, not discovered afterwards.
                  A card without a photograph is granted and waits — it does
                  not reach the printer until one is attached, and the
                  administrator should know how many are in that state while
                  they can still fix the archive. */}
              {withoutPhoto > 0 && (
                <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                  <CameraOff className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  <span>
                    <b className="font-bold">{withoutPhoto} carte(s) sans photographie.</b>{" "}
                    Elles seront créées et attendront leur image : sans elle,
                    elles n&apos;apparaissent pas chez l&apos;imprimeur.
                  </span>
                </p>
              )}

              {rejected.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red-700)]">
                    Lignes refusées — elles ne seront pas créées
                  </p>
                  <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                    {rejected.map((row) => <RowLine key={row.rowNumber} row={row} />)}
                  </ul>
                </div>
              )}

              {valid.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                    Cartes qui seront accordées
                  </p>
                  <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                    {valid.map((row) => <RowLine key={row.rowNumber} row={row} />)}
                  </ul>
                </div>
              )}

              {/* ⚠️ The same warning the single-grant dialog carries. A batch
                  does not make the exception smaller — it makes it forty
                  times larger. */}
              <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
                <span>
                  Chaque motif est inscrit au registre avec votre nom. Ces
                  cartes sont accordées sans examen de la commission.
                </span>
              </p>
            </div>
          )}

          {/* ══ 3 · done ══ */}
          {stage === "done" && result && (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Tally value={result.granted} label="accordées" tone="green" />
                <Tally value={result.photosAttached} label="avec photo" tone="plain" />
                <Tally value={result.failed} label="échouées" tone="red" />
              </div>

              {result.failed > 0 && (
                <div>
                  {/* ⚠️ NAMED, never a count alone. An administrator told
                      "3 failed" has to compare two lists to find which. */}
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red-700)]">
                    Lignes échouées
                  </p>
                  <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                    {result.outcomes.filter((o) => !o.granted).map((o) => (
                      <li key={o.rowNumber} className="flex items-start gap-3 px-4 py-3">
                        <X className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--red-700)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[var(--green-900)]">
                            <span className="font-mono text-[11px] text-[var(--muted-fg)]">
                              L.{o.rowNumber}
                            </span>{" "}
                            <span dir="auto">{o.fullName}</span>
                          </p>
                          <p className="text-[12px] text-[var(--red-700)]">{o.failureFr}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.granted > result.photosAttached && (
                <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                  <Camera className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  <span>
                    <b className="font-bold">
                      {result.granted - result.photosAttached} carte(s) attendent leur photographie.
                    </b>{" "}
                    Ajoutez-la depuis leur ligne : elles portent « Photo requise ».
                  </span>
                </p>
              )}

              <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                {result.outcomes.filter((o) => o.granted).map((o) => (
                  <li key={o.rowNumber} className="flex items-center gap-3 px-4 py-2.5">
                    <Check className="h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
                    <span dir="auto" className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--green-900)]">
                      {o.fullName}
                    </span>
                    <span dir="ltr" className="flex-none font-mono text-[11.5px] text-[var(--muted-fg)]">
                      {o.cardNumber}
                    </span>
                    {o.photoAttached
                      ? <Camera className="h-3 w-3 flex-none text-[var(--green-600)]" />
                      : <CameraOff className="h-3 w-3 flex-none text-[var(--gold-700)]" />}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
          {stage === "review" ? (
            <>
              <Button variant="outline" onClick={() => setStage("choose")}>
                Choisir un autre fichier
              </Button>
              <Button
                disabled={valid.length === 0 || commit.isPending}
                onClick={() => commit.mutate()}
              >
                {commit.isPending
                  ? "Octroi en cours…"
                  : `Accorder ${valid.length} carte${valid.length > 1 ? "s" : ""}`}
              </Button>
            </>
          ) : (
            <Button
              variant={stage === "done" ? "default" : "outline"}
              onClick={() => onOpenChange(false)}
            >
              {stage === "done" ? "Terminer" : "Annuler"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ══ pieces ══ */

function Tally({
  value, label, tone,
}: {
  value: number;
  label: string;
  tone: "green" | "red" | "plain";
}) {
  const colours = {
    green: { bg: "var(--green-tint)", fg: "var(--green-700)" },
    red:   { bg: "var(--red-tint)",   fg: "var(--red-700)" },
    plain: { bg: "#f2f5f3",           fg: "var(--slate)" },
  }[tone];

  return (
    <div className="rounded-xl px-4 py-3 text-center" style={{ background: colours.bg }}>
      <p className="font-mono text-[24px] font-extrabold leading-none"
        style={{ color: colours.fg }}>
        {value}
      </p>
      <p className="mt-1.5 text-[9.5px] font-bold uppercase tracking-[0.14em]"
        style={{ color: colours.fg, opacity: 0.75 }}>
        {label}
      </p>
    </div>
  );
}

function RowLine({ row }: { row: ImportRow }) {
  return (
    <li className="flex items-start gap-3 px-4 py-3">
      {row.errorFr
        ? <X className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--red-700)]" />
        : row.hasPhoto
          ? <Camera className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
          : <CameraOff className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />}

      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-[var(--green-900)]">
          <span className="font-mono text-[11px] font-normal text-[var(--muted-fg)]">
            L.{row.rowNumber}
          </span>
          <span dir="auto">{row.fullName || "—"}</span>
          <span dir="ltr" className="font-mono text-[11px] font-normal text-[var(--muted-fg)]">
            {row.identityNumber || "—"}
          </span>
        </p>
        {(row.categoryLabelFr || row.institution) && (
          <p className="text-[12px] text-[var(--slate)]">
            {[row.categoryLabelFr, row.institution].filter(Boolean).join(" · ")}
          </p>
        )}
        {row.errorFr && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--red-700)]">
            {row.errorFr}
          </p>
        )}
        {row.warningFr && !row.errorFr && (
          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--gold-700)]">
            {row.warningFr}
          </p>
        )}
      </div>
    </li>
  );
}
