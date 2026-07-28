"use client";
// src/app/(candidate)/layout.tsx — guard + chrome for CANDIDATE.
// The nav items are live now that week 3 has built their destinations.
import { usePathname } from "next/navigation";
import { LayoutDashboard, FileText, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { routes } from "@/lib/routes";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppShell
      requireRole="CANDIDATE"
      title="Espace candidat"
      subtitle="Votre demande de carte de presse"
      groups={[
        {
          items: [
            { label: "Tableau de bord", href: routes.candidate.dashboard,
              icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
              active: path === routes.candidate.dashboard },
          ],
        },
        {
          label: "Ma candidature",
          items: [
            { label: "Mon dossier", href: routes.candidate.application,
              icon: <FileText className="h-[17px] w-[17px]" />,
              active: path.startsWith(routes.candidate.application) },
            { label: "Mon profil", href: routes.candidate.profile,
              icon: <User className="h-[17px] w-[17px]" />,
              active: path === routes.candidate.profile },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
