// src/lib/api/admin-printers.ts
//
// Producer account management.
//
// ⚠️ A SEPARATE MODULE FROM admin.ts, which manages the commission.
//
// A reviewer is a member of a body whose size matters. A producer is a
// contractor with an account. The two endpoints mirror each other, and the
// screens that use them make different arguments — one about quorum and
// office, one about access and its withdrawal.

import { apiFetch } from "./client";

export interface PrinterResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  enabled: boolean;
}

export interface CreatePrinterRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdatePrinterRequest {
  fullName: string;
  email: string;
  phone?: string;
}

/**
 * ⚠️ Two outcomes, and the caller must say which happened.
 *
 * A producer who has produced cannot be destroyed — print_runs.printed_by
 * must stay resolvable. So "delete" archives instead, and an administrator
 * who is told "deleted" when the account still exists will look for it again.
 */
export interface DeleteResult {
  outcome: "DELETED" | "ARCHIVED";
  message: string;
}

export const printerAccountKeys = {
  all: ["printers"] as const,
};

export function listPrinters() {
  return apiFetch<PrinterResponse[]>("/api/admin/printers");
}

export function createPrinter(body: CreatePrinterRequest) {
  return apiFetch<PrinterResponse>("/api/admin/printers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updatePrinter(id: number, body: UpdatePrinterRequest) {
  return apiFetch<PrinterResponse>(`/api/admin/printers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function setPrinterEnabled(id: number, enabled: boolean) {
  return apiFetch<PrinterResponse>(`/api/admin/printers/${id}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export function deletePrinter(id: number) {
  return apiFetch<DeleteResult>(`/api/admin/printers/${id}`, {
    method: "DELETE",
  });
}
