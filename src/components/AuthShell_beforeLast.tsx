"use client";

import { useState, type ReactNode } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, Languages } from "lucide-react";
import { PressCard } from "@/components/public/PressCard";
import {
  Guilloche, OfficialSeal, TricolorRule,
} from "@/components/public/patterns";

// function NationalMark({ small = false }: { small?: boolean }) {
//   const h = small ? "h-3" : "h-3.5";
//   return (
//     <span className="inline-flex items-center gap-1" aria-hidden="true">
//       <i className={`${h} w-1.5 rounded-full bg-[var(--green-500)]`} />
//       <i className={`${h} w-1.5 rounded-full bg-[var(--gold-500)]`} />
//       <i className={`${h} w-1.5 rounded-full bg-[var(--red-500)]`} />
//     </span>
//   );
// }

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string; subtitle: string; children: ReactNode; footer: ReactNode;
}) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">

      {/* ══════════════════════════════════════════════════════════
          THE INSTITUTION — hidden below lg, where the form is all
          there is room for.
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative hidden overflow-hidden px-12 py-4 text-white lg:flex lg:flex-col lg:justify-between"
        style={{
          background:
            "radial-gradient(900px 460px at 88% -12%, rgba(255,215,0,.14), transparent 60%), radial-gradient(700px 500px at -10% 110%, rgba(0,169,92,.25), transparent 55%), linear-gradient(168deg, var(--green-900) 0%, #0e3d29 55%, #0b3524 100%)",
        }}
      >
        <Guilloche
          className="pointer-events-none absolute -left-52 -top-56 h-[640px] w-[640px] text-white opacity-[0.055]"
          rings={50}
        />
        <Guilloche
          className="pointer-events-none absolute -bottom-64 -right-40 h-[460px] w-[460px] text-[var(--gold-500)] opacity-[0.05]"
          rings={34}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.045]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg, #ffffff 0 1px, transparent 1px 11px)" }}
          aria-hidden="true"
        />

        <header className="relative z-10">

          <div className="mt-8 flex items-start gap-5">
            <span className="relative mt-1 flex h-[54px] w-[54px] flex-none items-center justify-center">
              <span
                className="absolute inset-0 rounded-full"
                style={{ background: "radial-gradient(circle, rgba(255,215,0,.20), transparent 70%)" }}
                aria-hidden="true"
              />
              <OfficialSeal
                className="seal-turn relative h-full w-full"
                color="var(--gold-500)"
                id="auth-seal"
              />
            </span>

            <div className="min-w-0">
              <p className="gold-foil text-[10.5px] font-bold uppercase leading-[1.7] tracking-[0.16em]">
                Ministère de la Culture, des Arts,
                <br />
                de la Communication et des Relations
                <br />
                avec le Parlement
              </p>
              <p dir="rtl" className="mt-2.5 text-[13px] font-semibold leading-[1.8] text-white/40">
              وزارة الثقافة والفنون والاتصالات والعلاقات مع البرلمان
              </p>
            </div>
          </div>

          <span className="foil-rule mt-7 block h-px w-40 opacity-55" aria-hidden="true" />

          <h1 className="engraved-dark mt-7 text-[38px] font-extrabold leading-[1.08] tracking-[-0.015em] xl:text-[44px]">
            La carte de presse
            <br />
            <span className="text-[var(--gold-500)]">officielle</span> de la Mauritanie
          </h1>
        </header>

        {/* THE SPECIMEN — the real component, so what an applicant sees here
            is what they will actually be issued. */}
        {/* <div className="relative z-10 self-center py-8">
          <PressCard className="w-full max-w-[420px]" />
        </div> */}
        <div className="relative z-10 self-center px-6 py-8">
          <PressCard className="mx-auto w-full max-w-[380px]" />
        </div>

        <footer className="relative z-10">
          <div className="flex flex-wrap gap-x-7 gap-y-2.5 text-[11.5px] font-semibold text-white/65">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-[var(--gold-500)]" />
              Données sécurisées
            </span>
            <span className="inline-flex items-center gap-2">
              <Languages className="h-3.5 w-3.5 text-[var(--gold-500)]" />
              Bilingue FR / AR
            </span>
          </div>

          <p className="mt-4 max-w-md text-[12px] leading-relaxed text-white/40">
            Espace sécurisé — vos informations sont traitées par le Ministère
            dans le cadre de l&apos;accréditation des journalistes.
          </p>

          {/* <MicroprintRule
            className="mt-6 text-white opacity-[0.13]"
            repeat={12}
          /> */}
        </footer>
      </section>

      {/* ══════════════════════════════════════════════════════════
          THE FORM
          ══════════════════════════════════════════════════════════ */}
      <section className="relative flex items-center justify-center overflow-hidden bg-white p-6 sm:p-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-60"
          style={{ background: "radial-gradient(640px 320px at 100% 0%, var(--green-tint), transparent 70%)" }}
          aria-hidden="true"
        />
        <Guilloche
          className="pointer-events-none absolute -right-28 -top-28 h-[360px] w-[360px] text-[var(--green-900)] opacity-[0.03]"
          rings={30}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* the lockup, for the narrow layout where the left panel is gone */}
          <div className="mb-9 flex items-center gap-3 lg:hidden">
            <span className="flex h-9 w-9 flex-none items-center justify-center">
              <OfficialSeal
                className="h-full w-full"
                color="var(--green-700)"
                id="auth-seal-mobile"
              />
            </span>
            <span className="text-[12.5px] font-extrabold leading-tight tracking-[0.08em] text-[var(--green-900)]">
              MCACRP
              <span className="mx-1.5 text-[var(--gold-700)]">/</span>
              <span className="text-[var(--slate)]">Accréditation presse</span>
            </span>
          </div>

          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
            Accréditation presse
          </p>

          <h2 className="mt-2.5 text-[30px] font-extrabold leading-tight tracking-tight text-[var(--green-900)]">
            {title}
          </h2>

          <span className="foil-rule mt-4 block h-px w-16 opacity-70" aria-hidden="true" />

          <p className="mt-4 text-[14.5px] leading-relaxed text-[var(--slate)]">
            {subtitle}
          </p>

          <div className="mt-8">{children}</div>

          <div className="mt-7 border-t border-[var(--line)] pt-5 text-[13.5px] text-[var(--slate)]">
            {footer}
          </div>
        </div>

        {/* the national rule, closing the panel */}
        <TricolorRule className="absolute inset-x-0 bottom-0" thin />
      </section>
    </main>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FORM PRIMITIVES — same signatures, unchanged API
   ══════════════════════════════════════════════════════════════════ */

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
        <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
          {error}
        </p>
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
        <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

/**
 * The submit button.
 *
 * Gold rather than the default green: on a white panel the primary action
 * should be the one thing the eye cannot miss, and gold is what this system
 * uses for a decision everywhere else.
 */
export function SubmitButton({ children, loading }: { children: ReactNode; loading?: boolean }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="group relative inline-flex h-10 w-full items-center justify-center gap-2 overflow-hidden rounded-md text-[13px] font-extrabold text-white
                 shadow-[0_12px_28px_-14px_rgba(0,107,60,.95)] transition-all
                 hover:-translate-y-px hover:shadow-[0_16px_34px_-14px_rgba(0,107,60,1)]
                 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0
                 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--gold-500)] focus-visible:ring-offset-2"
      style={{ background: "linear-gradient(140deg, var(--green-600), var(--green-700) 60%, #05502c)" }}
    >
      <span className="relative z-10">
        {loading ? "Veuillez patienter…" : children}
      </span>
      {/* the sheen the site uses on its primary actions */}
      <span
        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition-transform duration-700 group-hover:translate-x-full"
        aria-hidden="true"
      />
    </button>
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
