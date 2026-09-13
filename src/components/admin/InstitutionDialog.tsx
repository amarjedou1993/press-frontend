"use client";
// src/components/admin/InstitutionDialog.tsx

import { useEffect, useState } from "react";
import { Building2, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import type { InstitutionResponse, InstitutionBody } from "@/lib/api/admin-institutions";

/**
 * Register a body, or correct its names.
 *
 * ⚠️ THE CODE IS WRITTEN ONCE AND NEVER AGAIN.
 *
 * It identifies the institution in logs and in exports. A body may be renamed
 * — an authority reorganised, a title corrected — but changing its code would
 * orphan every line that named it. The field is therefore disabled in edit
 * mode rather than hidden: an administrator should see what it is and see
 * that it is settled.
 */
export function InstitutionDialog({
  open, onOpenChange, institution, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to register a new body. */
  institution: InstitutionResponse | null;
  onSubmit: (body: InstitutionBody) => void;
  submitting: boolean;
}) {
  const editing = institution !== null;

  const [code, setCode] = useState("");
  const [nameFr, setNameFr] = useState("");
  const [nameAr, setNameAr] = useState("");

  /**
   * ⚠️ ONE MESSAGE PER FIELD, NOT ONE FOR THE FORM.
   *
   * A single `error` string turned every label red and printed one sentence
   * at the foot — so three empty fields read as one problem, the person fixed
   * the code, submitted, and met the next message. Three passes for one
   * form.
   *
   * The same shape HonourCardDialog and StaffDialog use: collect everything,
   * show each beneath its own field.
   */
  const [errors, setErrors] = useState<Record<string, string>>({});

  /*
   * ⚠️ RESET ON EVERY OPEN, keyed on the institution.
   *
   * Without it, opening the dialog for one body after another shows the
   * first one's values — and an administrator correcting a name would
   * overwrite the wrong institution.
   */
  useEffect(() => {
    if (!open) return;
    setCode(institution?.code ?? "");
    setNameFr(institution?.nameFr ?? "");
    setNameAr(institution?.nameAr ?? "");
    setErrors({});
  }, [open, institution]);

  function submit() {
    const found: Record<string, string> = {};

    if (!editing) {
      const value = code.trim().toUpperCase();
      if (!value) {
        found.code = "Le code est requis.";
      } else if (!/^[A-Z0-9_]{2,30}$/.test(value)) {
        found.code = "Majuscules, chiffres et tiret bas, de 2 à 30 caractères.";
      }
    }
    if (!nameFr.trim()) found.nameFr = "Le nom en français est requis.";
    if (!nameAr.trim()) found.nameAr = "Le nom en arabe est requis.";

    /*
     * ⚠️ EVERYTHING IS COLLECTED BEFORE ANYTHING IS REPORTED.
     *
     * Returning on the first failure is what made this form a sequence of
     * refusals rather than a list of corrections.
     */
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      code: editing ? institution!.code : code.trim().toUpperCase(),
      nameFr: nameFr.trim(),
      nameAr: nameAr.trim(),
    });
  }

  const err = (field: string) =>
    errors[field] ? (
      <p className="text-[12px] font-medium text-[var(--red-700)]">{errors[field]}</p>
    ) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {editing ? "Modifier l'institution" : "Enregistrer une institution"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Le nom peut être corrigé ; le code est définitif."
              : "Un corps admis à déposer ses propres journalistes. Son compte se crée à l'étape suivante."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <Field data-invalid={!!errors.code}>
            <FieldLabel htmlFor="inst-code">Code</FieldLabel>
            <Input
              id="inst-code"
              dir="ltr"
              className="font-mono uppercase"
              placeholder="HAPA"
              value={code}
              disabled={editing}
              autoCapitalize="characters"
              aria-invalid={!!errors.code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setErrors((prev) => ({ ...prev, code: "" }));
              }}
            />
            {err("code")}
            <FieldDescription>
              {editing
                ? "Définitif : il identifie l'institution dans les journaux et les exports."
                : "Majuscules, chiffres et tiret bas. Il identifiera l'institution dans les journaux et les exports, et ne pourra plus changer."}
            </FieldDescription>
          </Field>

          <Field data-invalid={!!errors.nameFr}>
            <FieldLabel htmlFor="inst-name-fr">Nom (français)</FieldLabel>
            <Input
              id="inst-name-fr"
              value={nameFr}
              placeholder="Haute Autorité de la Presse et de l'Audiovisuel"
              aria-invalid={!!errors.nameFr}
              onChange={(e) => {
                setNameFr(e.target.value);
                setErrors((prev) => ({ ...prev, nameFr: "" }));
              }}
            />
            {err("nameFr")}
          </Field>

          <Field data-invalid={!!errors.nameAr}>
            <FieldLabel htmlFor="inst-name-ar">Nom (arabe)</FieldLabel>
            {/*
              ⚠️ dir="rtl" AND lang="ar" ON THE FIELD ITSELF.
              An Arabic name typed into an LTR input has its punctuation
              reordered as it is entered — and this administration space is
              French, so nothing else on the page would have set the
              direction.
            */}
            <Input
              id="inst-name-ar"
              dir="rtl"
              lang="ar"
              className="text-start"
              value={nameAr}
              placeholder="السلطة العليا للصحافة والسمعيات البصرية"
              aria-invalid={!!errors.nameAr}
              onChange={(e) => {
                setNameAr(e.target.value);
                setErrors((prev) => ({ ...prev, nameAr: "" }));
              }}
            />
            {err("nameAr")}
            <FieldDescription>
              {/* ⚠️ It is printed on nothing — but it names the body in the
                  candidate-facing half of the system, which IS bilingual. */}
              Utilisé partout où le système s&apos;adresse en arabe.
            </FieldDescription>
          </Field>

          {!editing && (
            <p className="flex items-start gap-2.5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
              <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
              Une institution enregistrée ne peut rien déposer tant qu&apos;elle
              n&apos;a pas de compte. Le dialogue suivant vous le proposera.
            </p>
          )}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="w-full sm:w-auto" onClick={submit} disabled={submitting}>
            <Building2 className="h-4 w-4 flex-none" />
            {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Enregistrer l'institution"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
