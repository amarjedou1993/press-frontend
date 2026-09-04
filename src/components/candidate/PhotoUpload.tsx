"use client";
// src/components/candidate/PhotoUpload.tsx
//
// The photograph that will be printed on the card.
//
// Every check runs BEFORE anything crosses the wire — size, format, real
// pixel dimensions, aspect ratio. A candidate on a weak connection should not
// upload four megabytes to be told the picture is landscape.

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Camera, Upload, RefreshCw, Trash2, AlertCircle, Check, Lock,
} from "lucide-react";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuthenticatedFile } from "@/lib/api/files";
import { useAuthStore } from "@/lib/auth";
import { useFieldError } from "@/lib/useFieldError";

const MIN_W = 600;
const MIN_H = 800;
const MAX_MB = 5;
const MIN_RATIO = 0.65;
const MAX_RATIO = 0.85;

const BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

export interface PhotoStatus {
  hasPhoto: boolean;
  uploadedAt: string | null;
  ageing: boolean;
}

export const photoKeys = { status: ["me", "photo", "status"] as const };

/**
 * Whether a photograph exists, and whether it is ageing.
 *
 * ⚠️ EXPORTED, because the profile page needs the same answer.
 *
 * It was written twice — once here and once inline in the page — under the
 * same query key. TanStack deduplicated the request, so nothing was visibly
 * wrong; but two implementations of one fetch drift, and this one decides
 * whether the page's completeness count is telling the truth.
 */
export async function fetchPhotoStatus(token: string | null): Promise<PhotoStatus> {
  const res = await fetch(`${BASE}/api/me/photo/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return { hasPhoto: false, uploadedAt: null, ageing: false };
  return res.json();
}

/**
 * Read the real dimensions before sending anything over the wire.
 *
 * ⚠️ It rejects with a KEY, fully qualified. This is a plain function outside
 * any component, so it has no access to translations — and the resolver reads
 * the ROOT namespace, which is why the "photo." prefix is not optional. A
 * bare "notAnImage" would reach the screen as that literal word.
 */
function inspect(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("photo.notAnImage"));
    };
    img.src = url;
  });
}

export function PhotoUpload({
  /** False until the identity record exists — the API requires it. */
  profileExists = true,
}: {
  profileExists?: boolean;
}) {
  const t = useTranslations("photo");
  const resolve = useFieldError();
  const qc = useQueryClient();
  const token = useAuthStore((s) => s.token);
  const input = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string>();
  const [version, setVersion] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const status = useQuery({
    queryKey: photoKeys.status,
    queryFn: () => fetchPhotoStatus(token),
  });

  // Fetched WITH the token — this is what makes the photo visible at all.
  const { url: photoUrl, loading: photoLoading } = useAuthenticatedFile(
    status.data?.hasPhoto ? "/api/me/photo" : null,
    version
  );

  const refresh = () => {
    qc.invalidateQueries({ queryKey: photoKeys.status });
    qc.invalidateQueries({ queryKey: ["me"] });
    setVersion((v) => v + 1);
  };

  const upload = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch(`${BASE}/api/me/photo`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
      if (!res.ok) {
        // The SERVER's own message if it sent one — which may itself be a key
        // ("validation.…") or a finished sentence. Either resolves below.
        let message = "photo.uploadFailed";
        try {
          const body = await res.json();
          message = body.detail ?? body.message ?? message;
        } catch { /* keep the key */ }
        throw new Error(message);
      }
      return res.json();
    },
    onSuccess: () => {
      refresh();
      toast.success(t("savedTitle"), { description: t("savedBody") });
    },
    onError: (e) => {
      const raw = e instanceof Error ? e.message : "photo.uploadFailed";
      // ⚠️ resolve() RETURNS the resolved string. A key becomes its sentence;
      // anything it does not recognise passes through unchanged.
      setError(resolve(raw));
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/me/photo`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("photo.deleteFailed");
    },
    onSuccess: () => {
      refresh();
      setConfirmDelete(false);
      toast.success(t("deletedTitle"), { description: t("deletedBody") });
    },
    onError: () => {
      setConfirmDelete(false);
      toast.error(t("deleteFailedTitle"), { description: t("tryAgain") });
    },
  });

  async function pick(file: File | undefined) {
    setError(undefined);
    if (!file) return;

    // These are OURS, and `t` is already scoped to "photo" — no prefix here.
    if (file.size === 0) { setError(t("emptyFile")); return; }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      setError(t("wrongFormat"));
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(t("tooLarge", { max: MAX_MB }));
      return;
    }

    try {
      const { width, height } = await inspect(file);
      if (width < MIN_W || height < MIN_H) {
        // The actual dimensions are named: "too small" alone leaves someone
        // guessing whether their picture is close or hopeless.
        setError(t("tooSmall", { width, height, minW: MIN_W, minH: MIN_H }));
        return;
      }
      const ratio = width / height;
      if (ratio < MIN_RATIO || ratio > MAX_RATIO) {
        setError(t("wrongRatio"));
        return;
      }
      upload.mutate(file);
    } catch (e) {
      // From inspect(), which rejects with a fully-qualified key.
      const raw = e instanceof Error ? e.message : "photo.unreadable";
      setError(resolve(raw));
    }
  }

  const busy = upload.isPending || remove.isPending || photoLoading;
  const has = status.data?.hasPhoto ?? false;

  const RULES = ["ratio", "resolution", "background", "face", "recent"] as const;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-5 sm:p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <Camera className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[13.5px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[14px]">
            {t("title")}
          </p>
          <p className="text-[12px] leading-snug text-[var(--slate)]">{t("subtitle")}</p>
        </div>
        {has && (
          <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--green-tint)] px-2.5 py-1 text-[10.5px] font-bold text-[var(--green-700)]">
            <Check className="h-3 w-3" /> {t("saved")}
          </span>
        )}
      </div>

      {/* ── identity must exist first ── */}
      {!profileExists && (
        <p className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
          <Lock className="mt-0.5 h-3.5 w-3.5 flex-none" />
          {t("identityFirst")}
        </p>
      )}

      <div className="mt-5 flex flex-wrap gap-5 sm:gap-6">
        {/*
          ── frame + actions ──

          ⚠️ SIDE BY SIDE ON A PHONE, STACKED ABOVE IT.

          The frame is 132px and the requirements column needs 240, so at
          375px the column wraps to its own line — leaving 170px of empty
          space beside the portrait, with two icon-only buttons squeezed
          underneath it.

          Putting the actions in that space costs nothing and buys room for
          their LABELS, which matters more than it sounds: `title` never
          appears on a touch screen, so on a phone those two buttons were an
          up-arrow and a bin, unexplained, on the control a candidate uses
          once and must get right.
        */}
        <div className="flex w-full items-start gap-3 sm:block sm:w-auto sm:flex-none">
          <div
            className="relative aspect-[3/4] w-[124px] flex-none overflow-hidden rounded-xl border-2 sm:w-[132px]"
            style={{
              borderColor: has ? "var(--green-500)" : "var(--line)",
              background: "var(--green-tint)",
            }}
          >
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt={t("altPhoto")}
                className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full flex-col items-center justify-center gap-2 text-[var(--muted-fg)]">
                <Camera className="h-7 w-7 opacity-40" />
                <span className="px-2 text-center text-[10.5px] font-semibold">
                  {t("noPhoto")}
                </span>
              </div>
            )}
            {busy && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/70">
                <RefreshCw className="h-5 w-5 animate-spin text-[var(--green-700)]" />
              </div>
            )}
          </div>

          {/* Stacked and labelled beside the frame on a phone; a compact
              icon row underneath it from sm. */}
          <div className="flex min-w-0 flex-1 flex-col gap-2 sm:mt-3 sm:w-[132px] sm:flex-row sm:items-center sm:justify-center">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy || !profileExists}
              title={has ? t("replace") : t("add")}
              aria-label={has ? t("replace") : t("add")}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--green-700)] transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)] disabled:cursor-not-allowed disabled:opacity-45 sm:h-9 sm:flex-1 sm:px-0"
            >
              {has ? <RefreshCw className="h-4 w-4 flex-none" /> : <Upload className="h-4 w-4 flex-none" />}
              {/* The label exists only where there is room for it — and that
                  is the narrow screen, which is the one that needed it. */}
              <span className="truncate sm:hidden">{has ? t("replace") : t("add")}</span>
            </button>

            {has && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                title={t("delete")}
                aria-label={t("delete")}
                className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-lg border border-[var(--line)] bg-white px-3 text-[13px] font-semibold text-[var(--muted-fg)] transition-colors hover:border-[var(--red-500)] hover:bg-[var(--red-tint)] hover:text-[var(--red-500)] disabled:opacity-45 sm:h-9 sm:w-9 sm:flex-none sm:px-0"
              >
                <Trash2 className="h-4 w-4 flex-none" />
                <span className="truncate sm:hidden">{t("delete")}</span>
              </button>
            )}
          </div>

          <input ref={input} type="file" accept="image/jpeg,image/png"
            className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        {/* ── requirements ── */}
        {/* ⚠️ min-w only from sm. Below it the column is already on its own
            line, and a 240px floor inside a 303px card is a needless
            constraint waiting to overflow on a narrower phone. */}
        <div className="w-full flex-1 sm:min-w-[240px]">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
            {t("requirements")}
          </p>
          <ul className="mt-2.5 space-y-1.5 text-[12.5px] leading-relaxed text-[var(--slate)]">
            {RULES.map((rule) => (
              <li key={rule} className="flex items-start gap-2">
                <span className="mt-1.5 h-1 w-1 flex-none rounded-full bg-[var(--green-500)]" />
                {t(`rules.${rule}`, { minW: MIN_W, minH: MIN_H })}
              </li>
            ))}
          </ul>

          {error && (
            <p dir="auto" className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium leading-relaxed text-[var(--red-700)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {/* min-w-0 so a long sentence wraps inside the flex row rather
                  than pushing the icon out of the panel. */}
              <span className="min-w-0 break-words">{error}</span>
            </p>
          )}

          {status.data?.ageing && !error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--gold-tint)] px-3 py-2 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              <span className="min-w-0">{t("ageing")}</span>
            </p>
          )}
        </div>
      </div>

      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("confirmDeleteTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("confirmDeleteBody")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="w-full sm:w-auto">{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="w-full bg-[var(--red-500)] text-white hover:bg-[var(--red-700)] sm:w-auto"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              {remove.isPending ? t("deleting") : t("delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
