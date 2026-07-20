"use client";
// src/app/(auth)/login/page.tsx — URL stays /login
// Also the landing spot of the global 401 rule: an expired session anywhere
// in the app redirects here with ?expired=1, shown as an info notice.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import {
  AuthShell,
  Field,
  PasswordField,
  SubmitButton,
  FormError,
} from "@/components/AuthShell";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  // Lazy init: read the flag once, on the client, without useSearchParams.
  const [sessionExpired] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("expired")
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      await login({
        email: String(form.get("email")),
        password: String(form.get("password")),
      });
      router.push("/dashboard");
    } catch (e) {
      setError(
        e instanceof ApiError && e.problem.status === 401
          ? "E-mail ou mot de passe incorrect."
          : "Connexion impossible. Vérifiez que le serveur est démarré."
      );
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à votre espace d'accréditation."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link
            href="/register"
            className="font-bold text-[var(--green-700)] underline underline-offset-2"
          >
            Créer un compte candidat
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <p
          role="status"
          className="mb-4 rounded-[var(--radius)] border border-[var(--gold-500)]/40 bg-[var(--gold-tint)] px-3.5 py-2.5 text-sm font-medium text-[var(--gold-700)]"
        >
          Votre session a expiré. Veuillez vous reconnecter.
        </p>
      )}
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          required
        />
        <SubmitButton loading={loading}>Se connecter</SubmitButton>
      </form>
    </AuthShell>
  );
}
