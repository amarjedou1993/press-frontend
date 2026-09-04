"use client";
// src/components/candidate/VerificationBanner.tsx
//
// Shown until a candidate confirms their address. It appears on every page of
// the candidate space, because an unverified address blocks SUBMISSION — and
// discovering that at the moment of submitting, after assembling a dossier,
// is the worst possible time to learn it.
//
// So the banner says what still works ("prepare your dossier now") as well as
// what does not. A warning that only forbids leaves someone stuck.
//
// ⚠️ AND MOST CANDIDATES READ IT ON A PHONE. This is the first thing they see
// in their space, on the device they will use throughout — so it is laid out
// for 375px first and allowed to spread, rather than the other way round.

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MailWarning, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVerificationStatus, resendVerification, accountKeys } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

export function VerificationBanner() {
  const t = useTranslations("verifyBanner");
  const [justSent, setJustSent] = useState(false);

  const { data } = useQuery({
    queryKey: accountKeys.verification,
    queryFn: getVerificationStatus,
    staleTime: 30_000,
  });

  const resend = useMutation({
    mutationFn: () => resendVerification(data!.email),
    onSuccess: () => {
      setJustSent(true);
      toast.success(t("sentTitle"), {
        description: t("sentBody", { email: data?.email ?? "" }),
      });
    },
    onError: (e) =>
      toast.error(t("sendFailed"), {
        description: e instanceof ApiError
          ? (e.problem.detail ?? e.message)
          : t("tryAgain"),
      }),
  });

  if (!data || data.verified) return null;

  return (
    <div
      className="relative mb-6 overflow-hidden rounded-2xl border shadow-[0_10px_30px_-18px_rgba(140,117,0,.5)]"
      style={{
        borderColor: "rgba(255,215,0,.55)",
        background: "linear-gradient(105deg, #fffdf2 0%, var(--gold-tint) 55%, #fffaea 100%)",
      }}
      role="status"
    >
      {/* gold edge — at the reading edge, so it leads rather than trails */}
      <span className="absolute inset-y-0 start-0 w-1.5 bg-[var(--gold-500)]" aria-hidden="true" />

      {/* ⚠️ Hidden below sm. At 375px a 128px seal sits directly behind the
          message it decorates, and the message is the point. */}
      <svg
        className="rtl-mirror pointer-events-none absolute -right-6 -top-8 hidden h-32 w-32 opacity-[0.07] sm:block"
        viewBox="0 0 200 200" aria-hidden="true"
      >
        <g stroke="var(--gold-700)" fill="none">
          <circle cx="100" cy="100" r="86" strokeWidth="3" />
          <circle cx="100" cy="100" r="70" strokeWidth="1.5" strokeDasharray="4 5" />
          {Array.from({ length: 40 }).map((_, i) => (
            <line key={i} x1="100" y1="14" x2="100" y2="24" strokeWidth="1.5"
              transform={`rotate(${i * 9} 100 100)`} />
          ))}
        </g>
      </svg>

      <div className="relative flex flex-wrap items-start gap-3.5 p-4 ps-5 sm:gap-4 sm:p-5 sm:ps-7">
        <span
          className="flex h-10 w-10 flex-none items-center justify-center rounded-xl shadow-sm sm:h-11 sm:w-11"
          style={{ background: "var(--gold-500)" }}
        >
          <MailWarning className="h-5 w-5 text-[var(--green-900)]" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]/70">
            {t("eyebrow")}
          </p>
          <p className="mt-1 text-[14.5px] font-extrabold leading-snug text-[var(--green-900)] sm:text-[15px]">
            {t("title")}
          </p>
          <p className="mt-1.5 max-w-2xl text-[13px] leading-relaxed text-[var(--gold-700)] sm:text-[13.5px]">
            {t.rich("body", {
              /*
               * ⚠️ dir="ltr" on the address. An e-mail is a Latin string, and
               * inside an Arabic paragraph its dot and @ bidi-reorder — the
               * address would display wrongly in the very message telling
               * someone to go and check it.
               *
               * ⚠️ AND break-all, WHICH IS NOT COSMETIC. An address is one
               * unbreakable token: "mohamed.ould.ahmed@agence-mauritanienne.mr"
               * has no space to wrap at, so on a 375px screen it runs straight
               * past the panel's edge and the end of it is simply not there.
               *
               * inline-block is what lets the break apply at all — an inline
               * element inherits the paragraph's wrapping and ignores it.
               */
              email: () => (
                <b dir="ltr" className="inline-block break-all font-bold text-[var(--green-900)]">
                  {data.email}
                </b>
              ),
              b: (c) => <b className="font-bold">{c}</b>,
            })}
          </p>

          {justSent && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 text-[12.5px] font-semibold text-[var(--green-700)]">
              <CheckCircle2 className="h-3.5 w-3.5 flex-none" />
              {t("resent")}
            </p>
          )}
        </div>

        {/*
         * ⚠️ FULL WIDTH BELOW sm, AND THAT IS WHAT FIXES THE LAYOUT.
         *
         * flex-none held the button on the first row and squeezed the message
         * to about 130px — three or four words a line, on the one screen a
         * candidate must actually read.
         *
         * w-full gives it a basis of 100%, so flex-wrap moves it to its own
         * line. It also becomes a full-width tap target, which is what it
         * should be on a phone: this is the action the banner exists to offer.
         */}
        <Button
          variant="outline"
          size="sm"
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          className="w-full flex-none border-[var(--gold-700)]/25 bg-white text-[var(--gold-700)] shadow-sm hover:bg-white hover:text-[var(--green-900)] sm:w-auto"
        >
          <Send className="h-3.5 w-3.5" />
          {resend.isPending ? t("sending") : t("resend")}
        </Button>
      </div>
    </div>
  );
}
