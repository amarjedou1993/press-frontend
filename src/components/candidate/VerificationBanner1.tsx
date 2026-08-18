"use client";


import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { MailWarning, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getVerificationStatus, resendVerification, accountKeys } from "@/lib/api/account";
import { ApiError } from "@/lib/api/client";

export function VerificationBanner() {
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
      toast.success("E-mail envoyé", {
        description: `Un nouveau lien a été envoyé à ${data?.email}.`,
      });
    },
    onError: (e) =>
      toast.error("Envoi impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
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
      {/* gold edge */}
      <span className="absolute inset-y-0 left-0 w-1.5 bg-[var(--gold-500)]" aria-hidden="true" />
      {/* seal watermark */}
      <svg
        className="pointer-events-none absolute -right-6 -top-8 h-32 w-32 opacity-[0.07]"
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

      <div className="relative flex flex-wrap items-start gap-4 p-5 pl-7">
        <span
          className="flex h-11 w-11 flex-none items-center justify-center rounded-xl shadow-sm"
          style={{ background: "var(--gold-500)" }}
        >
          <MailWarning className="h-5 w-5 text-[var(--green-900)]" />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--gold-700)]/70">
            Action requise
          </p>
          <p className="mt-1 text-[15px] font-extrabold text-[var(--green-900)]">
            Vérifiez votre adresse e-mail
          </p>
          <p className="mt-1.5 max-w-2xl text-[13.5px] leading-relaxed text-[var(--gold-700)]">
            Un lien a été envoyé à{" "}
            <b className="font-bold text-[var(--green-900)]">{data.email}</b>.
            Vous pouvez préparer votre dossier dès maintenant — la{" "}
            <b className="font-bold">soumission</b> nécessite une adresse vérifiée.
          </p>

          {justSent && (
            <p className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-white/70 px-2.5 py-1 text-[12.5px] font-semibold text-[var(--green-700)]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Lien renvoyé — pensez aux courriers indésirables.
            </p>
          )}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => resend.mutate()}
          disabled={resend.isPending}
          className="flex-none border-[var(--gold-700)]/25 bg-white text-[var(--gold-700)] shadow-sm hover:bg-white hover:text-[var(--green-900)]"
        >
          <Send className="h-3.5 w-3.5" />
          {resend.isPending ? "Envoi…" : "Renvoyer"}
        </Button>
      </div>
    </div>
  );
}
