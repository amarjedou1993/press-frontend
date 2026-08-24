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
        message: "validation.nniLength",
      }),
    passportNo: z.string().optional(),
    birthdate: z
      .string()
      .min(1, "validation.birthdateRequired")
      .refine((v) => new Date(v) < new Date(), {
        message: "validation.birthdatePast",
      }),
    birthplace: z
      .string()
      .min(1, "validation.birthplaceRequired")
      .max(200, "validation.max200"),
  })
  .refine(
    (v) => (v.nni && v.nni.trim()) || (v.passportNo && v.passportNo.trim()),
    {
      path: ["nni"],
      message: "validation.nniOrPassport",
    }
  );

export type ProfileValues = z.infer<typeof profileSchema>;

/** Name and phone. */
export const accountSchema = z.object({
  fullName: z
    .string()
    .min(1, "validation.requiredName")
    .max(200, "validation.max200"),
  phone: z
    .string()
    .min(1, "validation.requiredPhone")
    .refine((v) => PHONE_REGEX.test(v.replace(/\s/g, "")), {
      message: "validation.phone",
    }),
});

export type AccountValues = z.infer<typeof accountSchema>;

/** A published work link. */
export const workLinkSchema = z.object({
  url: z
    .string()
    .min(1, "validation.urlRequired")
    .url("validation.urlInvalid"),
});

export type WorkLinkValues = z.infer<typeof workLinkSchema>;
