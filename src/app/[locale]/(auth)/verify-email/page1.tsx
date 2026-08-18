"use client";
// src/app/(auth)/verify-email/page.tsx  →  /verify-email?token=...
//
// FIXES THE HYDRATION ERROR AND THE ERROR FLASH.
//
// The previous version read window.location.search in a useState initialiser.
// On the SERVER that is undefined, so it rendered "lien invalide"; on the
// CLIENT the token exists, so it rendered "vérification". React saw two
// different trees for the same markup — hence "Hydration failed" — and the
// user saw the failure state flash before the success.
//
// useSearchParams() is the App Router way to read a query string: it returns
// the same value on both sides. It requires a Suspense boundary, which also
// gives us the neutral first paint that removes the flash.

import { Suspense, useEffect, useState } from "react";
// import Link from "next/link";
// import { useRouter, useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/AuthShell";
import { verifyEmail } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { Link, useRouter } from "@/i18n/navigation";
import { useSearchParams } from "next/navigation";

function Verifying() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-5">
      <Loader2 className="h-5 w-5 animate-spin text-[var(--green-600)]" />
      <p className="text-[14px] text-[var(--slate)]">Vérification en cours…</p>
    </div>
  );
}

function VerifyEmailInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const verify = useMutation({ mutationFn: (t: string) => verifyEmail(t) });

  // Fire once. The candidate clicked a link; they should not click again.
  const [started, setStarted] = useState(false);
  useEffect(() => {
    if (token && !started) {
      setStarted(true);
      verify.mutate(token);
    }
  }, [token, started, verify]);

  if (!token) {
    return (
      <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
        <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          Lien incomplet
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--red-700)]">
          Ouvrez le lien directement depuis votre e-mail, sans le recopier.
        </p>
        <Button className="mt-5" variant="outline"
          onClick={() => router.push(routes.auth.login)}>
          Se connecter
        </Button>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--green-700)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          Adresse vérifiée
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--green-700)]">
          Vous pouvez désormais soumettre votre demande de carte de presse.
        </p>
        <Button className="mt-5" onClick={() => router.push(routes.candidate.dashboard)}>
          Accéder à mon espace
        </Button>
      </div>
    );
  }

  if (verify.isError) {
    return (
      <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
        <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          Lien invalide ou expiré
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--red-700)]">
          {verify.error instanceof ApiError
            ? (verify.error.problem.detail ?? "Ce lien n'est plus valable.")
            : "Ce lien n'est plus valable."}
        </p>
        <p className="mt-3 text-[12.5px] text-[var(--slate)]">
          Connectez-vous : un bandeau vous permettra de recevoir un nouveau lien.
        </p>
        <Button className="mt-5" variant="outline"
          onClick={() => router.push(routes.auth.login)}>
          Se connecter
        </Button>
      </div>
    );
  }

  return <Verifying />;
}

export default function VerifyEmailPage() {
  return (
    <AuthShell
      title="Vérification de votre adresse"
      subtitle="Confirmation du lien reçu par e-mail."
      footer={
        <Link href={routes.candidate.dashboard}
          className="font-bold text-[var(--green-700)] underline underline-offset-2">
          Aller à mon espace
        </Link>
      }
    >
      {/* useSearchParams needs a Suspense boundary — and it gives us the
          neutral first paint that removes the error flash. */}
      <Suspense fallback={<Verifying />}>
        <VerifyEmailInner />
      </Suspense>
    </AuthShell>
  );
}
