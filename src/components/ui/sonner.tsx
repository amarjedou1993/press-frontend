"use client";
// src/components/ui/sonner.tsx

import { Toaster as Sonner, type ToasterProps } from "sonner";
import { CheckCircle2, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react";

/**
 * Toasts, in the system's own hand.
 *
 * ───────────────────────────────────────────────────────────────────────
 * ⚠️ THESE ARE RECEIPTS, NOT NOTIFICATIONS.
 *
 * "Carte B - 0012 / 26 accordée" confirms an act that grants someone an
 * accreditation. "Carte retirée" confirms one that ends it. They are the only
 * acknowledgement an administrator gets, and unstyled they looked like a
 * cookie banner — a library's grey rounded rectangle on a page built from
 * seals, foil rules and a tricolour edge.
 *
 * So: the paper the rest of the interface is printed on, a coloured edge
 * carrying the outcome, and the same typography as everything around it.
 * ───────────────────────────────────────────────────────────────────────
 *
 * ⚠️ THE EDGE IS ON THE LEADING SIDE, logically.
 *
 * border-s rather than border-l, so it sits where reading begins in both
 * languages — on the left in French, the right in Arabic. A physical border-l
 * would put the accent at the end of the sentence in Arabic, where it reads
 * as a stray mark.
 */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      className="toaster group"
      /*
       * ⚠️ Slightly longer than sonner's 4s default.
       *
       * These carry card numbers — "B - 0012 / 26" — and a number that
       * vanishes before it can be written down is a number the administrator
       * has to go and look up.
       */
      duration={5000}
      /* Lucide, so the toasts use the same icons as the rows they confirm. */
      icons={{
        success: <CheckCircle2 className="h-[17px] w-[17px] text-[var(--green-600)]" />,
        error: <XCircle className="h-[17px] w-[17px] text-[var(--red-500)]" />,
        warning: <AlertTriangle className="h-[17px] w-[17px] text-[var(--gold-700)]" />,
        info: <Info className="h-[17px] w-[17px] text-[var(--green-700)]" />,
        loading: <Loader2 className="h-[17px] w-[17px] animate-spin text-[var(--slate)]" />,
      }}
      toastOptions={{
        classNames: {
          toast: [
            "group toast",
            "w-full items-start gap-3 rounded-xl border border-[var(--line)] bg-white p-4",
            // The same elevation as a card, so a toast reads as a piece of
            // the interface rather than an overlay from elsewhere.
            "shadow-[0_1px_2px_rgba(22,34,27,.05),0_18px_40px_-20px_rgba(11,46,31,.45)]",
            // ⚠️ The outcome edge. border-s: leading in both directions.
            "border-s-[3px] border-s-[var(--slate)]",
          ].join(" "),

          title: "text-[13.5px] font-extrabold leading-snug text-[var(--green-900)]",
          description:
            "!text-[12.5px] !leading-relaxed !text-[var(--slate)] mt-0.5",

          icon: "mt-px flex-none",
          content: "min-w-0 flex-1",

          actionButton:
            "!rounded-lg !bg-[var(--green-700)] !px-3 !py-1.5 !text-[12px] !font-bold !text-white hover:!bg-[var(--green-600)]",
          cancelButton:
            "!rounded-lg !bg-[#f2f5f3] !px-3 !py-1.5 !text-[12px] !font-bold !text-[var(--slate)]",
          closeButton:
            "!border-[var(--line)] !bg-white !text-[var(--muted-fg)] hover:!text-[var(--ink)]",

          /*
           * ⚠️ THE EDGE COLOUR IS THE WHOLE SIGNAL.
           *
           * An administrator glancing away and back should know from three
           * feet whether the last act succeeded. The icon says it too, but a
           * coloured rule is read before an icon is recognised — and these
           * are the same four tones the card statuses use, so the vocabulary
           * is one vocabulary.
           */
          success: "!border-s-[var(--green-500)]",
          error: "!border-s-[var(--red-500)]",
          warning: "!border-s-[var(--gold-500)]",
          info: "!border-s-[var(--green-700)]",
          loading: "!border-s-[var(--line)]",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
