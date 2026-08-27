import { apiFetch } from "./client";

export interface ProfileResponse {
  nni?: string | null;
  passportNo?: string | null;
  birthdate: string;      // yyyy-MM-dd
  birthplace: string;
}


export interface MeResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string;
  role: string;
  emailVerified: boolean;
  /** ISO 639-1 — la langue des courriels adressés à cette personne. */
  preferredLocale: string;
  profile?: ProfileResponse | null;
  profileComplete: boolean;
}

export const accountKeys = {
  me: ["me"] as const,
  verification: ["verification-status"] as const,
};

/* ── profile ── */

export function getMe() {
  return apiFetch<MeResponse>("/api/me");
}

export function updateAccount(body: { fullName: string; phone: string }) {
  return apiFetch<MeResponse>("/api/me/account", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function updateProfile(body: {
  nni?: string;
  passportNo?: string;
  birthdate: string;
  birthplace: string;
}) {
  return apiFetch<MeResponse>("/api/me/profile", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function setLocale(locale: string) {
  return apiFetch<void>("/api/me/locale", {
    method: "PUT",
    body: JSON.stringify({ locale }),
  });
}

/* ── e-mail verification ── */

export function getVerificationStatus() {
  return apiFetch<{ email: string; verified: boolean }>("/api/auth/verification-status");
}

export function verifyEmail(token: string) {
  return apiFetch<{ message: string }>("/api/auth/verify-email", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

export function resendVerification(email: string) {
  return apiFetch<{ message: string }>("/api/auth/resend-verification", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

/* ── password reset ── */

export function forgotPassword(email: string) {
  return apiFetch<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(body: { token: string; newPassword: string }) {
  return apiFetch<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function changePassword(body: {
  currentPassword: string;
  newPassword: string;
}) {
  return apiFetch<void>("/api/auth/password", {
    method: "PUT",
    body: JSON.stringify(body),
  });
}