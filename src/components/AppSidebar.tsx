"use client";
// src/components/AppSidebar.tsx
//
// ⚠️ THE SIDEBAR MOVES SIDES WITH THE LANGUAGE.
//
// A sidebar is chrome at the READING EDGE — the side a reader's eye starts
// from. shadcn positions it with physical CSS and defaults to "left", so
// dir="rtl" alone leaves it on the wrong side of an Arabic page: the content
// indents away from the reader rather than towards them.
//
// The admin and reviewer spaces need no exception. The proxy redirects
// /ar/admin to /fr/admin, so useLocale() is always "fr" there and the rail
// stays left on its own.

import { useLocale, useTranslations } from "next-intl";
import { ChevronsLeft, Lock } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "@/i18n/navigation";
import { UserMenu } from "@/components/UserMenu";

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

function NationalMark() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      <i className="h-3.5 w-1 rounded-full bg-[var(--green-500)]" />
      <i className="h-3.5 w-1 rounded-full bg-[var(--gold-500)]" />
      <i className="h-3.5 w-1 rounded-full bg-[var(--red-500)]" />
    </span>
  );
}

export function AppSidebar({
  groups,
  user,
  /**
   * False in the Authority's spaces.
   *
   * ⚠️ The proxy redirects /ar/admin to /fr/admin, so a language choice there
   * would reload the page in French and the control would look broken. One
   * line to reverse when the staff catalogues exist.
   */
  canSwitchLanguage = true,
}: {
  groups: NavGroup[];
  user: { fullName: string; role: string };
  canSwitchLanguage?: boolean;
}) {
  const t = useTranslations("shell");
  const locale = useLocale();
  const router = useRouter();
  const { state, toggleSidebar, isMobile } = useSidebar();

  const collapsed = state === "collapsed" && !isMobile;
  const arabic = locale === "ar";

  return (
    <Sidebar
      side={arabic ? "right" : "left"}
      collapsible="icon"
      className="border-e-0 [&>[data-sidebar=sidebar]]:bg-transparent"
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
        {/* gold hairline on the trailing edge — end-0, so it stays on the
            side facing the content whichever side the rail is on */}
        <span
          className="pointer-events-none absolute inset-y-0 end-0 w-px bg-gradient-to-b from-transparent via-[var(--gold-500)]/50 to-transparent"
          aria-hidden="true"
        />

        <SidebarHeader className="relative z-10 border-b border-[#8a9a92]/20 p-0">
          <div className={`flex items-center gap-2.5 px-4 py-4 ${collapsed ? "justify-center px-0" : ""}`}>
            <NationalMark />
            {!collapsed && (
              <div className="min-w-0">
                {/* The wordmark is fixed in both languages: it is a lockup,
                    the same object as the tricolour beside it. */}
                <p dir="ltr" className="truncate text-[13px] font-extrabold tracking-[0.1em] text-white rtl:text-end">
                  CARTE <span className="text-[var(--gold-500)]">/</span> PRESSE
                </p>
                <p className="truncate text-[9.5px] font-semibold uppercase tracking-[0.14em] text-white/45">
                  {t("accreditation")}
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
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        isActive={item.active}
                        tooltip={item.label}
                        aria-disabled={item.disabled}
                        onClick={item.disabled ? undefined : () => router.push(item.href)}
                        className={[
                          "relative h-10 rounded-lg text-[12.5px] font-semibold transition-all",
                          item.active
                            // start-0 / rounded-e: the active marker sits at
                            // the reading edge of the item, and its rounded
                            // corner faces inward.
                            ? "bg-white/[0.14] text-white hover:bg-white/[0.16] " +
                              "before:absolute before:start-0 before:top-1/2 before:h-5 before:w-[3px] " +
                              "before:-translate-y-1/2 before:rounded-e before:bg-[var(--gold-500)]"
                            : item.disabled
                              ? "cursor-not-allowed text-white/45 hover:bg-transparent"
                              : "text-white/70 hover:bg-white/[0.08] hover:text-white",
                        ].join(" ")}
                      >
                        {item.icon}
                        <span className="truncate">{item.label}</span>
                        {!collapsed && item.disabled && (
                          <span className="ms-auto inline-flex items-center gap-1.5">
                            {item.badge != null && (
                              <span className="rounded-full border border-white/25 px-1.5 py-0.5 font-mono text-[9.5px] font-bold text-white/55">
                                {item.badge}
                              </span>
                            )}
                            <Lock className="h-3 w-3 flex-none text-white/40" />
                          </span>
                        )}
                        {!collapsed && !item.disabled && item.badge != null && (
                          <span className="ms-auto rounded-full bg-[var(--gold-500)] px-1.5 py-0.5 font-mono text-[10px] font-extrabold text-[var(--green-900)]">
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

      <SidebarFooter className="relative z-10 border-t border-[#8a9a92]/20 p-2">
          <div className="flex items-center gap-1.5">
            {/* min-w-0 so the name truncates rather than pushing the
                collapse button out of the rail. */}
            <div className="min-w-0 flex-1">
              <UserMenu
                user={user}
                collapsed={collapsed}
                canSwitchLanguage={canSwitchLanguage}
              />
            </div>

            {!collapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                title={t("collapse")}
                aria-label={t("collapse")}
                className="flex h-[46px] w-8 flex-none items-center justify-center rounded-lg border-white/15 text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronsLeft className="rtl-flip h-4 w-4" />
              </button>
            )}
          </div>
        </SidebarFooter>
      </div>
      <SidebarRail />
    </Sidebar>
  );
}
