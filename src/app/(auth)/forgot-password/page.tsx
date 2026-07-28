"use client";
// src/app/(auth)/forgot-password/page.tsx
// Requests a reset link.
//
// The backend answers 200 whether or not the account exists, and this page
// shows the same confirmation either way — otherwise the form becomes a tool
// for discovering which journalists hold accounts.

import { useState } from "react";
import Link from "next/link";
import { useMutation } from "@tanstack/react-query";
import { MailCheck } from "lucide-react";
import { AuthShell, Field, SubmitButton, FormError } from "@/components/AuthShell";
import { forgotPassword } from "@/lib/api/account";
import { routes } from "@/lib/routes";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string>();

  const request = useMutation({
    mutationFn: (email: string) => forgotPassword(email),
    onSuccess: () => setSent(true),
    onError: () =>
      setError("Demande impossible. Vérifiez que le serveur est démarré."),
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    const email = String(new FormData(event.currentTarget).get("email") ?? "");
    if (!email.trim()) {
      setError("Veuillez saisir votre adresse e-mail.");
      return;
    }
    request.mutate(email.trim());
  }

  return (
    <AuthShell
      title="Mot de passe oublié"
      subtitle="Nous vous enverrons un lien pour en choisir un nouveau."
      footer={
        <Link href={routes.auth.login}
          className="font-bold text-[var(--green-700)] underline underline-offset-2">
          Retour à la connexion
        </Link>
      }
    >
      {sent ? (
        <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
          <MailCheck className="mx-auto h-9 w-9 text-[var(--green-700)]" />
          <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
            E-mail envoyé
          </p>
          <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--green-700)]">
            Si un compte existe pour cette adresse, vous recevrez un lien de
            réinitialisation. Il est valable 30 minutes.
          </p>
          <p className="mt-3 text-[12.5px] text-[var(--slate)]">
            Pensez à consulter vos courriers indésirables.
          </p>
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          <FormError message={error} />
          <Field
            label="Adresse e-mail"
            name="email"
            type="email"
            autoComplete="email"
            placeholder="nom@domaine.mr"
          />
          <SubmitButton loading={request.isPending}>
            Envoyer le lien
          </SubmitButton>
        </form>
      )}
    </AuthShell>
  );
}
