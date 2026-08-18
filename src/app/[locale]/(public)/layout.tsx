// src/app/(public)/layout.tsx
// Chrome for the public, unauthenticated pages. Server component: no auth
// guard, no providers, no client JS — these pages must be fast on a weak
// connection and readable by search engines.

import { PublicHeader } from "@/components/public/PublicHeader";
import { PublicFooter } from "@/components/public/PublicFooter";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[var(--paper)]">
      <PublicHeader />
      <main className="flex-1">{children}</main>
      <PublicFooter />
    </div>
  );
}
