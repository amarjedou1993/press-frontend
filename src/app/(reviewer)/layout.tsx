"use client";
// src/app/(reviewer)/layout.tsx — guard + chrome for REVIEWER.
import { usePathname } from "next/navigation";
import { Inbox, FolderCheck } from "lucide-react";
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
          label: "Examen",
          items: [
            { label: "File d'attente", href: routes.reviewer.pool,
              icon: <Inbox className="h-[17px] w-[17px]" />,
              active: path === routes.reviewer.pool },
            { label: "Mes dossiers", href: "#",
              icon: <FolderCheck className="h-[17px] w-[17px]" />,
              disabled: true, badge: "S4" },
          ],
        },
      ]}
    >
      {children}
    </AppShell>
  );
}
