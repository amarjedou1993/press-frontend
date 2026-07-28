"use client";
// src/components/candidate/DocumentUploader.tsx
// Adds evidence: a FILE upload, or LINKS.
//
// TWO IMPROVEMENTS over the first version:
//
// 1. MULTIPLE LINKS AT ONCE. A category requiring three published articles
//    used to mean opening this dialog three times. Now the dialog opens with
//    as many inputs as are still missing, they are validated together, and
//    they are sent together. Asking someone to repeat a modal three times is
//    a tax on the applicant for our convenience.
//
// 2. HONEST FILE VALIDATION. An empty or corrupt file used to be refused with
//    whatever message the server happened to produce. Now: zero-byte files
//    are named as such, and images/PDFs are checked for a valid signature
//    (magic bytes) rather than trusting the extension — a .pdf that is
//    actually a renamed .exe has the wrong first four bytes.

import { useState, useRef, useEffect } from "react";
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

const LABELS: Record<DocumentType, { fr: string; hint: string; isFile: boolean }> = {
  CONTRACT: {
    fr: "Contrat de travail",
    hint: "PDF ou photo de votre contrat en cours de validité.",
    isFile: true,
  },
  WORK_CERTIFICATE: {
    fr: "Attestation de travail",
    hint: "Document délivré par votre employeur.",
    isFile: true,
  },
  WEBSITE: {
    fr: "Site web professionnel",
    hint: "Adresse de votre site ou blog professionnel.",
    isFile: false,
  },
  WORK_LINK: {
    fr: "Liens de publication",
    hint: "Adresses d'articles que vous avez publiés.",
    isFile: false,
  },
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
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const fileInput = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [urls, setUrls] = useState<string[]>([""]);
  const [urlErrors, setUrlErrors] = useState<Record<number, string>>({});
  const [error, setError] = useState<string>();
  const [checking, setChecking] = useState(false);

  const meta = docType ? LABELS[docType] : null;

  // Open with as many inputs as are still missing (capped for sanity).
  useEffect(() => {
    if (open && meta && !meta.isFile) {
      setUrls(Array.from({ length: Math.min(Math.max(remaining, 1), 10) }, () => ""));
      setUrlErrors({});
    }
  }, [open, remaining, meta]);

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
      toast.success("Pièce ajoutée", { description: `${meta?.fr} a été téléversé.` });
      close();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "Le téléversement a échoué."),
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
        toast.success(
          total === 1 ? "Lien ajouté" : `${total} liens ajoutés`,
          { description: `${meta?.fr} enregistré.` }
        );
        close();
      } else {
        // Say exactly what happened rather than pretending it all worked.
        toast.warning(`${total - failed} lien(s) ajouté(s), ${failed} en échec`, {
          description: "Vérifiez les adresses restantes et réessayez.",
        });
      }
    },
    onError: (e) =>
      setError(e instanceof ApiError ? (e.problem.detail ?? e.message) : "L'ajout a échoué."),
  });

  async function pickFile(selected: File | undefined) {
    setError(undefined);
    if (!selected) return;

    // Zero bytes: a real case (interrupted copy, empty scan) that a size
    // check alone would let through with a confusing server error.
    if (selected.size === 0) {
      setError("Ce fichier est vide (0 octet). Vérifiez-le et réessayez.");
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

    // The extension proves nothing; the first bytes do.
    setChecking(true);
    try {
      const genuine = await looksLikeItsType(selected);
      if (!genuine) {
        setError(
          "Ce fichier semble endommagé ou n'est pas du format annoncé. " +
          "Ouvrez-le pour vérifier, puis réessayez."
        );
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

  function submitLinks() {
    setError(undefined);
    const errors: Record<number, string> = {};
    const filled: string[] = [];
    const seen = new Set<string>();

    urls.forEach((raw, i) => {
      const value = raw.trim();
      if (!value) return;                       // blanks are simply skipped
      if (!isValidUrl(value)) {
        errors[i] = "Adresse invalide (exemple : https://exemple.mr/article)";
        return;
      }
      if (seen.has(value)) {
        errors[i] = "Ce lien est déjà saisi ci-dessus.";
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
      setError("Saisissez au moins une adresse.");
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
          <DialogTitle>{meta?.fr ?? "Ajouter une pièce"}</DialogTitle>
          <DialogDescription>
            {meta?.hint}
            {!meta?.isFile && remaining > 1 && (
              <> Vous pouvez en saisir {remaining} d&apos;un coup.</>
            )}
          </DialogDescription>
        </DialogHeader>

        {meta?.isFile ? (
          /* ══ file ══ */
          <Field data-invalid={!!error}>
            <FieldLabel htmlFor="doc-file">Fichier</FieldLabel>

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
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                disabled={checking}
                className="flex w-full flex-col items-center gap-2 rounded-xl border-2 border-dashed border-[var(--line)] p-8 transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40 disabled:opacity-60"
              >
                <Upload className="h-6 w-6 text-[var(--muted-fg)]" />
                <span className="text-[13px] font-semibold text-[var(--green-700)]">
                  {checking ? "Vérification…" : "Choisir un fichier"}
                </span>
                <span className="text-[11.5px] text-[var(--muted-fg)]">
                  PDF, JPEG ou PNG · {MAX_SIZE_MB} Mo maximum
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
                  {urls.length > 1 ? `Lien ${i + 1}` : "Adresse"}
                </FieldLabel>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--muted-fg)]" />
                    <Input
                      id={`doc-url-${i}`}
                      type="url"
                      inputMode="url"
                      className="pl-9"
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
                      aria-label={`Retirer le lien ${i + 1}`}
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
                <Plus className="h-3.5 w-3.5" /> Ajouter un autre lien
              </button>
            )}

            <FieldDescription>
              Les adresses doivent être publiquement accessibles pour que la
              commission puisse les consulter. Les champs vides sont ignorés.
            </FieldDescription>

            {error && <FieldError errors={[{ message: error }]} />}
          </div>
        )}

        <DialogFooter>
          <Button type="button" variant="outline" onClick={close}>
            Annuler
          </Button>
          <Button
            type="button"
            onClick={() => (meta?.isFile ? upload.mutate() : submitLinks())}
            disabled={pending || (meta?.isFile ? !file : filledCount === 0)}
          >
            {pending
              ? "Envoi…"
              : meta?.isFile
                ? "Téléverser"
                : filledCount > 1
                  ? `Ajouter ${filledCount} liens`
                  : "Ajouter le lien"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
