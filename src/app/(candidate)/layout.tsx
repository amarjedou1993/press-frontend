"use client";
// src/app/(candidate)/layout.tsx
// Guard + chrome for the CANDIDATE space. Every page inside inherits the
// role check and the candidate sidebar — declared once, here.
import { AppShell } from "@/components/AppShell";
import { usePathname } from "next/navigation";

export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppShell
      requireRole="CANDIDATE"
      title="Espace candidat"
      nav={[
        { label: "Tableau de bord", href: "/dashboard", active: path === "/dashboard" },
        { label: "Ma candidature", href: "#", disabled: true },
        { label: "Mon profil", href: "#", disabled: true },
      ]}
    >
      {children}
    </AppShell>
  );
}
