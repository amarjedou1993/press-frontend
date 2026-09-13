"use client";
// src/components/institution/StaffDialog.tsx
//
// Declaring one of an institution's own journalists.

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery } from "@tanstack/react-query";
import { User, Briefcase, Info } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchCategories, fetchSpecialisations } from "@/lib/api/public";
import type { FilingResponse, FilingBody } from "@/lib/api/institutional";

/**
 * A titled block.
 *
 * ⚠️ THE SAME COMPONENT HonourCardDialog USES, and deliberately.
 *
 * An officer who files an honour card and an institutional agent in one
 * afternoon meets two dialogs doing the same job: declare a person, produce a
 * card. They should not be two different forms.
 *
 * An earlier draft of this file invented its own layout — dotted baselines, a
 * coloured header, labels at the reading edge. It was defensible on its own
 * and wrong beside its sibling: one dialog in a house style is not a house
 * style.
 */
function Section({
  icon: Icon, title, children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <p className="flex items-center gap-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
        <Icon className="h-3.5 w-3.5 flex-none" />
        {title}
        <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
      </p>
      {children}
    </section>
  );
}

/**
 * A labelled reference-data select.
 *
 * ⚠️ Three things the bare component gets wrong, fixed once — the same three
 * HonourCardDialog documents: SelectTrigger is w-fit by default, SelectValue
 * renders the id rather than the label, and alignItemWithTrigger pushes a
 * dozen rows off the top of a scrolling dialog.
 */
function RefSelect({
  id, label, value, onChange, options, placeholder,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ id: number; labelFr: string }>;
  placeholder: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v ?? "")}>
        <SelectTrigger id={id} className="w-full">
          <SelectValue placeholder={placeholder}>
            {(current: string | null) =>
              options?.find((o) => String(o.id) === current)?.labelFr
              ?? placeholder}
          </SelectValue>
        </SelectTrigger>
        <SelectContent align="start" alignItemWithTrigger={false}>
          {options?.map((o) => (
            <SelectItem key={o.id} value={String(o.id)}>
              {o.labelFr}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

export function StaffDialog({
  open, onOpenChange, filing, onSubmit, submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null to file someone new. */
  filing: FilingResponse | null;
  onSubmit: (body: FilingBody) => void;
  submitting: boolean;
}) {
  const t = useTranslations("institution");
  const editing = !!filing;
  const [errors, setErrors] = useState<Record<string, string>>({});

  /**
   * ⚠️ CONTROLLED, unlike the text fields.
   *
   * DatePicker and Select are not native inputs — they do not appear in
   * FormData, so their values are held here and read at submit. The text
   * fields stay uncontrolled: defaultValue covers them, and every keystroke
   * would otherwise re-render the dialog.
   */
  const [birthdate, setBirthdate] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [specialisationId, setSpecialisationId] = useState("");

  const categories = useQuery({
    queryKey: ["public", "categories"], queryFn: fetchCategories,
  });
  const specialisations = useQuery({
    queryKey: ["public", "specialisations"], queryFn: fetchSpecialisations,
  });

  /* ⚠️ Reset on every open, keyed on the filing: opening for one employee
     after another would otherwise carry the first one's dates and choices —
     and those are the three fields `key` on the form does not clear, because
     they are not uncontrolled inputs. */
  useEffect(() => {
    if (!open) return;
    setBirthdate(filing?.birthdate ?? "");
    setCategoryId(filing?.categoryId ? String(filing.categoryId) : "");
    setSpecialisationId(filing?.specialisationId ? String(filing.specialisationId) : "");
    setErrors({});
  }, [open, filing]);

  function handle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);

    const fullName = String(data.get("fullName") ?? "").trim();
    const identityNumber = String(data.get("identityNumber") ?? "").replace(/\s/g, "");
    const birthplace = String(data.get("birthplace") ?? "").trim();
    const jobTitle = String(data.get("jobTitle") ?? "").trim();

    const found: Record<string, string> = {};
    if (!fullName) found.fullName = t("errorNameRequired");
    if (!identityNumber) found.identityNumber = t("errorIdentityRequired");
    /*
     * ⚠️ SHAPE ONLY, NOT THE CHECKSUM — unlike HonourCardDialog.
     *
     * That dialog grants to Mauritanian figures and can assume an NNI. An
     * institution may legitimately file a foreign employee on a passport
     * number, which carries no modulo-97 key — so a checksum here would
     * refuse a valid filing, and this screen cannot tell the two apart with
     * certainty.
     *
     * The server applies the checksum when the number LOOKS like an NNI, and
     * says which rule failed. That is the right place for it.
     */
    else if (identityNumber.length < 6) {
      found.identityNumber = t("errorIdentityShort");
    }

    setErrors(found);
    if (Object.keys(found).length > 0) return;

    onSubmit({
      fullName,
      identityNumber,
      birthdate: birthdate || null,
      birthplace: birthplace || null,
      jobTitle: jobTitle || null,
      categoryId: categoryId ? Number(categoryId) : null,
      specialisationId: specialisationId ? Number(specialisationId) : null,
    });
  }

  const err = (field: string) =>
    errors[field] ? (
      <p className="text-[12px] font-medium text-[var(--red-700)]">{errors[field]}</p>
    ) : null;

  const thisYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] flex-col overflow-hidden gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>
            {editing ? t("dialogEditTitle") : t("dialogFileTitle")}
          </DialogTitle>
          <DialogDescription>
            {editing ? t("dialogEditBody") : t("dialogFileBody")}
          </DialogDescription>
        </DialogHeader>

        <form
          key={`${open}-${filing?.id ?? "new"}`}
          onSubmit={handle}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* min-h-0 is what lets a flex child actually shrink and scroll. */}
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">

            {/* ══ who they are ══ */}
            <Section icon={User} title={t("sectionHolder")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">{t("fieldName")}</Label>
                  {/* dir="auto": the name may be in either script. */}
                  <Input id="fullName" name="fullName" dir="auto"
                    className="user-text"
                    placeholder={t("placeholderName")}
                    defaultValue={filing?.fullName ?? ""}
                    aria-invalid={!!errors.fullName} />
                  {err("fullName")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identityNumber">{t("fieldIdentity")}</Label>
                  <Input id="identityNumber" name="identityNumber"
                    dir="ltr" className="font-mono text-start"
                    inputMode="numeric"
                    placeholder="1234567890"
                    defaultValue={filing?.identityNumber ?? ""}
                    aria-invalid={!!errors.identityNumber} />
                  {err("identityNumber")}
                  <p className="text-[12px] leading-relaxed text-[var(--slate)]">
                    {t("fieldIdentityHint")}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate">{t("fieldBirthdate")}</Label>
                  {/* ⚠️ PAST ONLY, back to 1930 — the same bounds the honour
                      dialog gives it. The year dropdown is what makes a date
                      decades back reachable without paging a calendar. */}
                  <DatePicker
                    id="birthdate"
                    name="birthdate"
                    value={birthdate}
                    onChange={setBirthdate}
                    disabled={(d) => d > new Date()}
                    fromYear={1930}
                    toYear={thisYear}
                    defaultMonth={new Date(1980, 0)}
                  />
                </div>

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="birthplace">{t("fieldBirthplace")}</Label>
                  <Input id="birthplace" name="birthplace" dir="auto"
                    className="user-text"
                    placeholder={t("placeholderBirthplace")}
                    defaultValue={filing?.birthplace ?? ""} />
                </div>
              </div>
            </Section>

            {/* ══ what they do here ══ */}
            <Section icon={Briefcase} title={t("sectionEmployment")}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="jobTitle">{t("fieldJobTitle")}</Label>
                  <Input id="jobTitle" name="jobTitle" dir="auto"
                    className="user-text"
                    placeholder={t("fieldJobTitlePlaceholder")}
                    defaultValue={filing?.jobTitle ?? ""} />
                  <p className="text-[12px] leading-relaxed text-[var(--slate)]">
                    {t("fieldJobTitleHint")}
                  </p>
                </div>

                <RefSelect
                  id="categoryId"
                  label={t("fieldCategory")}
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categories.data}
                  placeholder={t("choose")}
                />

                <RefSelect
                  id="specialisationId"
                  label={t("fieldSpecialisation")}
                  value={specialisationId}
                  onChange={setSpecialisationId}
                  options={specialisations.data}
                  placeholder={t("choose")}
                />
              </div>
            </Section>

            {/* ⚠️ WHAT THIS DIALOG DOES NOT ASK FOR, and why.
                An institution filing its first agent will look for an expiry
                field and a photograph field. Saying where they are beats
                leaving the form to be read as incomplete. */}
            {!editing && (
              <p className="flex items-start gap-2.5 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
                <Info className="mt-0.5 h-3.5 w-3.5 flex-none" />
                {t("filingNote")}
              </p>
            )}
          </div>

          <DialogFooter className="flex-none flex-col gap-2 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4 sm:flex-row">
            <Button type="button" variant="outline" className="w-full sm:w-auto"
              onClick={() => onOpenChange(false)}>
              {t("cancel")}
            </Button>
            <Button type="submit" className="w-full sm:w-auto" disabled={submitting}>
              {submitting ? t("saving") : editing ? t("save") : t("fileAction")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
