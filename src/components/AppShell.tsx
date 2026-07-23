"use client";
// src/components/AppShell.tsx
// Role guard + application chrome. The sidebar is now AppSidebar (shadcn
// Sidebar primitives); this file keeps the guard, the topbar, and the
// shared Card/StatusBadge exports so existing imports keep working.

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { PanelLeft } from "lucide-react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar, type NavGroup } from "@/components/AppSidebar";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/lib/auth";
import { routes, homeForRole } from "@/lib/routes";
import type { Role } from "@/lib/types";

export type { NavItem, NavGroup } from "@/components/AppSidebar";

export function AppShell({
  requireRole,
  groups,
  title,
  subtitle,
  actions,
  children,
}: {
  requireRole: Role;
  groups: NavGroup[];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { user, ready, logout } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!ready) return;
    if (!user) {
      router.replace(routes.auth.login);
    } else if (user.role !== requireRole) {
      router.replace(homeForRole(user.role));
    }
  }, [ready, user, requireRole, router]);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--paper)]">
        <span className="inline-flex items-center gap-1" aria-hidden="true">
          <i className="h-4 w-1.5 rounded-full bg-[var(--green-500)] animate-pulse" />
          <i className="h-4 w-1.5 rounded-full bg-[var(--gold-500)] animate-pulse [animation-delay:150ms]" />
          <i className="h-4 w-1.5 rounded-full bg-[var(--red-500)] animate-pulse [animation-delay:300ms]" />
        </span>
      </div>
    );
  }

  if (!user || user.role !== requireRole) return null;

  return (
    <SidebarProvider>
      <AppSidebar groups={groups} user={user} />
      <SidebarInset className="bg-[var(--paper)]">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-[var(--line)] bg-white/85 px-5 backdrop-blur">
          <SidebarTrigger className="text-[var(--slate)] hover:text-[var(--green-900)]" aria-label="Basculer le menu">
            <PanelLeft className="h-4 w-4" />
          </SidebarTrigger>
          <span className="h-5 w-px bg-[var(--line)]" aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-[15px] font-extrabold text-[var(--green-900)]">
              {title}
            </h1>
            {subtitle && (
              <p className="truncate text-[11.5px] text-[var(--slate)]">{subtitle}</p>
            )}
          </div>
          {actions}
        </header>
        <main className="p-6">{children}</main>
      </SidebarInset>
      <Toaster />
    </SidebarProvider>
  );
}

export function Card({ children }: { children: ReactNode }) {
  return (
    <div
      className="rounded-[16px] bg-white p-6"
      style={{
        boxShadow: "0 1px 2px rgba(22,34,27,.05),0 4px 16px rgba(22,34,27,.05)",
        border: "1px solid var(--line)",
      }}
    >
      {children}
    </div>
  );
}

type StatusKind = "draft" | "review" | "correction" | "accepted" | "rejected";

export function StatusBadge({ kind, children }: { kind: StatusKind; children: ReactNode }) {
  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-1 text-[12px] font-bold"
      style={{ background: `var(--st-${kind}-bg)`, color: `var(--st-${kind}-fg)` }}
    >
      {children}
    </span>
  );
}
