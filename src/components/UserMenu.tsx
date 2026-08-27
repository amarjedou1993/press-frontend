"use client";
// src/components/UserMenu.tsx
//
// The account menu at the foot of the sidebar: language, password, sign out.

import { useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { Check, ChevronsUpDown, KeyRound, Languages, LogOut } from "lucide-react";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChangePasswordDialog } from "@/components/ChangePasswordDialog";
import { setLocale as saveLocale } from "@/lib/api/account";
import { useAuth } from "@/lib/auth";
import { routes } from "@/lib/routes";
import { LOCALE_NAMES, type Locale } from "@/i18n/routing";

const ARABIC_RANGE = /[\u0600-\u06FF]/;

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

export function UserMenu({
  user,
  collapsed,
  /**
   * False in the Authority's spaces.
   *
   * ⚠️ The proxy redirects /ar/admin to /fr/admin, so a language choice there
   * would reload the page in French and the control would look broken. A
   * control that appears not to work is worse than an absent one.
   *
   * One line to reverse when the admin and reviewer catalogues exist.
   */
  canSwitchLanguage = true,
}: {
  user: { fullName: string; role: string };
  collapsed: boolean;
  canSwitchLanguage?: boolean;
}) {
  const t = useTranslations("shell");
  const tr = useTranslations("roles");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const qc = useQueryClient();
  const { logout } = useAuth();

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const nameIsArabic = ARABIC_RANGE.test(user.fullName.charAt(0));

  function switchTo(next: Locale) {
    if (next === locale) return;

    /**
     * ⚠️ TWO THINGS, and both matter.
     *
     * The navigation changes what is on screen. The stored preference decides
     * what language every FUTURE E-MAIL is written in — and an e-mail has no
     * request to read a locale from, so without this a person reading an
     * Arabic interface keeps receiving French decisions.
     *
     * Fire-and-forget: a failed preference must not block the navigation just
     * asked for. The candidate layout re-saves it on the next load.
     */
    saveLocale(next).catch(() => {});
    qc.invalidateQueries({ queryKey: ["me"] });

    startTransition(() => {
      // pathname from @/i18n/navigation has the locale STRIPPED, so this
      // lands on the same page in the other language rather than the home.
      router.replace(pathname, { locale: next });
    });
  }

  return (
    <>
      <DropdownMenu>
        {/* ⚠️ NO render PROP. Base UI's Trigger already renders a <button>;
            styling it directly avoids the render-prop shape entirely, and
            with it a whole class of "element is not a single child" errors. */}
        <DropdownMenuTrigger
          aria-label={t("accountMenu")}
          className={[
            "flex w-full items-center gap-2.5 rounded-lg bg-white/[0.06] p-2.5 text-start",
            "transition-colors hover:bg-white/[0.11]",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-500)]/60",
            collapsed ? "justify-center" : "",
          ].join(" ")}
        >
          <span
            dir="auto"
            className="flex h-8 w-8 flex-none items-center justify-center overflow-hidden rounded-full px-1 text-[11px] font-extrabold text-[var(--green-900)]"
            style={{ background: "var(--gold-500)" }}
          >
            {monogram(user.fullName, nameIsArabic)}
          </span>

          {!collapsed && (
            <>
              <span className="min-w-0 flex-1">
                {/* dir="auto": the name may be in either script whatever the
                    interface language is. */}
                <span dir="auto" className="block truncate text-[12.5px] font-bold text-white">
                  {user.fullName}
                </span>
                <span className="block truncate text-[10px] text-white/50">
                  {tr.has(user.role) ? tr(user.role) : user.role}
                </span>
              </span>
              {/* Vertical, so it needs no mirroring — it says "this opens",
                  not "this way". */}
              <ChevronsUpDown className="h-3.5 w-3.5 flex-none text-white/40" />
            </>
          )}
        </DropdownMenuTrigger>

        {/* side="top": the trigger sits at the BOTTOM of the sidebar, so a
            menu opening downwards would be clipped.

            ⚠️ w-60 OVERRIDES the popup's w-(--anchor-width). Left alone the
            menu takes the TRIGGER's width — which, collapsed, is a 44px
            avatar. The menu would be 44px wide. */}
        <DropdownMenuContent
          side="top"
          align="start"
          sideOffset={8}
          className="w-60"
        >
          <DropdownMenuGroup>
            <DropdownMenuLabel className="font-normal">
              <span dir="auto" className="block truncate text-[13px] font-bold text-foreground">
                {user.fullName}
              </span>
              <span className="block truncate text-[11.5px] font-normal">
                {tr.has(user.role) ? tr(user.role) : user.role}
              </span>
            </DropdownMenuLabel>
          </DropdownMenuGroup>

          {canSwitchLanguage && (
            <>
              <DropdownMenuSeparator />

              {/* ⚠️ WRAPPED IN A GROUP, and this is not cosmetic.
                  DropdownMenuLabel maps to Base UI's Menu.GroupLabel, which
                  must live inside a Menu.Group — it labels the group, and
                  outside one it has nothing to label. That is what threw
                  error 31. */}
              <DropdownMenuGroup>
                <DropdownMenuLabel className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.12em]">
                  <Languages className="h-3 w-3 flex-none" />
                  {t("language")}
                </DropdownMenuLabel>

                {(Object.keys(LOCALE_NAMES) as Locale[]).map((code) => (
                  <DropdownMenuItem
                    key={code}
                    disabled={pending}
                    // ⚠️ onClick, not onSelect — Base UI's Item, not Radix's.
                    onClick={() => switchTo(code)}
                    className="gap-2"
                  >
                    {/* ⚠️ Each language is named IN ITSELF, never translated.
                        Someone who cannot read the current interface must
                        still recognise their own language here — that is the
                        whole point of the control they are looking for. */}
                    <span
                      dir={code === "ar" ? "rtl" : "ltr"}
                      lang={code}
                      className="flex-1"
                    >
                      {LOCALE_NAMES[code].native}
                    </span>
                    {code === locale && (
                      <Check className="h-3.5 w-3.5 flex-none text-[var(--green-700)]" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuGroup>
            </>
          )}

          <DropdownMenuSeparator />

          <DropdownMenuItem className="gap-2" onClick={() => setPasswordOpen(true)}>
            <KeyRound className="h-3.5 w-3.5 flex-none" />
            {t("changePassword")}
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            variant="destructive"
            className="gap-2"
            onClick={() => { logout(); router.replace(routes.auth.login); }}
          >
            <LogOut className="rtl-flip h-3.5 w-3.5 flex-none" />
            {t("signOut")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* ⚠️ OUTSIDE the DropdownMenu, not inside an item.
          A dialog rendered within a menu is unmounted the moment the menu
          closes — which is the same click that opened it. */}
      <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
    </>
  );
}
