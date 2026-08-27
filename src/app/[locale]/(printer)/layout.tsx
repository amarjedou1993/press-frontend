"use client";
// src/app/[locale]/(printer)/layout.tsx

import { usePathname } from "@/i18n/navigation";
import { Printer, History } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navMatcher } from "@/lib/nav";
import { routes } from "@/lib/routes";

/**
 * Every destination in this sidebar.
 *
 * Declared as one list because navMatcher decides which entry is current by
 * comparing them all: "/printer" is a prefix of "/printer/historique", and
 * only seeing both at once lets the longer one win.
 */
const NAV_HREFS = [
  routes.printer.home,
  routes.printer.history,
] as const;

export default function PrinterLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  const isActive = navMatcher(path, NAV_HREFS);

  return (
    <AppShell
      requireRole="PRINTER"
      title="Production des cartes"
      subtitle="Fabrication des cartes de presse"
      /**
       * ⚠️ French, like the Authority's other spaces.
       *
       * The proxy redirects /ar/printer to /fr/printer, so a language control
       * here would reload the page in French and look broken. One line to
       * reverse when the staff catalogues exist.
       */
      canSwitchLanguage={false}
      groups={[
        {
          items: [
            {
              label: "À produire",
              href: routes.printer.home,
              icon: <Printer className="h-[17px] w-[17px]" />,
              active: isActive(routes.printer.home),
            },
            {
              label: "Historique",
              href: routes.printer.history,
              icon: <History className="h-[17px] w-[17px]" />,
              active: isActive(routes.printer.history),
            },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
