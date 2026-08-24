import { z } from "zod";

export const PHONE_REGEX = /^(\+222)?[234]\d{7}$/;
export const PASSWORD_REGEX = /^(?=.*[A-Za-z])(?=.*\d).{8,100}$/;

const days = (phase: string) =>
  z
    .number({ message: `Indiquez la durée de la phase de ${phase}.` })
    .int("Indiquez un nombre entier de jours.")
    .min(1, `La phase de ${phase} doit durer au moins 1 jour.`)
    .max(365, "365 jours maximum.");

/* ── Session creation ──────────────────────────────────────── */
export const createSessionSchema = z
  .object({
    startDate: z.string().min(1, "La date de début est requise."),
    receivingDays: days("réception"),
    reviewDays: days("examen"),
    correctionDays: days("correction"),
    reclamationDays: days("réclamation"),
     /* The expiry printed on every card from this session — an accreditation
       runs in cycles, so all holders renew together. The "after the session
       ends" rule is enforced by the date picker, the service and a DB CHECK;
       recomputing the phase calendar here would be a fourth implementation
       of the same date arithmetic. */
    cardExpiryDate: z.string().min(1, "Indiquez la date d'expiration des cartes."),
  })
  .refine(
    (v) => {
      const d = new Date(v.startDate + "T00:00:00");
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d > today;
    },
    { path: ["startDate"], message: "La date de début doit être dans le futur." }
  );

export type CreateSessionValues = z.infer<typeof createSessionSchema>;

/* ── Reviewer create / edit ────────────────────────────────── */
const fullName = z
  .string()
  .min(1, "Le nom complet est requis.")
  .max(200, "200 caractères maximum.");

const email = z
  .string()
  .min(1, "L'adresse e-mail est requise.")
  .email("Adresse e-mail invalide (ex. nom@domaine.mr).");

const phone = z
  .string()
  .optional()
  .refine((v) => !v || PHONE_REGEX.test(v.replace(/\s/g, "")), {
    message: "Numéro invalide — 8 chiffres commençant par 2, 3 ou 4.",
  });

export const reviewerCreateSchema = z.object({
  fullName,
  email,
  phone,
  password: z
    .string()
    .min(1, "Le mot de passe est requis.")
    .regex(PASSWORD_REGEX, "Au moins 8 caractères, dont une lettre et un chiffre."),
});

export const reviewerEditSchema = z.object({
  fullName,
  email,
  phone,
  password: z.string().optional(),   // ignored in edit mode
});

/** One value shape for both modes. */
export type ReviewerFormValues = {
  fullName: string;
  email: string;
  phone?: string;
  password?: string;
};
