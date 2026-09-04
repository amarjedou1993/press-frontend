"use client";
// src/components/admin/HonourPhoto.tsx

import { useEffect, useState } from "react";
import { CameraOff } from "lucide-react";
import { useAuthStore } from "@/lib/auth";
import { honourPhotoPath } from "@/lib/api/honour";

/**
 * A holder's photograph, on an authenticated endpoint.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ WHY THIS IS NOT AN <img src>.
 *
 * The browser does not attach the Authorization header to an image request,
 * so a bare src would get a 401 and render a broken icon. The component
 * fetches the bytes with the token and holds an object URL instead.
 *
 * ⚠️ AND IT REVOKES THAT URL ON UNMOUNT. Each one pins its blob in memory
 * until released — a grid of forty faces, paged through a register of two
 * hundred, leaks steadily otherwise.
 * ───────────────────────────────────────────────────────────────────────
 */
export function HonourPhoto({
  cardId, hasPhoto, alt, className,
}: {
  cardId: number;
  hasPhoto: boolean;
  alt: string;
  className?: string;
}) {
  const token = useAuthStore((s) => s.token);
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!hasPhoto) return;

    let objectUrl: string | null = null;
    let cancelled = false;
    const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

    fetch(`${base}${honourPhotoPath(cardId)}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then((res) => {
        if (!res.ok) throw new Error(String(res.status));
        return res.blob();
      })
      .then((blob) => {
        if (cancelled) return;
        objectUrl = URL.createObjectURL(blob);
        setUrl(objectUrl);
      })
      // The row claims a photograph and the server disagrees — show the
      // placeholder rather than a broken image.
      .catch(() => { if (!cancelled) setFailed(true); });

    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [cardId, hasPhoto, token]);

  if (!hasPhoto || failed) {
    return (
      <div
        className={`flex items-center justify-center bg-[var(--gold-tint)] ${className ?? ""}`}
        title="Photographie requise"
      >
        <CameraOff className="h-5 w-5 text-[var(--gold-700)]" aria-hidden="true" />
        <span className="sr-only">Photographie manquante</span>
      </div>
    );
  }

  if (!url) {
    return <div className={`animate-pulse bg-[#eef1ef] ${className ?? ""}`} aria-hidden="true" />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt={alt} className={`object-cover ${className ?? ""}`} />
  );
}
