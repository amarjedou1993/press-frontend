"use client";
// src/app/error.tsx
// App-level error boundary: an unexpected exception never shows users a
// raw Next.js screen. The real error is logged to the console (and later,
// to monitoring); the user sees a calm recovery path.

import { useEffect } from "react";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--paper)]">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--line)] bg-white p-8 text-center shadow-sm">
        <span className="inline-flex items-center gap-1" aria-hidden="true">
          <i className="h-3.5 w-1.5 rounded-full bg-[var(--green-500)]" />
          <i className="h-3.5 w-1.5 rounded-full bg-[var(--gold-500)]" />
          <i className="h-3.5 w-1.5 rounded-full bg-[var(--red-500)]" />
        </span>
        <h1 className="mt-4 text-xl font-extrabold text-[var(--green-900)]">
          Une erreur est survenue
        </h1>
        <p className="mt-2 text-sm text-[var(--slate)]">
          Quelque chose s&apos;est mal passé. Vous pouvez réessayer — si le
          problème persiste, revenez un peu plus tard.
        </p>
        <button
          onClick={reset}
          className="mt-6 rounded-[var(--radius)] bg-[var(--green-700)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--green-600)]"
        >
          Réessayer
        </button>
      </div>
    </main>
  );
}
