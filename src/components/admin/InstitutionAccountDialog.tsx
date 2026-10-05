"use client";
// src/components/admin/InstitutionAccountDialog.tsx

import { useEffect, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { KeyRound, UserPlus, Copy, Check, ShieldAlert, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import {
  createInstitutionAccount, resetInstitutionPassword, changeInstitutionAccountEmail,
  type InstitutionResponse,
} from "@/lib/api/admin-institutions";
import { ApiError } from "@/lib/api/client";

/**
 * Issue a body's account, or reset its password.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ ONE ACCOUNT PER INSTITUTION, AND IT IS THE ORGANISATION'S.
 *
 * Not one per employee of the body: staff turnover must not cost an
 * institution its access, and a departing officer must not take the ability
 * to file with them.
 *
 * ⚠️ AND THE PASSWORD IS SHOWN ONCE, HERE, TO BE HANDED OVER OUT OF BAND.
 *
 * There is no e-mail loop: the Ministry vetted the address when it decided
 * the body may file. Which means this screen is the only moment the password
 * exists in readable form — so it is displayed deliberately, with a copy
 * button, rather than typed into a field and forgotten.
 * ───────────────────────────────────────────────────────────────────────
 */
export function InstitutionAccountDialog({
  open, onOpenChange, institution, onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  institution: InstitutionResponse | null;
  onDone: () => void;
}) {
  const resetting = institution?.accountId != null;

  /*
   * ⚠️ DEUX GESTES SUR UN COMPTE EXISTANT, et on n'en fait qu'un à la fois.
   *
   * Changer le mot de passe et changer l'adresse répondent au même événement
   * — la personne qui tenait le compte est partie — mais ce sont deux actes.
   * Les mêler dans un seul envoi ferait d'une faute de frappe dans l'adresse
   * une réinitialisation ratée aussi.
   */
  const [section, setSection] = useState<"password" | "email">("password");
  const changingEmail = resetting && section === "email";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  /**
   * ⚠️ ONE MESSAGE PER FIELD.
   *
   * A single string made a bad address and a weak password the same problem,
   * reported at the foot of the form — so the person fixed one, submitted,
   * and met the other.
   */
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!open) return;
    setEmail(institution?.accountEmail ?? "");
    setPassword(suggestPassword());
    setErrors({});
    setCopied(false);
    setSection("password");
  }, [open, institution]);

  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const create = useMutation({
    mutationFn: () => createInstitutionAccount(institution!.id, {
      email: email.trim().toLowerCase(),
      password,
    }),
    onSuccess: () => {
      toast.success("Compte créé", {
        description: "Communiquez l'adresse et le mot de passe à l'institution.",
      });
      onDone();
    },
    // ⚠️ The server's refusals are about the ACCOUNT as a whole — an address
    // already taken, a body that already has one. They belong at the foot,
    // not under a field.
    onError: (e) => setErrors({ form: errText(e) }),
  });

  const reset = useMutation({
    mutationFn: () => resetInstitutionPassword(institution!.id, password),
    onSuccess: () => {
      toast.success("Mot de passe réinitialisé", {
        description: "L'ancien ne fonctionne plus. Communiquez le nouveau.",
      });
      onDone();
    },
    onError: (e) => setErrors({ form: errText(e) }),
  });

  const changeEmail = useMutation({
    mutationFn: () => changeInstitutionAccountEmail(institution!.id, email.trim().toLowerCase()),
    onSuccess: () => {
      toast.success("Adresse du compte modifiée", {
        description: "Les liens de réinitialisation déjà envoyés à l'ancienne adresse ne fonctionnent plus.",
      });
      onDone();
    },
    onError: (e) => setErrors({ form: errText(e) }),
  });

  function submit() {
    const found: Record<string, string> = {};

    if (changingEmail) {
      const value = email.trim().toLowerCase();
      if (!value) {
        found.email = "L'adresse e-mail est requise.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        found.email = "Adresse e-mail invalide.";
      } else if (value === (institution?.accountEmail ?? "").toLowerCase()) {
        found.email = "C'est déjà l'adresse du compte.";
      }
      setErrors(found);
      if (Object.keys(found).length === 0) changeEmail.mutate();
      return;
    }

    if (!resetting) {
      const value = email.trim();
      if (!value) {
        found.email = "L'adresse e-mail est requise.";
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
        found.email = "Adresse e-mail invalide.";
      }
    }
    if (!/^(?=.*[A-Za-z])(?=.*\d).{8,100}$/.test(password)) {
      found.password = "Au moins 8 caractères, dont une lettre et un chiffre.";
    }

    // ⚠️ Collected, not returned on the first: two empty fields are two
    // corrections, made in one pass.
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    (resetting ? reset : create).mutate();
  }

  const err = (field: string) =>
    errors[field] ? (
      <p className="text-[12px] font-medium text-[var(--red-700)]">{errors[field]}</p>
    ) : null;

  const pending = create.isPending || reset.isPending || changeEmail.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader className="pr-8">
          <DialogTitle>
            {!resetting ? "Créer le compte"
              : changingEmail ? "Changer l'adresse du compte"
              : "Réinitialiser le mot de passe"}
          </DialogTitle>
          <DialogDescription>
            {institution?.nameFr}
            {!resetting
              ? " — un compte unique, qui appartient à l'institution et non à une personne."
              : changingEmail
                ? " — l'institution se connectera désormais avec la nouvelle adresse."
                : " — l'ancien mot de passe cessera immédiatement de fonctionner."}
          </DialogDescription>
        </DialogHeader>

        {resetting && (
          <div className="grid grid-cols-2 gap-1 rounded-xl bg-[#f2f5f3] p-1">
            {([
              { key: "password" as const, label: "Mot de passe", Icon: KeyRound },
              { key: "email" as const, label: "Adresse e-mail", Icon: AtSign },
            ]).map((tab) => {
              const on = section === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  aria-pressed={on}
                  onClick={() => {
                    setSection(tab.key);
                    setErrors({});
                    setEmail(institution?.accountEmail ?? "");
                  }}
                  className="flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-[12.5px] font-bold transition-all"
                  style={on
                    ? { background: "#fff", color: "var(--green-900)",
                        boxShadow: "0 1px 3px rgba(11,46,31,.14)" }
                    : { color: "var(--slate)" }}
                >
                  <tab.Icon className="h-3.5 w-3.5 flex-none" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        )}

        <div className="space-y-4">
          <Field data-invalid={!!errors.email}>
            <FieldLabel htmlFor="inst-email">Adresse e-mail</FieldLabel>
            <Input
              id="inst-email"
              type="email"
              dir="ltr"
              className="text-start"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="accreditation@hapa.mr"
              value={email}
              disabled={resetting && !changingEmail}
              aria-invalid={!!errors.email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors((prev) => ({ ...prev, email: "" }));
              }}
            />
            {err("email")}
            <FieldDescription>
              {changingEmail
                ? "Vérifiez-la avec soin : les réinitialisations de mot de passe y seront envoyées. Une adresse de service survit au départ de la personne."
                : resetting
                  ? "Pour changer l'adresse, utilisez l'onglet « Adresse e-mail »."
                  : "Une adresse de service plutôt qu'une personnelle : le compte survit au départ de qui l'utilise."}
            </FieldDescription>
          </Field>

          {changingEmail && (
            <p className="flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
              {/* ⚠️ Dit avant l'acte : c'est précisément ce qui protège quand
                  la personne partie avait demandé un lien la veille. */}
              <span>
                Les liens de réinitialisation déjà envoyés à l&apos;ancienne
                adresse cesseront de fonctionner, et toute session ouverte
                avec elle prendra fin. Le mot de passe, lui, ne change pas.
              </span>
            </p>
          )}

          {!changingEmail && (<>

          <Field data-invalid={!!errors.password}>
            <FieldLabel htmlFor="inst-password">Mot de passe</FieldLabel>
            <div className="flex items-center gap-2">
              {/*
                ⚠️ VISIBLE, NOT MASKED.
                
                The Ministry has to read this out or write it down — it is
                handed over out of band, and there is no e-mail loop to fall
                back on. A masked field would mean typing a password nobody
                can verify, twice.
              */}
              <Input
                id="inst-password"
                dir="ltr"
                className="flex-1 font-mono text-start"
                value={password}
                aria-invalid={!!errors.password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setErrors((prev) => ({ ...prev, password: "" }));
                  setCopied(false);
                }}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                className="flex-none"
                title="Copier"
                aria-label="Copier le mot de passe"
                onClick={() => {
                  navigator.clipboard.writeText(password);
                  setCopied(true);
                }}
              >
                {copied ? <Check className="h-4 w-4 text-[var(--green-600)]" />
                        : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            {err("password")}
            <FieldDescription>
              Au moins 8 caractères, dont une lettre et un chiffre.
            </FieldDescription>
          </Field>

          {/* ⚠️ SAID BEFORE THE ACTION, not after. This screen is the only
              moment the password exists in readable form — an administrator
              who closes the dialog without noting it has locked the
              institution out until they reset it again. */}
          <p className="flex items-start gap-2.5 rounded-lg bg-[var(--gold-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--gold-700)]">
            <ShieldAlert className="mt-0.5 h-3.5 w-3.5 flex-none" />
            <span>
              <b className="font-bold">Notez ce mot de passe avant de fermer.</b>{" "}
              Il n&apos;est envoyé par aucun message et ne sera plus affiché :
              le Ministère le communique à l&apos;institution par ses propres
              moyens.
            </span>
          </p>
          </>)}

          {/* The server's own refusal — about the account, not a field. */}
          {errors.form && <FieldError errors={[{ message: errors.form }]} />}
        </div>

        <DialogFooter className="flex-col gap-2 sm:flex-row">
          <Button variant="outline" className="w-full sm:w-auto"
            onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button className="w-full sm:w-auto" onClick={submit} disabled={pending}>
            {changingEmail ? <AtSign className="h-4 w-4 flex-none" />
              : resetting ? <KeyRound className="h-4 w-4 flex-none" />
              : <UserPlus className="h-4 w-4 flex-none" />}
            {pending ? "Enregistrement…"
              : changingEmail ? "Changer l'adresse"
              : resetting ? "Réinitialiser"
              : "Créer le compte"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * A password the Ministry can read aloud.
 *
 * ⚠️ NO AMBIGUOUS CHARACTERS — no O and 0, no l and 1, no I.
 *
 * This is dictated over a telephone or copied from a screen onto paper. A
 * generator that produced "lI10O" would be producing support calls, and the
 * institution locked out in the meantime cannot file.
 */
function suggestPassword() {
  const letters = "abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";
  const digits = "23456789";
  const pool = letters + digits;

  const bytes = new Uint32Array(14);
  crypto.getRandomValues(bytes);

  let out = "";
  for (let i = 0; i < bytes.length; i++) {
    out += pool[bytes[i] % pool.length];
  }
  // Guarantee the shape the server demands rather than hoping for it.
  return out.slice(0, 12) + letters[bytes[12] % letters.length]
                          + digits[bytes[13] % digits.length];
}
