"use client";
// src/components/candidate/ReplaceDocumentDialog.tsx
// Replacing one flagged piece.
//
// The dialog SHOWS THE COMMISSION'S OBSERVATION while the candidate chooses
// the replacement. Being told "scan illisible" on a previous screen and then
// asked for a file in the abstract is how someone uploads the same bad scan
// again — the reason must be in front of them at the moment they act.

import { useRef, useState } from "react";
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
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const isLink = item ? LINK_TYPES.has(item.docType) : false;

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
      toast.success("Pièce remplacée", {
        description: `${item?.docTypeLabelFr} a été mise à jour.`,
      });
      close();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Le remplacement a échoué."),
  });

  const link = useMutation({
    mutationFn: () => replaceLink(applicationId, item!.documentId, url.trim()),
    onSuccess: () => {
      refresh();
      toast.success("Lien remplacé", {
        description: `${item?.docTypeLabelFr} a été mis à jour.`,
      });
      close();
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "Le remplacement a échoué."),
  });

  async function pick(selected: File | undefined) {
    setError(undefined);
    if (!selected) return;

    if (selected.size === 0) {
      setError("Ce fichier est vide (0 octet).");
      return;
    }
    if (selected.size > MAX_SIZE_MB * 1024 * 1024) {
      setError(`Le fichier dépasse ${MAX_SIZE_MB} Mo.`);
      return;
    }
    if (!ACCEPTED.includes(selected.type)) {
      setError("Formats acceptés : PDF, JPEG, PNG.");
      return;
    }

    setChecking(true);
    try {
      if (!(await looksLikeItsType(selected))) {
        setError("Ce fichier semble endommagé ou n'est pas du format annoncé.");
        return;
      }
    } catch {
      setError("Ce fichier n'a pas pu être lu.");
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
      if (!value) { setError("Saisissez une adresse."); return; }
      try {
        const parsed = new URL(value);
        if (!["http:", "https:"].includes(parsed.protocol)) throw new Error();
      } catch {
        setError("Adresse invalide (exemple : https://exemple.mr/article)");
        return;
      }
      link.mutate();
    } else {
      if (!file) { setError("Choisissez un fichier."); return; }
      upload.mutate();
    }
  }

  const pending = upload.isPending || link.isPending || checking;

  return (
    <Dialog open={open} onOpenChange={(o) => (o ? onOpenChange(true) : close())}>
      <DialogContent className="flex max-h-[85vh] flex-col sm:max-w-[520px]">
        <DialogHeader className="flex-none">
          <DialogTitle>Remplacer : {item?.docTypeLabelFr}</DialogTitle>
          <DialogDescription>
            La pièce précédente est conservée dans l&apos;historique de votre
            dossier ; c&apos;est la nouvelle version qui sera examinée.
          </DialogDescription>
        </DialogHeader>

        <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-1">
          {/* ── the reason, in front of them while they choose ── */}
          {item?.observation && (
            <div className="rounded-xl border border-[var(--gold-500)]/45 bg-[var(--gold-tint)] p-4">
              <p className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--gold-700)]">
                <AlertTriangle className="h-3 w-3" />
                Observation de la commission
              </p>
              <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--gold-700)]">
                {item.observation}
              </p>
            </div>
          )}

          {isLink ? (
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="replace-url">Nouvelle adresse</FieldLabel>
              <div className="relative">
                <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                <Input id="replace-url" type="url" inputMode="url" className="pl-9"
                  placeholder="https://exemple.mr/mon-article"
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setError(undefined); }}
                  aria-invalid={!!error} />
              </div>
              <FieldDescription>
                L&apos;adresse doit être publiquement accessible.
              </FieldDescription>
              {error && <FieldError errors={[{ message: error }]} />}
            </Field>
          ) : (
            <Field data-invalid={!!error}>
              <FieldLabel htmlFor="replace-file">Nouveau fichier</FieldLabel>

              {file ? (
                <div className="flex items-center gap-3 rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-3.5">
                  <FileText className="h-5 w-5 flex-none text-[var(--green-700)]" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[13px] font-semibold text-[var(--ink)]">
                      {file.name}
                    </p>
                    <p className="text-[11.5px] text-[var(--slate)]">
                      {(file.size / 1024 / 1024).toFixed(2)} Mo
                    </p>
                  </div>
                  <button type="button" onClick={() => setFile(null)}
                    aria-label="Retirer le fichier"
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
                    {checking ? "Vérification…" : "Choisir un fichier"}
                  </span>
                  <span className="text-[11.5px] text-[var(--muted-fg)]">
                    PDF, JPEG ou PNG · {MAX_SIZE_MB} Mo maximum
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
          <Button variant="outline" onClick={close}>Annuler</Button>
          <Button onClick={submit} disabled={pending}>
            {pending ? "Envoi…" : "Remplacer la pièce"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
