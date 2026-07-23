"use client";
// src/components/AppSidebar.tsx
// The institutional sidebar, built on shadcn's Sidebar primitives:
// collapsible to icons, mobile sheet on small screens, keyboard shortcut,
// and state persisted across sessions — none of which is worth hand-rolling.
//
// NOTE: no `asChild` anywhere. These shadcn components are built on Base UI,
// which composes via a `render` prop, NOT asChild — passing asChild leaks it
// to the DOM and nests <button>s. SidebarMenuButton navigates via onClick +
// router.push instead, which needs no composition at all.
//
// Disabled items are SHOWN (they signal the roadmap) but must stay legible:
// white/45 + a lock icon + a week badge. An earlier version used white/25,
// which was invisible on the dark rail and looked like a missing item.
//
// Styling is HAPA's: deep-green rail, gold accents, the national mark, a
// framed brand block, grouped navigation with active indicator, and a user
// card with role and sign-out.

import { useRouter } from "next/navigation";
import { LogOut, ChevronsLeft, Lock } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/lib/auth";
import { routes } from "@/lib/routes";

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
  active?: boolean;
  /** Not yet built: shown, clearly marked, and not clickable. */
  disabled?: boolean;
  badge?: string | number;
}

export interface NavGroup {
  label?: string;
  items: NavItem[];
}

const ROLE_LABELS: Record<string, string> = {
  CANDIDATE: "Candidat",
  REVIEWER: "Commission d'examen",
  SUPER_ADMIN: "Super administrateur",
};

function NationalMark() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      <i className="h-3.5 w-1 rounded-full bg-[var(--green-500)]" />
      <i className="h-3.5 w-1 rounded-full bg-[var(--gold-500)]" />
      <i className="h-3.5 w-1 rounded-full bg-[var(--red-500)]" />
    </span>
  );
}

function initials(name: string) {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function AppSidebar({
  groups,
  user,
}: {
  groups: NavGroup[];
  user: { fullName: string; role: string };
}) {
  const router = useRouter();
  const { logout } = useAuth();
  const { state, toggleSidebar, isMobile } = useSidebar();
  const collapsed = state === "collapsed" && !isMobile;

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 [&>[data-sidebar=sidebar]]:bg-transparent"
    >
      {/* The whole rail carries the institutional gradient + security print */}
      <div
        className="relative flex h-full flex-col"
        style={{
          background:
            "radial-gradient(400px 220px at 50% -8%, rgba(255,215,0,.10), transparent 65%), linear-gradient(178deg, var(--green-900) 0%, #0c3625 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true"
        />
        {/* gold hairline on the trailing edge */}
        <span className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-[var(--gold-500)]/50 to-transparent" aria-hidden="true" />

        <SidebarHeader className="relative z-10 border-b border-white/10 p-0">
          <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? "justify-center px-0" : ""}`}>
            <NationalMark />
            {!collapsed && (
              <div className="min-w-0">
                <p className="truncate text-[13px] font-extrabold tracking-[0.1em] text-white">
                  HAPA <span className="text-[var(--gold-500)]">/</span> PRESSE
                </p>
                <p className="truncate text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  Accréditation
                </p>
              </div>
            )}
          </div>
        </SidebarHeader>

        <SidebarContent className="relative z-10 gap-0">
          {groups.map((group, gi) => (
            <SidebarGroup key={gi} className="px-2 py-3">
              {group.label && !collapsed && (
                <SidebarGroupLabel className="px-2 text-[9.5px] font-bold uppercase tracking-[0.18em] text-white/35">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-1">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.label}>
                      <SidebarMenuButton
                        isActive={item.active}
                        tooltip={item.label}
                        aria-disabled={item.disabled}
                        onClick={item.disabled ? undefined : () => router.push(item.href)}
                        className={[
                          "relative h-10 rounded-lg text-[13.5px] font-semibold transition-all",
                          item.active
                            ? "bg-white/[0.14] text-white hover:bg-white/[0.16] " +
                              "before:absolute before:left-0 before:top-1/2 before:h-5 before:w-[3px] " +
                              "before:-translate-y-1/2 before:rounded-r before:bg-[var(--gold-500)]"
                            : item.disabled
                              ? "cursor-not-allowed text-white/45 hover:bg-transparent"
                              : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                        ].join(" ")}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                        {!collapsed && item.disabled && (
                          <span className="ml-auto inline-flex items-center gap-1.5">
                            {item.badge != null && (
                              <span className="rounded-full border border-white/25 px-1.5 py-0.5 text-[9.5px] font-bold tracking-wide text-white/55">
                                {item.badge}
                              </span>
                            )}
                            <Lock className="h-3 w-3 text-white/40" />
                          </span>
                        )}
                        {!collapsed && !item.disabled && item.badge != null && (
                          <span className="ml-auto rounded-full bg-[var(--gold-500)] px-1.5 py-0.5 text-[10px] font-extrabold text-[var(--green-900)]">
                            {item.badge}
                          </span>
                        )}
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          ))}
        </SidebarContent>

        <SidebarFooter className="relative z-10 border-t border-white/10 p-3">
          <div className={`flex items-center gap-2.5 rounded-lg bg-white/[0.06] p-2.5 ${collapsed ? "justify-center" : ""}`}>
            <span
              className="flex h-8 w-8 flex-none items-center justify-center rounded-full text-[11px] font-extrabold text-[var(--green-900)]"
              style={{ background: "var(--gold-500)" }}
            >
              {initials(user.fullName)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="truncate text-[12.5px] font-bold text-white">{user.fullName}</p>
                <p className="truncate text-[10px] text-white/50">
                  {ROLE_LABELS[user.role] ?? user.role}
                </p>
              </div>
            )}
          </div>

          <div className={`mt-2 flex gap-1.5 ${collapsed ? "flex-col items-center" : ""}`}>
            <button
              onClick={() => { logout(); router.replace(routes.auth.login); }}
              title="Se déconnecter"
              className={[
                "flex items-center justify-center gap-2 rounded-lg border border-white/20 py-2",
                "text-[11px] font-bold uppercase tracking-wider text-white/80",
                "transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white",
                collapsed ? "h-8 w-8" : "flex-1",
              ].join(" ")}
            >
              <LogOut className="h-3.5 w-3.5" />
              {!collapsed && "Déconnexion"}
            </button>
            {!collapsed && (
              <button
                onClick={toggleSidebar}
                title="Réduire le menu"
                aria-label="Réduire le menu"
                className="flex h-[34px] w-9 items-center justify-center rounded-lg border border-white/20 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronsLeft className="h-4 w-4" />
              </button>
            )}
          </div>
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
