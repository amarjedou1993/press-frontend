"use client";
// src/app/(auth)/register/page.tsx — URL stays /register

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

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});
    setLoading(true);

    const form = new FormData(event.currentTarget);
    try {
      await register({
        fullName: String(form.get("fullName")),
        email: String(form.get("email")),
        phone: String(form.get("phone")) || undefined,
        password: String(form.get("password")),
      });
      router.push("/dashboard");
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 409) {
          setFieldErrors({ email: "Un compte existe déjà avec cet e-mail." });
        } else if (e.problem.errors) {
          // Backend field-level validation (400) → shown next to each field
          setFieldErrors(e.problem.errors);
        } else {
          setError(e.message);
        }
      } else {
        setError("Inscription impossible. Vérifiez que le serveur est démarré.");
      }
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Créer un compte candidat"
      subtitle="Une fois inscrit, vous pourrez déposer votre demande de carte de presse dès l'ouverture d'une session."
      footer={
        <>
          Déjà inscrit ?{" "}
          <Link
            href="/login"
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
          required
          error={fieldErrors.fullName}
        />
        <Field
          label="Adresse e-mail"
          name="email"
          type="email"
          autoComplete="email"
          required
          error={fieldErrors.email}
        />
        <Field
          label="Téléphone (optionnel)"
          name="phone"
          type="tel"
          autoComplete="tel"
          error={fieldErrors.phone}
        />
        <PasswordField
          label="Mot de passe"
          name="password"
          autoComplete="new-password"
          minLength={8}
          required
          error={fieldErrors.password}
        />
        <SubmitButton loading={loading}>Créer mon compte</SubmitButton>
      </form>
    </AuthShell>
  );
}
