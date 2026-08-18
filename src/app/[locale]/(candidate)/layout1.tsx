"use client";
// src/app/(candidate)/layout.tsx — guard + chrome for CANDIDATE.

// import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { navMatcher } from "@/lib/nav";
import { routes } from "@/lib/routes";
import { usePathname } from "@/i18n/navigation";

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
  const path = usePathname();

  const isActive = navMatcher(path, NAV_HREFS);

  return (
    <AppShell
      requireRole="CANDIDATE"
      title="Espace candidat"
      subtitle="Votre demande de carte de presse"
      groups={[
        {
          items: [
            {
              label: "Tableau de bord",
              href: routes.candidate.dashboard,
              icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
              active: isActive(routes.candidate.dashboard),
            },
          ],
        },
        {
          label: "Ma candidature",
          items: [
            {
              label: "Mon dossier",
              href: routes.candidate.application,
              icon: <FileText className="h-[17px] w-[17px]" />,
              active: isActive(routes.candidate.application),
            },
            {
              label: "Mon profil",
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
