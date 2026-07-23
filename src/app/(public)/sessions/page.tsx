// src/app/(public)/sessions/page.tsx  →  /sessions
// SERVER COMPONENT + ISR. Rendered on the server, cached, and re-rendered at
// most once a minute: complete HTML arrives on the first byte, the page is
// indexable, and the backend answers one request per window no matter how
// many journalists open it.

import Link from "next/link";
import { CalendarDays, ArrowRight, Clock, FileCheck2 } from "lucide-react";
import { fetchOpenSessions, fetchCategories } from "@/lib/api/public";
import { routes } from "@/lib/routes";

export const revalidate = 60;

export const metadata = {
  title: "Sessions de candidature — HAPA",
  description:
    "Sessions d'accréditation ouvertes pour la carte de presse en Mauritanie. Déposez votre demande auprès de la HAPA.",
};

function fmtLong(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
}

function daysUntil(iso: string) {
  const end = new Date(iso + "T00:00:00").getTime();
  const now = new Date().setHours(0, 0, 0, 0);
  return Math.round((end - now) / 86_400_000);
}

export default async function PublicSessionsPage() {
  // Both fetches run in parallel on the server.
  const [sessions, categories] = await Promise.all([
    fetchOpenSessions(),
    fetchCategories(),
  ]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-14">
      <header className="max-w-2xl">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
          Accréditation presse
        </p>
        <h1 className="mt-2 text-[34px] font-extrabold leading-tight text-[var(--green-900)]">
          Sessions de candidature
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[var(--slate)]">
          La HAPA ouvre périodiquement des sessions durant lesquelles les
          journalistes peuvent déposer une demande de carte de presse. Les
          sessions actuellement ouvertes sont listées ci-dessous.
        </p>
      </header>

      {/* ── Open sessions ── */}
      <section className="mt-10">
        {sessions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-[var(--line)] bg-white p-14 text-center">
            <CalendarDays className="mx-auto h-10 w-10 text-[var(--muted-fg)]" />
            <h2 className="mt-4 text-lg font-extrabold text-[var(--green-900)]">
              Aucune session ouverte actuellement
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-[var(--slate)]">
              Aucune session de candidature n&apos;est ouverte pour le moment.
              Créez votre compte dès maintenant : vous serez informé par e-mail
              dès l&apos;ouverture de la prochaine session.
            </p>
            <Link
              href={routes.auth.register}
              className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--green-700)] px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[var(--green-600)]"
            >
              Créer mon compte <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((s) => {
              const left = daysUntil(s.receivingEnd);
              const closingSoon = left >= 0 && left <= 5;
              return (
                <article
                  key={s.id}
                  className="relative overflow-hidden rounded-2xl p-7 text-white shadow-lg"
                  style={{
                    background:
                      "radial-gradient(650px 320px at 92% -25%, rgba(255,215,0,.16), transparent 60%), linear-gradient(158deg, var(--green-900), #0e3d29)",
                  }}
                >
                  <div
                    className="pointer-events-none absolute inset-0 opacity-[0.05]"
                    style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 11px)" }}
                    aria-hidden="true"
                  />
                  <div className="relative z-10 flex flex-wrap items-start justify-between gap-6">
                    <div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--green-500)] px-3 py-1 text-[11px] font-extrabold text-white">
                        <span className="h-1.5 w-1.5 rounded-full bg-white" />
                        Candidatures ouvertes
                      </span>
                      <h2 className="mt-3 text-2xl font-extrabold">
                        Session ouverte le {fmtLong(s.startDate)}
                      </h2>
                      <p className="mt-2 flex items-center gap-2 text-sm text-white/70">
                        <Clock className="h-4 w-4" />
                        Dépôt des dossiers jusqu&apos;au{" "}
                        <b className="font-semibold text-white">{fmtLong(s.receivingEnd)}</b>
                      </p>
                      {closingSoon && (
                        <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-[var(--gold-500)]/20 px-2.5 py-1 text-[12px] font-bold text-[var(--gold-500)] ring-1 ring-[var(--gold-500)]/40">
                          {left === 0
                            ? "Dernier jour pour déposer votre dossier"
                            : `Plus que ${left} jour${left > 1 ? "s" : ""} pour déposer`}
                        </p>
                      )}
                    </div>

                    <Link
                      href={routes.auth.register}
                      className="inline-flex items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-[var(--green-900)] transition-transform hover:-translate-y-px"
                    >
                      Déposer ma demande <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Categories ── */}
      {categories.length > 0 && (
        <section className="mt-14">
          <h2 className="text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
            Catégories d&apos;accréditation
          </h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            {categories.map((c) => (
              <div
                key={c.id}
                className="rounded-xl border border-[var(--line)] bg-white p-5"
              >
                <FileCheck2 className="h-4 w-4 text-[var(--green-600)]" />
                <p className="mt-3 text-sm font-bold text-[var(--green-900)]">
                  {c.labelFr}
                </p>
                <p dir="rtl" className="mt-1 text-[13px] text-[var(--slate)]">
                  {c.labelAr}
                </p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-[var(--slate)]">
            Les pièces justificatives requises dépendent de votre catégorie et
            vous seront indiquées lors du dépôt.
          </p>
        </section>
      )}
    </div>
  );
}
