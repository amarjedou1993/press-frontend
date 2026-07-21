"use client";
// src/app/(candidate)/dashboard/page.tsx
// Candidate home. The (candidate) layout provides the guard + sidebar, so
// this file is just the page content.

function StepDot({ done }: { done?: boolean }) {
  return (
    <span
      className="mt-0.5 flex h-6 w-6 flex-none items-center justify-center rounded-full text-[11px] font-bold"
      style={{
        background: done ? "var(--green-tint)" : "#eef1ef",
        color: done ? "var(--green-700)" : "var(--muted-fg)",
        border: `1.5px solid ${done ? "var(--green-500)" : "var(--line)"}`,
      }}
    >
      {done ? "\u2713" : ""}
    </span>
  );
}

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div
        className="fade-up relative overflow-hidden rounded-2xl p-7 text-white"
        style={{
          background:
            "radial-gradient(600px 300px at 90% -20%, rgba(255,215,0,.14), transparent 60%), linear-gradient(160deg, var(--green-900), #0e3d29)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold-500)]">
              Ma demande de carte de presse
            </p>
            <h2 className="mt-2 text-2xl font-extrabold">Aucune session ouverte</h2>
            <p className="mt-2 max-w-lg text-sm text-white/70">
              Aucune session de candidature n&apos;est actuellement ouverte. Vous
              recevrez un e-mail dès qu&apos;une session sera disponible.
            </p>
          </div>
          <span className="rounded-full bg-white/10 px-3 py-1 text-[12px] font-bold text-white/80 ring-1 ring-white/20">
            En attente
          </span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-[1.4fr_1fr]">
        <div className="fade-up rounded-2xl bg-white p-6" style={{ border: "1px solid var(--line)", boxShadow: "0 1px 2px rgba(22,34,27,.05),0 4px 16px rgba(22,34,27,.05)" }}>
          <h3 className="text-sm font-extrabold text-[var(--green-900)]">Comment obtenir votre carte</h3>
          <ol className="mt-4 space-y-4">
            {[
              ["Ouverture d'une session", "La HAPA ouvre une session de candidature."],
              ["Dépôt du dossier", "Vous soumettez vos pièces ; le système vérifie qu'elles sont complètes."],
              ["Examen", "La commission d'examen étudie votre dossier et rend sa décision."],
              ["Édition de la carte", "En cas d'acceptation, votre carte bilingue est éditée."],
            ].map(([title, desc], i) => (
              <li key={i} className="flex gap-3">
                <StepDot />
                <div>
                  <p className="text-sm font-bold text-[var(--ink)]">{title}</p>
                  <p className="text-[13px] text-[var(--slate)]">{desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>

        <div className="space-y-6">
          <div className="fade-up rounded-2xl p-6" style={{ background: "var(--green-tint)", border: "1px solid var(--green-500)" }}>
            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]">Votre future carte</p>
            <div className="mt-3 aspect-[1.586] rounded-xl bg-white p-4 shadow-sm" role="img" aria-label="Aperçu de la carte">
              <div className="flex justify-between border-b-2 border-[var(--green-500)] pb-1.5">
                <span className="text-[9px] font-extrabold text-[var(--green-700)]">HAPA</span>
                <span dir="rtl" className="text-[9px] text-[var(--green-700)]">بطاقة صحفية</span>
              </div>
              <p className="mt-2 text-[11px] font-extrabold text-[var(--green-900)]">CARTE DE PRESSE</p>
              <p className="mt-1 font-mono text-[8px] text-[var(--muted-fg)]">HAPA-2026-XXXXXX</p>
              <div className="mt-2 flex h-1 w-full" aria-hidden="true">
                <i className="flex-1 bg-[var(--green-500)]" /><i className="flex-1 bg-[var(--gold-500)]" /><i className="flex-1 bg-[var(--red-500)]" />
              </div>
            </div>
          </div>

          <div className="fade-up rounded-2xl bg-white p-6" style={{ border: "1px solid var(--line)" }}>
            <h3 className="text-sm font-extrabold text-[var(--green-900)]">Catégories</h3>
            <ul className="mt-3 space-y-2 text-[13px] text-[var(--slate)]">
              <li className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-[var(--green-500)]" />Média international</li>
              <li className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-[var(--green-500)]" />Professionnel des médias, employé public</li>
              <li className="flex items-center gap-2"><i className="h-1.5 w-1.5 rounded-full bg-[var(--green-500)]" />Journaliste indépendant</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
