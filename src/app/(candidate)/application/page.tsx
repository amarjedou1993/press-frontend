"use client";
// src/app/(candidate)/application/page.tsx
// The dossier: pieces, checklist, submission, and history.
//
// Two faces, one page. While the dossier is a DRAFT it is a workspace — add
// pieces, watch the checklist close, submit when the server says it may. Once
// submitted it becomes a record — the timeline takes over and nothing is
// editable. Which face shows is decided by `editable` from the backend, never
// by the frontend's own reading of the status.

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  FileText, Link2, Trash2, Send, Download, History, AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { RequirementChecklist } from "@/components/candidate/RequirementChecklist";
import { StatusTimeline } from "@/components/candidate/StatusTimeline";
import { DossierProgress } from "@/components/candidate/DossierProgress";
import { DocumentUploader } from "@/components/candidate/DocumentUploader";
import {
  listMyApplications, getApplication, removeDocument, submitApplication,
  documentFileUrl, applicationKeys, STATUS_KIND, type DocumentType,
} from "@/lib/api/applications";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

export default function ApplicationPage() {
  const router = useRouter();
  const qc = useQueryClient();

  // const [uploadFor, setUploadFor] = useState<DocumentType | null>(null);
  const [uploadFor, setUploadFor] =
    useState<{ docType: DocumentType; remaining: number } | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const list = useQuery({ queryKey: applicationKeys.all, queryFn: listMyApplications });
  const currentId = list.data?.[0]?.id;

  const detail = useQuery({
    queryKey: applicationKeys.detail(currentId!),
    queryFn: () => getApplication(currentId!),
    enabled: !!currentId,
  });

  const refresh = () => {
    qc.invalidateQueries({ queryKey: applicationKeys.detail(currentId!) });
    qc.invalidateQueries({ queryKey: applicationKeys.all });
  };

  const remove = useMutation({
    mutationFn: (documentId: number) => removeDocument(currentId!, documentId),
    onSuccess: () => {
      refresh(); setDeleting(null);
      toast.success("Pièce retirée");
    },
    onError: (e) => {
      setDeleting(null);
      toast.error("Suppression impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      });
    },
  });

  const submit = useMutation({
    mutationFn: () => submitApplication(currentId!),
    onSuccess: () => {
      refresh(); setConfirmSubmit(false);
      toast.success("Dossier soumis", {
        description: "Votre demande a été transmise à la commission d'examen.",
      });
    },
    onError: (e) => {
      setConfirmSubmit(false);
      // 422 carries the blockers; the checklist already displays them.
      toast.error("Soumission refusée", {
        description: e instanceof ApiError
          ? (e.problem.detail ?? "Certaines conditions ne sont pas remplies.")
          : "Réessayez.",
      });
    },
  });

  if (list.isLoading || (currentId && detail.isLoading)) {
    return <Skeleton className="mx-auto h-96 max-w-4xl rounded-2xl" />;
  }

  /* ── no dossier yet ── */
  if (!currentId || !detail.data) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <VerificationBanner />
        <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
          <FileText className="mx-auto h-9 w-9 text-[var(--muted-fg)]" />
          <p className="mt-4 text-[15px] font-extrabold text-[var(--green-900)]">
            Aucune demande en cours
          </p>
          <p className="mt-2 text-[13.5px] text-[var(--slate)]">
            Vous n&apos;avez pas encore déposé de demande de carte de presse.
          </p>
          <Button className="mt-5"
            onClick={() => router.push(routes.candidate.newApplication)}>
            Déposer une demande
          </Button>
        </div>
      </div>
    );
  }

  const { application, documents, timeline, readiness } = detail.data;
  const kind = STATUS_KIND[application.status];
  const editable = application.editable;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {/* ── header ── */}
      <section
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
        style={{
          background:
            "radial-gradient(700px 340px at 90% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true"
        />
        <svg className="pointer-events-none absolute -right-24 -top-28 h-80 w-80 opacity-[0.06]"
          viewBox="0 0 400 400" fill="none" aria-hidden="true">
          <g stroke="#fff" strokeWidth="0.6">
            {Array.from({ length: 30 }).map((_, i) => (
              <ellipse key={i} cx="200" cy="200" rx="180" ry="62"
                transform={`rotate(${(i * 180) / 30} 200 200)`} />
            ))}
          </g>
        </svg>

        <div className="relative z-10 p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div>
              <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
                Dossier de candidature
              </p>
              <div className="mt-2.5 flex flex-wrap items-center gap-3">
                <h2 className="text-[26px] font-extrabold leading-tight">
                  {application.statusLabelFr}
                </h2>
                <span className="font-mono text-[11.5px] text-white/40">
                  n° {application.id}
                </span>
              </div>
              {application.submittedAt && (
                <p className="mt-2 text-[13px] text-white/60">
                  Soumis le{" "}
                  {new Date(application.submittedAt).toLocaleDateString("fr-FR", {
                    day: "numeric", month: "long", year: "numeric",
                  })}
                </p>
              )}
            </div>
            <span
              className="rounded-full px-4 py-1.5 text-[12px] font-extrabold"
              style={{
                background: `var(--st-${kind}-bg)`,
                color: `var(--st-${kind}-fg)`,
              }}
            >
              {application.statusLabelFr}
            </span>
          </div>

          <div className="mt-7 rounded-xl bg-black/20 px-5 py-5">
            <DossierProgress status={application.status} />
          </div>
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      {/* ── correction notice ── */}
      {application.status === "CORRECTION_REQUESTED" && (
        <div className="flex items-start gap-3 rounded-xl border border-[var(--gold-500)] bg-[var(--gold-tint)] p-5">
          <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-[var(--gold-700)]" />
          <div>
            <p className="text-[14px] font-extrabold text-[var(--gold-700)]">
              Des corrections vous sont demandées
            </p>
            <p className="mt-1 text-[13.5px] leading-relaxed text-[var(--gold-700)]">
              Remplacez les pièces signalées ci-dessous, puis soumettez à
              nouveau votre dossier avant la fin de la phase de correction.
            </p>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* ── pieces ── */}
        <div className="space-y-6">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              Pièces jointes
            </p>

            {documents.length === 0 ? (
              <p className="mt-4 text-[13.5px] text-[var(--slate)]">
                Aucune pièce pour le moment. Utilisez la liste des exigences
                pour ajouter les documents demandés.
              </p>
            ) : (
              <ul className="mt-4 divide-y divide-[var(--line)]">
                {documents.map((d) => (
                  <li key={d.id} className="flex items-start gap-3 py-3.5">
                    <span
                      className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-lg"
                      style={{
                        background: d.needsCorrection ? "var(--gold-tint)" : "var(--green-tint)",
                        color: d.needsCorrection ? "var(--gold-700)" : "var(--green-700)",
                      }}
                    >
                      {d.kind === "FILE" ? <FileText className="h-4 w-4" />
                                         : <Link2 className="h-4 w-4" />}
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
                        <a href={d.url} target="_blank" rel="noopener noreferrer"
                          className="truncate text-[12.5px] text-[var(--green-700)] underline underline-offset-2">
                          {d.url}
                        </a>
                      ) : (
                        <a href={documentFileUrl(application.id, d.id)}
                          target="_blank" rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[12.5px] text-[var(--green-700)] underline underline-offset-2">
                          <Download className="h-3 w-3" /> Consulter le fichier
                        </a>
                      )}
                      {d.needsCorrection && d.observation && (
                        <p className="mt-1.5 rounded-lg bg-[var(--gold-tint)] px-2.5 py-1.5 text-[12.5px] text-[var(--gold-700)]">
                          <b>Observation :</b> {d.observation}
                        </p>
                      )}
                    </div>

                    {editable && (
                      <button
                        type="button"
                        onClick={() => setDeleting(d.id)}
                        aria-label={`Retirer ${d.docTypeLabelFr}`}
                        title="Retirer"
                        className="flex-none rounded-lg p-1.5 text-[var(--muted-fg)] transition-colors hover:bg-[var(--red-tint)] hover:text-[var(--red-500)]"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* ── timeline ── */}
          {timeline.length > 0 && (
            <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
              <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                <History className="h-3.5 w-3.5" /> Historique
              </p>
              <div className="mt-5">
                <StatusTimeline entries={timeline} />
              </div>
            </div>
          )}
        </div>

        {/* ── checklist + submit ── */}
        <div className="space-y-6 lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
              {editable ? "Ce qu'il vous reste à faire" : "Pièces du dossier"}
            </p>
            <div className="mt-4">
              <RequirementChecklist
                readiness={readiness}
                editable={editable}  
                // onAdd={editable ? (t) => setUploadFor(t) : undefined}
              onAdd={
                  editable
                    ? (docType) => {
                        // How many of this type are still missing — the
                        // uploader opens with that many inputs.
                        const req =
                          readiness.mandatory.find((r) => r.docType === docType) ??
                          readiness.alternativeGroups
                            .flatMap((g) => g.options)
                            .find((r) => r.docType === docType);
                        const remaining = req
                          ? Math.max(req.required - req.provided, 1)
                          : 1;
                        setUploadFor({ docType, remaining });
                      }
                    : undefined
                }
              />
            </div>

            {editable && (
              <Button
                className="mt-6 w-full"
                size="lg"
                disabled={!readiness.canSubmit || submit.isPending}
                onClick={() => setConfirmSubmit(true)}
              >
                <Send className="h-4 w-4" />
                Soumettre mon dossier
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* ── dialogs ── */}

      <DocumentUploader
        applicationId={application.id}
        docType={uploadFor?.docType ?? null}
        remaining={uploadFor?.remaining ?? 1}
        open={!!uploadFor}
        onOpenChange={(o) => !o && setUploadFor(null)}
      />

      <AlertDialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Retirer cette pièce ?</AlertDialogTitle>
            <AlertDialogDescription>
              Elle sera supprimée de votre dossier. Vous pourrez en ajouter une
              autre tant que votre dossier n&apos;est pas soumis.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
              onClick={() => deleting && remove.mutate(deleting)}
            >
              Retirer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={confirmSubmit} onOpenChange={setConfirmSubmit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Soumettre votre dossier ?</AlertDialogTitle>
            <AlertDialogDescription>
              Votre dossier sera transmis à la commission d&apos;examen.
              <br />
              <span className="mt-2 block font-medium text-[var(--red-500)]">
                Après soumission, vous ne pourrez plus modifier vos pièces —
                sauf si la commission vous demande une correction.
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => submit.mutate()}
              disabled={submit.isPending}
            >
              {submit.isPending ? "Envoi…" : "Confirmer la soumission"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
