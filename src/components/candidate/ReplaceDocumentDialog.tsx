"use client";
// src/components/candidate/ReplaceDocumentDialog.tsx
//
// Replacing a piece the commission flagged.
//
// The observation sits at the top, in front of the candidate while they
// choose the replacement — a correction made without re-reading what was
// asked is a correction that comes back.
//
// ⚠️ Most strings here duplicate DocumentUploader's. They share the
// `uploader` namespace deliberately: "PDF, JPEG or PNG · 10 Mo maximum"
// stated two different ways in two dialogs is how a limit stops being
// believed.

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, FileText, X, Link2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  replaceDocument, replaceLink, correctionKeys, type OutstandingItem,
} from "@/lib/api/correction";
import { applicationKeys } from "@/lib/api/applications";
import { useAuthStore } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";

const MAX_SIZE_MB = 10;
const ACCEPTED = ["application/pdf", "image/jpeg", "image/png"];

/** A link document by type — a website or a published article. */
const LINK_TYPES = new Set(["WEBSITE", "WORK_LINK"]);

/** The bytes, not the extension. A .txt renamed .pdf fails here. */
async function looksLikeItsType(file: File): Promise<boolean> {
  const head = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);

  switch (file.type) {
    case "application/pdf": return startsWith(0x25, 0x50, 0x44, 0x46);
    case "image/jpeg": return startsWith(0xff, 0xd8, 0xff);
    case "image/png": return startsWith(0x89, 0x50, 0x4e, 0x47);
    default: return false;
  }
}

export function ReplaceDocumentDialog({
  applicationId,
  item,
  open,
  onOpenChange,
}: {
  applicationId: number;
  item: OutstandingItem | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}) {
  const t = useTranslations("uploader");
  const tr = useTranslations("replace");
  const td = useTranslations("documentType");

  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const isLink = item ? LINK_TYPES.has(item.docType) : false;
  const typeLabel = item ? td(item.docType) : "";

  const reset = () => { setFile(null); setUrl(""); setError(undefined); };
  const close = () => { reset(); onOpenChange(false); };

  const refresh = () => {
    qc.invalidateQueries({ queryKey: correctionKeys.state(applicationId) });
    qc.invalidateQueries({ queryKey: applicationKeys.detail(applicationId) });
  };

  const upload = useMutation({
    mutationFn: () => replaceDocument(applicationId, item!.documentId, file!, token),
    onSuccess: () => {
      refresh();
      toast.success(tr("pieceReplaced"), {
        description: tr("updated", { type: typeLabel }),
      });
      close();
    },
    onError: (e) => setError(e instanceof Error ? e.message : tr("replaceFailed")),
  });

  const link = useMutation({
    mutationFn: () => replaceLink(applicationId, item!.documentId, url.trim()),
    onSuccess: () => {
      refresh();
      toast.success(tr("linkReplaced"), {
        description: tr("updated", { type: typeLabel }),
      });
      close();
    },
    onError: (e) =>
      setError(e instanceof ApiError
        ? (e.problem.detail ?? e.message)
        : tr("replaceFailed")),
  });

  async function pick(selected: File | undefined) {
    setError(undefined);
    if (!selected) return;

    if (selected.size === 0) { setError(t("emptyFile")); return; }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(t("tooLarge", { max: MAX_SIZE_MB }));
      return;
    }
    if (!ACCEPTED.includes(selected.type)) { setError(t("wrongFormat")); return; }

    setChecking(true);
    try {
      if (!(await looksLikeItsType(selected))) {
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

  function submit() {
    setError(undefined);
    if (!item) return;

    if (isLink) {
      const value = url.trim();
      if (!value) { setError(t("atLeastOne")); return; }
      try {
        const parsed = new URL(value);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        setError(t("invalidUrl"));
        return;
      }
      link.mutate();
    } else {
      if (!file) { setError(tr("chooseAFile")); return; }
      upload.mutate();
    }
  }

  const pending = upload.isPending || link.isPending || checking;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[520px]">
        <DialogHeader className="flex-none">
          <DialogTitle>{tr("title", { type: typeLabel })}</DialogTitle>
          <DialogDescription>{tr("previousKept")}</DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {/* ── the reason, in front of them while they choose ── */}
          {item?.observation && (
            <div className="rounded-xl border border-[var(--gold-500)]/45 bg-[var(--gold-tint)] p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--gold-700)]">
                <AlertTriangle className="h-3 w-3 flex-none" />
                {tr("observation")}
              </p>
              {/* ⚠️ dir="auto" — written by a commission member, in whichever
                  language they use, and never translated. */}
              <p dir="auto"
                className="user-text mt-1.5 whitespace-pre-wrap text-[13.5px] leading-relaxed text-[var(--gold-700)]">
                {item.observation}
              </p>
            </div>
          )}

          {isLink ? (
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="replace-url">{tr("newAddress")}</FieldLabel>
              <div className="relative">
                <Link2 className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                {/* ⚠️ dir="ltr": a URL's slashes and dots reorder in an RTL
                    field, and someone typing a link in an Arabic page would
                    watch it scramble as they went. */}
                <Input id="replace-url" type="url" inputMode="url"
                  dir="ltr" className="ps-9 text-start"
                  placeholder="https://exemple.mr/mon-article"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(undefined); }}
                  aria-invalid={!!error} />
              </div>
              <FieldDescription>{tr("mustBePublic")}</FieldDescription>
              {error && <FieldError errors={[{ message: error }]} />}
            </Field>
          ) : (
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="replace-file">{tr("newFile")}</FieldLabel>

              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-3.5">
                  <FileText className="h-5 w-5 flex-none text-[var(--green-700)]" />
                  <div className="min-w-0 flex-1">
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
                <button type="button" onClick={() => fileInput.current?.click()}
                  disabled={checking}
                  className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--line)] p-8 transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40 disabled:opacity-60">
                  <Upload className="h-6 w-6 text-[var(--muted-fg)]" />
                  <span className="text-[13px] font-semibold text-[var(--green-700)]">
                    {checking ? t("checking") : t("chooseFile")}
                  </span>
                  <span className="text-[11.5px] text-[var(--muted-fg)]">
                    {t("formats", { max: MAX_SIZE_MB })}
                  </span>
                </button>
              )}

              <input ref={fileInput} id="replace-file" type="file"
                accept={ACCEPTED.join(",")} className="hidden"
                onChange={(e) => pick(e.target.files?.[0])} />

              {error && <FieldError errors={[{ message: error }]} />}
            </Field>
          )}
        </div>

        <DialogFooter className="flex-none border-t border-[var(--line)] pt-4">
          <Button variant="outline" onClick={close}>{t("cancel")}</Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? t("sending") : tr("replaceAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
