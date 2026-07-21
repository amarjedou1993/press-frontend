"use client";
// src/app/(admin)/layout.tsx — guard + chrome for the SUPER_ADMIN space.
import { AppShell } from "@/components/AppShell";
import { usePathname } from "next/navigation";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const path = usePathname();
  return (
    <AppShell
      requireRole="SUPER_ADMIN"
      title="Administration"
      nav={[
        { label: "Tableau de bord", href: "/admin", active: path === "/admin" },
        { label: "Sessions", href: "#", disabled: true },
        { label: "Réviseurs", href: "#", disabled: true },
        { label: "Cartes", href: "#", disabled: true },
      ]}
    >
      {children}
    </AppShell>
  );
}
