// src/lib/types.ts
// The shared vocabulary: TypeScript twins of the backend DTOs and enums.

/* ── Roles (backend: UserRole) ─────────────────────────────── */
export type Role = "CANDIDATE" | "REVIEWER" | "SUPER_ADMIN";

/* ── Auth (backend: AuthDtos) ──────────────────────────────── */
export interface AuthResponse {
  token: string;
  role: Role;
  fullName: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterCandidateRequest {
  fullName: string;
  email: string;
  phone: string; // mandatory since feedback §2.1 — mirrors the backend
  password: string;
}

/* ── Errors (backend: RFC 7807 ProblemDetail) ──────────────── */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  errors?: Record<string, string>;
}

/* ── The 9-state machine (backend: application status CHECK) ── */
export type ApplicationStatus =
  | "DRAFT"
  | "UNDER_REVIEW"
  | "CORRECTION_REQUESTED"
  | "UNDER_FINAL_REVIEW"
  | "ACCEPTED"
  | "REJECTED"
  | "UNDER_RECLAMATION"
  | "FINAL_REJECTION"
  | "CARD_ISSUED";

export type StatusKind =
  | "draft"
  | "review"
  | "correction"
  | "accepted"
  | "rejected";

export const STATUS_BADGE: Record<ApplicationStatus, StatusKind> = {
  DRAFT: "draft",
  UNDER_REVIEW: "review",
  UNDER_FINAL_REVIEW: "review",
  UNDER_RECLAMATION: "review",
  CORRECTION_REQUESTED: "correction",
  ACCEPTED: "accepted",
  CARD_ISSUED: "accepted",
  REJECTED: "rejected",
  FINAL_REJECTION: "rejected",
};

export const STATUS_LABELS: Record<ApplicationStatus, string> = {
  DRAFT: "Brouillon",
  UNDER_REVIEW: "En cours d'examen",
  CORRECTION_REQUESTED: "Correction demandée",
  UNDER_FINAL_REVIEW: "Examen final",
  ACCEPTED: "Acceptée",
  REJECTED: "Rejetée",
  UNDER_RECLAMATION: "Réclamation en cours",
  FINAL_REJECTION: "Rejet définitif",
  CARD_ISSUED: "Carte éditée",
};
