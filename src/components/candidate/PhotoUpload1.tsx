"use client";

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

async function fetchStatus(token: string | null): Promise<PhotoStatus> {
  const res = await fetch(`${BASE}/api/me/photo/status`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return { hasPhoto: false, uploadedAt: null, ageing: false };
  return res.json();
}

/** Read the real dimensions before sending anything over the wire. */
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
      // A CODE, not a sentence — the caller translates it.
      // reject(new Error("notAnImage"));
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
    queryFn: () => fetchStatus(token),
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
        // The SERVER's own message if it sent one — already in the caller's
        // language. Otherwise our key, translated below.
        let message = "uploadFailed";
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
      const raw = e instanceof Error ? e.message : "uploadFailed";
      // A key resolves; a server sentence passes through unchanged.
      setError(resolve(raw) ? t(raw) : raw);
    },
  });

  const remove = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${BASE}/api/me/photo`, {
        method: "DELETE",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error("deleteFailed");
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
      const raw = e instanceof Error ? e.message : "unreadable";
      // setError(t.has(raw) ? t(raw) : raw);
      setError(resolve(raw));
    }
  }

  const busy = upload.isPending || remove.isPending || photoLoading;
  const has = status.data?.hasPhoto ?? false;

  const RULES = ["ratio", "resolution", "background", "face", "recent"] as const;

  return (
    <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
      <div className="flex items-center gap-3">
        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
          <Camera className="h-4 w-4 text-[var(--green-700)]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-extrabold text-[var(--green-900)]">
            {t("title")}
          </p>
          <p className="text-[12px] text-[var(--slate)]">{t("subtitle")}</p>
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

      <div className="mt-5 flex flex-wrap gap-6">
        {/* ── frame + actions ── */}
        <div className="flex-none">
          <div
            className="relative aspect-[3/4] w-[132px] overflow-hidden rounded-xl border-2"
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

          {/* icon actions */}
          <div className="mt-3 flex w-[132px] items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => input.current?.click()}
              disabled={busy || !profileExists}
              title={has ? t("replace") : t("add")}
              aria-label={has ? t("replace") : t("add")}
              className="inline-flex h-9 flex-1 items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--green-700)] transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)] disabled:cursor-not-allowed disabled:opacity-45"
            >
              {has ? <RefreshCw className="h-4 w-4" /> : <Upload className="h-4 w-4" />}
            </button>

            {has && (
              <button
                type="button"
                onClick={() => setConfirmDelete(true)}
                disabled={busy}
                title={t("delete")}
                aria-label={t("delete")}
                className="inline-flex h-9 w-9 flex-none items-center justify-center rounded-lg border border-[var(--line)] bg-white text-[var(--muted-fg)] transition-colors hover:border-[var(--red-500)] hover:bg-[var(--red-tint)] hover:text-[var(--red-500)] disabled:opacity-45"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>

          <input ref={input} type="file" accept="image/jpeg,image/png"
            className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        </div>

        {/* ── requirements ── */}
        <div className="min-w-[240px] flex-1">
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
            <p dir="auto" className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--red-tint)] px-3 py-2 text-[12.5px] font-medium text-[var(--red-700)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {error}
            </p>
          )}

          {status.data?.ageing && !error && (
            <p className="mt-3 flex items-start gap-2 rounded-lg bg-[var(--gold-tint)] px-3 py-2 text-[12.5px] text-[var(--gold-700)]">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {t("ageing")}
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
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction
              className="bg-[var(--red-500)] text-white hover:bg-[var(--red-700)]"
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
