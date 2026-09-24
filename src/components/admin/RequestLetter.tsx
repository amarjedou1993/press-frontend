"use client";
// src/components/admin/RequestLetter.tsx

import { useEffect, useState } from "react";
import { FileText, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { institutionLetterPath } from "@/lib/api/admin-institution-requests";

/**
 * La lettre officielle d'une demande.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ RÉCUPÉRÉE AVEC LE JETON, PAS POINTÉE PAR UN src.
 *
 * L'endpoint est authentifié — c'est un document officiel nommant une
 * personne et un corps — et un navigateur n'attache pas l'en-tête
 * Authorization à un <iframe src> ni à un <img src>. Le composant la charge
 * lui-même et tient une URL d'objet, comme HonourPhoto pour les portraits.
 *
 * ⚠️ ET EN GRAND, parce que la lire EST l'examen.
 *
 * Une vignette ou un lien de téléchargement transformerait la vérification en
 * étape facultative — et c'est la seule qui protège contre une demande
 * déposée au nom d'un corps par quelqu'un qui n'en fait pas partie.
 * ───────────────────────────────────────────────────────────────────────
 */
export function RequestLetter({ requestId }: { requestId: number }) {
  const token = useAuthStore((s) => s.token);
  const [url, setUrl] = useState<string>();
  const [type, setType] = useState<string>();
  const [error, setError] = useState(false);

  useEffect(() => {
    let revoked: string | undefined;
    let cancelled = false;

    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
    fetch(`${base}${institutionLetterPath(requestId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error("letter");
        setType(res.headers.get("content-type") ?? "application/pdf");
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        revoked = URL.createObjectURL(blob);
        setUrl(revoked);
      })
      .catch(() => !cancelled && setError(true));

    return () => {
      cancelled = true;
      // ⚠️ Révoquée au démontage : la lettre reste en mémoire tant que
      // l'URL vit, et un administrateur ouvre plusieurs demandes de suite.
      if (revoked) URL.revokeObjectURL(revoked);
    };
  }, [requestId, token]);

  if (error) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-white p-8 text-center">
        <AlertTriangle className="h-8 w-8 text-[var(--gold-700)]" />
        <p className="text-[13.5px] font-bold text-[var(--green-900)]">
          La lettre n&apos;a pas pu être chargée
        </p>
        {/* ⚠️ Ce qu'il faut en conclure, pas seulement ce qui a échoué : une
            demande sans sa lettre ne s'examine pas. */}
        <p className="max-w-xs text-[12.5px] leading-relaxed text-[var(--slate)]">
          Le fichier est introuvable sur le serveur. N&apos;approuvez pas cette
          demande sans avoir vu la lettre.
        </p>
      </div>
    );
  }

  if (!url) {
    return (
      <div className="flex h-full min-h-[320px] items-center justify-center rounded-xl border border-[var(--line)] bg-white">
        <Loader2 className="h-6 w-6 animate-spin text-[var(--green-600)]" />
      </div>
    );
  }

  const isPdf = type?.includes("pdf");

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-[var(--line)] bg-white">
      <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-4 py-2.5">
        <FileText className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
        <p className="min-w-0 flex-1 text-[12.5px] font-bold text-[var(--green-900)]">
          Lettre officielle
        </p>
        {/* Une lettre scannée de travers se lit mieux dans un onglet, où le
            navigateur donne zoom et rotation. */}
        <a
          href={url}
          target="_blank"
          rel="noreferrer"
          className="flex flex-none items-center gap-1 text-[12px] font-semibold text-[var(--green-700)] underline underline-offset-2"
        >
          <ExternalLink className="h-3 w-3" />
          Ouvrir
        </a>
      </div>

      <div className="min-h-0 flex-1 bg-[#f2f5f3]">
        {isPdf ? (
          <iframe src={url} title="Lettre officielle" className="h-full w-full" />
        ) : (
          <img src={url} alt="Lettre officielle"
            className="h-full w-full object-contain" />
        )}
      </div>
    </div>
  );
}
