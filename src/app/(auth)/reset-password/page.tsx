"use client";
// src/app/(auth)/reset-password/page.tsx  →  /reset-password?token=...
// Consumes a reset link and sets the new password.

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AuthShell, PasswordField, SubmitButton, FormError,
} from "@/components/AuthShell";
import { resetPassword } from "@/lib/api/account";
import { PASSWORD_REGEX } from "@/lib/validation";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

function ResetPasswordInner() {
  const router = useRouter();
  // useSearchParams returns the SAME value on server and client. Reading
  // window.location in a useState initialiser did not — it produced a
  // hydration mismatch and a flash of the wrong state.
  const token = useSearchParams().get("token");
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const reset = useMutation({
    mutationFn: (newPassword: string) => resetPassword({ token: token!, newPassword }),
    onError: (e) =>
      setError(
        e instanceof ApiError
          ? (e.problem.detail ?? "Ce lien n'est plus valable.")
          : "Réinitialisation impossible."
      ),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const errors: Record<string, string> = {};
    if (!password) errors.password = "Veuillez saisir un mot de passe.";
    else if (!PASSWORD_REGEX.test(password))
      errors.password = "Au moins 8 caractères, dont une lettre et un chiffre.";
    if (password !== confirm)
      errors.confirm = "Les deux mots de passe ne correspondent pas.";

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }
    reset.mutate(password);
  }

  if (!token) {
    return (
      <AuthShell
        title="Lien invalide"
        subtitle="Ce lien de réinitialisation est incomplet."
        footer={
          <Link href={routes.auth.forgotPassword}
            className="font-bold text-[var(--green-700)] underline underline-offset-2">
            Demander un nouveau lien
          </Link>
        }
      >
        <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
          <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
          <p className="mt-3 text-[13.5px] text-[var(--red-700)]">
            Ouvrez le lien directement depuis votre e-mail.
          </p>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Nouveau mot de passe"
      subtitle="Choisissez un mot de passe pour votre compte."
      footer={
        <Link href={routes.auth.login}
          className="font-bold text-[var(--green-700)] underline underline-offset-2">
          Retour à la connexion
        </Link>
      }
    >
      {reset.isSuccess ? (
        <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
          <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--green-700)]" />
          <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
            Mot de passe modifié
          </p>
          <p className="mt-1.5 text-[13.5px] text-[var(--green-700)]">
            Vous pouvez maintenant vous connecter.
          </p>
          <Button className="mt-5" onClick={() => router.push(routes.auth.login)}>
            Se connecter
          </Button>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FormError message={error} />
          <PasswordField
            label="Nouveau mot de passe"
            name="password"
            autoComplete="new-password"
            placeholder="8 caractères min., une lettre et un chiffre"
            error={fieldErrors.password}
          />
          <PasswordField
            label="Confirmer le mot de passe"
            name="confirm"
            autoComplete="new-password"
            error={fieldErrors.confirm}
          />
          <SubmitButton loading={reset.isPending}>
            Modifier mon mot de passe
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}

export default function ResetPasswordPage() {
  // Suspense is required by useSearchParams, and gives a neutral first paint.
  return (
    <Suspense fallback={null}>
      <ResetPasswordInner />
    </Suspense>
  );
}
