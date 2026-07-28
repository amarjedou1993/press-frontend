"use client";
// src/app/(reviewer)/layout.tsx — guard + chrome for REVIEWER.
import { usePathname } from "next/navigation";
import { Scale, FolderOpen } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { routes } from "@/lib/routes";

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
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
              active: path === routes.reviewer.home,
            },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
