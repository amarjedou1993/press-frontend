// src/app/verifier/[token]/page.tsx
// What a scanned QR resolves to.
//
// ───────────────────────────────────────────────────────────────────────
// THE MOST-SEEN PAGE IN THE SYSTEM, and the one where looking official IS
// the function.
//
// Everyone else who reaches this project came looking for it. Whoever reaches
// THIS page was handed a piece of plastic by a stranger and is deciding
// whether to believe it — at a checkpoint, a ministry door, a press
// conference. They have no account, no context, and about four seconds.
//
// So the page is built as a SEALED VERDICT: the state seal struck over the
// answer, guilloche engraving behind it, microprint closing the record. The
// same security vocabulary as the card in their hand, deliberately — a
// verification that looked like a generic status page would be less
// convincing than the plastic it is verifying.
//
// A SERVER COMPONENT. On a poor connection the verdict is in the first paint:
// no bundle, no spinner, no client fetch.
// ───────────────────────────────────────────────────────────────────────

import Link from "next/link";
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, HelpCircle, ScanLine,
} from "lucide-react";
import {
  Guilloche, GuillocheBand, OfficialSeal, MicroprintRule, TricolorRule,
} from "@/components/public/patterns";
import { routes } from "@/lib/routes";

export const dynamic = "force-dynamic";   // a status must never be cached

interface VerificationResult {
  found: boolean;
  status?: "VALID" | "SUSPENDED" | "REVOKED" | "EXPIRED" | null;
  statusLabelFr?: string | null;
  statusLabelAr?: string | null;
  usable: boolean;
  cardNumber?: string | null;
  holderFullName?: string | null;
  categoryLabelFr?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  signatureValid: boolean;
  statusNoteFr?: string | null;
}

/** Server-side base URL — the container name in production, not localhost. */
const API = process.env.INTERNAL_API_URL
  ?? process.env.NEXT_PUBLIC_API_URL
  ?? "http://localhost:8080";

async function verify(token: string): Promise<VerificationResult | null> {
  try {
    const res = await fetch(`${API}/api/public/verify/${encodeURIComponent(token)}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

/**
 * Each verdict gets its own atmosphere, not merely its own accent colour.
 *
 * Someone reads this from arm's length in bad light. The whole screen must
 * answer before any word is read — deep green for a card in force, ash for
 * one that has simply lapsed, amber for a suspension, and a dark red that
 * looks like nothing else in the system for a withdrawal.
 */
const VERDICT = {
  VALID: {
    Icon: ShieldCheck,
    accent: "#00a95c",
    seal: "#ffd700",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,215,0,.15), transparent 62%), radial-gradient(700px 400px at 85% 115%, rgba(0,169,92,.26), transparent 60%), linear-gradient(168deg, #08251a 0%, #0b2e1f 48%, #0d3a27 100%)",
    fr: "Carte valide",
    ar: "بطاقة سارية",
    lede: "Cette carte de presse est en cours de validité.",
  },
  EXPIRED: {
    Icon: Clock,
    accent: "#8a948d",
    seal: "#b9c4bd",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,255,255,.06), transparent 62%), linear-gradient(168deg, #2b3833 0%, #222d29 55%, #1b2420 100%)",
    fr: "Carte expirée",
    ar: "بطاقة منتهية",
    lede: "Cette carte a atteint son échéance et n'est plus en cours de validité.",
  },
  SUSPENDED: {
    Icon: ShieldAlert,
    accent: "#ffd700",
    seal: "#ffd700",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,215,0,.22), transparent 60%), linear-gradient(168deg, #3d2f05 0%, #2c2206 55%, #1f1804 100%)",
    fr: "Carte suspendue",
    ar: "بطاقة موقوفة",
    lede: "Cette carte est temporairement suspendue et ne peut pas être utilisée.",
  },
  REVOKED: {
    Icon: ShieldX,
    accent: "#d01c1f",
    seal: "#ff8a8c",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(208,28,31,.30), transparent 60%), linear-gradient(168deg, #3d0c0e 0%, #2b0809 55%, #1d0506 100%)",
    fr: "Carte retirée",
    ar: "بطاقة مسحوبة",
    lede: "Cette carte a été retirée par l'autorité et n'est plus valable.",
  },
  UNKNOWN: {
    Icon: HelpCircle,
    accent: "#8a948d",
    seal: "#b9c4bd",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,255,255,.05), transparent 62%), linear-gradient(168deg, #232e35 0%, #1b242a 55%, #151c21 100%)",
    fr: "Carte inconnue",
    ar: "بطاقة غير معروفة",
    lede: "Aucune carte ne correspond à ce code.",
  },
} as const;

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso.length === 10 ? iso + "T00:00:00" : iso)
    .toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
}

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await verify(token);

  const known = result?.found === true;
  const status = (known ? result!.status : "UNKNOWN") ?? "UNKNOWN";
  const v = VERDICT[status as keyof typeof VERDICT] ?? VERDICT.UNKNOWN;

  // The photograph is what lets a verifier confirm the PERSON, not merely the
  // card. Withheld for suspended and revoked cards: there is nobody left to
  // confirm, and a cancelled credential should not keep serving a face.
  const showPhoto = known && (status === "VALID" || status === "EXPIRED");

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-16">

      {/* ══════════════════════════════════════════════════════════
          A WAY OUT — deliberately minimal.

          This page sits OUTSIDE the (public) layout, and should: someone
          scanning a card at a checkpoint wants the verdict, not a masthead
          with a session ribbon and a "Déposer une demande" button above it.
          But a page with no way to anything is a dead end, so it carries one
          discreet line: the seal, the ministry, and a link home.
          ══════════════════════════════════════════════════════════ */}
      <div className="bg-[#071f16]">
        <div className="mx-auto flex max-w-lg items-center justify-between gap-4 px-5 py-2.5">
          <Link
            href={routes.home}
            className="group inline-flex items-center gap-2.5 text-white/50 transition-colors hover:text-white"
          >
            <OfficialSeal
              className="h-6 w-6 flex-none opacity-70 transition-opacity group-hover:opacity-100"
              color="var(--gold-500)"
              id="verify-bar-seal"
            />
            <span className="text-[10px] font-bold uppercase tracking-[0.18em]">
              MCACRP
            </span>
          </Link>
          <Link
            href={routes.publicJournalists}
            className="text-[10.5px] font-semibold text-white/40 underline underline-offset-2 transition-colors hover:text-white/75"
          >
            Registre des journalistes
          </Link>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════
          THE VERDICT — struck like a seal on a document.
          ══════════════════════════════════════════════════════════ */}
      <section
        className="relative overflow-hidden text-white"
        style={{ background: v.field }}
      >
        {/* engraving, at two scales — the same rosettes as the card's own
            security print */}
        <Guilloche
          className="pointer-events-none absolute -left-48 -top-52 h-[560px] w-[560px] text-white opacity-[0.06]"
          rings={48}
        />
        <Guilloche
          className="pointer-events-none absolute -right-44 -bottom-52 h-[420px] w-[420px] opacity-[0.05]"
          rings={32}
          stroke={v.accent}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(112deg,#fff 0 1px,transparent 1px 13px)" }}
          aria-hidden="true"
        />

        <div className="relative z-10 mx-auto max-w-lg px-6 pb-12 pt-11 text-center">
          <p className="text-[9.5px] font-bold uppercase tracking-[0.24em] text-white/45">
            République Islamique de Mauritanie
          </p>

          {/* ── the struck seal ──
              The verdict icon sits INSIDE the state seal rather than beside
              it: the Authority's mark and the answer are one object, which is
              what a stamp on a document is. */}
          <div className="relative mx-auto mt-8 flex h-[132px] w-[132px] items-center justify-center">
            <span
              className="absolute inset-0 rounded-full"
              style={{ background: `radial-gradient(circle, ${v.accent}33, transparent 68%)` }}
              aria-hidden="true"
            />
            <OfficialSeal
              className="seal-turn absolute inset-0 h-full w-full"
              color={v.seal}
              id="verify-seal"
            />
            <span
              className="relative flex h-[52px] w-[52px] items-center justify-center rounded-full"
              style={{
                background: "rgba(0,0,0,.35)",
                boxShadow: `inset 0 0 0 1.5px ${v.accent}`,
              }}
            >
              <v.Icon className="h-6 w-6" style={{ color: v.accent }} />
            </span>
          </div>

          <h1 className="engraved-dark mt-7 text-[30px] font-extrabold leading-none tracking-tight sm:text-[34px]">
            {known ? result!.statusLabelFr ?? v.fr : v.fr}
          </h1>
          <p dir="rtl" lang="ar" className="mt-2.5 text-[21px] font-semibold text-white/55">
            {known ? result!.statusLabelAr ?? v.ar : v.ar}
          </p>

          <span className="foil-rule mx-auto mt-6 block h-px w-32 opacity-50" aria-hidden="true" />

          <p className="mx-auto mt-6 max-w-sm text-[14px] leading-relaxed text-white/60">
            {known ? (result!.statusNoteFr ?? v.lede) : v.lede}
          </p>

          {!known && (
            <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-white/40">
              Vérifiez que le code a été scanné entièrement. En cas de doute
              sur l&apos;authenticité d&apos;une carte, signalez-la au
              Ministère.
            </p>
          )}
        </div>

        <GuillocheBand
          className="pointer-events-none absolute inset-x-0 bottom-2 h-14 text-white opacity-[0.07]"
          lines={8}
        />
        <MicroprintRule
          className="relative z-10 pb-1.5 text-center text-white opacity-[0.15]"
          repeat={16}
        />
      </section>
      <TricolorRule />

      {/* ══════════════════════════════════════════════════════════
          THE HOLDER — the record itself
          ══════════════════════════════════════════════════════════ */}
      {known && (
        <section className="mx-auto -mt-7 max-w-lg px-5">
          <div className="relative overflow-hidden rounded-[20px] bg-white shadow-[0_24px_60px_-34px_rgba(11,46,31,.75)]">
            <Guilloche
              className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 text-[var(--green-900)] opacity-[0.035]"
              rings={26}
            />

            {/* the accent edge, matching the verdict */}
            <span
              className="absolute inset-x-0 top-0 h-[3px]"
              style={{ background: `linear-gradient(90deg, ${v.accent}, var(--gold-500))` }}
              aria-hidden="true"
            />

            <div className="relative flex items-start gap-5 p-6 pt-7">
              {showPhoto ? (
                <div
                  className="relative h-[118px] w-[88px] flex-none overflow-hidden rounded-xl bg-[#eef1ef]"
                  style={{ boxShadow: `0 0 0 2px ${v.accent}, 0 8px 20px -12px rgba(11,46,31,.6)` }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/public/verify/${encodeURIComponent(token)}/photo`}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                /* Explained rather than merely absent — a blank space would
                   read as a broken image, and this is deliberate. */
                <div className="flex h-[118px] w-[88px] flex-none flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[var(--line)] bg-[#fbfcfb] px-2 text-center">
                  <ShieldAlert className="h-5 w-5 text-[var(--muted-fg)]" />
                  <span className="text-[9px] font-semibold leading-tight text-[var(--muted-fg)]">
                    Photographie retenue
                  </span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
                  Titulaire
                </p>
                <p className="mt-1.5 text-[21px] font-extrabold leading-tight tracking-tight text-[var(--green-900)]">
                  {result!.holderFullName ?? "—"}
                </p>
                {result!.categoryLabelFr && (
                  <span className="mt-2.5 inline-block rounded-full bg-[var(--green-tint)] px-3 py-1 text-[12px] font-bold text-[var(--green-700)]">
                    {result!.categoryLabelFr}
                  </span>
                )}
              </div>
            </div>

            <dl className="relative divide-y divide-[var(--line)] border-t border-[var(--line)]">
              <Row label="N° de carte" labelAr="رقم البطاقة"
                value={result!.cardNumber} mono />
              <Row label="Délivrée le" labelAr="تاريخ الإصدار"
                value={fmt(result!.issuedAt)} />
              <Row label="Expire le" labelAr="تاريخ الإنتهاء"
                value={fmt(result!.expiresAt)} />
            </dl>

            {/* ── the signature ──
                A DIFFERENT question from the status. The status says "is this
                card in force"; this says "did the Ministry issue THIS EXACT
                card", provably, against a published key. Someone seeing it
                fail on an otherwise valid-looking card has found something
                worth reporting. */}
            <div
              className="relative flex items-center gap-3 border-t border-[var(--line)] px-6 py-4"
              style={{ background: result!.signatureValid ? "#f2fbf6" : "var(--red-tint)" }}
            >
              {result!.signatureValid ? (
                <>
                  <ShieldCheck className="h-4 w-4 flex-none text-[var(--green-700)]" />
                  <div>
                    <p className="text-[12.5px] font-extrabold text-[var(--green-700)]">
                      Signature électronique vérifiée
                    </p>
                    <p className="text-[11.5px] text-[var(--green-700)]/75">
                      Cette carte a bien été émise par le Ministère.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 flex-none text-[var(--red-700)]" />
                  <div>
                    <p className="text-[12.5px] font-extrabold text-[var(--red-700)]">
                      Signature électronique non vérifiée
                    </p>
                    <p className="text-[11.5px] text-[var(--red-700)]/80">
                      Signalez cette carte au Ministère.
                    </p>
                  </div>
                </>
              )}
            </div>

            <MicroprintRule
              className="relative pb-1.5 text-center text-[var(--green-700)] opacity-[0.1]"
              repeat={14}
            />
          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════
          WHAT THIS PAGE IS
          ══════════════════════════════════════════════════════════ */}
      <section className="mx-auto mt-8 max-w-lg px-5">
        <div className="flex items-start gap-3 rounded-2xl border border-[var(--line)] bg-white px-5 py-4">
          <ScanLine className="mt-0.5 h-4 w-4 flex-none text-[var(--green-600)]" />
          <div>
            <p className="text-[12.5px] leading-relaxed text-[var(--slate)]">
              Cette page confirme, auprès du Ministère, l&apos;état d&apos;une
              carte de presse. Elle n&apos;est accessible qu&apos;en scannant le
              code figurant sur la carte.
            </p>
            <p dir="rtl" lang="ar" className="mt-2.5 text-[12.5px] leading-[1.9] text-[var(--slate)]">
              تؤكد هذه الصفحة حالة البطاقة الصحفية لدى الوزارة.
            </p>
            <p className="mt-3 text-[12px] text-[var(--muted-fg)]">
              Consulter le{" "}
              <Link
                href={routes.publicJournalists}
                className="font-semibold text-[var(--green-700)] underline underline-offset-2"
              >
                registre des journalistes accrédités
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ══ one line of the record ══ */

function Row({ label, labelAr, value, mono = false }: {
  label: string; labelAr: string; value?: string | null; mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3">
      <dt className="flex-none">
        <span className="block text-[11.5px] font-semibold text-[var(--slate)]">
          {label}
        </span>
        <span dir="rtl" lang="ar" className="block text-[10.5px] text-[var(--muted-fg)]">
          {labelAr}
        </span>
      </dt>
      <dd
        className={`text-right text-[14px] font-bold text-[var(--green-900)] ${
          mono ? "font-mono tracking-tight" : ""
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
