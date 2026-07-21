"use client";
// src/app/(reviewer)/pool/page.tsx — reviewer home (W4 builds the real pool)
import { Card } from "@/components/AppShell";

export default function PoolPage() {
  return (
    <div className="mx-auto max-w-4xl">
      <Card>
        <h2 className="text-base font-extrabold text-[var(--green-900)]">
          File d&apos;attente des dossiers
        </h2>
        <p className="mt-2 text-sm text-[var(--slate)]">
          La file partagée des candidatures à examiner apparaîtra ici dès
          qu&apos;une session sera en phase d&apos;examen. (Semaine 4 :
          réclamation des dossiers, décisions.)
        </p>
      </Card>
    </div>
  );
}
