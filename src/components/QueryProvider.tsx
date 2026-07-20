"use client";
// src/components/QueryProvider.tsx
// One QueryClient for the app. Created inside useState so it is stable
// across re-renders and never shared between users during SSR.
//
// Retry policy: retrying a 4xx is pointless (the request is wrong, or the
// user isn't allowed) — only network failures and 5xx get up to 2 retries.

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiError } from "@/lib/api/client";

export function QueryProvider({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 30_000, // fresh for 30s — spares the backend
            refetchOnWindowFocus: false,
            retry: (failureCount, error) => {
              if (error instanceof ApiError && error.problem.status < 500) {
                return false; // 4xx: never retry
              }
              return failureCount < 2;
            },
          },
        },
      })
  );

  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}
