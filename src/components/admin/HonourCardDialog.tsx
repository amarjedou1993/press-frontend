"use client";
// src/components/admin/HonourCardDialog.tsx
//
// Granting a card nobody examined.

import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShieldAlert, User, IdCard, CalendarClock, Camera } from "lucide-react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { fetchCategories, fetchSpecialisations } from "@/lib/api/public";
import type { HonourCardResponse, GrantBody } from "@/lib/api/honour";

/** The NNI's modulo-97 checksum, as the candidate form applies it. */
function nniValid(value: string): boolean {
  if (!/^\d{10}$/.test(value)) return false;
  return (Number(value) - 1) % 97 === 0;
}

/** A titled block. The form has three subjects; a flat stack hides that. */
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
 * ⚠️ THREE THINGS THE BARE COMPONENT GETS WRONG HERE, all fixed once:
 *
 *  · SelectTrigger is `w-fit` by default — sized to its content, so an empty
 *    one is a stub. In a two-column grid it must fill its cell.
 *
 *  · SelectPrimitive.Value renders the VALUE, which is the id. Left alone the
 *    trigger reads "7" after a choice. Base UI takes a render function as
 *    children, and that is what turns the id back into its label.
 *
 *  · alignItemWithTrigger overlays the popup ON the trigger, aligning the
 *    chosen row with it. Handsome for a short list, and for a dozen rows it
 *    pushes the list off the top of a dialog that is already scrolling.
 */
function RefSelect({
  id, label, value, onChange, options, placeholder = "Choisir…",
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options?: Array<{ id: number; labelFr: string }>;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select
        value={value}
        // Base UI passes null when the selection is cleared; "" is what the
        // submit reads as "not chosen".
        onValueChange={(v) => onChange(v ?? "")}
      >
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

export function HonourCardDialog({
  open,
  onOpenChange,
  card,
  onSubmit,
  submitting,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Null when granting. */
  card: HonourCardResponse | null;
  onSubmit: (body: GrantBody) => void;
  submitting: boolean;
}) {
  const editing = !!card;
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
  const [expiresAt, setExpiresAt] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [specialisationId, setSpecialisationId] = useState("");

  const categories = useQuery({
    queryKey: ["public", "categories"],
    queryFn: fetchCategories,
  });
  const specialisations = useQuery({
    queryKey: ["public", "specialisations"],
    queryFn: fetchSpecialisations,
  });

  // Reset on every open, so an edit never inherits the previous subject's
  // dates or the leftovers of an abandoned grant.
  useEffect(() => {
    if (!open) return;
    setErrors({});
    setBirthdate(card?.birthdate ?? "");
    setExpiresAt(card?.expiresAt ?? "");
    setCategoryId(card?.categoryId != null ? String(card.categoryId) : "");
    setSpecialisationId(
      card?.specialisationId != null ? String(card.specialisationId) : "");
  }, [open, card]);

  function handle(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrors({});

    const form = new FormData(event.currentTarget);
    const fullName = String(form.get("fullName") ?? "").trim();
    const identityNumber = String(form.get("identityNumber") ?? "").replace(/\s/g, "");
    const birthplace = String(form.get("birthplace") ?? "").trim();
    const institution = String(form.get("institution") ?? "").trim();
    const grantReason = String(form.get("grantReason") ?? "").trim();

    const found: Record<string, string> = {};

    if (!fullName) found.fullName = "Indiquez le nom du titulaire.";

    // ⚠️ Required, and not as bureaucracy: the card's signature is computed
    // over this. Without it the card cannot be signed, and a scan reports the
    // Ministry's own credential as unverifiable.
    if (!identityNumber) {
      found.identityNumber = "Le NNI ou le numéro de passeport est obligatoire.";
    } else if (/^\d{10}$/.test(identityNumber) && !nniValid(identityNumber)) {
      // Ten digits failing the checksum is a mistyped NNI, not a passport.
      found.identityNumber = "Ce NNI est invalide (clé de contrôle).";
    }

    if (!expiresAt) found.expiresAt = "Indiquez la date d'expiration.";

    // ⚠️ Mandatory, for the reason a justification is mandatory on a
    // rejection: this card bypasses the examination every other card
    // requires, and the register must say why.
    if (!grantReason) found.grantReason = "Indiquez le motif de l'octroi.";

    if (Object.keys(found).length > 0) {
      setErrors(found);
      return;
    }

    onSubmit({
      fullName,
      identityNumber,
      birthdate: birthdate || null,
      birthplace: birthplace || null,
      categoryId: categoryId ? Number(categoryId) : null,
      specialisationId: specialisationId ? Number(specialisationId) : null,
      institution: institution || null,
      expiresAt,
      grantReason,
    });
  }

  const err = (name: string) => errors[name] && (
    <p className="text-xs font-medium text-[var(--red-500)]" role="alert">
      {errors[name]}
    </p>
  );

  const thisYear = new Date().getFullYear();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/*
        ⚠️ THE SCROLL BELONGS TO THE BODY, NOT THE CARD.

        overflow-y-auto on DialogContent scrolls the whole panel — the rounded
        corners disappear behind a full-height scrollbar, and the title and
        the buttons slide away with the fields.

        So: a flex column, padding removed from the panel and given to each
        band, and only the middle one scrolls.
      */}
      <DialogContent className="flex max-h-[90vh] flex-col gap-0 p-0 sm:max-w-2xl">
        <DialogHeader className="flex-none border-b border-[var(--line)] px-6 pb-4 pr-12 pt-6">
          <DialogTitle>
            {editing ? "Modifier la carte" : "Accorder une carte d'honneur"}
          </DialogTitle>
          <DialogDescription>
            {editing
              ? "Les informations seront re-signées."
              : "Accordée sans examen de la commission. Numéro de la série B, absente du registre public."}
          </DialogDescription>
        </DialogHeader>

        <form
          key={`${open}-${card?.id ?? "new"}`}
          onSubmit={handle}
          noValidate
          className="flex min-h-0 flex-1 flex-col"
        >
          {/* min-h-0 is what lets a flex child actually shrink and scroll. */}
          <div className="min-h-0 flex-1 space-y-7 overflow-y-auto px-6 py-6">

            {/* ══ the holder ══ */}
            <Section icon={User} title="Titulaire">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="fullName">Nom complet</Label>
                  {/* dir="auto": the name may be in either script. */}
                  <Input id="fullName" name="fullName" dir="auto"
                    defaultValue={card?.fullName ?? ""}
                    aria-invalid={!!errors.fullName} />
                  {err("fullName")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="identityNumber">NNI ou passeport</Label>
                  <Input id="identityNumber" name="identityNumber"
                    dir="ltr" className="font-mono text-left"
                    placeholder="1234567890"
                    defaultValue={card?.identityNumber ?? ""}
                    aria-invalid={!!errors.identityNumber} />
                  {err("identityNumber")}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="birthdate">Date de naissance</Label>
                  {/* ⚠️ PAST ONLY, back to 1930 — the candidate profile's
                      bounds. A birthdate is often decades back, which is what
                      the year dropdown is for. */}
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
                  <Label htmlFor="birthplace">Lieu de naissance</Label>
                  <Input id="birthplace" name="birthplace" dir="auto"
                    placeholder="Nouakchott"
                    defaultValue={card?.birthplace ?? ""} />
                </div>
              </div>
            </Section>

            {/* ══ what is printed ══ */}
            <Section icon={IdCard} title="Mentions portées sur la carte">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* ⚠️ Read by an agent at a checkpoint: "journaliste" and
                    "photographe de presse" open different access at an event.
                    Not decoration. */}
                <RefSelect
                  id="categoryId"
                  label="Catégorie"
                  value={categoryId}
                  onChange={setCategoryId}
                  options={categories.data}
                />
                <RefSelect
                  id="specialisationId"
                  label="Spécialité"
                  value={specialisationId}
                  onChange={setSpecialisationId}
                  options={specialisations.data}
                />

                <div className="space-y-2 sm:col-span-2">
                  <Label htmlFor="institution">Organe de presse</Label>
                  <Input id="institution" name="institution" dir="auto"
                    defaultValue={card?.institution ?? ""} />
                </div>
              </div>
            </Section>

            {/* ══ the grant ══ */}
            <Section icon={CalendarClock} title="Validité et motif">
              <div className="space-y-2">
                <Label htmlFor="expiresAt">Date d&apos;expiration</Label>
                {/* ⚠️ FUTURE ONLY — the opposite bound from the birthdate
                    above, and the same component. An ordinary card takes its
                    expiry from its session so a whole cohort renews together;
                    there is no session here, so nothing can derive this. */}
                <DatePicker
                  id="expiresAt"
                  name="expiresAt"
                  value={expiresAt}
                  onChange={setExpiresAt}
                  invalid={!!errors.expiresAt}
                  disabled={(d) => d <= new Date()}
                  fromYear={thisYear}
                  toYear={thisYear + 10}
                  defaultMonth={new Date(thisYear + 1, 0)}
                />
                <p className="text-[12px] text-[var(--slate)]">
                  Une carte d&apos;honneur n&apos;appartient à aucune session :
                  sa durée est fixée ici.
                </p>
                {err("expiresAt")}
              </div>

              <div className="space-y-2">
                <Label htmlFor="grantReason">Motif de l&apos;octroi</Label>
                <Textarea id="grantReason" name="grantReason" rows={3} dir="auto"
                  defaultValue={card?.grantReason ?? ""}
                  placeholder="Pourquoi cette carte est accordée sans examen."
                  aria-invalid={!!errors.grantReason} />
                {err("grantReason")}
              </div>
            </Section>

            {!editing && (
              <div className="space-y-3">
                {/* ⚠️ THE PHOTOGRAPH CANNOT BE HERE, and its absence needs
                    explaining rather than leaving as a puzzle.

                    Uploading it needs a card id, and the card does not exist
                    until this form is submitted. So it is the next step, on
                    the row — and until it is done the card cannot be produced
                    at all, which is worth knowing before leaving this
                    dialog. */}
                <p className="flex items-start gap-2.5 rounded-xl border border-[var(--line)] bg-[#fbfcfb] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--slate)]">
                  <Camera className="mt-0.5 h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
                  <span>
                    La photographie s&apos;ajoute{" "}
                    <b className="font-bold text-[var(--green-900)]">après l&apos;octroi</b>,
                    depuis la ligne de la carte. Sans elle, la carte ne peut
                    pas être produite.
                  </span>
                </p>

                {/* ⚠️ This card skips the examination every other card
                    requires. The register records who granted it and why, and
                    that record is what makes the exception defensible. */}
                <p className="flex items-start gap-2.5 rounded-xl bg-[var(--gold-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
                  <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
                  <span>
                    Le motif est inscrit au registre avec votre nom. Une carte
                    accordée sans examen engage l&apos;autorité qui la délivre.
                  </span>
                </p>
              </div>
            )}
          </div>

          {/* <DialogFooter className="flex-none border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4"> */}
          <DialogFooter className="flex-none rounded-b-lg border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-4">
            <Button type="button" variant="outline"
              onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Enregistrement…" : editing ? "Enregistrer" : "Accorder la carte"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
