// src/lib/validation.ts
// Client-side MIRROR of the backend rules — instant, localized, per-field
// feedback. The backend remains the enforcer. Keep regexes in sync with
// application.yaml (app.identity.phone-regex / app.security.password-regex).

export const PHONE_REGEX = /^(\+222)?[234]\d{7}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const messages = {
  requiredEmail: "Veuillez saisir votre adresse e-mail.",
  requiredPassword: "Veuillez saisir votre mot de passe.",
  requiredName: "Veuillez saisir votre nom complet.",
  requiredPhone: "Veuillez saisir votre numéro de téléphone.",
  email: "Adresse e-mail invalide (ex. nom@domaine.mr).",
  phone: "Numéro invalide — 8 chiffres commençant par 2, 3 ou 4.",
  password: "Au moins 8 caractères, dont une lettre et un chiffre.",
} as const;

/** Login: only presence + email shape. Never applies the password policy
 *  (existing passwords must always be accepted). */
export function validateLogin(input: {
  email: string;
  password: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!input.email.trim()) errors.email = messages.requiredEmail;
  else if (!EMAIL_REGEX.test(input.email.trim())) errors.email = messages.email;
  if (!input.password) errors.password = messages.requiredPassword;
  return errors;
}

/** Registration: full policy. Returns field→message; empty map = valid. */
export function validateRegistration(input: {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.fullName.trim()) errors.fullName = messages.requiredName;

  if (!input.email.trim()) errors.email = messages.requiredEmail;
  else if (!EMAIL_REGEX.test(input.email.trim())) errors.email = messages.email;

  if (!input.phone.trim()) errors.phone = messages.requiredPhone;
  else if (!PHONE_REGEX.test(input.phone.replace(/\s/g, "")))
    errors.phone = messages.phone;

  if (!input.password) errors.password = messages.requiredPassword;
  else if (!PASSWORD_REGEX.test(input.password))
    errors.password = messages.password;

  return errors;
}
