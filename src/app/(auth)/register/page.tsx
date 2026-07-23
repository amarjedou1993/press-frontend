"use client";
// src/app/(auth)/register/page.tsx — URL stays /register
// Guarded against already-authenticated visitors (same as login): a logged-in
// user who reaches /register (Back button, bookmark, bfcache restore) is
// bounced to their role's home rather than shown the form.
// Each error is bound to exactly its field via the shared name key.

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth, homeForRole } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { validateRegistration } from "@/lib/validation";
import { routes } from "@/lib/routes";
import {
  AuthShell,
  Field,
  PasswordField,
  SubmitButton,
  FormError,
} from "@/components/AuthShell";

export default function RegisterPage() {
  const { register, user, ready } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Already logged in? Don't show the form — go to the role's home.
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
      fullName: String(form.get("fullName")),
      email: String(form.get("email")),
      phone: String(form.get("phone")),
      password: String(form.get("password")),
    };

    const clientErrors = validateRegistration(input);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const created = await register({ ...input, phone: input.phone.replace(/\s/g, "") });
      router.replace(homeForRole(created.role));
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 409) {
          setFieldErrors({ email: "Un compte existe deja avec cet e-mail." });
        } else if (e.problem.errors) {
          setFieldErrors(e.problem.errors);
        } else {
          setError(e.message);
        }
      } else {
        setError("Inscription impossible. Verifiez que le serveur est demarre.");
      }
      setLoading(false);
    }
  }

  // While redirecting an already-authenticated user, render nothing.
  if (ready && user) return null;

  return (
    <AuthShell
      title="Creer un compte candidat"
      subtitle="Une fois inscrit, vous pourrez deposer votre demande de carte de presse des l'ouverture d'une session."
      footer={
        <>
          Deja inscrit ?{" "}
          <Link
            href={routes.auth.login}
            className="font-bold text-[var(--green-700)] underline underline-offset-2"
          >
            Se connecter
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />
        <Field
          label="Nom complet"
          name="fullName"
          autoComplete="name"
          error={fieldErrors.fullName}
        />
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          error={fieldErrors.email}
        />
        <Field
          label="Telephone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          placeholder="22 12 34 56"
          error={fieldErrors.phone}
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="new-password"
          placeholder="8 caracteres min., une lettre et un chiffre"
          error={fieldErrors.password}
        />
        <SubmitButton loading={loading}>Creer mon compte</SubmitButton>
      </form>
    </AuthShell>
  );
}
