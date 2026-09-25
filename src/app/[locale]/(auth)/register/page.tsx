// // "use client";
// // // src/app/[locale]/(auth)/register/page.tsx

// // import { useState, useEffect, useCallback } from "react";
// // import { useLocale, useTranslations } from "next-intl";
// // import { Link, useRouter } from "@/i18n/navigation";
// // import { useAuth } from "@/lib/auth";
// // import { ApiError } from "@/lib/api/client";
// // import { validateRegistration, V } from "@/lib/validation";
// // import { routes, homeForRole } from "@/lib/routes";
// // import { useFieldError } from "@/lib/useFieldError";
// // import {
// //   AuthShell, Field, PasswordField, SubmitButton, FormError,
// // } from "@/components/AuthShell";
// // import type { Role } from "@/lib/types";

// // export default function RegisterPage() {
// //   const t = useTranslations("auth");
// //   const locale = useLocale();
// //   const resolve = useFieldError();
// //   const { register, user, ready } = useAuth();
// //   const router = useRouter();

// //   const [loading, setLoading] = useState(false);
// //   const [error, setError] = useState<string>();
// //   const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

// //   const goHome = useCallback(
// //     (role: Role) => router.replace(homeForRole(role)),
// //     [router]
// //   );

// //   // Already logged in? Don't show the form — go to the role's home.
// //   useEffect(() => {
// //     if (ready && user) goHome(user.role);
// //   }, [ready, user, goHome]);

// //   async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
// //     event.preventDefault();
// //     setError(undefined);
// //     setFieldErrors({});

// //     const form = new FormData(event.currentTarget);
// //     const input = {
// //       fullName: String(form.get("fullName")),
// //       email: String(form.get("email")),
// //       phone: String(form.get("phone")),
// //       password: String(form.get("password")),
// //     };

// //     // Returns KEYS, which Field resolves in the reader's language.
// //     const clientErrors = validateRegistration(input);
// //     if (Object.keys(clientErrors).length > 0) {
// //       setFieldErrors(clientErrors);
// //       return;
// //     }

// //     setLoading(true);
// //     try {
// //       const created = await register({
// //         ...input,
// //         phone: input.phone.replace(/\s/g, ""),
// //         // The interface they registered in — this decides the language of
// //         // every e-mail they receive afterwards, and an e-mail has no request
// //         // to read a locale from.
// //         locale,
// //       });
// //       goHome(created.role);
// //     } catch (e) {
// //       if (e instanceof ApiError) {
// //         if (e.problem.status === 409) {
// //           // A KEY, not a sentence — this one is ours, so it gets translated.
// //           // The field-level placement matters: a duplicate address is a
// //           // problem with the address, and belongs beside it.
// //           setFieldErrors({ email: V.emailTaken });
// //         } else if (e.problem.errors) {
// //           // The SERVER's own field messages. These may be KEYS too — the
// //           // backend's @Pattern and @NotBlank annotations emit them now —
// //           // and FieldError resolves each one against the root namespace.
// //           setFieldErrors(e.problem.errors);
// //         } else {
// //           // ⚠️ resolve(): a bare problem.detail is a key as often as a
// //           // sentence. Without this, a candidate reads "validation.nniTaken"
// //           // in the error banner.
// //           setError(resolve(e.problem.detail ?? e.message));
// //         }
// //       } else {
// //         setError(t("registerUnavailable"));
// //       }
// //       setLoading(false);
// //     }
// //   }

// //   // While redirecting an already-authenticated user, render nothing.
// //   if (ready && user) return null;

// //   return (
// //     <AuthShell
// //       title={t("registerTitle")}
// //       subtitle={t("registerSubtitle")}
// //       footer={
// //         <>
// //           <span className="text-[13px]">{t("registerHasAccount")}</span>{" "}
// //           <Link
// //             href={routes.auth.login}
// //             className="text-[13px] font-bold text-[var(--green-700)] underline underline-offset-2"
// //           >
// //             {t("registerSignIn")}
// //           </Link>
// //         </>
// //       }
// //     >
// //       <form onSubmit={onSubmit} noValidate>
// //         <FormError message={error} />

// //         {/* dir="auto": the name a journalist types may be in either script,
// //             whatever language the form is in. The first candidate to register
// //             typed «حامد فال». */}
// //         <Field
// //           label={t("fullName")}
// //           name="fullName"
// //           dir="auto"
// //           autoComplete="name"
// //           error={fieldErrors.fullName}
// //         />

// //         {/* dir="ltr" on the machine values below: an address, a number and a
// //             password are Latin strings, and typing them inside an RTL field
// //             makes the caret jump at the @, the dot and the digits. */}
// //         <Field
// //           label={t("email")}
// //           name="email"
// //           type="email"
// //           dir="ltr"
// //           className="text-start"
// //           autoComplete="email"
// //           error={fieldErrors.email}
// //         />

// //         <Field
// //           label={t("phone")}
// //           name="phone"
// //           type="tel"
// //           inputMode="numeric"
// //           dir="ltr"
// //           className="text-start"
// //           autoComplete="tel"
// //           placeholder="22 12 34 56"
// //           error={fieldErrors.phone}
// //         />

// //         <PasswordField
// //           label={t("password")}
// //           name="password"
// //           autoComplete="new-password"
// //           placeholder={t("passwordHint")}
// //           error={fieldErrors.password}
// //         />

// //         <SubmitButton loading={loading}>{t("registerSubmit")}</SubmitButton>
// //       </form>
// //     </AuthShell>
// //   );
// // }


// "use client";
// // src/app/[locale]/(auth)/register/page.tsx

// import { useState, useEffect, useCallback } from "react";
// import { useLocale, useTranslations } from "next-intl";
// import { Link, useRouter } from "@/i18n/navigation";
// import { useAuth } from "@/lib/auth";
// import { ApiError } from "@/lib/api/client";
// import { validateRegistration, V } from "@/lib/validation";
// import { routes, homeForRole } from "@/lib/routes";
// import { useFieldError } from "@/lib/useFieldError";
// import {
//   AuthShell, Field, PasswordField, SubmitButton, FormError,
// } from "@/components/AuthShell";
// import { InstitutionRequestForm } from "@/components/auth/InstitutionRequestForm";
// import { User2, Building2 } from "lucide-react";
// import type { Role } from "@/lib/types";

// export default function RegisterPage() {
//   const t = useTranslations("auth");
//   const locale = useLocale();
//   const resolve = useFieldError();
//   const { register, user, ready } = useAuth();
//   const router = useRouter();

//   /*
//    * ───────────────────────────────────────────────────────────────────
//    * ⚠️ ONE PAGE, TWO DOORS — NOT TWO PAGES.
//    *
//    * A separate /register/institution would hide the second door from anyone
//    * who does not already know to look for it. Here a body arriving to
//    * register sees immediately that it applies as an institution rather than
//    * as a journalist, and a candidate sees a choice they simply pass over.
//    *
//    * ⚠️ AND THE TWO ARE NOT THE SAME ACT. The candidate form CREATES an
//    * account; the institution form FILES A REQUEST that the Ministry decides.
//    * The toggle labels say so, because a form that looked identical would
//    * promise the same outcome.
//    * ───────────────────────────────────────────────────────────────────
//    */
//   const [applicant, setApplicant] = useState<"candidate" | "institution">("candidate");

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
//           // The SERVER's own field messages. These may be KEYS too — the
//           // backend's @Pattern and @NotBlank annotations emit them now —
//           // and FieldError resolves each one against the root namespace.
//           setFieldErrors(e.problem.errors);
//         } else {
//           // ⚠️ resolve(): a bare problem.detail is a key as often as a
//           // sentence. Without this, a candidate reads "validation.nniTaken"
//           // in the error banner.
//           setError(resolve(e.problem.detail ?? e.message));
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
//       /*
//        * ⚠️ LE TITRE SUIT LA PORTE CHOISIE.
//        *
//        * « Première étape avant de déposer votre demande de carte de presse »
//        * décrit le parcours du journaliste. Laissé en place sur l'autre porte,
//        * il annonçait à une institution qu'elle demandait une carte pour
//        * elle-même — alors qu'elle demande à être enregistrée pour déposer ses
//        * journalistes.
//        *
//        * Deux actes différents méritent deux en-têtes.
//        */
//       title={applicant === "institution"
//         ? t("registerInstitutionTitle")
//         : t("registerTitle")}
//       subtitle={applicant === "institution"
//         ? t("registerInstitutionSubtitle")
//         : t("registerSubtitle")}
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
//       <div
//         role="radiogroup"
//         aria-label={t("registerAsLabel")}
//         className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#f2f5f3] p-1"
//       >
//         {([
//           { key: "candidate" as const, Icon: User2, label: t("registerAsCandidate"),
//             note: t("registerAsCandidateNote") },
//           { key: "institution" as const, Icon: Building2, label: t("registerAsInstitution"),
//             note: t("registerAsInstitutionNote") },
//         ]).map((option) => {
//           const selected = applicant === option.key;
//           return (
//             <button
//               key={option.key}
//               type="button"
//               role="radio"
//               aria-checked={selected}
//               onClick={() => setApplicant(option.key)}
//               className="rounded-lg px-3 py-2.5 text-start transition-all"
//               style={selected
//                 ? { background: "#fff", boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
//                 : undefined}
//             >
//               <span className="flex items-center gap-2">
//                 <option.Icon
//                   className="h-3.5 w-3.5 flex-none"
//                   style={{ color: selected ? "var(--green-700)" : "var(--muted-fg)" }}
//                 />
//                 <span
//                   className="text-[13px] font-bold"
//                   style={{ color: selected ? "var(--green-900)" : "var(--slate)" }}
//                 >
//                   {option.label}
//                 </span>
//               </span>
//               {/* ⚠️ The note is the whole point of the toggle: it says what
//                   each door leads to, before anyone fills a field. */}
//               <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted-fg)]">
//                 {option.note}
//               </span>
//             </button>
//           );
//         })}
//       </div>

//       {applicant === "institution" ? (
//         <InstitutionRequestForm />
//       ) : (
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
//       )}
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
import { InstitutionRequestForm } from "@/components/auth/InstitutionRequestForm";
import { User2, Building2 } from "lucide-react";
import type { Role } from "@/lib/types";

export default function RegisterPage() {
  const t = useTranslations("auth");
  const locale = useLocale();
  const resolve = useFieldError();
  const { register, user, ready } = useAuth();
  const router = useRouter();

  /*
   * ───────────────────────────────────────────────────────────────────
   * ⚠️ ONE PAGE, TWO DOORS — NOT TWO PAGES.
   *
   * A separate /register/institution would hide the second door from anyone
   * who does not already know to look for it. Here a body arriving to
   * register sees immediately that it applies as an institution rather than
   * as a journalist, and a candidate sees a choice they simply pass over.
   *
   * ⚠️ AND THE TWO ARE NOT THE SAME ACT. The candidate form CREATES an
   * account; the institution form FILES A REQUEST that the Ministry decides.
   * The toggle labels say so, because a form that looked identical would
   * promise the same outcome.
   * ───────────────────────────────────────────────────────────────────
   */
  const [applicant, setApplicant] = useState<"candidate" | "institution">("candidate");

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
      /*
       * ⚠️ LE TITRE SUIT LA PORTE CHOISIE.
       *
       * « Première étape avant de déposer votre demande de carte de presse »
       * décrit le parcours du journaliste. Laissé en place sur l'autre porte,
       * il annonçait à une institution qu'elle demandait une carte pour
       * elle-même — alors qu'elle demande à être enregistrée pour déposer ses
       * journalistes.
       *
       * Deux actes différents méritent deux en-têtes.
       */
      title={applicant === "institution"
        ? t("registerInstitutionTitle")
        : t("registerTitle")}
      subtitle={applicant === "institution"
        ? t("registerInstitutionSubtitle")
        : t("registerSubtitle")}
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
      <div
        role="radiogroup"
        aria-label={t("registerAsLabel")}
        className="mb-6 grid grid-cols-2 gap-2 rounded-xl bg-[#f2f5f3] p-1"
      >
        {([
          { key: "candidate" as const, Icon: User2, label: t("registerAsCandidate"),
            note: t("registerAsCandidateNote") },
          { key: "institution" as const, Icon: Building2, label: t("registerAsInstitution"),
            note: t("registerAsInstitutionNote") },
        ]).map((option) => {
          const selected = applicant === option.key;
          return (
            <button
              key={option.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => setApplicant(option.key)}
              className="rounded-lg px-3 py-2.5 text-start transition-all"
              style={selected
                ? { background: "#fff", boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                : undefined}
            >
              <span className="flex items-center gap-2">
                <option.Icon
                  className="h-3.5 w-3.5 flex-none"
                  style={{ color: selected ? "var(--green-700)" : "var(--muted-fg)" }}
                />
                <span
                  className="text-[13px] font-bold"
                  style={{ color: selected ? "var(--green-900)" : "var(--slate)" }}
                >
                  {option.label}
                </span>
              </span>
              {/* ⚠️ The note is the whole point of the toggle: it says what
                  each door leads to, before anyone fills a field. */}
              <span className="mt-0.5 block text-[11px] leading-snug text-[var(--muted-fg)]">
                {option.note}
              </span>
            </button>
          );
        })}
      </div>

      {applicant === "institution" ? (
        <InstitutionRequestForm />
      ) : (
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
      )}
    </AuthShell>
  );
}
