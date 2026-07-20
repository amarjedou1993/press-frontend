// src/app/not-found.tsx
// The 404, in the house style. Server component — no interactivity needed.

import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-[var(--paper)]">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[var(--line)] bg-white p-8 text-center shadow-sm">
        <p className="font-mono text-xs text-[var(--muted)]">404</p>
        <h1 className="mt-2 text-xl font-extrabold text-[var(--green-900)]">
          Page introuvable
        </h1>
        <p className="mt-2 text-sm text-[var(--slate)]">
          La page demandée n&apos;existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="mt-6 inline-block rounded-[var(--radius)] bg-[var(--green-700)] px-6 py-2.5 text-sm font-bold text-white hover:bg-[var(--green-600)]"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}
