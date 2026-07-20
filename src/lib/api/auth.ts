import { apiFetch } from "./client";
import type {
  AuthResponse,
  LoginRequest,
  RegisterCandidateRequest,
} from "@/lib/types";

export function login(input: LoginRequest) {
  return apiFetch<AuthResponse>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function register(input: RegisterCandidateRequest) {
  return apiFetch<AuthResponse>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
}
