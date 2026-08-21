// "use client";
// // src/app/[locale]/(auth)/verify-email/page.tsx  →  /verify-email?token=…
// // Consumes the confirmation link sent at registration.

// import { Suspense, useEffect, useState } from "react";
// import { useTranslations } from "next-intl";
// import { useSearchParams } from "next/navigation";
// import { useMutation } from "@tanstack/react-query";
// import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
// import { Link, useRouter } from "@/i18n/navigation";
// import { Button } from "@/components/ui/button";
// import { AuthShell } from "@/components/AuthShell";
// import { verifyEmail } from "@/lib/api/account";
// import { ApiError } from "@/lib/api/client";
// import { routes } from "@/lib/routes";

// function Verifying() {
//   const t = useTranslations("auth");
//   return (
//     <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-5">
//       <Loader2 className="h-5 w-5 flex-none animate-spin text-[var(--green-600)]" />
//       <p className="text-[14px] text-[var(--slate)]">{t("verifyInProgress")}</p>
//     </div>
//   );
// }

// function VerifyEmailInner() {
//   const t = useTranslations("auth");
//   const router = useRouter();
//   const token = useSearchParams().get("token");

//   const verify = useMutation({ mutationFn: (tk: string) => verifyEmail(tk) });

//   // Fire once. The candidate clicked a link; they should not click again.
//   const [started, setStarted] = useState(false);
//   useEffect(() => {
//     if (token && !started) {
//       setStarted(true);
//       verify.mutate(token);
//     }
//   }, [token, started, verify]);

//   /* ── a link with no token ── */
//   if (!token) {
//     return (
//       <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
//         <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
//         <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
//           {t("verifyIncompleteTitle")}
//         </p>
//         <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--red-700)]">
//           {t("verifyIncompleteBody")}
//         </p>
//         <Button
//           className="mt-5"
//           variant="outline"
//           onClick={() => router.push(routes.auth.login)}
//         >
//           {t("loginSubmit")}
//         </Button>
//       </div>
//     );
//   }

//   if (verify.isSuccess) {
//     return (
//       <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
//         <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--green-700)]" />
//         <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
//           {t("verifyDoneTitle")}
//         </p>
//         {/* This sentence is the WHOLE POINT of the verification: it says what
//             the candidate can now do, not merely that a step succeeded. */}
//         <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--green-700)]">
//           {t("verifyDoneBody")}
//         </p>
//         <Button
//           className="mt-5"
//           onClick={() => router.push(routes.candidate.dashboard)}
//         >
//           {t("verifyGoToSpace")}
//         </Button>
//       </div>
//     );
//   }

//   if (verify.isError) {
//     return (
//       <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
//         <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
//         <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
//           {t("verifyFailedTitle")}
//         </p>
//         {/* The SERVER's detail passes through: it is already in the caller's
//             language and may say something more precise than "expired". */}
//         <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--red-700)]">
//           {verify.error instanceof ApiError
//             ? (verify.error.problem.detail ?? t("verifyLinkExpired"))
//             : t("verifyLinkExpired")}
//         </p>
//         {/* A DEAD END WOULD BE THE FAILURE HERE. An expired link is normal —
//             people open e-mail days later — so the page must say how to get
//             another one rather than only that this one is finished. */}
//         <p className="mt-3 text-[12.5px] text-[var(--slate)]">
//           {t("verifyFailedNext")}
//         </p>
//         <Button
//           className="mt-5"
//           variant="outline"
//           onClick={() => router.push(routes.auth.login)}
//         >
//           {t("loginSubmit")}
//         </Button>
//       </div>
//     );
//   }

//   return <Verifying />;
// }

// export default function VerifyEmailPage() {
//   const t = useTranslations("auth");
//   return (
//     <AuthShell
//       title={t("verifyTitle")}
//       subtitle={t("verifySubtitle")}
//       footer={
//         <Link
//           href={routes.candidate.dashboard}
//           className="font-bold text-[var(--green-700)] underline underline-offset-2"
//         >
//           {t("verifyGoToSpace")}
//         </Link>
//       }
//     >
//       {/* useSearchParams needs a Suspense boundary — and it gives us the
//           neutral first paint that removes the error flash. */}
//       <Suspense fallback={<Verifying />}>
//         <VerifyEmailInner />
//       </Suspense>
//     </AuthShell>
//   );
// }


"use client";
// src/app/[locale]/(auth)/verify-email/page.tsx  →  /verify-email?token=…
// Consumes the confirmation link sent at registration.

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/AuthShell";
import { verifyEmail } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";
import { useFieldError } from "@/lib/useFieldError";

function Verifying() {
  const t = useTranslations("auth");
  return (
    <div className="flex items-center gap-3 rounded-xl border border-[var(--line)] bg-white p-5">
      <Loader2 className="h-5 w-5 flex-none animate-spin text-[var(--green-600)]" />
      <p className="text-[14px] text-[var(--slate)]">{t("verifyInProgress")}</p>
    </div>
  );
}

function VerifyEmailInner() {
  const t = useTranslations("auth");
  const resolve = useFieldError();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const verify = useMutation({ mutationFn: (tk: string) => verifyEmail(tk) });

  /**
   * Fire once. The candidate clicked a link; they should not click again.
   *
   * ⚠️ `mutate`, NOT `verify`, in the dependency array. TanStack returns a
   * new mutation object on every render, so depending on it would re-run this
   * effect endlessly — the `started` guard happens to prevent that, but it is
   * guarding against a loop that should not exist. `mutate` is referentially
   * stable, so the effect depends on what it actually uses.
   */
  const { mutate } = verify;
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (token && !started) {
      setStarted(true);
      mutate(token);
    }
  }, [token, started, mutate]);

  /* ── a link with no token ── */
  if (!token) {
    return (
      <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
        <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          {t("verifyIncompleteTitle")}
        </p>
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--red-700)]">
          {t("verifyIncompleteBody")}
        </p>
        <Button
          className="mt-5"
          variant="outline"
          onClick={() => router.push(routes.auth.login)}
        >
          {t("loginSubmit")}
        </Button>
      </div>
    );
  }

  if (verify.isSuccess) {
    return (
      <div className="rounded-xl border border-[var(--green-500)] bg-[var(--green-tint)] p-6 text-center">
        <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--green-700)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          {t("verifyDoneTitle")}
        </p>
        {/* This sentence is the WHOLE POINT of the verification: it says what
            the candidate can now do, not merely that a step succeeded. */}
        <p className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--green-700)]">
          {t("verifyDoneBody")}
        </p>
        <Button
          className="mt-5"
          onClick={() => router.push(routes.candidate.dashboard)}
        >
          {t("verifyGoToSpace")}
        </Button>
      </div>
    );
  }

  if (verify.isError) {
    return (
      <div className="rounded-xl border border-[var(--red-500)]/30 bg-[var(--red-tint)] p-6 text-center">
        <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />
        <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">
          {t("verifyFailedTitle")}
        </p>
        {/* ⚠️ resolve(): the server's detail may be a KEY rather than a
            sentence — "validation.tokenExpired" — and it must not reach the
            screen as one. Anything it does not recognise passes through
            unchanged, which is what a genuine server sentence needs. */}
        <p dir="auto" className="mt-1.5 text-[13.5px] leading-relaxed text-[var(--red-700)]">
          {verify.error instanceof ApiError
            ? (resolve(verify.error.problem.detail) ?? t("verifyLinkExpired"))
            : t("verifyLinkExpired")}
        </p>
        {/* A DEAD END WOULD BE THE FAILURE HERE. An expired link is normal —
            people open e-mail days later — so the page must say how to get
            another one rather than only that this one is finished. */}
        <p className="mt-3 text-[12.5px] text-[var(--slate)]">
          {t("verifyFailedNext")}
        </p>
        <Button
          className="mt-5"
          variant="outline"
          onClick={() => router.push(routes.auth.login)}
        >
          {t("loginSubmit")}
        </Button>
      </div>
    );
  }

  return <Verifying />;
}

export default function VerifyEmailPage() {
  const t = useTranslations("auth");
  return (
    <AuthShell
      title={t("verifyTitle")}
      subtitle={t("verifySubtitle")}
      footer={
        <Link
          href={routes.candidate.dashboard}
          className="font-bold text-[var(--green-700)] underline underline-offset-2"
        >
          {t("verifyGoToSpace")}
        </Link>
      }
    >
      {/* useSearchParams needs a Suspense boundary — and <Verifying /> is the
          right fallback rather than null: the page is ALREADY going to show
          that spinner a moment later, so the two states are continuous
          instead of a blank flashing into a spinner. */}
      <Suspense fallback={<Verifying />}>
        <VerifyEmailInner />
      </Suspense>
    </AuthShell>
  );
}
