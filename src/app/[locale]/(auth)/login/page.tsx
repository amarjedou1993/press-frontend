"use client";
// src/app/[locale]/(auth)/login/page.tsx

import { Suspense, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link, useRouter } from "@/i18n/navigation";
import { AuthShell, Field, FormError, PasswordField, SubmitButton } from "@/components/AuthShell";
import { useAuth } from "@/lib/auth";
import { validateLogin } from "@/lib/validation";
import { routes, homeForRole } from "@/lib/routes";
import { ApiError } from "@/lib/api/client";
import type { Role } from "@/lib/types";

/**
 * The page shell.
 *
 * useSearchParams() must sit inside a SUSPENSE BOUNDARY: Next renders the page
 * on the server, where the query string is not yet known, and fills it in on
 * the client. Without the boundary the two trees disagree and React discards
 * the server's.
 *
 * The fallback is the same form without the banner, so the transition is a
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
  const t = useTranslations("auth");
  const { login, user, ready } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Read only in the Suspense-wrapped instance; the fallback renders without
  // it, so both trees are consistent with what the server produced.
  const params = useSearchParams();
  const sessionExpired = readsQuery && params.has("expired");

  /**
   * Send a signed-in user to their space.
   *
   * One router: every space is localised now, so homeForRole("/reviewer")
   * becomes /ar/reviewer, and the proxy sends the Authority's spaces on to
   * /fr. No second router, no branch on role.
   */
  const goHome = useCallback(
    (role: Role) => router.replace(homeForRole(role)),
    [router]
  );

  // Already logged in? Don't show the form — go to the role's home.
  // Runs on mount and whenever auth state settles, so Back-button and
  // bfcache restores are caught too.
  useEffect(() => {
    if (ready && user) goHome(user.role);
  }, [ready, user, goHome]);

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(undefined);
    setFieldErrors({});

    const form = new FormData(event.currentTarget);
    const input = {
      email: String(form.get("email")),
      password: String(form.get("password")),
    };

    // Returns KEYS — "validation.email" — which Field resolves in the
    // reader's language. A French sentence under an Arabic label is the one
    // thing the bilingual work exists to prevent.
    const clientErrors = validateLogin(input);
    if (Object.keys(clientErrors).length > 0) {
      setFieldErrors(clientErrors);
      return;
    }

    setLoading(true);
    try {
      const loggedIn = await login(input);
      goHome(loggedIn.role);
    } catch (e) {
      // 401 is a WRONG PASSWORD, not a broken server — and it must never say
      // which of the two fields was wrong: that would confirm an address
      // exists to whoever is guessing.
      if (e instanceof ApiError && e.problem.status === 401) {
        setError(t("loginFailed"));
      } else {
        setError(t("loginUnavailable"));
      }
      setLoading(false);
    }
  }

  // While redirecting an already-authenticated user, render nothing.
  if (ready && user) return null;

  return (
    <AuthShell
      title={t("loginTitle")}
      subtitle={t("loginSubtitle")}
      footer={
        <>
          <span className="text-[13px]">{t("loginNoAccount")}</span>{" "}
          <Link
            href={routes.auth.register}
            className="text-[13px] font-bold text-[var(--green-700)] underline underline-offset-2"
          >
            {t("loginCreate")}
          </Link>
        </>
      }
    >
      {sessionExpired && (
        <p
          role="status"
          className="mb-5 rounded-xl border border-[var(--gold-500)]/40 bg-[var(--gold-tint)] px-4 py-3 text-sm font-medium text-[var(--gold-700)]"
        >
          {t("sessionExpired")}
        </p>
      )}

      <form onSubmit={onSubmit} noValidate>
        <FormError message={error} />

        {/* dir="ltr" on the address: an e-mail is a Latin string, and typing
            it inside an RTL field makes the caret jump at the @ and the dot. */}
        <Field
          label={t("email")}
          name="email"
          type="email"
          dir="ltr"
          className="text-start"
          autoComplete="email"
          error={fieldErrors.email}
        />

        <PasswordField
          label={t("password")}
          name="password"
          autoComplete="current-password"
          error={fieldErrors.password}
        />

        {/* Placed under the field it relates to — where someone who has just
            failed to remember their password is already looking.
            text-end, not text-right: it belongs at the reading edge. */}
        <div className="-mt-3 mb-5 text-end">
          <Link
            href={routes.auth.forgotPassword}
            className="text-[13px] font-semibold text-[var(--green-700)] underline underline-offset-2 hover:text-[var(--green-600)]"
          >
            {t("forgotPassword")}
          </Link>
        </div>

        <SubmitButton loading={loading}>{t("loginSubmit")}</SubmitButton>
      </form>
    </AuthShell>
  );
}
