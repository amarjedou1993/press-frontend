"use client";
// src/components/ChangePasswordDialog.tsx

import { useEffect, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { PasswordField } from "@/components/AuthShell";
import { changePassword } from "@/lib/api/account";
import { validateNewPassword, V } from "@/lib/validation";
import { ApiError } from "@/lib/api/client";
import { useFieldError } from "@/lib/useFieldError";

export function ChangePasswordDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("password");
  const arabic = useLocale() === "ar";
  const resolve = useFieldError();

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Cleared on close: a half-filled password form left behind a dialog is a
  // password sitting in memory for no reason.
  useEffect(() => {
    if (!open) setErrors({});
  }, [open]);

  const change = useMutation({
    mutationFn: (body: { currentPassword: string; newPassword: string }) =>
      changePassword(body),
    onSuccess: () => {
      onOpenChange(false);
      toast.success(t("doneTitle"), { description: t("doneBody") });
    },
    onError: (e) => {
      /**
       * ⚠️ A WRONG CURRENT PASSWORD IS A FIELD ERROR, NOT A TOAST.
       *
       * It is the likeliest failure by far, and it belongs beside the box
       * that was typed wrongly. A toast in the corner leaves someone
       * re-reading three fields to find which one the system disliked.
       */
      if (e instanceof ApiError && e.problem.status === 401) {
        setErrors({ currentPassword: V.currentPasswordWrong });
        return;
      }
      toast.error(t("failedTitle"), {
        description: e instanceof ApiError
          ? (resolve(e.problem.detail) ?? t("tryAgain"))
          : t("tryAgain"),
      });
    },
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const form = new FormData(event.currentTarget);
    const current = String(form.get("currentPassword") ?? "");
    const next = String(form.get("newPassword") ?? "");
    const confirm = String(form.get("confirm") ?? "");

    const found: Record<string, string> = {};
    if (!current) found.currentPassword = V.requiredPassword;

    // The same three rules as the reset page — one policy, one function.
    const policy = validateNewPassword(next, confirm);
    if (policy.password) found.newPassword = policy.password;
    if (policy.confirm) found.confirm = policy.confirm;

    // ⚠️ Not a policy failure, and not caught by validateNewPassword: the new
    // password may be perfectly strong and still be the one already in use.
    // Refused here rather than at the server, so the person is told before a
    // round trip that changed nothing.
    if (!found.newPassword && current && next && current === next) {
      found.newPassword = V.passwordUnchanged;
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }
    change.mutate({ currentPassword: current, newPassword: next });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* <DialogContent className="sm:max-w-md"> */}
       <DialogContent
        className={[
          "sm:max-w-md",
          // ⚠️ The close button is pinned `right-4 top-4` inside DialogContent.
          // Moving it means overriding from here — and `left-auto` is not
          // optional: without it both rules apply and the button stretches
          // across the header.
          arabic
            ? "[&>button:last-of-type]:left-4 [&>button:last-of-type]:right-auto"
            : "",
        ].join(" ")}
      >
        {/* <DialogHeader> */}
        <DialogHeader className={arabic ? "pl-8" : "pr-8"}>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 flex-none text-[var(--green-700)]" />
            {t("title")}
          </DialogTitle>
          <DialogDescription>{t("subtitle")}</DialogDescription>
        </DialogHeader>

        {/* ⚠️ key={String(open)} remounts the form on every open, so the
            browser's autofill and the previous attempt's values do not
            survive a close. A password field that reopens pre-filled is a
            password left on screen. */}
        <form key={String(open)} onSubmit={onSubmit} noValidate>
          {/* ⚠️ THE CURRENT PASSWORD IS NOT A FORMALITY.
              A signed-in session may be an unattended machine. Without it,
              anyone walking past a logged-in screen takes the account — and
              on this system that account holds a press accreditation. */}
          <PasswordField
            label={t("current")}
            name="currentPassword"
            autoComplete="current-password"
            error={errors.currentPassword}
          />

          <PasswordField
            label={t("new")}
            name="newPassword"
            autoComplete="new-password"
            placeholder={t("policy")}
            error={errors.newPassword}
          />

          <PasswordField
            label={t("confirm")}
            name="confirm"
            autoComplete="new-password"
            error={errors.confirm}
          />

          <DialogFooter>
            <Button type="button" variant="outline"
              onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" disabled={change.isPending}>
              {change.isPending ? t("saving") : t("submit")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
