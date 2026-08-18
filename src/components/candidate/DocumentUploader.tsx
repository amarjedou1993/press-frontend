"use client";
// src/components/candidate/DocumentUploader.tsx
//
// Adding a supporting document — a file, or one or more published links.
//
// ⚠️ THE LABELS ARE NO LONGER DUPLICATED HERE. This file carried its own
// French names for the four document types, alongside the ones the backend
// already sends and the ones CompletenessService uses. Three copies of one
// list drift; the `documentType` namespace is now the single source.

import { useState, useRef, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, X, Plus, Trash2, Link2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  uploadDocument, attachLink, applicationKeys, type DocumentType,
} from "@/lib/api/applications";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

const MAX_SIZE_MB = 10;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];

/** Which types are uploaded and which are typed. Everything else is a key. */
const IS_FILE: Record<DocumentType, boolean> = {
  CONTRACT: true,
  WORK_CERTIFICATE: true,
  WEBSITE: false,
  WORK_LINK: false,
};

/* ── file signature check: the bytes, not the extension ── */
async function looksLikeItsType(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const startsWith = (...bytes: number[]) =>
    bytes.every((b, i) => head[i] === b);

  switch (file.type) {
    case "application/pdf":
      return startsWith(0x25, 0x50, 0x44, 0x46);              // %PDF
    case "image/jpeg":
      return startsWith(0xff, 0xd8, 0xff);                     // JPEG SOI
    case "image/png":
      return startsWith(0x89, 0x50, 0x4e, 0x47);               // \x89PNG
    default:
      return false;
  }
}

function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    // A javascript: or data: URL is not a publication.
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function DocumentUploader({
  applicationId,
  docType,
  /** How many more of this type are needed — drives the number of inputs. */
  remaining = 1,
  open,
  onOpenChange,
}: {
  applicationId: number;
  docType: DocumentType | null;
  remaining?: number;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations("uploader");
  const td = useTranslations("documentType");
  const th = useTranslations("documentHint");

  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const isFile = docType ? IS_FILE[docType] : false;
  const typeLabel = docType ? td(docType) : t("addPiece");

  // Open with as many inputs as are still missing (capped for sanity).
  useEffect(() => {
    if (open && docType && !IS_FILE[docType]) {
      setUrls(Array.from({ length: Math.min(Math.max(remaining, 1), 10) }, () => ""));
      setUrlErrors({});
    }
  }, [open, remaining, docType]);

  const reset = () => {
    setFile(null); setUrls([""]); setUrlErrors({}); setError(undefined);
  };
  const close = () => { reset(); onOpenChange(false); };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
    qc.invalidateQueries({ queryKey: applicationKeys.readiness(applicationId) });
  };

  const upload = useMutation({
    mutationFn: () => uploadDocument(applicationId, docType!, file!, token),
    onSuccess: () => {
      refresh();
      toast.success(t("pieceAdded"), { description: t("uploaded", { type: typeLabel }) });
      close();
    },
    onError: (e) => setError(e instanceof Error ? e.message : t("uploadFailed")),
  });

  /** All links in one go — partial success is reported honestly. */
  const links = useMutation({
    mutationFn: async (values: string[]) => {
      const results = await Promise.allSettled(
        values.map((url) => attachLink(applicationId, { docType: docType!, url }))
      );
      const failed = results.filter((r) => r.status === "rejected").length;
      return { total: values.length, failed };
    },
    onSuccess: ({ total, failed }) => {
      refresh();
      if (failed === 0) {
        toast.success(t("linksAdded", { count: total }),
          { description: t("recorded", { type: typeLabel }) });
        close();
      } else {
        // Say exactly what happened rather than pretending it all worked.
        toast.warning(t("partialFailure", { added: total - failed, failed }), {
          description: t("checkRemaining"),
        });
      }
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : t("addFailed")),
  });

  async function pickFile(selected: File | undefined) {
    setError(undefined);
    if (!selected) return;

    // Zero bytes: a real case (interrupted copy, empty scan) that a size
    // check alone would let through with a confusing server error.
    if (selected.size === 0) {
      setError(t("emptyFile"));
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t("tooLarge", { max: MAX_SIZE_MB }));
      return;
    }
    if (!ACCEPTED.includes(selected.type)) {
      setError(t("wrongFormat"));
      return;
    }

    // The extension proves nothing; the first bytes do.
    setChecking(true);
    try {
      const genuine = await looksLikeItsType(selected);
      if (!genuine) {
        setError(t("corrupt"));
        return;
      }
    } catch {
      setError(t("unreadable"));
      return;
    } finally {
      setChecking(false);
    }

    setFile(selected);
  }

  function submitLinks() {
    setError(undefined);
    const errors: Record<number, string> = {};
    const filled: string[] = [];
    const seen = new Set<string>();

    urls.forEach((raw, i) => {
      const value = raw.trim();
      if (!value) return;                       // blanks are simply skipped
      if (!isValidUrl(value)) {
        errors[i] = t("invalidUrl");
        return;
      }
      if (seen.has(value)) {
        errors[i] = t("duplicateUrl");
        return;
      }
      seen.add(value);
      filled.push(value);
    });

    if (Object.keys(errors).length > 0) {
      setUrlErrors(errors);
      return;
    }
    if (filled.length === 0) {
      setError(t("atLeastOne"));
      return;
    }
    setUrlErrors({});
    links.mutate(filled);
  }

  const pending = upload.isPending || links.isPending || checking;
  const filledCount = urls.filter((u) => u.trim()).length;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{typeLabel}</DialogTitle>
          <DialogDescription>
            {docType && th(docType)}
            {!isFile && remaining > 1 && <> {t("severalAtOnce", { count: remaining })}</>}
          </DialogDescription>
        </DialogHeader>

        {isFile ? (
          /* ══ file ══ */
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="doc-file">{t("file")}</FieldLabel>

            {file ? (
              <div className="flex items-center gap-3 rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-3.5">
                <FileText className="h-5 w-5 flex-none text-[var(--green-700)]" />
                <div className="min-w-0 flex-1">
                  {/* dir="auto": a filename may be in either script, and
                      "rapport-2026.pdf" must not reorder in an Arabic page. */}
                  <p dir="auto" className="truncate text-[13px] font-semibold text-[var(--ink)]">
                    {file.name}
                  </p>
                  <p className="text-[11.5px] text-[var(--slate)]">
                    {t("megabytes", { size: (file.size / 1024 / 1024).toFixed(2) })}
                  </p>
                </div>
                <button type="button" onClick={() => setFile(null)}
                  aria-label={t("removeFile")}
                  className="flex-none rounded-lg p-1.5 text-[var(--muted-fg)] hover:bg-white hover:text-[var(--red-500)]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={checking}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--line)] p-8 transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40 disabled:opacity-60"
              >
                <Upload className="h-6 w-6 text-[var(--muted-fg)]" />
                <span className="text-[13px] font-semibold text-[var(--green-700)]">
                  {checking ? t("checking") : t("chooseFile")}
                </span>
                <span className="text-[11.5px] text-[var(--muted-fg)]">
                  {t("formats", { max: MAX_SIZE_MB })}
                </span>
              </button>
            )}

            <input ref={fileInput} id="doc-file" type="file"
              accept={ACCEPTED.join(",")} className="hidden"
              onChange={(e) => pickFile(e.target.files?.[0])} />

            {error && <FieldError errors={[{ message: error }]} />}
          </Field>
        ) : (
          /* ══ links ══ */
          <div className="space-y-3">
            {urls.map((value, i) => (
              <Field key={i} data-invalid={!!urlErrors[i]}>
                <FieldLabel htmlFor={`doc-url-${i}`}>
                  {urls.length > 1 ? t("linkNumber", { n: i + 1 }) : t("address")}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    {/* start-3 / ps-9: the icon sits at the reading edge. */}
                    <Link2 className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                    {/* ⚠️ dir="ltr" ALWAYS. A URL is a Latin string full of
                        slashes, dots and hyphens — every one of which
                        bidi-reorders inside an RTL field. Someone typing a
                        link in an Arabic page would watch it scramble as they
                        went. */}
                    <Input
                      id={`doc-url-${i}`}
                      type="url"
                      inputMode="url"
                      dir="ltr"
                      className="ps-9 text-start"
                      placeholder="https://exemple.mr/mon-article"
                      value={value}
                      aria-invalid={!!urlErrors[i]}
                      onChange={(e) => {
                        const next = [...urls];
                        next[i] = e.target.value;
                        setUrls(next);
                        if (urlErrors[i]) {
                          const { [i]: _drop, ...rest } = urlErrors;
                          setUrlErrors(rest);
                        }
                        setError(undefined);
                      }}
                    />
                  </div>
                  {urls.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setUrls(urls.filter((_, j) => j !== i));
                        setUrlErrors({});
                      }}
                      aria-label={t("removeLink", { n: i + 1 })}
                      className="flex-none rounded-lg p-2 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-500)]"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {urlErrors[i] && <FieldError errors={[{ message: urlErrors[i] }]} />}
              </Field>
            ))}

            {urls.length < 10 && (
              <button
                type="button"
                onClick={() => setUrls([...urls, ""])}
                className="inline-flex items-center gap-1.5 text-[12.5px] font-bold text-[var(--green-700)] hover:text-[var(--green-600)]"
              >
                <Plus className="h-3.5 w-3.5 flex-none" /> {t("addAnotherLink")}
              </button>
            )}

            <FieldDescription>{t("linksNote")}</FieldDescription>

            {error && <FieldError errors={[{ message: error }]} />}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            {t("cancel")}
          </Button>
          <Button
            type="button"
            onClick={() => (isFile ? upload.mutate() : submitLinks())}
            disabled={pending || (isFile ? !file : filledCount === 0)}
          >
            {pending
              ? t("sending")
              : isFile
                ? t("uploadAction")
                : t("addLinks", { count: filledCount })}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
