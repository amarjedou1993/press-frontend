// src/components/public/PublicHeader.tsx
// Server component — no interactivity, so no "use client" and no JS shipped.

import Link from "next/link";
import { routes } from "@/lib/routes";

export function PublicHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-5 py-3.5">
        <Link href={routes.home} className="flex items-center gap-2.5">
          <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
            <i className="h-4 w-1.5 rounded-full bg-[var(--green-500)]" />
            <i className="h-4 w-1.5 rounded-full bg-[var(--gold-500)]" />
            <i className="h-4 w-1.5 rounded-full bg-[var(--red-500)]" />
          </span>
          <span className="leading-tight">
            <span className="block text-[13px] font-extrabold tracking-[0.1em] text-[var(--green-900)]">
              HAPA
            </span>
            <span className="block text-[9.5px] font-semibold uppercase tracking-[0.12em] text-[var(--slate)]">
              Accréditation presse
            </span>
          </span>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href={routes.publicSessions}
            className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
          >
            Sessions
          </Link>
          <Link
            href={routes.auth.login}
            className="rounded-lg px-3 py-2 text-[13px] font-semibold text-[var(--slate)] transition-colors hover:bg-[var(--green-tint)] hover:text-[var(--green-700)]"
          >
            Connexion
          </Link>
          <Link
            href={routes.auth.register}
            className="rounded-lg bg-[var(--green-700)] px-4 py-2 text-[13px] font-bold text-white transition-colors hover:bg-[var(--green-600)]"
          >
            Créer un compte
          </Link>
        </nav>
      </div>
    </header>
  );
}
