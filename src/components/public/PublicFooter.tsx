// src/components/public/PublicFooter.tsx — server component.

import Link from "next/link";
import { routes } from "@/lib/routes";

export function PublicFooter() {
  return (
    <footer className="mt-20 border-t-4 border-[var(--gold-500)]" style={{ background: "var(--green-900)" }}>
      <div className="mx-auto max-w-5xl px-5 py-10 text-white/70">
        <div className="flex flex-wrap items-start justify-between gap-8">
          <div className="max-w-sm">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
                <i className="h-3.5 w-1 rounded-full bg-[var(--green-500)]" />
                <i className="h-3.5 w-1 rounded-full bg-[var(--gold-500)]" />
                <i className="h-3.5 w-1 rounded-full bg-[var(--red-500)]" />
              </span>
              <span className="text-[12px] font-extrabold tracking-[0.12em] text-white">
                HAPA
              </span>
            </div>
            <p className="mt-3 text-[12.5px] leading-relaxed">
              Haute Autorité de la Presse et de l&apos;Audiovisuel — République
              Islamique de Mauritanie.
            </p>
            <p dir="rtl" className="mt-2 text-[12.5px] leading-relaxed text-white/55">
              السلطة العليا للصحافة والسمعيات البصرية
            </p>
          </div>

          <nav className="flex flex-col gap-2 text-[13px]">
            <span className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--gold-500)]">
              Accréditation
            </span>
            <Link href={routes.publicSessions} className="hover:text-white">
              Sessions ouvertes
            </Link>
            <Link href={routes.auth.register} className="hover:text-white">
              Créer un compte
            </Link>
            <Link href={routes.auth.login} className="hover:text-white">
              Se connecter
            </Link>
          </nav>
        </div>

        <p className="mt-10 border-t border-white/10 pt-5 text-[11.5px] text-white/40">
          © {new Date().getFullYear()} HAPA — Toute demande d&apos;accréditation
          est traitée conformément à la réglementation en vigueur.
        </p>
      </div>
    </footer>
  );
}
