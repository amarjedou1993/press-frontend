"use client";
// src/components/AppShell.tsx
// The application chrome for every logged-in space. Now ROLE-AWARE: each
// group layout declares which role it's for, and the shell enforces it —
// wrong-role users are redirected to THEIR home, not shown someone else's.

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth, homeForRole } from "@/lib/auth";
import type { Role } from "@/lib/types";

export interface NavItem {
  label: string;
  href: string;
  active?: boolean;
  disabled?: boolean;
}

const ROLE_LABELS: Record<string, string> = {
  CANDIDATE: "Candidat",
  REVIEWER: "Commission d'examen",
  SUPER_ADMIN: "Super administrateur",
};

export function AppShell({
  requireRole,
  nav,
  title,
  children,
}: {
  requireRole: Role;
  nav: NavItem[];
  title: string;
  children: ReactNode;
}) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace("/login");
    } else if (user.role !== requireRole) {
      // Logged in, wrong space → send to the caller's own home.
      router.replace(homeForRole(user.role));
    }
  }, [ready, user, requireRole, router]);

  // Render nothing until we've confirmed the right user for this space.
  if (!ready || !user || user.role !== requireRole) return null;

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      {/* ── Sidebar ── */}
      <aside
        className="flex flex-col text-white lg:min-h-screen"
        style={{ background: "var(--green-900)" }}
      >
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-white/10">
          <span className="inline-flex items-center gap-1" aria-hidden="true">
            <i className="h-3 w-1 rounded-full bg-[var(--green-500)]" />
            <i className="h-3 w-1 rounded-full bg-[var(--gold-500)]" />
            <i className="h-3 w-1 rounded-full bg-[var(--red-500)]" />
          </span>
          <span className="text-sm font-extrabold tracking-[0.12em]">
            HAPA <span className="text-[var(--gold-500)]">/</span> PRESSE
          </span>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1">
          {nav.map((item) => (
            <a
              key={item.label}
              href={item.disabled ? undefined : item.href}
              aria-disabled={item.disabled}
              aria-current={item.active ? "page" : undefined}
              className={[
                "block rounded-[10px] px-3.5 py-2.5 text-[14px] font-semibold transition-colors",
                item.active
                  ? "bg-[var(--green-600)] text-white"
                  : item.disabled
                    ? "text-white/35 cursor-not-allowed"
                    : "text-white/75 hover:bg-white/10 hover:text-white",
              ].join(" ")}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="px-5 py-4 border-t border-white/10">
          <p className="text-sm font-bold truncate">{user.fullName}</p>
          <p className="text-[11px] text-white/55">
            {ROLE_LABELS[user.role] ?? user.role}
          </p>
          <button
            onClick={() => {
              logout();
              router.replace("/login");
            }}
            className="mt-3 w-full rounded-[10px] border border-white/25 py-2 text-xs font-bold uppercase tracking-wider hover:bg-white/10"
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* ── Content ── */}
      <div>
        <header className="bg-white border-b border-[var(--line)] px-6 py-4">
          <h1 className="text-lg font-extrabold text-[var(--green-900)]">
            {title}
          </h1>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}

/* ── Shared card + status badge ── */

export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[16px] bg-white p-6"
      style={{ boxShadow: "0 1px 2px rgba(22,34,27,.05),0 4px 16px rgba(22,34,27,.05)", border: "1px solid var(--line)" }}
    >
      {children}
    </div>
  );
}

type StatusKind = "draft" | "review" | "correction" | "accepted" | "rejected";

export function StatusBadge({
  kind,
  children,
}: {
  kind: StatusKind;
  children: ReactNode;
}) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ background: `var(--st-${kind}-bg)`, color: `var(--st-${kind}-fg)` }}
    >
      {children}
    </span>
  );
}
