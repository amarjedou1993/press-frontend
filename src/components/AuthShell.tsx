"use client";
// src/components/AuthShell.tsx
//
// A journalist's first impression of the Authority. Whoever reaches this
// screen is about to hand their identity documents to a government system —
// what the page must establish, before a field is filled, is that this is the
// real thing.
//
// ───────────────────────────────────────────────────────────────────────
// ⚠️ THE FIELD PRIMITIVES RESOLVE ERROR CODES, NOT SENTENCES.
//
// Validation used to return French text: «Adresse e-mail invalide». Under an
// Arabic label that is the exact mixed-language failure this whole exercise
// exists to avoid.
//
// So the validators now return KEYS — "validation.email" — and Field resolves
// them here. A key that has no entry is rendered as-is, which lets a SERVER
// message («Cet e-mail est déjà utilisé», already translated by the backend)
// pass through untouched.
//
// Every call site is unchanged: they still pass `error` and it still renders.
// ───────────────────────────────────────────────────────────────────────

import { useState, type ReactNode } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, ShieldCheck, Languages } from "lucide-react";
import { PressCard } from "@/components/public/PressCard";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { Guilloche, OfficialSeal, TricolorRule } from "@/components/public/patterns";
import { useFieldError } from "@/lib/useFieldError";

export function AuthShell({
  title, subtitle, children, footer,
}: {
  title: string; subtitle: string; children: ReactNode; footer: ReactNode;
}) {
  const locale = useLocale();
  const t = useTranslations("auth");
  const arabic = locale === "ar";

  /* ── the two halves of the ministry signature ── */

  const latinName = (
    <p
      dir="ltr"
      lang="fr"
      className="gold-foil text-[10.5px] font-bold uppercase leading-[1.7] tracking-[0.16em]"
    >
      Ministère de la Culture, des Arts,
      <br />
      de la Communication et des Relations
      <br />
      avec le Parlement
    </p>
  );

  const arabicName = (
    <p
      dir="rtl"
      lang="ar"
      className="text-[13px] font-semibold leading-[1.8] text-white/40"
    >
      وزارة الثقافة والفنون والاتصال والعلاقات مع البرلمان
    </p>
  );

  /**
   * ⚠️ Arabic leading gets the foil WITHOUT tracking.
   *
   * gold-foil carries letter-spacing: 0.16em, which separates Arabic
   * letterforms — the word visibly falls apart.
   */
  const arabicNameLeading = (
    <p
      dir="rtl"
      lang="ar"
      className="gold-foil text-[15px] font-bold leading-[1.85]"
      style={{ letterSpacing: 0 }}
    >
      وزارة الثقافة والفنون والاتصال والعلاقات مع البرلمان
    </p>
  );

  const latinNameFollowing = (
    <p
      dir="ltr"
      lang="fr"
      className="text-[10px] font-bold uppercase leading-[1.75] tracking-[0.12em] text-white/40"
    >
      Ministère de la Culture, des Arts, de la Communication
      <br />
      et des Relations avec le Parlement
    </p>
  );

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
          className="rtl-mirror pointer-events-none absolute -left-52 -top-56 h-[640px] w-[640px] text-white opacity-[0.055]"
          rings={50}
        />
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -bottom-64 -right-40 h-[460px] w-[460px] text-[var(--gold-500)] opacity-[0.05]"
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

            {/* The reader's own language leads; the other follows. */}
            <div className="min-w-0">
              {arabic ? arabicNameLeading : latinName}
              <div className="mt-2.5">
                {arabic ? latinNameFollowing : arabicName}
              </div>
            </div>
          </div>

          <span className="foil-rule mt-7 block h-px w-40 opacity-55" aria-hidden="true" />

          <h1 className="engraved-dark mt-7 text-[38px] font-extrabold leading-[1.08] tracking-[-0.015em] xl:text-[44px]">
            {t.rich("heroTitle", {
              gold: (c) => <span className="text-[var(--gold-500)]">{c}</span>,
              br: () => <br />,
            })}
          </h1>
        </header>

        {/* THE SPECIMEN — the real component, so what an applicant sees here
            is what they will actually be issued.
            ⚠️ NOT mirrored: the card is a physical object with a fixed
            layout, and Arabic already leads on it. */}
        <div className="relative z-10 self-center px-6 py-8">
          <PressCard className="mx-auto w-full max-w-[380px]" />
        </div>

        <footer className="relative z-10">
          <div className="flex flex-wrap gap-x-7 gap-y-2.5 text-[11.5px] font-semibold text-white/65">
            <span className="inline-flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 flex-none text-[var(--gold-500)]" />
              {t("secureData")}
            </span>
            <span className="inline-flex items-center gap-2">
              <Languages className="h-3.5 w-3.5 flex-none text-[var(--gold-500)]" />
              {t("bilingual")}
            </span>
          </div>

          <p className="mt-4 max-w-md text-[12px] leading-relaxed text-white/40">
            {t("secureNotice")}
          </p>
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
          className="rtl-mirror pointer-events-none absolute -right-28 -top-28 h-[360px] w-[360px] text-[var(--green-900)] opacity-[0.03]"
          rings={30}
        />

        <div className="relative z-10 w-full max-w-md">
          {/* the lockup and the switcher, for the narrow layout where the
              left panel is gone. The switcher must be reachable there too —
              a visitor arriving in the wrong language needs a way out. */}
          <div className="mb-9 flex items-center justify-between gap-3 lg:hidden">
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center">
                <OfficialSeal
                  className="h-full w-full"
                  color="var(--green-700)"
                  id="auth-seal-mobile"
                />
              </span>
              <span className="min-w-0 truncate text-[12.5px] font-extrabold leading-tight text-[var(--green-900)]">
                {t("eyebrow")}
              </span>
            </span>
            <LocaleSwitcher variant="light" />
          </div>

          <div className="mb-2.5 hidden items-center justify-between gap-3 lg:flex">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
              {t("eyebrow")}
            </p>
            <LocaleSwitcher variant="light" />
          </div>

          <h2 className="text-[30px] font-extrabold leading-tight tracking-tight text-[var(--green-900)]">
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

/**
 * Resolve a validation key, or pass a sentence through unchanged.
 *
 * Client validators return keys ("validation.email"); the SERVER returns
 * finished sentences. Checking whether the key exists lets both work through
 * the same prop, so no call site had to change.
 */
// function useFieldError() {
//   const t = useTranslations();
//   return (error?: string) => {
//     if (!error) return undefined;
//     return t.has(error) ? t(error) : error;
//   };
// }

export function Field({
  label, error, ...inputProps
}: { label: string; error?: string } & React.ComponentProps<typeof Input>) {
  const id = inputProps.id ?? inputProps.name;
  const resolve = useFieldError();
  const message = resolve(error);

  return (
    <div className="mb-5 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        aria-invalid={!!message}
        className={message ? "border-[var(--red-500)]" : ""}
        {...inputProps}
      />
      {message && (
        <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export function PasswordField({
  label, error, ...inputProps
}: { label: string; error?: string } & Omit<React.ComponentProps<typeof Input>, "type">) {
  const id = inputProps.id ?? inputProps.name;
  const t = useTranslations("auth");
  const resolve = useFieldError();
  const message = resolve(error);
  const [visible, setVisible] = useState(false);

  return (
    <div className="mb-5 space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        {/* pe-11 rather than pr-11: the reveal button sits at the END of the
            field, which is the left in Arabic. */}
        <Input
          id={id}
          type={visible ? "text" : "password"}
          aria-invalid={!!message}
          // A password is typed left-to-right whatever the page: it may
          // contain Latin letters and digits, and mixing directions inside
          // one field makes the caret jump.
          dir="ltr"
          className={`pe-11 text-start ${message ? "border-[var(--red-500)]" : ""}`}
          {...inputProps}
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? t("hidePassword") : t("showPassword")}
          aria-pressed={visible}
          className="absolute inset-y-0 end-0 flex w-11 items-center justify-center text-[var(--muted-fg)] transition-colors hover:text-[var(--green-700)]"
        >
          {visible ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      </div>
      {message && (
        <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}

export function SubmitButton({ children, loading }: { children: ReactNode; loading?: boolean }) {
  const t = useTranslations("common");
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
        {loading ? t("pleaseWait") : children}
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
  const resolve = useFieldError();
  const text = resolve(message);
  if (!text) return null;
  return (
    <Alert variant="destructive" className="mb-5">
      <AlertDescription>{text}</AlertDescription>
    </Alert>
  );
}
