"use client";

import { useEffect } from "react";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  reviewerCreateSchema, reviewerEditSchema, type ReviewerFormValues,
} from "@/lib/schemas";
import type { ReviewerResponse } from "@/lib/api/admin";

export function ReviewerDialog({
  open, onOpenChange, reviewer, submitting, onSubmit,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  reviewer?: ReviewerResponse | null;   // present = edit mode
  submitting: boolean;
  onSubmit: (values: ReviewerFormValues) => void;
}) {
  const isEdit = !!reviewer;

  const form = useForm<ReviewerFormValues>({
    resolver: zodResolver(
      (isEdit ? reviewerEditSchema : reviewerCreateSchema) as any
    ) as Resolver<ReviewerFormValues>,
    
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { fullName: "", email: "", phone: "", password: "" },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        fullName: reviewer?.fullName ?? "",
        email: reviewer?.email ?? "",
        phone: reviewer?.phone ?? "",
        password: "",
      });
    }
  }, [open, reviewer, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Modifier le réviseur" : "Nouveau réviseur"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mettez à jour les informations du membre de la commission."
              : "Créez un compte pour un membre de la commission d'examen."}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Controller
            name="fullName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Nom complet</FieldLabel>
                <Input {...field} value={field.value ?? ""} id={field.name}
                  aria-invalid={fieldState.invalid}
                  placeholder="Ahmed Ould Mohamed" autoComplete="off" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="email"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Adresse e-mail</FieldLabel>
                <Input {...field} value={field.value ?? ""} id={field.name} type="email"
                  aria-invalid={fieldState.invalid} placeholder="nom@hapa.mr" autoComplete="off" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          <Controller
            name="phone"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>
                  Téléphone{" "}
                  <span className="font-normal text-[var(--muted-fg)]">(optionnel)</span>
                </FieldLabel>
                <Input {...field} value={field.value ?? ""} id={field.name} type="tel"
                  inputMode="numeric" aria-invalid={fieldState.invalid}
                  placeholder="22 12 34 56" autoComplete="off" />
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />

          {!isEdit && (
            <Controller
              name="password"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Mot de passe initial</FieldLabel>
                  <Input {...field} value={field.value ?? ""} id={field.name}
                    type="password" aria-invalid={fieldState.invalid}
                    autoComplete="new-password" />
                  <FieldDescription>
                    À communiquer au réviseur ; il pourra le changer ensuite.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement…" : isEdit ? "Enregistrer" : "Créer le réviseur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
