"use client";
// src/components/LocaleSwitcher.tsx
//
// ───────────────────────────────────────────────────────────────────────
// EACH LANGUAGE IS NAMED IN ITSELF — العربية, never "Arabe".
//
// Someone who cannot read the current language must still recognise their
// own. A French label for Arabic helps only the people who do not need it.
//
// AND IT KEEPS THE PAGE. Switching from /ar/journalistes lands on
// /fr/journalistes, not the home page — a reader who changes language halfway
// through the register should not lose their place.
//
// No flags. A language is not a country: Arabic is not Saudi Arabia, and
// French is not France.
// ───────────────────────────────────────────────────────────────────────

import { useTransition } from "react";
import { useLocale } from "next-intl";
import { useParams } from "next/navigation";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, LOCALE_NAMES, type Locale } from "@/i18n/routing";

export function LocaleSwitcher({
  variant = "dark",
}: {
  /** `dark` for the green surfaces, `light` for white panels. */
  variant?: "dark" | "light";
}) {
  const current = useLocale() as Locale;
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams();
  const [pending, startTransition] = useTransition();

  const dark = variant === "dark";

  function switchTo(next: Locale) {
    if (next === current || pending) return;
    startTransition(() => {
      // `params` carries dynamic segments — a token, an id — so the reader
      // stays on the SAME page rather than being sent home.
      router.replace(
        // @ts-expect-error — pathname and params are known-good together
        { pathname, params },
        { locale: next }
      );
    });
  }

  return (
    <div
      role="group"
      aria-label={current === "ar" ? "اللغة" : "Langue"}
      className="inline-flex items-center rounded-lg p-0.5"
      style={{
        background: dark ? "rgba(255,255,255,.08)" : "var(--green-tint)",
        boxShadow: `inset 0 0 0 1px ${dark ? "rgba(255,255,255,.14)" : "var(--line)"}`,
        opacity: pending ? 0.6 : 1,
      }}
    >
      {routing.locales.map((locale) => {
        const active = locale === current;
        return (
          <button
            key={locale}
            type="button"
            onClick={() => switchTo(locale)}
            disabled={pending}
            // The switcher itself must read correctly in each direction.
            dir={locale === "ar" ? "rtl" : "ltr"}
            lang={locale}
            aria-current={active ? "true" : undefined}
            className="rounded-md px-2.5 py-1 text-[12px] font-bold transition-all disabled:cursor-wait"
            style={
              active
                ? {
                    background: dark ? "var(--gold-500)" : "var(--green-900)",
                    color: dark ? "var(--green-900)" : "#fff",
                  }
                : { color: dark ? "rgba(255,255,255,.6)" : "var(--slate)" }
            }
          >
            {LOCALE_NAMES[locale].native}
          </button>
        );
      })}
    </div>
  );
}
