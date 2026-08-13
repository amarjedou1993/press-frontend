"use client";
// src/app/error.tsx
//
// Something failed that should not have. The person reading this did nothing
// wrong, and telling them so matters more than the stack trace does.
//
// TWO THINGS THIS PAGE DOES THAT A GENERIC ERROR SCREEN DOES NOT.
//
// 1. IT REASSURES ABOUT THE DOSSIER. The commonest fear on this system is
//    "did I just lose my application" — and the answer is no: nothing is
//    written by a page that failed to render. Saying it is worth more than
//    anything else on the screen.
//
// 2. IT SHOWS THE DIGEST. Next generates one per error; quoting it lets
//    somebody report a fault that can actually be found in the logs, rather
//    than describing a red screen.

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import {
  Guilloche, OfficialSeal, MicroprintRule, TricolorRule,
} from "@/components/public/patterns";
import { routes } from "@/lib/routes";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // The browser console is the only place this can go from here.
    console.error("Unhandled error:", error);
  }, [error]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-16 text-white"
      style={{
        background:
          "radial-gradient(900px 460px at 50% -20%, rgba(208,28,31,.16), transparent 62%), linear-gradient(168deg, #2a1013 0%, #1d2320 45%, #101815 100%)",
      }}
    >
      <Guilloche
        className="pointer-events-none absolute -left-52 -top-56 h-[600px] w-[600px] text-white opacity-[0.05]"
        rings={46}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.05]"
        style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
        aria-hidden="true"
      />

      <div className="relative z-10 w-full max-w-lg text-center">
        <span className="relative mx-auto flex h-[92px] w-[92px] items-center justify-center">
          <span
            className="absolute inset-0 rounded-full"
            style={{ background: "radial-gradient(circle, rgba(208,28,31,.22), transparent 70%)" }}
            aria-hidden="true"
          />
          <OfficialSeal
            className="absolute inset-0 h-full w-full"
            color="#ff8a8c"
            id="error-seal"
          />
          <span
            className="relative flex h-[40px] w-[40px] items-center justify-center rounded-full"
            style={{ background: "rgba(0,0,0,.4)", boxShadow: "inset 0 0 0 1.5px var(--red-500)" }}
          >
            <AlertTriangle className="h-4.5 w-4.5 text-[var(--red-500)]" />
          </span>
        </span>

        <h1 className="engraved-dark mt-7 text-[30px] font-extrabold leading-tight tracking-tight sm:text-[35px]">
          Une erreur est survenue
        </h1>
        <p dir="rtl" lang="ar" className="mt-2.5 text-[19px] font-semibold text-white/45">
          حدث خطأ
        </p>

        <span className="foil-rule mx-auto mt-6 block h-px w-28 opacity-45" aria-hidden="true" />

        <p className="mx-auto mt-6 max-w-sm text-[14px] leading-relaxed text-white/55">
          Le service n&apos;a pas pu afficher cette page. Le problème vient de
          nous, pas de vous.
        </p>

        {/* the thing people actually fear */}
        <p className="mx-auto mt-4 max-w-sm rounded-xl border border-white/12 bg-black/30 px-4 py-3 text-[13px] leading-relaxed text-white/60">
          <b className="font-semibold text-white/85">Votre dossier n&apos;est pas affecté.</b>{" "}
          Aucune donnée n&apos;est perdue : réessayez dans un instant.
        </p>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-[var(--gold-500)] px-5 text-[13px] font-extrabold text-[var(--green-900)]
                       shadow-[0_10px_26px_-12px_rgba(255,215,0,.8)] transition-all
                       hover:bg-[#ffe14d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#1d2320]"
          >
            <RotateCcw className="h-4 w-4" />
            Réessayer
          </button>

          <Link
            href={routes.home}
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-white/[0.07] px-5 text-[13px] font-bold text-white/85 ring-1 ring-inset ring-white/20 transition-all hover:bg-white/[0.14] hover:text-white"
          >
            <Home className="h-4 w-4" />
            Accueil
          </Link>
        </div>

        {/* quotable, so a fault can be found rather than described */}
        {error.digest && (
          <p className="mt-8 font-mono text-[10.5px] uppercase tracking-[0.16em] text-white/25">
            Incident {error.digest}
          </p>
        )}
      </div>

      <MicroprintRule
        className="absolute inset-x-0 bottom-3 text-center text-white opacity-[0.12]"
        repeat={16}
      />
      <TricolorRule className="absolute inset-x-0 bottom-0" />
    </main>
  );
}
