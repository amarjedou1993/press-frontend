"use client";
// src/components/admin/PrinterDialog.tsx

import { useEffect, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordField } from "@/components/AuthShell";
import { PASSWORD_REGEX, PHONE_REGEX } from "@/lib/validation";
import type { PrinterResponse } from "@/lib/api/admin-printers";

export function PrinterDialog({
  open,
  onOpenChange,
  printer,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null when creating. */
  printer: PrinterResponse | null;
  onSubmit: (values: {
    fullName: string; email: string; phone?: string; password?: string;
  }) => void;
  submitting: boolean;
}) {
  const editing = !!printer;
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!open) setErrors({});
  }, [open]);

  function handle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const email = String(form.get("email") ?? "").trim();
    const phone = String(form.get("phone") ?? "").trim();
    const password = String(form.get("password") ?? "");

    const found: Record<string, string> = {};
    if (!fullName) found.fullName = "Indiquez le nom du responsable.";
    if (!email) found.email = "Indiquez une adresse e-mail.";
    if (phone && !PHONE_REGEX.test(phone.replace(/\s/g, ""))) {
      found.phone = "Numéro invalide.";
    }
    // ⚠️ Required on creation, ABSENT on edit — a password field that arrives
    // pre-filled on an edit form is an invitation to change one by accident.
    if (!editing && !PASSWORD_REGEX.test(password)) {
      found.password = "8 caractères min., une lettre et un chiffre.";
    }

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    onSubmit(editing
      ? { fullName, email, phone: phone || undefined }
      : { fullName, email, phone: phone || undefined, password });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        {/* pr-8 keeps the title clear of the close button, which is pinned
            top-right in both languages. */}
        <DialogHeader className="pr-8">
          <DialogTitle>
            {editing ? "Modifier le compte" : "Créer un compte d'impression"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Les modifications prennent effet immédiatement."
              : "Ce compte accède aux ressources de production : photographies, codes de vérification et aperçus. Jamais à la carte signée."}
          </DialogDescription>
        </DialogHeader>

        {/* key remounts the form on every open, so an edit never inherits the
            previous subject's values. */}
        <form key={`${open}-${printer?.id ?? "new"}`} onSubmit={handle} noValidate>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Nom du responsable</Label>
              <Input id="fullName" name="fullName" dir="auto"
                defaultValue={printer?.fullName ?? ""}
                aria-invalid={!!errors.fullName} />
              {errors.fullName && (
                <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
                  {errors.fullName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Adresse e-mail</Label>
              <Input id="email" name="email" type="email" dir="ltr"
                className="text-left"
                defaultValue={printer?.email ?? ""}
                aria-invalid={!!errors.email} />
              {errors.email && (
                <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
                  {errors.email}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">
                Téléphone{" "}
                <span className="font-normal text-[var(--muted-fg)]">(facultatif)</span>
              </Label>
              <Input id="phone" name="phone" type="tel" inputMode="numeric"
                dir="ltr" className="text-left" placeholder="22 12 34 56"
                defaultValue={printer?.phone ?? ""}
                aria-invalid={!!errors.phone} />
              {errors.phone && (
                <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
                  {errors.phone}
                </p>
              )}
            </div>

            {!editing && (
              <PasswordField
                label="Mot de passe initial"
                name="password"
                autoComplete="new-password"
                placeholder="8 caractères min., une lettre et un chiffre"
                error={errors.password}
              />
            )}
          </div>

          <DialogFooter className="mt-6">
            <Button type="button" variant="outline"
              onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Créer le compte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
