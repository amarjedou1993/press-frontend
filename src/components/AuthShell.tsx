"use client";

import { useState, type ReactNode } from "react";

function NationalMark({ small = false }: { small?: boolean }) {
  const h = small ? "h-3" : "h-3.5";
  return (
    <span className="inline-flex items-center gap-1" aria-hidden="true">
      <i className={`${h} w-1.5 rounded-full bg-[var(--green-500)]`} />
      <i className={`${h} w-1.5 rounded-full bg-[var(--gold-500)]`} />
      <i className={`${h} w-1.5 rounded-full bg-[var(--red-500)]`} />
    </span>
  );
}

/* ── The press-card motif — the product as the emblem ─────────────── */
function PressCardSpecimen() {
  return (
    <div className="card-float">
      <div
        className="relative w-full max-w-[400px] aspect-[1.586] overflow-hidden rounded-2xl bg-white p-5 -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-[1.02]"
        style={{
          boxShadow:
            "0 40px 80px -24px rgba(0,0,0,.55), 0 12px 28px -12px rgba(0,0,0,.35)",
          color: "var(--ink)",
        }}
        role="img"
        aria-label="Carte de presse — spécimen"
      >
        {/* guilloche security band */}
        <svg
          className="pointer-events-none absolute inset-x-0 bottom-7 h-16 w-full"
          viewBox="0 0 400 64"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          {[16, 26, 36, 46].map((y) => (
            <path
              key={y}
              d={`M0 ${y} C 60 ${y - 16}, 120 ${y + 16}, 180 ${y} S 300 ${y - 16}, 360 ${y} S 420 ${y + 12}, 440 ${y}`}
              fill="none"
              stroke="var(--green-500)"
              strokeWidth="0.9"
              opacity="0.14"
            />
          ))}
        </svg>

        {/* header */}
        <div className="flex items-start justify-between gap-3 border-b-2 border-[var(--green-500)] pb-2">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--green-700)]">
              HAPA
            </p>
            <p className="mt-0.5 max-w-[150px] text-[6.5px] font-semibold uppercase leading-[1.4] tracking-[0.08em] text-[var(--muted-fg)]">
              Haute Autorité de la Presse et de l&apos;Audiovisuel
            </p>
          </div>
          <p dir="rtl" className="text-right text-[10px] leading-snug text-[var(--green-700)]">
            السلطة العليا للصحافة
            <br />
            والسمعيات البصرية
          </p>
        </div>
        <div className="h-px w-full bg-[var(--gold-500)]/70" aria-hidden="true" />

        {/* body: photo + titles + fields */}
        <div className="mt-3 flex gap-4">
          <div className="flex h-[84px] w-[68px] flex-none items-center justify-center rounded-lg border border-[var(--green-500)]/30 bg-[var(--green-tint)]">
            <svg width="30" height="30" viewBox="0 0 24 24" fill="none"
              stroke="var(--green-600)" strokeWidth="1.6" opacity="0.55"
              strokeLinecap="round" aria-hidden="true">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
            </svg>
          </div>
          <div className="min-w-0">
            <div className="flex items-baseline justify-between gap-3">
              <b className="text-[13.5px] font-extrabold tracking-[0.05em] text-[var(--green-900)]">
                CARTE DE PRESSE
              </b>
              <span dir="rtl" className="text-[12px] font-semibold text-[var(--green-900)]">
                بطاقة صحفية
              </span>
            </div>
            <dl className="mt-2.5 space-y-1.5">
              {[
                ["Nom", "—————————"],
                ["N°", "HAPA-2026-000000"],
                ["Validité", "12 / 2027"],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline gap-2">
                  <dt className="w-14 flex-none text-[7.5px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]/80">
                    {label}
                  </dt>
                  <dd className="font-mono text-[9.5px] text-[var(--ink)]/85">
                    {value}
                  </dd>
                </div>
              ))}
            </dl>
          </div>
        </div>

        {/* serrated gold seal */}
        <div
          className="absolute bottom-9 right-4 flex h-[60px] w-[60px] rotate-12 items-center justify-center rounded-full border-2 border-dashed border-[var(--gold-500)]"
          aria-hidden="true"
        >
          <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-[var(--gold-500)]"
            style={{
              background:
                "radial-gradient(circle at 35% 30%, rgba(255,215,0,.28), transparent 65%)",
            }}
          >
            <NationalMark small />
          </div>
        </div>

        {/* MRZ line */}
        <p
          className="absolute bottom-3 left-5 right-5 overflow-hidden whitespace-nowrap font-mono text-[8.5px] tracking-[0.32em] text-[var(--muted-fg)]"
          aria-hidden="true"
        >
          HAPA&lt;RIM&lt;PRESSE&lt;&lt;SPECIMEN
        </p>

        {/* national baseline */}
        <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </div>
    </div>
  );
}

/* ── The shell ────────────────────────────────────────────────────── */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      {/* ══ Brand panel ══ */}
      <section
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          background:
            "radial-gradient(900px 460px at 88% -12%, rgba(255,215,0,.14), transparent 60%), radial-gradient(700px 500px at -10% 110%, rgba(0,169,92,.25), transparent 55%), linear-gradient(168deg, var(--green-900) 0%, #0e3d29 55%, #0b3524 100%)",
        }}
      >
        {/* security-print texture */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{
            backgroundImage:
              "repeating-linear-gradient(115deg, #ffffff 0 1px, transparent 1px 11px)",
          }}
          aria-hidden="true"
        />
        {/* concentric engraving */}
        <svg
          className="pointer-events-none absolute -right-28 -top-28 w-[480px] opacity-[0.06]"
          viewBox="0 0 400 400"
          aria-hidden="true"
        >
          {[70, 105, 140, 175, 195].map((r) => (
            <circle key={r} cx="200" cy="200" r={r} fill="none" stroke="#fff" strokeWidth="1" />
          ))}
        </svg>

        <header className="relative z-10 fade-up">
          <div className="flex items-center gap-3">
            <NationalMark />
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/60">
              République Islamique de Mauritanie
            </p>
          </div>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold-500)]">
            Haute Autorité de la Presse et de l&apos;Audiovisuel
          </p>
          <h1 className="mt-3 text-[38px] font-extrabold leading-[1.1] xl:text-[44px]">
            La carte de presse
            <br />
            <span className="text-[var(--gold-500)]">officielle</span> de la
            Mauritanie
          </h1>
        </header>

        <div className="relative z-10 self-center fade-up" style={{ animationDelay: "150ms" }}>
          <PressCardSpecimen />
        </div>

        <footer className="relative z-10 fade-up" style={{ animationDelay: "300ms" }}>
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-[11.5px] font-semibold text-white/70">
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              Données sécurisées
            </span>
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9Z"/></svg>
              Bilingue FR · AR
            </span>
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5"/></svg>
              Registre officiel
            </span>
          </div>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-white/45">
            Espace sécurisé — vos informations sont traitées par la HAPA dans
            le cadre de l&apos;accréditation des journalistes.
          </p>
        </footer>
      </section>

      {/* ══ Form panel ══ */}
      <section className="relative flex items-center justify-center bg-white p-6 sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{
            background:
              "radial-gradient(640px 320px at 100% 0%, var(--green-tint), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative z-10 w-full max-w-md">
          {/* mobile brand */}
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <NationalMark />
            <span className="text-sm font-extrabold tracking-[0.1em] text-[var(--green-900)]">
              HAPA <span className="text-[var(--gold-700)]">/</span> ACCRÉDITATION PRESSE
            </span>
          </div>

          <p className="fade-up text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
            HAPA · Accréditation presse
          </p>
          <h2 className="fade-up mt-2 text-[30px] font-extrabold leading-tight text-[var(--green-900)]" style={{ animationDelay: "60ms" }}>
            {title}
          </h2>
          <p className="fade-up mt-2 text-[15px] text-[var(--slate)]" style={{ animationDelay: "110ms" }}>
            {subtitle}
          </p>
          <div className="fade-up mt-9" style={{ animationDelay: "170ms" }}>
            {children}
          </div>
          <div className="fade-up mt-7 text-sm text-[var(--slate)]" style={{ animationDelay: "230ms" }}>
            {footer}
          </div>
        </div>
      </section>
    </main>
  );
}

/* ── Form primitives ─────────────────────────────────────────────── */

const inputBase =
  "w-full rounded-xl border-[1.5px] bg-white px-4 py-3 text-[15px] transition-all " +
  "placeholder:text-[var(--muted-fg)] focus:outline-none focus:border-[var(--green-600)] " +
  "focus:ring-4 focus:ring-[var(--green-tint)]";

export function Field({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  const id = inputProps.id ?? inputProps.name;
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-[var(--ink)]">
        {label}
      </label>
      <input
        id={id}
        {...inputProps}
        aria-invalid={!!error}
        className={`mt-2 ${inputBase}`}
        style={{ borderColor: error ? "var(--red-500)" : "var(--line)" }}
      />
      {error && (
        <p className="mt-1.5 text-xs font-medium text-[var(--red-500)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/** Password input with a visibility toggle (the eye). */
export function PasswordField({
  label,
  error,
  ...inputProps
}: {
  label: string;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "type">) {
  const id = inputProps.id ?? inputProps.name;
  const [visible, setVisible] = useState(false);
  return (
    <div className="mb-5">
      <label htmlFor={id} className="block text-[13px] font-semibold text-[var(--ink)]">
        {label}
      </label>
      <div className="relative mt-2">
        <input
          id={id}
          {...inputProps}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={`${inputBase} pr-12`}
          style={{ borderColor: error ? "var(--red-500)" : "var(--line)" }}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-12 items-center justify-center rounded-r-xl text-[var(--muted-fg)] transition-colors hover:text-[var(--green-700)]"
        >
          {visible ? (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
              <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
              <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
              <line x1="1" y1="1" x2="23" y2="23" />
            </svg>
          ) : (
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              strokeLinejoin="round" aria-hidden="true">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8Z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
      {error && (
        <p className="mt-1.5 text-xs font-medium text-[var(--red-500)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({
  children,
  loading,
}: {
  children: ReactNode;
  loading?: boolean;
}) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="h-12 w-full rounded-xl text-[15px] font-bold text-white transition-all hover:-translate-y-px active:translate-y-0 disabled:opacity-60 disabled:hover:translate-y-0"
      style={{
        background: "linear-gradient(180deg, var(--green-600), var(--green-700))",
        boxShadow: "0 12px 28px -10px rgba(0,107,60,.55)",
      }}
    >
      {loading ? "Veuillez patienter…" : children}
    </button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="mb-5 rounded-xl border border-[var(--red-500)]/25 bg-[var(--red-tint)] px-4 py-3 text-sm font-medium text-[var(--red-700)]"
    >
      {message}
    </p>
  );
}
