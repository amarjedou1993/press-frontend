// src/lib/api/sessions-public.ts
// CLIENT-side access to the public endpoints, for the candidate space.
// (lib/api/public.ts is the SERVER-side equivalent used by the public pages —
// same endpoints, different execution context, so they stay separate.)

import { apiFetch } from "./client";

export interface OpenSession {
  id: number;
  startDate: string;
  receivingEnd: string;
}

export interface PressCategory {
  id: number;
  code: string;
  labelFr: string;
  labelAr: string;
}

export const catalogKeys = {
  openSessions: ["public", "sessions"] as const,
  categories: ["public", "categories"] as const,
};

export function listOpenSessions() {
  return apiFetch<OpenSession[]>("/api/public/sessions");
}

export function listCategories() {
  return apiFetch<PressCategory[]>("/api/public/categories");
}
