"use client";

import { AppShell, Card, StatusBadge } from "@/components/AppShell";

export default function DashboardPage() {
  return (
    <AppShell
      title="Tableau de bord"
      nav={[
        { label: "Tableau de bord", href: "/dashboard", active: true },
        { label: "Ma candidature", href: "#", disabled: true },
        { label: "Mon profil", href: "#", disabled: true },
      ]}
    >
      <div className="max-w-3xl space-y-5">
        <Card>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <h2 className="text-base font-extrabold text-[var(--green-900)]">
                Ma demande de carte de presse
              </h2>
              <p className="mt-1 text-sm text-[var(--slate)]">
                Aucune session de candidature n&apos;est ouverte pour le
                moment. Vous serez notifié par e-mail dès l&apos;ouverture.
              </p>
            </div>
            <StatusBadge kind="draft">Aucune candidature</StatusBadge>
          </div>
        </Card>

        <Card>
          <h3 className="text-sm font-bold text-[var(--green-900)]">
            Comment ça marche
          </h3>
          <ol className="mt-3 space-y-2 text-sm text-[var(--slate)] list-decimal list-inside">
            <li>Une session de candidature est ouverte par la HAPA.</li>
            <li>
              Vous déposez votre dossier complet (le système vérifie les pièces
              requises pour votre catégorie).
            </li>
            <li>La commission d&apos;examen étudie votre dossier.</li>
            <li>
              En cas d&apos;acceptation, votre carte de presse bilingue est
              éditée par la HAPA.
            </li>
          </ol>
        </Card>
      </div>
    </AppShell>
  );
}
