"use client";
// src/app/(auth)/login/page.tsx
// Guarded against already-authenticated visitors: if a logged-in user lands
// here (via the Back button, a bookmark, or typing /login), they're bounced
// to their role's home instead of being shown the login form again.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, homeForRole } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { validateLogin } from "@/lib/validation";
import { routes } from "@/lib/routes";
import {
  AuthShell,
  Field,
  PasswordField,
  SubmitButton,
  FormError,
} from "@/components/AuthShell";

export default function LoginPage() {
  const { login, user, ready } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [sessionExpired] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("expired")
  );

  // Already logged in? Don't show the form — go to the role's home.
  // Runs on mount and whenever auth state settles, so Back-button and
  // bfcache restores are caught too.
  useEffect(() => {
    if (ready && user) {
      router.replace(homeForRole(user.role));
    }
  }, [ready, user, router]);

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
      const loggedIn = await login(input);
      router.replace(homeForRole(loggedIn.role));
    } catch (e) {
      if (e instanceof ApiError && e.problem.status === 401) {
        setError("E-mail ou mot de passe incorrect.");
      } else {
        setError("Connexion impossible. Verifiez que le serveur est demarre.");
      }
      setLoading(false);
    }
  }

  // While redirecting an already-authenticated user, render nothing.
  if (ready && user) return null;

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accedez a votre espace d'accreditation."
      footer={
        <>
          Pas encore de compte ?{" "}
          <Link href={routes.auth.register} className="font-bold text-[var(--green-700)] underline underline-offset-2">
            Creer un compte candidat
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <p role="status" className="mb-5 rounded-xl border border-[var(--gold-500)]/40 bg-[var(--gold-tint)] px-4 py-3 text-sm font-medium text-[var(--gold-700)]">
          Votre session a expire. Veuillez vous reconnecter.
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
