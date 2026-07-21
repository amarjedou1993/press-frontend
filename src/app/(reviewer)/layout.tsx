"use client";
// src/app/(reviewer)/layout.tsx — guard + chrome for the REVIEWER space.
import { AppShell } from "@/components/AppShell";
import { usePathname } from "next/navigation";

export default function ReviewerLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppShell
      requireRole="REVIEWER"
      title="Commission d'examen"
      nav={[
        { label: "File d'attente", href: "/pool", active: path === "/pool" },
        { label: "Mes dossiers", href: "#", disabled: true },
      ]}
    >
      {children}
    </AppShell>
  );
}
