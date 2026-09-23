"use client";
// src/components/auth/InstitutionRequestForm.tsx

import { useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { FileText, Upload, X, CheckCircle2, Mail } from "lucide-react";
import { Field, PasswordField, SubmitButton, FormError } from "@/components/AuthShell";
import { useFieldError } from "@/lib/useFieldError";
import {
  submitInstitutionRequest, type InstitutionRequestForm as Payload,
} from "@/lib/api/institution-requests";

/**
 * A body asking to be registered as an institution.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ THIS FORM CREATES NOTHING.
 *
 * It files a REQUEST. No account exists until the Ministry has read the
 * letter and approved — which is why the screen that follows says "votre
 * demande a été reçue" rather than "bienvenue", and why the password chosen
 * here cannot be used to sign in yet.
 *
 * Saying so plainly matters: an applicant who thinks they have an account
 * will try to log in, fail, and conclude the system is broken.
 * ───────────────────────────────────────────────────────────────────────
 */
export function InstitutionRequestForm() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const resolve = useFieldError();

  const fileInput = useRef<HTMLInputElement>(null);
  const [letter, setLetter] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [submittedTo, setSubmittedTo] = useState<string>();

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const payload: Payload = {
      proposedNameFr: String(form.get("proposedNameFr") ?? "").trim(),
      proposedNameAr: String(form.get("proposedNameAr") ?? "").trim(),
      contactName: String(form.get("contactName") ?? "").trim(),
      contactRole: String(form.get("contactRole") ?? "").trim(),
      email: String(form.get("email") ?? "").trim(),
      phone: String(form.get("phone") ?? "").replace(/\s/g, ""),
      password: String(form.get("password") ?? ""),
      locale,
    };

    /*
     * ⚠️ THE LETTER IS CHECKED HERE, because it is the one field a browser
     * cannot mark required in a way that reads well — and because sending the
     * form without it wastes a round trip on the largest request the applicant
     * will make.
     */
    if (!letter) {
      setFieldErrors({ letter: "validation.institutionLetterRequired" });
      return;
    }

    setLoading(true);
    try {
      const created = await submitInstitutionRequest(payload, letter);
      setSubmittedTo(created.email);
    } catch (e) {
      const problem = e as { status?: number; errors?: Record<string, string>; detail?: string };
      if (problem.status === 409) {
        // A duplicate address is a problem with the address, and belongs
        // beside it — the same placement the candidate form uses.
        setFieldErrors({ email: "validation.emailTaken" });
      } else if (problem.errors) {
        setFieldErrors(problem.errors);
      } else {
        setError(resolve(problem.detail) ?? t("registerUnavailable"));
      }
      setLoading(false);
    }
  }

  /* ══ what follows a submission ══ */

  if (submittedTo) {
    return (
      <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--green-700)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          {t("institutionRequestSentTitle")}
        </p>
        {/*
          ⚠️ THE ADDRESS IS REPEATED BACK.

          A typo in it is the one mistake that cannot be recovered from this
          screen: the confirmation goes somewhere else, the request expires in
          seven days, and the applicant waits for a decision nobody is making.
          Shown here, the typo is visible while it still costs nothing.
        */}
        <p className="mt-2 flex items-center justify-center gap-2 text-[13.5px] font-semibold text-[var(--green-700)]">
          <Mail className="h-3.5 w-3.5 flex-none" />
          <span dir="ltr" className="font-mono">{submittedTo}</span>
        </p>
        <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-[var(--green-700)]">
          {t("institutionRequestSentBody")}
        </p>
        <p className="mt-3 text-[12px] leading-relaxed text-[var(--slate)]">
          {t("institutionRequestSentSpam")}
        </p>
      </div>
    );
  }

  /* ══ the form ══ */

  return (
    <form onSubmit={onSubmit} noValidate>
      <FormError message={error} />

      {/*
        ⚠️ SAID BEFORE THE FIRST FIELD, not after the submission.

        What this form does — and does not do — decides whether the applicant
        waits patiently or tries to log in tomorrow. It is one sentence, and
        it belongs where it is read.
      */}
      <p className="mb-5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
        {t("institutionRequestIntro")}
      </p>

      {/* dir="auto" on the two names: one is Arabic by definition, and the
          French one may still be typed in either script. */}
      <Field
        label={t("institutionNameFr")}
        name="proposedNameFr"
        dir="auto"
        error={fieldErrors.proposedNameFr}
      />
      <Field
        label={t("institutionNameAr")}
        name="proposedNameAr"
        dir="rtl"
        error={fieldErrors.proposedNameAr}
      />

      <Field
        label={t("institutionContactName")}
        name="contactName"
        dir="auto"
        autoComplete="name"
        error={fieldErrors.contactName}
      />
      <Field
        label={t("institutionContactRole")}
        name="contactRole"
        placeholder={t("institutionContactRoleHint")}
        error={fieldErrors.contactRole}
      />

      <Field
        label={t("email")}
        name="email"
        type="email"
        dir="ltr"
        className="text-start"
        autoComplete="email"
        error={fieldErrors.email}
      />
      <Field
        label={t("phone")}
        name="phone"
        type="tel"
        inputMode="numeric"
        dir="ltr"
        className="text-start"
        autoComplete="tel"
        placeholder="22 12 34 56"
        error={fieldErrors.phone}
      />

      <PasswordField
        label={t("password")}
        name="password"
        autoComplete="new-password"
        placeholder={t("passwordHint")}
        error={fieldErrors.password}
      />

      {/* ══ the letter ══ */}
      <div className="mb-4">
        <label className="mb-1.5 block text-[13px] font-semibold text-[var(--green-900)]">
          {t("institutionLetter")}
        </label>

        <input
          ref={fileInput}
          type="file"
          accept="application/pdf,image/jpeg,image/png"
          className="hidden"
          onChange={(e) => {
            const chosen = e.target.files?.[0];
            if (chosen) {
              setLetter(chosen);
              setFieldErrors((prev) => ({ ...prev, letter: "" }));
            }
            e.target.value = "";
          }}
        />

        {letter ? (
          <div className="flex items-center gap-3 rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] px-4 py-3">
            <FileText className="h-4 w-4 flex-none text-[var(--green-700)]" />
            <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[var(--green-900)]">
              {letter.name}
            </span>
            <span className="flex-none font-mono text-[11px] text-[var(--muted-fg)]">
              {(letter.size / 1024 / 1024).toFixed(1)} Mo
            </span>
            <button
              type="button"
              onClick={() => setLetter(null)}
              aria-label={t("institutionLetterRemove")}
              className="flex-none rounded p-1 text-[var(--muted-fg)] hover:text-[var(--red-500)]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            className="flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-6 transition-colors hover:border-[var(--green-500)] hover:bg-[var(--green-tint)]/40"
            style={{ borderColor: fieldErrors.letter ? "var(--red-500)" : "var(--line)" }}
          >
            <Upload className="h-6 w-6 text-[var(--green-600)]" />
            <span className="text-[13px] font-bold text-[var(--green-900)]">
              {t("institutionLetterChoose")}
            </span>
            <span className="text-center text-[12px] leading-relaxed text-[var(--slate)]">
              {t("institutionLetterHint")}
            </span>
          </button>
        )}

        {fieldErrors.letter && (
          <p className="mt-1.5 text-[12.5px] font-medium text-[var(--red-700)]">
            {resolve(fieldErrors.letter)}
          </p>
        )}
      </div>

      <SubmitButton loading={loading}>{t("institutionRequestSubmit")}</SubmitButton>
    </form>
  );
}
