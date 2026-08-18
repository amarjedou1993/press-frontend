"use client";
// src/app/[locale]/(candidate)/layout.tsx — guard + chrome for CANDIDATE.

import { useEffect } from "react";
import { useLocale, useTranslations } from "next-intl";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { usePathname } from "@/i18n/navigation";
import { AppShell } from "@/components/AppShell";
import { setLocale } from "@/lib/api/account";
import { useAuth } from "@/lib/auth";
import { navMatcher } from "@/lib/nav";
import { routes } from "@/lib/routes";

/**
 * Every destination in this sidebar.
 *
 * No prefix collision here today — but the candidate space will grow (a
 * correction workspace, an objection form), and the same rule then applies
 * without anyone having to notice it does.
 */
const NAV_HREFS = [
  routes.candidate.dashboard,
  routes.candidate.application,
  routes.candidate.profile,
] as const;

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const t = useTranslations("nav");
  const ts = useTranslations("candidateShell");
  const locale = useLocale();
  const { user, ready } = useAuth();
  const path = usePathname();

  const isActive = navMatcher(path, NAV_HREFS);

  /**
   * Keep the stored language in step with the one being read.
   *
   * ⚠️ THIS IS NOT THE INTERFACE LOCALE — that lives in the URL and needs no
   * server. This is what E-MAIL to this person is written in, and an e-mail
   * has no request to read a locale from: it is composed hours later by a
   * job, for somebody who is not there.
   *
   * A candidate who switches to Arabic reasonably expects their notifications
   * to follow. Making them find a separate setting for it would mean most
   * never do.
   *
   * Fire-and-forget: a failed sync is not worth interrupting anyone for, and
   * the next switch retries it. The catch is deliberate, not lazy.
   */
  useEffect(() => {
    if (!ready || !user) return;
    setLocale(locale).catch(() => {});
  }, [locale, ready, user]);

  return (
    <AppShell
      requireRole="CANDIDATE"
      title={ts("title")}
      subtitle={ts("subtitle")}
      groups={[
        {
          items: [
            {
              label: t("dashboard"),
              href: routes.candidate.dashboard,
              icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
              active: isActive(routes.candidate.dashboard),
            },
          ],
        },
        {
          label: ts("myApplicationGroup"),
          items: [
            {
              label: t("myApplication"),
              href: routes.candidate.application,
              icon: <FileText className="h-[17px] w-[17px]" />,
              active: isActive(routes.candidate.application),
            },
            {
              label: t("myProfile"),
              href: routes.candidate.profile,
              icon: <User className="h-[17px] w-[17px]" />,
              active: isActive(routes.candidate.profile),
            },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
