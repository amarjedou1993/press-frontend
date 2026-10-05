export const PHONE_REGEX = /^(\+222)?[234]\d{7}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * The catalogue keys these validators can return.
 *
 * ⚠️ ONE RULE, ONE KEY — that is what this object is for. The password policy
 * appears on registration and on the reset page; if each wrote its own
 * sentence, the two would drift and a candidate would meet the same
 * requirement worded two ways.
 */
export const V = {
  requiredEmail: "validation.requiredEmail",
  requiredPassword: "validation.requiredPassword",
  requiredName: "validation.requiredName",
  requiredPhone: "validation.requiredPhone",
  email: "validation.email",
  phone: "validation.phone",
  password: "validation.password",

  /**
   * The two entries differ.
   *
   * ⚠️ NOT a policy failure — both may be perfectly good passwords. It says
   * the person mistyped one of them, which is a different message on a
   * different field, and confusing the two sends someone hunting for a rule
   * they have not broken.
   */
  passwordMismatch: "validation.passwordMismatch",

    /** ⚠️ Le mot de passe actuel est faux — 401, pas un échec de politique. */
  currentPasswordWrong: "validation.currentPasswordWrong",

  /** Le nouveau est identique à l'ancien : valide, mais sans effet. */
  passwordUnchanged: "validation.passwordUnchanged",
  /** Le compte utilise l'identification Khidmaty : il n'a pas de mot de passe à changer. */
  noLocalPassword: "validation.noLocalPassword",

  /** Renvoyé par le SERVEUR (409), pas par un validateur — mais c'est notre
      phrase, donc elle vit avec les autres. */
  emailTaken: "validation.emailTaken",

  /* ── demande d'enregistrement d'une institution ── */
  requiredInstitutionNameFr: "validation.requiredInstitutionNameFr",
  requiredInstitutionNameAr: "validation.requiredInstitutionNameAr",
  requiredContactRole: "validation.requiredContactRole",
  institutionLetterRequired: "validation.institutionLetterRequired",
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

/**
 * An institution's registration request.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ LES MÊMES RÈGLES QUE validateRegistration, PAS DE NOUVELLES.
 *
 * Adresse, téléphone et mot de passe passent par les expressions et les clés
 * déjà employées pour un candidat. Une institution qui saisit un numéro
 * mauritanien obéit à la règle mauritanienne, et lit la même phrase qu'un
 * journaliste quand elle se trompe.
 *
 * ⚠️ LE TÉLÉPHONE EST OBLIGATOIRE. Le Ministère examine une lettre officielle
 * et peut avoir besoin d'appeler le signataire pour la confirmer — c'est même
 * la vérification qui déjoue une demande déposée au nom d'un corps par
 * quelqu'un qui n'en fait pas partie.
 * ───────────────────────────────────────────────────────────────────────
 */
export function validateInstitutionRequest(input: {
  proposedNameFr: string;
  proposedNameAr: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  password: string;
  hasLetter: boolean;
}): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!input.proposedNameFr.trim()) errors.proposedNameFr = V.requiredInstitutionNameFr;
  if (!input.proposedNameAr.trim()) errors.proposedNameAr = V.requiredInstitutionNameAr;
  if (!input.contactName.trim()) errors.contactName = V.requiredName;
  if (!input.contactRole.trim()) errors.contactRole = V.requiredContactRole;

  if (!input.email.trim()) errors.email = V.requiredEmail;
  else if (!EMAIL_REGEX.test(input.email.trim())) errors.email = V.email;

  if (!input.phone.trim()) errors.phone = V.requiredPhone;
  else if (!PHONE_REGEX.test(input.phone.replace(/\s/g, "")))
    errors.phone = V.phone;

  if (!input.password) errors.password = V.requiredPassword;
  else if (!PASSWORD_REGEX.test(input.password))
    errors.password = V.password;

  if (!input.hasLetter) errors.letter = V.institutionLetterRequired;

  return errors;
}

/**
 * A new password and its confirmation.
 *
 * Shared by the reset page and anywhere else a password is set twice, so the
 * three rules stay in one place rather than being retyped per form.
 */
export function validateNewPassword(
  password: string,
  confirm: string
): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!password) errors.password = V.requiredPassword;
  else if (!PASSWORD_REGEX.test(password)) errors.password = V.password;

  // Checked even when the first failed: someone who mistyped both wants to
  // know both, not to discover the second after fixing the first.
  if (password !== confirm) errors.confirm = V.passwordMismatch;

  return errors;
}