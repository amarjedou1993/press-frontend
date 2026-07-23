"use client";
// src/app/(admin)/layout.tsx — guard + chrome for SUPER_ADMIN.
import { usePathname } from "next/navigation";
import { LayoutDashboard, CalendarDays, Users, IdCard } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { routes } from "@/lib/routes";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppShell
      requireRole="SUPER_ADMIN"
      title="Administration"
      subtitle="Sessions, commission d'examen et cartes de presse"
      groups={[
        {
          items: [
            { label: "Tableau de bord", href: routes.admin.home,
              icon: <LayoutDashboard className="h-[17px] w-[17px]" />,
              active: path === routes.admin.home },
          ],
        },
        {
          label: "Accréditation",
          items: [
            { label: "Sessions", href: routes.admin.sessions,
              icon: <CalendarDays className="h-[17px] w-[17px]" />,
              active: path.startsWith(routes.admin.sessions) },
            { label: "Réviseurs", href: routes.admin.reviewers,
              icon: <Users className="h-[17px] w-[17px]" />,
              active: path === routes.admin.reviewers },
            { label: "Cartes", href: routes.admin.cards,
              icon: <IdCard className="h-[17px] w-[17px]" />,
              disabled: true, badge: "S6" },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
