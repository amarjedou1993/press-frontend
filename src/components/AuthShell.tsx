"use client";

import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff } from "lucide-react";

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

/* Press-card specimen — CUSTOM branding (no library primitive fits) */
function PressCardSpecimen() {
  return (
    <div
      className="relative w-full max-w-[400px] aspect-[1.586] overflow-hidden rounded-2xl bg-white p-5 -rotate-3 transition-transform duration-500 hover:rotate-0 hover:scale-[1.02]"
      style={{
        boxShadow: "0 40px 80px -24px rgba(0,0,0,.5), 0 12px 28px -12px rgba(0,0,0,.35)",
        color: "var(--ink)",
      }}
      role="img"
      aria-label="Carte de presse — spécimen"
    >
      <div className="flex items-start justify-between gap-3 border-b-2 border-[var(--green-500)] pb-2">
        <div>
          <p className="text-[11px] font-extrabold tracking-[0.08em] text-[var(--green-700)]">HAPA</p>
          <p className="mt-0.5 max-w-[150px] text-[6.5px] font-semibold uppercase leading-[1.4] tracking-[0.08em] text-[var(--muted-fg)]">
            Haute Autorite de la Presse et de l&apos;Audiovisuel
          </p>
        </div>
        <p dir="rtl" className="text-right text-[10px] leading-snug text-[var(--green-700)]">
          &#1575;&#1604;&#1587;&#1604;&#1591;&#1577; &#1575;&#1604;&#1593;&#1604;&#1610;&#1575; &#1604;&#1604;&#1589;&#1581;&#1575;&#1601;&#1577;<br />&#1608;&#1575;&#1604;&#1587;&#1605;&#1593;&#1610;&#1575;&#1578; &#1575;&#1604;&#1576;&#1589;&#1585;&#1610;&#1577;
        </p>
      </div>
      <div className="h-px w-full bg-[var(--gold-500)]/70" aria-hidden="true" />
      <div className="mt-3 flex gap-4">
        <div className="flex h-[84px] w-[68px] flex-none items-center justify-center rounded-lg border border-[var(--green-500)]/30 bg-[var(--green-tint)]">
          <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--green-600)" strokeWidth="1.6" opacity="0.55" strokeLinecap="round" aria-hidden="true">
            <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5" />
          </svg>
        </div>
        <div className="min-w-0">
          <div className="flex items-baseline justify-between gap-3">
            <b className="text-[13.5px] font-extrabold tracking-[0.05em] text-[var(--green-900)]">CARTE DE PRESSE</b>
            <span dir="rtl" className="text-[12px] font-semibold text-[var(--green-900)]">&#1576;&#1591;&#1575;&#1602;&#1577; &#1589;&#1581;&#1601;&#1610;&#1577;</span>
          </div>
          <dl className="mt-2.5 space-y-1.5">
            {[["Nom", "\u2014\u2014\u2014\u2014\u2014"], ["N", "HAPA-2026-000000"], ["Validite", "12 / 2027"]].map(([l, v]) => (
              <div key={l} className="flex items-baseline gap-2">
                <dt className="w-14 flex-none text-[7.5px] font-bold uppercase tracking-[0.14em] text-[var(--green-700)]/80">{l}</dt>
                <dd className="font-mono text-[9.5px] text-[var(--ink)]/85">{v}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
      <div className="absolute bottom-9 right-4 flex h-[60px] w-[60px] rotate-12 items-center justify-center rounded-full border-2 border-dashed border-[var(--gold-500)]" aria-hidden="true">
        <div className="flex h-[42px] w-[42px] items-center justify-center rounded-full border-2 border-[var(--gold-500)]"
          style={{ background: "radial-gradient(circle at 35% 30%, rgba(255,215,0,.28), transparent 65%)" }}>
          <NationalMark small />
        </div>
      </div>
      <p className="absolute bottom-3 left-5 right-5 overflow-hidden whitespace-nowrap font-mono text-[8.5px] tracking-[0.32em] text-[var(--muted-fg)]" aria-hidden="true">
        HAPA&lt;RIM&lt;PRESSE&lt;&lt;SPECIMEN
      </p>
      <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
        <i className="flex-1 bg-[var(--green-500)]" /><i className="flex-1 bg-[var(--gold-500)]" /><i className="flex-1 bg-[var(--red-500)]" />
      </div>
    </div>
  );
}

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string; subtitle: string; children: ReactNode; footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section
        className="relative hidden overflow-hidden p-12 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          background:
            "radial-gradient(900px 460px at 88% -12%, rgba(255,215,0,.14), transparent 60%), radial-gradient(700px 500px at -10% 110%, rgba(0,169,92,.25), transparent 55%), linear-gradient(168deg, var(--green-900) 0%, #0e3d29 55%, #0b3524 100%)",
        }}
      >
        <div className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0 1px, transparent 1px 11px)" }} aria-hidden="true" />
        <header className="relative z-10">
          <div className="flex items-center gap-3">
            <NationalMark />
            <p className="text-[10.5px] font-bold uppercase tracking-[0.22em] text-white/60">
              Republique Islamique de Mauritanie
            </p>
          </div>
          <p className="mt-7 text-[11px] font-bold uppercase tracking-[0.18em] text-[var(--gold-500)]">
            Haute Autorite de la Presse et de l&apos;Audiovisuel
          </p>
          <h1 className="mt-3 text-[38px] font-extrabold leading-[1.1] xl:text-[44px]">
            La carte de presse<br />
            <span className="text-[var(--gold-500)]">officielle</span> de la Mauritanie
          </h1>
        </header>
        <div className="relative z-10 self-center">
          <PressCardSpecimen />
        </div>
        <footer className="relative z-10">
          <div className="flex flex-wrap gap-x-7 gap-y-2 text-[11.5px] font-semibold text-white/70">
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z"/></svg>
              Donnees securisees
            </span>
            <span className="inline-flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--gold-500)" strokeWidth="2" strokeLinecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.5 2.6 4 5.6 4 9s-1.5 6.4-4 9c-2.5-2.6-4-5.6-4-9s1.5-6.4 4-9Z"/></svg>
              Bilingue FR / AR
            </span>
          </div>
          <p className="mt-4 max-w-md text-xs leading-relaxed text-white/45">
            Espace securise - vos informations sont traitees par la HAPA dans le cadre de l&apos;accreditation des journalistes.
          </p>
        </footer>
      </section>

      <section className="relative flex items-center justify-center bg-white p-6 sm:p-12">
        <div className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(640px 320px at 100% 0%, var(--green-tint), transparent 70%)" }} aria-hidden="true" />
        <div className="relative z-10 w-full max-w-md">
          <div className="mb-10 flex items-center gap-3 lg:hidden">
            <NationalMark />
            <span className="text-sm font-extrabold tracking-[0.1em] text-[var(--green-900)]">
              HAPA <span className="text-[var(--gold-700)]">/</span> ACCREDITATION PRESSE
            </span>
          </div>
          <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--muted-fg)]">
            HAPA - Accreditation presse
          </p>
          <h2 className="mt-2 text-[30px] font-extrabold leading-tight text-[var(--green-900)]">{title}</h2>
          <p className="mt-2 text-[15px] text-[var(--slate)]">{subtitle}</p>
          <div className="mt-9">{children}</div>
          <div className="mt-7 text-sm text-[var(--slate)]">{footer}</div>
        </div>
      </section>
    </main>
  );
}

/* Form primitives - now shadcn base, same signatures */

export function Field({
  label, error, ...inputProps
}: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
  const id = inputProps.id ?? inputProps.name;
  return (
    <div className="mb-5 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!error}
        className={error ? "border-[var(--red-500)]" : ""}
        {...inputProps}
      />
      {error && (
        <p className="text-xs font-medium text-[var(--red-500)]" role="alert">{error}</p>
      )}
    </div>
  );
}

export function PasswordField({
  label, error, ...inputProps
}: { label: string; error?: string } & Omit<React.ComponentProps<typeof Input>, "type">) {
  const id = inputProps.id ?? inputProps.name;
  const [visible, setVisible] = useState(false);
  return (
    <div className="mb-5 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!error}
          className={`pr-11 ${error ? "border-[var(--red-500)]" : ""}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
          aria-pressed={visible}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-[var(--muted-fg)] transition-colors hover:text-[var(--green-700)]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {error && (
        <p className="text-xs font-medium text-[var(--red-500)]" role="alert">{error}</p>
      )}
    </div>
  );
}

export function SubmitButton({ children, loading }: { children: ReactNode; loading?: boolean }) {
  return (
    <Button type="submit" disabled={loading} size="lg" className="w-full">
      {loading ? "Veuillez patienter\u2026" : children}
    </Button>
  );
}

export function FormError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" className="mb-5">
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}
