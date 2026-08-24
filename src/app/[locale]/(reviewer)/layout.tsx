"use client";

import { usePathname } from "@/i18n/navigation";
import { Scale, IdCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navMatcher } from "@/lib/nav";
import { routes } from "@/lib/routes";

/**
 * Every destination in this sidebar.
 *
 * Declared as one list because navMatcher decides which entry is current by
 * comparing them all: "/reviewer" is a prefix of "/reviewer/cartes", and only
 * seeing both at once lets the longer one win.
 */
const NAV_HREFS = [
  routes.reviewer.home,
  routes.reviewer.cards,
] as const;

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();

  // Longest match wins. "/reviewer/12" — an examination — falls under
  // "/reviewer" and correctly lights "Dossiers"; "/reviewer/cartes" matches
  // the longer href and lights only the register.
  const isActive = navMatcher(path, NAV_HREFS);

  return (
    <AppShell
      requireRole="REVIEWER"
      title="Commission d'examen"
      subtitle="Examen des candidatures"
      groups={[
        {
          items: [
            {
              label: "Dossiers",
              href: routes.reviewer.home,
              icon: <Scale className="h-[17px] w-[17px]" />,
              active: isActive(routes.reviewer.home),
            },
            {
              label: "Registre des cartes",
              href: routes.reviewer.cards,
              icon: <IdCard className="h-[17px] w-[17px]" />,
              active: isActive(routes.reviewer.cards),
            },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
