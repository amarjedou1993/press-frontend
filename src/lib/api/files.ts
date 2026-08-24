import { useEffect, useState } from "react";
import { useAuthStore } from "@/lib/auth";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";

/** Fetch a protected file as a Blob using the session token. */
export async function fetchProtectedBlob(
  path: string,
  token: string | null
): Promise<Blob | null> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    cache: "no-store",
  });
  if (!res.ok) return null;
  return res.blob();
}

/**
 * An object URL for a protected file, revoked automatically.
 *
 * @param path     API path, or null to hold nothing
 * @param deps     bump to force a refetch (e.g. after replacing a photo)
 */
export function useAuthenticatedFile(path: string | null, version = 0) {
  const token = useAuthStore((s) => s.token);
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!path) {
      setUrl(null);
      return;
    }

    let cancelled = false;
    let created: string | null = null;

    setLoading(true);
    fetchProtectedBlob(path, token)
      .then((blob) => {
        if (cancelled || !blob) return;
        created = URL.createObjectURL(blob);
        setUrl(created);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
      // Without this, every photo replacement leaks a blob for the session.
      if (created) URL.revokeObjectURL(created);
    };
  }, [path, token, version]);

  return { url, loading };
}

/**
 * Open a protected file in a new tab.
 *
 * The object URL is revoked after a delay rather than immediately: revoking
 * it synchronously would close the tab we just opened, since the tab is
 * still resolving it.
 */
export async function openProtectedFile(
  path: string,
  token: string | null,
  fallbackName = "document"
): Promise<boolean> {
  const blob = await fetchProtectedBlob(path, token);
  if (!blob) return false;

  const url = URL.createObjectURL(blob);
  const opened = window.open(url, "_blank", "noopener,noreferrer");

  if (!opened) {
    // Pop-up blocked: fall back to a download, which is never blocked.
    const a = document.createElement("a");
    a.href = url;
    a.download = fallbackName;
    a.click();
  }

  setTimeout(() => URL.revokeObjectURL(url), 60_000);
  return true;
}
