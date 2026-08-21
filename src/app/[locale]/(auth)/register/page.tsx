// "use client";
// // src/app/[locale]/(auth)/register/page.tsx

// import { useState, useEffect, useCallback } from "react";
// import { useLocale, useTranslations } from "next-intl";
// import { Link, useRouter } from "@/i18n/navigation";
// import { useAuth } from "@/lib/auth";
// import { ApiError } from "@/lib/api/client";
// import { validateRegistration, V } from "@/lib/validation";
// import { routes, homeForRole } from "@/lib/routes";
// import {
//   AuthShell, Field, PasswordField, SubmitButton, FormError,
// } from "@/components/AuthShell";
// import type { Role } from "@/lib/types";

// export default function RegisterPage() {
//   const t = useTranslations("auth");
//   const locale = useLocale();
//   const { register, user, ready } = useAuth();
//   const router = useRouter();

//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<string>();
//   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

//   const goHome = useCallback(
//     (role: Role) => router.replace(homeForRole(role)),
//     [router]
//   );

//   // Already logged in? Don't show the form — go to the role's home.
//   useEffect(() => {
//     if (ready && user) goHome(user.role);
//   }, [ready, user, goHome]);

//   async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
//     event.preventDefault();
//     setError(undefined);
//     setFieldErrors({});

//     const form = new FormData(event.currentTarget);
//     const input = {
//       fullName: String(form.get("fullName")),
//       email: String(form.get("email")),
//       phone: String(form.get("phone")),
//       password: String(form.get("password")),
//     };

//     // Returns KEYS, which Field resolves in the reader's language.
//     const clientErrors = validateRegistration(input);
//     if (Object.keys(clientErrors).length > 0) {
//       setFieldErrors(clientErrors);
//       return;
//     }

//     setLoading(true);
//     try {
//       // const created = await register({
//       //   ...input,
//       //   phone: input.phone.replace(/\s/g, ""),
//       // });
//       const created = await register({
//         ...input,
//         phone: input.phone.replace(/\s/g, ""),
//         // The interface they registered in — this decides the language of
//         // every e-mail they receive afterwards, and an e-mail has no request
//         // to read a locale from.
//         locale,
//       });
//       goHome(created.role);
//     } catch (e) {
//       if (e instanceof ApiError) {
//         if (e.problem.status === 409) {
//           // A KEY, not a sentence — this one is ours, so it gets translated.
//           // The field-level placement matters: a duplicate address is a
//           // problem with the address, and belongs beside it.
//           setFieldErrors({ email: V.emailTaken });
//         } else if (e.problem.errors) {
//           // The SERVER's own field messages, already in the caller's
//           // language. Field renders anything it cannot resolve as-is.
//           setFieldErrors(e.problem.errors);
//         } else {
//           setError(e.problem.detail ?? e.message);
//         }
//       } else {
//         setError(t("registerUnavailable"));
//       }
//       setLoading(false);
//     }
//   }

//   // While redirecting an already-authenticated user, render nothing.
//   if (ready && user) return null;

//   return (
//     <AuthShell
//       title={t("registerTitle")}
//       subtitle={t("registerSubtitle")}
//       footer={
//         <>
//           <span className="text-[13px]">{t("registerHasAccount")}</span>{" "}
//           <Link
//             href={routes.auth.login}
//             className="text-[13px] font-bold text-[var(--green-700)] underline underline-offset-2"
//           >
//             {t("registerSignIn")}
//           </Link>
//         </>
//       }
//     >
//       <form onSubmit={onSubmit} noValidate>
//         <FormError message={error} />

//         {/* dir="auto": the name a journalist types may be in either script,
//             whatever language the form is in. The first candidate to register
//             typed «حامد فال». */}
//         <Field
//           label={t("fullName")}
//           name="fullName"
//           dir="auto"
//           autoComplete="name"
//           error={fieldErrors.fullName}
//         />

//         {/* dir="ltr" on the machine values below: an address, a number and a
//             password are Latin strings, and typing them inside an RTL field
//             makes the caret jump at the @, the dot and the digits. */}
//         <Field
//           label={t("email")}
//           name="email"
//           type="email"
//           dir="ltr"
//           className="text-start"
//           autoComplete="email"
//           error={fieldErrors.email}
//         />

//         <Field
//           label={t("phone")}
//           name="phone"
//           type="tel"
//           inputMode="numeric"
//           dir="ltr"
//           className="text-start"
//           autoComplete="tel"
//           placeholder="22 12 34 56"
//           error={fieldErrors.phone}
//         />

//         <PasswordField
//           label={t("password")}
//           name="password"
//           autoComplete="new-password"
//           placeholder={t("passwordHint")}
//           error={fieldErrors.password}
//         />

//         <SubmitButton loading={loading}>{t("registerSubmit")}</SubmitButton>
//       </form>
//     </AuthShell>
//   );
// }


"use client";
// src/app/[locale]/(auth)/register/page.tsx

import { useState, useEffect, useCallback } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Link, useRouter } from "@/i18n/navigation";
import { useAuth } from "@/lib/auth";
import { ApiError } from "@/lib/api/client";
import { validateRegistration, V } from "@/lib/validation";
import { routes, homeForRole } from "@/lib/routes";
import { useFieldError } from "@/lib/useFieldError";
import {
  AuthShell, Field, PasswordField, SubmitButton, FormError,
} from "@/components/AuthShell";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const resolve = useFieldError();
  const { register, user, ready } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const goHome = useCallback(
    (role: Role) => router.replace(homeForRole(role)),
    [router]
  );

  // Already logged in? Don't show the form — go to the role's home.
  useEffect(() => {
    if (ready && user) goHome(user.role);
  }, [ready, user, goHome]);

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

    // Returns KEYS, which Field resolves in the reader's language.
    const clientErrors = validateRegistration(input);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const created = await register({
        ...input,
        phone: input.phone.replace(/\s/g, ""),
        // The interface they registered in — this decides the language of
        // every e-mail they receive afterwards, and an e-mail has no request
        // to read a locale from.
        locale,
      });
      goHome(created.role);
    } catch (e) {
      if (e instanceof ApiError) {
        if (e.problem.status === 409) {
          // A KEY, not a sentence — this one is ours, so it gets translated.
          // The field-level placement matters: a duplicate address is a
          // problem with the address, and belongs beside it.
          setFieldErrors({ email: V.emailTaken });
        } else if (e.problem.errors) {
          // The SERVER's own field messages. These may be KEYS too — the
          // backend's @Pattern and @NotBlank annotations emit them now —
          // and FieldError resolves each one against the root namespace.
          setFieldErrors(e.problem.errors);
        } else {
          // ⚠️ resolve(): a bare problem.detail is a key as often as a
          // sentence. Without this, a candidate reads "validation.nniTaken"
          // in the error banner.
          setError(resolve(e.problem.detail ?? e.message));
        }
      } else {
        setError(t("registerUnavailable"));
      }
      setLoading(false);
    }
  }

  // While redirecting an already-authenticated user, render nothing.
  if (ready && user) return null;

  return (
    <AuthShell
      title={t("registerTitle")}
      subtitle={t("registerSubtitle")}
      footer={
        <>
          <span className="text-[13px]">{t("registerHasAccount")}</span>{" "}
          <Link
            href={routes.auth.login}
            className="text-[13px] font-bold text-[var(--green-700)] underline underline-offset-2"
          >
            {t("registerSignIn")}
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />

        {/* dir="auto": the name a journalist types may be in either script,
            whatever language the form is in. The first candidate to register
            typed «حامد فال». */}
        <Field
          label={t("fullName")}
          name="fullName"
          dir="auto"
          autoComplete="name"
          error={fieldErrors.fullName}
        />

        {/* dir="ltr" on the machine values below: an address, a number and a
            password are Latin strings, and typing them inside an RTL field
            makes the caret jump at the @, the dot and the digits. */}
        <Field
          label={t("email")}
          name="email"
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <Field
          label={t("phone")}
          name="phone"
          type="tel"
          inputMode="numeric"
          dir="ltr"
          className="text-start"
          autoComplete="tel"
          placeholder="22 12 34 56"
          error={fieldErrors.phone}
        />

        <PasswordField
          label={t("password")}
          name="password"
          autoComplete="new-password"
          placeholder={t("passwordHint")}
          error={fieldErrors.password}
        />

        <SubmitButton loading={loading}>{t("registerSubmit")}</SubmitButton>
      </form>
    </AuthShell>
  );
}
