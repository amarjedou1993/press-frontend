// src/lib/schemas-candidate.ts
// Zod schemas for the candidate forms. Rules mirror the backend validators
// (@ValidNni, @ValidPhone) — the backend stays the enforcer; these give
// instant, field-specific French feedback.
//
// APPEND these to your existing src/lib/schemas.ts, or keep as a separate
// module and import from both.

import { z } from "zod";

export const NNI_REGEX = /^\d{10}$/;
export const PHONE_REGEX = /^(\+222)?[234]\d{7}$/;

/** Identity. NNI or passport — the either/or is checked by .refine below. */
export const profileSchema = z
  .object({
    nni: z
      .string()
      .optional()
      .refine((v) => !v || NNI_REGEX.test(v.replace(/\s/g, "")), {
        message: "Le NNI doit comporter 10 chiffres.",
      }),
    passportNo: z.string().optional(),
    birthdate: z
      .string()
      .min(1, "La date de naissance est requise.")
      .refine((v) => new Date(v) < new Date(), {
        message: "La date de naissance doit être dans le passé.",
      }),
    birthplace: z
      .string()
      .min(1, "Le lieu de naissance est requis.")
      .max(200, "200 caractères maximum."),
  })
  .refine(
    (v) => (v.nni && v.nni.trim()) || (v.passportNo && v.passportNo.trim()),
    {
      path: ["nni"],
      message: "Renseignez votre NNI ou votre numéro de passeport.",
    }
  );

export type ProfileValues = z.infer<typeof profileSchema>;

/** Name and phone. */
export const accountSchema = z.object({
  fullName: z
    .string()
    .min(1, "Le nom complet est requis.")
    .max(200, "200 caractères maximum."),
  phone: z
    .string()
    .min(1, "Le numéro de téléphone est requis.")
    .refine((v) => PHONE_REGEX.test(v.replace(/\s/g, "")), {
      message: "Numéro invalide — 8 chiffres commençant par 2, 3 ou 4.",
    }),
});

export type AccountValues = z.infer<typeof accountSchema>;

/** A published work link. */
export const workLinkSchema = z.object({
  url: z
    .string()
    .min(1, "L'adresse du lien est requise.")
    .url("Adresse invalide (exemple : https://exemple.mr/article)"),
});

export type WorkLinkValues = z.infer<typeof workLinkSchema>;
