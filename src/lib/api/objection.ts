// src/lib/api/objection.ts
import { apiFetch } from "./client";

export interface ObjectionEligibility {
  canObject: boolean;

  /**
   * ⚠️ WHY THERE ARE THREE OF THESE, AND WHICH ONE TO USE.
   *
   * `blockedReason` is a CODE — "ALREADY_FILED", "DEADLINE_PASSED". It is the
   * translation key, and it is what a screen should read.
   *
   * The two sentences exist for logs and for anything that cannot translate.
   * One of them, DEADLINE_PASSED, embeds a date formatted server-side — which
   * is exactly why a screen must not use it: the date would be French inside
   * an Arabic page. `deadline` travels separately for that reason.
   */
  blockedReason?: string | null;
  blockedReasonFr?: string | null;
  blockedReasonAr?: string | null;

  deadline: string | null;          // yyyy-MM-dd
  daysRemaining: number;
  alreadyFiled: boolean;

  /** The rejection being contested, for the form's context. */
  contestedJustification?: string | null;
  contestedGroundLabelFr?: string | null;
  contestedGroundLabelAr?: string | null;
}

export interface ObjectionReasonOption {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
  hintFr?: string | null;
  hintAr?: string | null;
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

/**
 * The objection already filed, or null.
 *
 * ⚠️ The endpoint answers 204 when none exists — an absence stated in the
 * status line rather than a 200 with an empty body. apiFetch returns
 * undefined for an empty body, which this normalises to null so the caller
 * has one shape to check.
 */
export async function getFiledObjection(applicationId: number) {
  const filed = await apiFetch<FiledObjection | undefined>(
    `/api/applications/${applicationId}/objection/filed`
  );
  return filed ?? null;
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
