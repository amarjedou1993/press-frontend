// src/lib/types.ts
// The shared vocabulary: TypeScript twins of the backend DTOs and enums.
// Names mirror the backend exactly — when a DTO changes there, it changes
// here, and the compiler finds every affected screen.

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
  phone?: string;
  password: string;
}

/* ── Errors (backend: RFC 7807 ProblemDetail) ──────────────── */
export interface ProblemDetail {
  status: number;
  title?: string;
  detail?: string;
  errors?: Record<string, string>; // field → message (validation failures)
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

/* Visual kinds rendered by <StatusBadge> (5 kinds for 9 states).
   Logic: neutral = in HAPA's hands · gold = candidate must act ·
   green = positive terminal · red = rejection. */
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

/* French labels for the statuses — the UI never shows raw enum names. */
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
