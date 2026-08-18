"use client";
// src/app/(auth)/login/page.tsx

import { Suspense, useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
import { AuthShell, Field, FormError, PasswordField, SubmitButton } from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";
import { validateLogin } from "@/lib/validation";
import { homeForRole } from "@/lib/routes";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

/**
 * The page shell.
 *
 * useSearchParams() must sit inside a SUSPENSE BOUNDARY: Next renders the page
 * on the server, where the query string is not yet known, and fills it in on
 * the client. Without the boundary the two trees disagree and React discards
 * the server's — which is exactly the hydration error the previous version
 * produced by reading window.location.search inside useState.
 *
 * The fallback is the same shell without the banner, so the transition is a
 * banner appearing rather than the whole form flashing.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginForm />}>
      <LoginForm readsQuery />
    </Suspense>
  );
}

function LoginForm({ readsQuery = false }: { readsQuery?: boolean }) {
  const { login, user, ready } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Read only in the Suspense-wrapped instance; the fallback renders without
  // it, so both trees are consistent with what the server produced.
  const params = useSearchParams();
  const sessionExpired = readsQuery && params.has("expired");

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
        setError("Connexion impossible. Vérifiez que le serveur est démarré.");
      }
      setLoading(false);
    }
  }

  // While redirecting an already-authenticated user, render nothing.
  if (ready && user) return null;

  return (
    <AuthShell
      title="Connexion"
      subtitle="Accédez à votre espace d'accréditation."
      footer={
        <>
          <span className="text-[13px]">Pas encore de compte ?</span>{" "}
          <Link
            href={routes.auth.register}
            className="font-bold text-[var(--green-700)] text-[13px] underline underline-offset-2"
          >
            Créer un compte
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-[var(--gold-500)]/40 bg-[var(--gold-tint)] px-4 py-3 text-sm font-medium text-[var(--gold-700)]"
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
          error={fieldErrors.email}
        />

        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="current-password"
          error={fieldErrors.password}
        />

        {/* Placed under the field it relates to — where someone who has just
            failed to remember their password is already looking. */}
        <div className="-mt-3 mb-5 text-right">
          <Link
            href={routes.auth.forgotPassword}
            className="text-[13px] font-semibold text-[var(--green-700)] underline underline-offset-2 hover:text-[var(--green-600)]"
          >
            Mot de passe oublié ?
          </Link>
        </div>

        <SubmitButton loading={loading}>Se connecter</SubmitButton>
      </form>
    </AuthShell>
  );
}
