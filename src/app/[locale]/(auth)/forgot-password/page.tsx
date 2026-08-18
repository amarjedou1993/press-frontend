"use client";
// src/app/[locale]/(auth)/forgot-password/page.tsx

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { AuthShell, Field, SubmitButton, FormError } from "@/components/AuthShell";
import { forgotPassword } from "@/lib/api/account";
import { V } from "@/lib/validation";
import { routes } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");

  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const request = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    // ⚠️ SUCCESS WHETHER OR NOT THE ADDRESS EXISTS.
    //
    // The backend answers the same way for an unknown address, and this page
    // must not undo that: a different response would let anyone test whether
    // a journalist holds an account here, which is a fact worth protecting on
    // a press-accreditation system.
    onSuccess: () => setSent(true),
    onError: () => setError(t("forgotUnavailable")),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    if (!email.trim()) {
      // A KEY, resolved by FormError in the reader's language.
      setError(V.requiredEmail);
      return;
    }
    request.mutate(email.trim());
  }

  return (
    <AuthShell
      title={t("forgotTitle")}
      subtitle={t("forgotSubtitle")}
      footer={
        <Link
          href={routes.auth.login}
          className="font-bold text-[var(--green-700)] underline underline-offset-2"
        >
          {t("backToLogin")}
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
          <MailCheck className="mx-auto h-9 w-9 text-[var(--green-700)]" />
          <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
            {t("forgotSentTitle")}
          </p>
          {/* The wording is deliberately conditional — "if an account
              exists" — for the same reason the mutation always succeeds. */}
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--green-700)]">
            {t("forgotSentBody")}
          </p>
          <p className="mt-3 text-[12.5px] text-[var(--slate)]">
            {t("forgotSentSpam")}
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FormError message={error} />
          {/* dir="ltr": an address is a Latin string, and typing it in an RTL
              field makes the caret jump at the @ and the dot. */}
          <Field
            label={t("email")}
            name="email"
            type="email"
            dir="ltr"
            className="text-start"
            autoComplete="email"
            placeholder="nom@domaine.mr"
          />
          <SubmitButton loading={request.isPending}>
            {t("forgotSubmit")}
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
