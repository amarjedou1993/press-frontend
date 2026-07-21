"use client";
// src/app/(admin)/admin/page.tsx — admin home (W2 builds sessions here)
import { Card } from "@/components/AppShell";

export default function AdminHomePage() {
  const tiles = [
    ["Sessions", "Ouvrir et gérer les sessions de candidature.", "Semaine 2"],
    ["Réviseurs", "Créer et gérer les membres de la commission.", "Semaine 2"],
    ["Cartes", "Générer les cartes et exporter la liste.", "Semaine 6"],
  ];
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div
        className="rounded-2xl p-7 text-white"
        style={{ background: "linear-gradient(160deg, var(--green-900), #0e3d29)" }}
      >
        <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold-500)]">
          Administration HAPA
        </p>
        <h2 className="mt-2 text-2xl font-extrabold">Tableau de bord</h2>
        <p className="mt-2 text-sm text-white/70">
          Gérez les sessions, la commission d&apos;examen et l&apos;édition des cartes.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {tiles.map(([title, desc, when]) => (
          <Card key={title}>
            <div className="flex items-start justify-between">
              <h3 className="text-sm font-extrabold text-[var(--green-900)]">{title}</h3>
              <span className="rounded-full bg-[var(--gold-tint)] px-2 py-0.5 text-[10px] font-bold text-[var(--gold-700)]">
                {when}
              </span>
            </div>
            <p className="mt-2 text-[13px] text-[var(--slate)]">{desc}</p>
          </Card>
        ))}
      </div>
    </div>
  );
}
