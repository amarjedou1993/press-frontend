// src/lib/api/objection.ts
// Mirrors ObjectionController.
//
// As with the submission gate and the correction panel, the SERVER decides
// whether the right may be exercised and says why not if not. One object
// carries the verdict, the deadline, and the reason — so the form and its
// explanation can never disagree.

import { apiFetch } from "./client";

export interface ObjectionEligibility {
  canObject: boolean;
  /** Present when it cannot be filed — the server's own French wording. */
  blockedReasonFr?: string | null;
  deadline: string | null;          // yyyy-MM-dd
  daysRemaining: number;
  alreadyFiled: boolean;
  /** The rejection being contested, for the form's context. */
  contestedJustification?: string | null;
  contestedGroundLabelFr?: string | null;
}

export interface ObjectionReasonOption {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
  hintFr?: string | null;
  /** OTHER — the argument does all the work. */
  freeForm: boolean;
}

export interface FiledObjection {
  id: number;
  reasonId: number;
  reasonLabelFr?: string | null;
  reasonLabelAr?: string | null;
  argument: string;
  createdAt?: string | null;
}

export const objectionKeys = {
  eligibility: (applicationId: number) => ["objection", applicationId] as const,
  reasons: (applicationId: number) => ["objection", applicationId, "reasons"] as const,
  filed: (applicationId: number) => ["objection", applicationId, "filed"] as const,
};

export function getObjectionEligibility(applicationId: number) {
  return apiFetch<ObjectionEligibility>(`/api/applications/${applicationId}/objection`);
}

export function getObjectionReasons(applicationId: number) {
  return apiFetch<ObjectionReasonOption[]>(
    `/api/applications/${applicationId}/objection/reasons`
  );
}

export function getFiledObjection(applicationId: number) {
  return apiFetch<FiledObjection | null>(
    `/api/applications/${applicationId}/objection/filed`
  );
}

export function fileObjection(
  applicationId: number,
  body: { reasonId: number; argument: string }
) {
  return apiFetch<ObjectionEligibility>(
    `/api/applications/${applicationId}/objection`,
    { method: "POST", body: JSON.stringify(body) }
  );
}

/** The service's own minimum — mirrored here so the counter agrees with it. */
export const MIN_ARGUMENT_LENGTH = 30;
