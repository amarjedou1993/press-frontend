// src/lib/validation.ts
//
// ⚠️ THESE RETURN KEYS, NOT SENTENCES.
//
// «Adresse e-mail invalide» under an Arabic label is the mixed-language
// failure the whole bilingual exercise exists to avoid. So a validator says
// WHICH rule failed — "validation.email" — and the Field component resolves
// it in the reader's language.
//
// The keys are namespaced so a Field can tell a validation code from a server
// sentence: `t.has(key)` is true for the first and false for the second, and
// an unresolvable string is rendered as-is.

export const PHONE_REGEX = /^(\+222)?[234]\d{7}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** The catalogue keys these validators can return. */
export const V = {
  requiredEmail: "validation.requiredEmail",
  requiredPassword: "validation.requiredPassword",
  requiredName: "validation.requiredName",
  requiredPhone: "validation.requiredPhone",
  email: "validation.email",
  phone: "validation.phone",
  password: "validation.password",
  /** Renvoyé par le SERVEUR (409), pas par un validateur — mais c'est notre
      phrase, donc elle vit avec les autres. */
  emailTaken: "validation.emailTaken",
} as const;

/**
 * Login: presence and e-mail shape only.
 *
 * NEVER the password policy. An account created before the policy tightened
 * must still be able to sign in — refusing a correct password because it
 * predates a rule locks someone out of their own dossier.
 */
export function validateLogin(input: {
  email: string;
  password: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.email.trim()) errors.email = V.requiredEmail;
  else if (!EMAIL_REGEX.test(input.email.trim())) errors.email = V.email;
  if (!input.password) errors.password = V.requiredPassword;
  return errors;
}

/** Registration: full policy. Returns field→key; empty map = valid. */
export function validateRegistration(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.fullName.trim()) errors.fullName = V.requiredName;

  if (!input.email.trim()) errors.email = V.requiredEmail;
  else if (!EMAIL_REGEX.test(input.email.trim())) errors.email = V.email;

  if (!input.phone.trim()) errors.phone = V.requiredPhone;
  else if (!PHONE_REGEX.test(input.phone.replace(/\s/g, "")))
    errors.phone = V.phone;

  if (!input.password) errors.password = V.requiredPassword;
  else if (!PASSWORD_REGEX.test(input.password))
    errors.password = V.password;

  return errors;
}
