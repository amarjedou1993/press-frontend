// src/lib/api/admin.ts
// Reviewer management endpoints, mirroring AdminReviewerController.

import { apiFetch } from "./client";

export interface ReviewerResponse {
  id: number;
  email: string;
  fullName: string;
  phone: string | null;
  role: string;
  enabled: boolean;
}

export interface CreateReviewerRequest {
  fullName: string;
  email: string;
  phone?: string;
  password: string;
}

export interface UpdateReviewerRequest {
  fullName: string;
  email: string;
  phone?: string;
}

export interface DeleteResult {
  outcome: "DELETED" | "ARCHIVED";
  message: string;
}

export const reviewerKeys = {
  all: ["reviewers"] as const,
};

export function listReviewers() {
  return apiFetch<ReviewerResponse[]>("/api/admin/reviewers");
}

export function createReviewer(body: CreateReviewerRequest) {
  return apiFetch<ReviewerResponse>("/api/admin/reviewers", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateReviewer(id: number, body: UpdateReviewerRequest) {
  return apiFetch<ReviewerResponse>(`/api/admin/reviewers/${id}`, {
    method: "PUT",
    body: JSON.stringify(body),
  });
}

export function setReviewerEnabled(id: number, enabled: boolean) {
  return apiFetch<ReviewerResponse>(`/api/admin/reviewers/${id}/enabled`, {
    method: "PATCH",
    body: JSON.stringify({ enabled }),
  });
}

export function deleteReviewer(id: number) {
  return apiFetch<DeleteResult>(`/api/admin/reviewers/${id}`, {
    method: "DELETE",
  });
}
