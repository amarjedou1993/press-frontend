"use client";
// src/app/[locale]/(auth)/institution-request/confirm/page.tsx
//   →  /institution-request/confirm?token=…
//
// Consumes the link sent when an institution files its request.

import { Suspense, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { AuthShell } from "@/components/AuthShell";
import { confirmInstitutionRequest } from "@/lib/api/institution-requests";
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

function ConfirmInner() {
  const t = useTranslations("auth");
  const resolve = useFieldError();
  const router = useRouter();
  const token = useSearchParams().get("token");

  const confirm = useMutation({ mutationFn: (tk: string) => confirmInstitutionRequest(tk) });

  /*
   * ⚠️ `mutate`, NOT `confirm`, in the dependency array — TanStack returns a
   * new object every render, and depending on it would re-run this for ever.
   * The same correction the candidate verification page carries.
   */
  const { mutate } = confirm;
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (token && !started) {
      setStarted(true);
      mutate(token);
    }
  }, [token, started, mutate]);

  if (!token) {
    return (
      <Panel tone="error"
        title={t("verifyIncompleteTitle")}
        body={t("verifyIncompleteBody")}
        action={t("loginSubmit")}
        onAction={() => router.push(routes.auth.login)} />
    );
  }

  if (confirm.isSuccess) {
    /*
     * ⚠️ TWO WAYS TO SUCCEED, AND THEY ARE NOT THE SAME NEWS.
     *
     * A link clicked twice confirms nothing new — but the address IS
     * confirmed, which is what the applicant wanted. Saying "c'était déjà
     * fait" closes the doubt that the first click failed silently.
     */
    const already = confirm.data?.alreadyConfirmed === true;
    return (
      <Panel tone="ok"
        title={already
          ? t("institutionConfirmAlreadyTitle")
          : t("institutionConfirmDoneTitle")}
        body={already
          ? t("institutionConfirmAlreadyBody")
          : t("institutionConfirmDoneBody")} />
    );
  }

  if (confirm.isError) {
    return (
      <Panel tone="error"
        title={t("verifyFailedTitle")}
        body={confirm.error instanceof ApiError
          ? (resolve(confirm.error.problem.detail) ?? t("verifyLinkExpired"))
          : t("verifyLinkExpired")}
        /*
         * ⚠️ A DEAD END WOULD BE THE FAILURE HERE.
         *
         * An expired link means the request expired too — seven days without
         * confirmation. The only way forward is a new request, and the page
         * says so rather than leaving the applicant on a refusal.
         */
        note={t("institutionConfirmExpiredNext")}
        action={t("institutionConfirmRetry")}
        onAction={() => router.push(routes.auth.register)} />
    );
  }

  return <Verifying />;
}

function Panel({
  tone, title, body, note, action, onAction,
}: {
  tone: "ok" | "error";
  title: string;
  body: string;
  note?: string;
  action?: string;
  onAction?: () => void;
}) {
  const ok = tone === "ok";
  return (
    <div
      className="rounded-xl border p-6 text-center"
      style={ok
        ? { borderColor: "var(--green-500)", background: "var(--green-tint)" }
        : { borderColor: "color-mix(in srgb, var(--red-500) 30%, transparent)",
            background: "var(--red-tint)" }}
    >
      {ok
        ? <CheckCircle2 className="mx-auto h-9 w-9 text-[var(--green-700)]" />
        : <XCircle className="mx-auto h-9 w-9 text-[var(--red-500)]" />}

      <p className="mt-3 text-[15px] font-extrabold text-[var(--green-900)]">{title}</p>
      <p dir="auto" className="mx-auto mt-1.5 max-w-sm text-[13.5px] leading-relaxed"
        style={{ color: ok ? "var(--green-700)" : "var(--red-700)" }}>
        {body}
      </p>

      {note && (
        <p className="mt-3 text-[12.5px] leading-relaxed text-[var(--slate)]">{note}</p>
      )}

      {action && onAction && (
        <Button className="mt-5" variant={ok ? "default" : "outline"} onClick={onAction}>
          {action}
        </Button>
      )}
    </div>
  );
}

export default function InstitutionRequestConfirmPage() {
  const t = useTranslations("auth");
  return (
    <AuthShell
      title={t("institutionConfirmTitle")}
      subtitle={t("institutionConfirmSubtitle")}
      footer={
        <Link
          href={routes.auth.login}
          className="font-bold text-[var(--green-700)] underline underline-offset-2"
        >
          {t("loginSubmit")}
        </Link>
      }
    >
      {/* useSearchParams needs a Suspense boundary — and the spinner is the
          right fallback rather than null, since the page is about to show it
          anyway. */}
      <Suspense fallback={<Verifying />}>
        <ConfirmInner />
      </Suspense>
    </AuthShell>
  );
}
