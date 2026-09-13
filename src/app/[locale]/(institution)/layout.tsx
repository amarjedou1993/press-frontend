"use client";
// src/app/[locale]/(institution)/layout.tsx

import { useTranslations } from "next-intl";
import { usePathname } from "next/navigation";
import { Users2 } from "lucide-react";
import { AppShell, type NavGroup } from "@/components/AppShell";
import { routes } from "@/lib/routes";

export default function InstitutionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("institutionShell");
  const pathname = usePathname();

  /*
   * ⚠️ ONE ENTRY, AND THAT IS THE WHOLE SPACE.
   *
   * The account belongs to the body rather than to a person: there is no
   * profile to edit, no password page beyond the shared one, no dossier to
   * follow. An institution files its staff and waits.
   *
   * A rail padded out to three entries would be inventing destinations to
   * make the furniture look right — and every one of them would be a page
   * that answers nothing.
   */
  const groups: NavGroup[] = [
    {
      label: t("navGroup"),
      items: [
        {
          label: t("staff"),
          href: routes.institution.home,
          icon: <Users2 className="h-4 w-4" />,
          active: pathname.endsWith(routes.institution.home),
        },
      ],
    },
  ];

  return (
    <AppShell
      requireRole="INSTITUTION"
      groups={groups}
      title={t("title")}
      subtitle={t("subtitle")}
      /*
       * ⚠️ TRUE, unlike the Authority's spaces.
       *
       * The proxy redirects /ar/admin to /fr/admin because the staff
       * catalogues are French only. An institution is not staff — its account
       * holder may well read Arabic, and the space is built from the same
       * catalogues the candidate space uses.
       */
      canSwitchLanguage
    >
      {children}
    </AppShell>
  );
}
