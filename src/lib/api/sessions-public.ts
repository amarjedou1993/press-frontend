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
