"use client";
// src/app/(auth)/login/page.tsx
// After login, routes each role to its OWN home via homeForRole(). The form
// submits on Enter natively (single form, type="submit" button); an explicit
// requestSubmit fallback on the password field guarantees it even if focus
// is unusual.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, homeForRole } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { validateLogin } from "@/lib/validation";
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
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [sessionExpired] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("expired")
  );

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const input = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };

    const clientErrors = validateLogin(input);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const user = await login(input);
      router.push(homeForRole(user.role)); // ← role-based landing
    } catch (e) {
      if (e instanceof ApiError && e.problem.status === 401) {
        setError("E-mail ou mot de passe incorrect.");
      } else {
        setError("Connexion impossible. Vérifiez que le serveur est démarré.");
      }
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
          <Link href="/register" className="font-bold text-[var(--green-700)] underline underline-offset-2">
            Créer un compte candidat
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <p role="status" className="mb-5 rounded-xl border border-[var(--gold-500)]/40 bg-[var(--gold-tint)] px-4 py-3 text-sm font-medium text-[var(--gold-700)]">
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
          error={fieldErrors.email}
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          error={fieldErrors.password}
        />
        <SubmitButton loading={loading}>Se connecter</SubmitButton>
      </form>
    </AuthShell>
  );
}
