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
import { LogOut, ChevronsLeft, Lock } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarHeader, SidebarMenu, SidebarMenuButton,
  SidebarMenuItem, SidebarRail, useSidebar,
} from "@/components/ui/sidebar";
import { useRouter } from "@/i18n/navigation";
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

function NationalMark() {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      <i className="h-3.5 w-1 rounded-full bg-[var(--green-500)]" />
      <i className="h-3.5 w-1 rounded-full bg-[var(--gold-500)]" />
      <i className="h-3.5 w-1 rounded-full bg-[var(--red-500)]" />
    </span>
  );
}

/**
 * ⚠️ Initials only work for scripts that HAVE them.
 *
 * «حامد فال» reduced to «حف» is not how Arabic names are abbreviated — the
 * letters change shape when isolated, and the result reads as nonsense.
 * Arabic names therefore show their first word instead, truncated by CSS.
 */
function monogram(name: string, arabicScript: boolean) {
  const trimmed = name.trim();
  if (!trimmed) return "—";
  if (arabicScript) return trimmed.split(/\s+/)[0];
  return trimmed.split(/\s+/).slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "").join("");
}

const ARABIC_RANGE = /[\u0600-\u06FF]/;

export function AppSidebar({
  groups,
  user,
}: {
  groups: NavGroup[];
  user: { fullName: string; role: string };
}) {
  const t = useTranslations("shell");
  const tr = useTranslations("roles");
  const locale = useLocale();
  const router = useRouter();
  const { logout } = useAuth();
  const { state, toggleSidebar, isMobile } = useSidebar();

  const collapsed = state === "collapsed" && !isMobile;
  const arabic = locale === "ar";
  const nameIsArabic = ARABIC_RANGE.test(user.fullName.charAt(0));

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

        <SidebarHeader className="relative z-10 border-b border-white/10 p-0">
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

        <SidebarFooter className="relative z-10 border-t border-white/10 p-3">
          <div className={`flex items-center gap-2.5 rounded-lg bg-white/[0.06] p-2.5 ${collapsed ? "justify-center" : ""}`}>
            <span
              dir="auto"
              className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full px-1 text-[11px] font-extrabold text-[var(--green-900)]"
              style={{ background: "var(--gold-500)" }}
            >
              {monogram(user.fullName, nameIsArabic)}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                {/* dir="auto": the name may be in either script whatever the
                    interface language is. */}
                <p dir="auto" className="truncate text-[12.5px] font-bold text-white">
                  {user.fullName}
                </p>
                <p className="truncate text-[10px] text-white/50">
                  {tr.has(user.role) ? tr(user.role) : user.role}
                </p>
              </div>
            )}
          </div>

          <div className={`mt-2 flex gap-1.5 ${collapsed ? "flex-col items-center" : ""}`}>
            <button
              type="button"
              onClick={() => { logout(); router.replace(routes.auth.login); }}
              title={t("signOut")}
              className={[
                "flex items-center justify-center gap-2 rounded-lg border border-white/20 py-2",
                "text-[11px] font-bold uppercase tracking-wider text-white/80",
                "transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white",
                collapsed ? "h-8 w-8" : "flex-1",
              ].join(" ")}
            >
              <LogOut className="rtl-flip h-3.5 w-3.5 flex-none" />
              {!collapsed && t("signOut")}
            </button>
            {!collapsed && (
              <button
                type="button"
                onClick={toggleSidebar}
                title={t("collapse")}
                aria-label={t("collapse")}
                className="flex h-[34px] w-9 flex-none items-center justify-center rounded-lg border border-white/20 text-white/70 transition-colors hover:bg-white/10 hover:text-white"
              >
                {/* It points at the edge the rail folds towards, which
                    changes side with the language. */}
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
