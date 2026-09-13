"use client";
// src/components/institution/StaffImportDialog.tsx

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Upload, FileSpreadsheet, Download, Camera, CameraOff, X, Check,
  Loader2, AlertTriangle,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  importStaff, downloadStaffTemplate, type ImportResult,
} from "@/lib/api/institutional";
import { useAuthStore } from "@/lib/auth";

/**
 * File a whole staff roll from one archive.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ ONE UPLOAD, NOT A PREVIEW THEN A COMMIT.
 *
 * The honour card import asks for the file twice: it GRANTS cards, taking a
 * B number per row from a sequence that must run unbroken, so confirming
 * forty of them deserves a check that the file still describes the same
 * forty.
 *
 * This one only FILES. Nothing is granted, no number is taken, and a filing
 * filed in error is deleted from the roll. Demanding ten megabytes a second
 * time for a reversible act would be ceremony.
 *
 * ⚠️ WHICH MAKES THE RESULT SCREEN THE ONLY PLACE THE REFUSED ROWS APPEAR.
 * An import reporting "37 déposés" without naming the three it would not take
 * is one nobody can tell has finished.
 * ───────────────────────────────────────────────────────────────────────
 */
export function StaffImportDialog({
  open, onOpenChange, onImported,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImported: () => void;
}) {
  const t = useTranslations("institution");
  const token = useAuthStore((s) => s.token);
  const fileInput = useRef<HTMLInputElement>(null);

  const [result, setResult] = useState<ImportResult | null>(null);

  // Reset on every open, so a second import never shows the first's report.
  useEffect(() => {
    if (!open) setResult(null);
  }, [open]);

  const run = useMutation({
    mutationFn: (archive: File) => importStaff(archive, token),
    onSuccess: (data) => {
      setResult(data);
      onImported();
    },
    onError: (e) => toast.error(t("importFailed"), {
      description: e instanceof Error ? e.message : t("tryAgain"),
    }),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 overflow-hidden p-0 sm:max-w-3xl">
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>
            {result ? t("importDoneTitle") : t("importTitle")}
          </DialogTitle>
          <DialogDescription>
            {result ? t("importDoneBody") : t("importBody")}
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6">
          {!result ? (
            <div className="space-y-5">
              {/* ⚠️ THE TEMPLATE COMES FIRST, before the upload control.
                  An institution that has not seen the columns will send
                  something that fails on the first row — and a format nobody
                  can produce is a feature nobody can use. */}
              <div className="flex flex-wrap items-center gap-4 rounded-xl border border-[var(--line)] bg-[#fbfcfb] px-5 py-4">
                <FileSpreadsheet className="h-5 w-5 flex-none text-[var(--green-700)]" />
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-bold text-[var(--green-900)]">
                    {t("templateTitle")}
                  </p>
                  <p className="mt-0.5 text-[12.5px] leading-relaxed text-[var(--slate)]">
                    {t("templateBody")}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-none"
                  onClick={() => downloadStaffTemplate(token).catch((e) =>
                    toast.error(t("templateFailed"), {
                      description: e instanceof Error ? e.message : t("tryAgain"),
                    }))}
                >
                  <Download className="h-3.5 w-3.5" />
                  {t("templateAction")}
                </Button>
              </div>

              <div className="rounded-xl bg-[var(--green-tint)] px-5 py-4">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">
                  {t("archiveShape")}
                </p>
                <pre dir="ltr" className="mt-2.5 font-mono text-[12px] leading-relaxed text-[var(--green-900)]">
{`import.zip
├── agents.xlsx
└── photos/
    ├── 1234567890.jpg
    └── 9876543210.png`}
                </pre>
                <p className="mt-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
                  {t("archiveNote")}
                </p>
              </div>

              <input
                ref={fileInput}
                type="file"
                accept=".zip,application/zip"
                className="hidden"
                onChange={(e) => {
                  const chosen = e.target.files?.[0];
                  if (chosen) run.mutate(chosen);
                  e.target.value = "";
                }}
              />

              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={run.isPending}
                className="flex w-full flex-col items-center justify-center gap-2.5 rounded-xl border-2 border-dashed border-[var(--line)] px-6 py-10 transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40 disabled:opacity-60"
              >
                {run.isPending
                  ? <Loader2 className="h-7 w-7 animate-spin text-[var(--green-600)]" />
                  : <Upload className="h-7 w-7 text-[var(--green-600)]" />}
                <span className="text-[13.5px] font-bold text-[var(--green-900)]">
                  {run.isPending ? t("importReading") : t("importChoose")}
                </span>
                <span className="text-center text-[12.5px] text-[var(--slate)]">
                  {t("importChooseHint")}
                </span>
              </button>
            </div>
          ) : (
            <div className="space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <Tally value={result.filed} label={t("tallyFiled")} tone="green" />
                <Tally value={result.photosAttached} label={t("tallyPhotos")} tone="plain" />
                <Tally value={result.failed + result.rejected.length}
                       label={t("tallyRefused")} tone="red" />
              </div>

              {/*
                ⚠️ REFUSED ROWS FIRST, AND NAMED.
                
                This is the only screen where they appear — there is no
                preview step. An institution that reads "37 déposés" and
                closes the dialog has lost the three it must correct.
              */}
              {result.rejected.length > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red-700)]">
                    {t("refusedHeading")}
                  </p>
                  <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                    {result.rejected.map((row) => (
                      <li key={row.rowNumber} className="flex items-start gap-3 px-4 py-3">
                        <X className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--red-700)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[var(--green-900)]">
                            <span className="font-mono text-[11px] font-normal text-[var(--muted-fg)]">
                              L.{row.rowNumber}
                            </span>{" "}
                            <span dir="auto" className="user-text">
                              {row.fullName || "—"}
                            </span>
                          </p>
                          <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--red-700)]">
                            {row.errorFr}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {result.failed > 0 && (
                <div>
                  <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--red-700)]">
                    {t("failedHeading")}
                  </p>
                  <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                    {result.outcomes.filter((o) => !o.filed).map((o) => (
                      <li key={o.rowNumber} className="flex items-start gap-3 px-4 py-3">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--gold-700)]" />
                        <div className="min-w-0 flex-1">
                          <p className="text-[13px] font-bold text-[var(--green-900)]">
                            <span dir="auto" className="user-text">{o.fullName}</span>
                          </p>
                          <p className="text-[12px] text-[var(--gold-700)]">{o.failureFr}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* ⚠️ The photograph gap, named as an action rather than a
                  statistic. Those filings become cards that never reach the
                  printer. */}
              {result.filed > result.photosAttached && (
                <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                  <Camera className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  <span>
                    <b className="font-bold">
                      {t("photosMissing", { count: result.filed - result.photosAttached })}
                    </b>{" "}
                    {t("photosMissingHint")}
                  </span>
                </p>
              )}

              {result.filed > 0 && (
                <ul className="divide-y divide-[var(--line)] overflow-hidden rounded-xl border border-[var(--line)]">
                  {result.outcomes.filter((o) => o.filed).map((o) => (
                    <li key={o.rowNumber} className="flex items-center gap-3 px-4 py-2.5">
                      <Check className="h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
                      <span dir="auto" className="user-text min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--green-900)]">
                        {o.fullName}
                      </span>
                      {o.photoAttached
                        ? <Camera className="h-3 w-3 flex-none text-[var(--green-600)]" />
                        : <CameraOff className="h-3 w-3 flex-none text-[var(--gold-700)]" />}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
          <Button
            className="w-full sm:w-auto"
            variant={result ? "default" : "outline"}
            onClick={() => onOpenChange(false)}
          >
            {result ? t("done") : t("cancel")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

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
