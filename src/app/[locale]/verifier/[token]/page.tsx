import { getLocale, getTranslations } from "next-intl/server";
import {
  ShieldCheck, ShieldAlert, ShieldX, Clock, HelpCircle, ScanLine,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
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
  categoryLabelAr?: string | null;
  issuedAt?: string | null;
  expiresAt?: string | null;
  signatureValid: boolean;
  statusNoteFr?: string | null;
  statusNoteAr?: string | null;
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
 *
 * Only the VISUAL properties live here now; the words come from the
 * catalogues, so a verdict reads in the language of whoever scanned it.
 */
const VERDICT = {
  VALID: {
    Icon: ShieldCheck,
    accent: "#00a95c",
    seal: "#ffd700",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,215,0,.15), transparent 62%), radial-gradient(700px 400px at 85% 115%, rgba(0,169,92,.26), transparent 60%), linear-gradient(168deg, #08251a 0%, #0b2e1f 48%, #0d3a27 100%)",
  },
  EXPIRED: {
    Icon: Clock,
    accent: "#8a948d",
    seal: "#b9c4bd",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,255,255,.06), transparent 62%), linear-gradient(168deg, #2b3833 0%, #222d29 55%, #1b2420 100%)",
  },
  SUSPENDED: {
    Icon: ShieldAlert,
    accent: "#ffd700",
    seal: "#ffd700",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,215,0,.22), transparent 60%), linear-gradient(168deg, #3d2f05 0%, #2c2206 55%, #1f1804 100%)",
  },
  REVOKED: {
    Icon: ShieldX,
    accent: "#d01c1f",
    seal: "#ff8a8c",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(208,28,31,.30), transparent 60%), linear-gradient(168deg, #3d0c0e 0%, #2b0809 55%, #1d0506 100%)",
  },
  UNKNOWN: {
    Icon: HelpCircle,
    accent: "#8a948d",
    seal: "#b9c4bd",
    field: "radial-gradient(900px 420px at 50% -20%, rgba(255,255,255,.05), transparent 62%), linear-gradient(168deg, #232e35 0%, #1b242a 55%, #151c21 100%)",
  },
} as const;

export default async function VerificationPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const locale = await getLocale();
  const t = await getTranslations("verify");
  const arabic = locale === "ar";

  const result = await verify(token);

  const known = result?.found === true;
  const status = (known ? result!.status : "UNKNOWN") ?? "UNKNOWN";
  const v = VERDICT[status as keyof typeof VERDICT] ?? VERDICT.UNKNOWN;
  const key = status.toLowerCase();

  /**
   * The verdict, in both languages — and this is one of the few places where
   * the pairing earns its keep. Whoever reads this is holding a BILINGUAL
   * CARD and comparing it to a screen: the two objects should say the same
   * thing in the same two languages.
   *
   * The reader's own leads; the other follows, quieter.
   */
  const backendLabel = arabic ? result?.statusLabelAr : result?.statusLabelFr;
  const backendLabelOther = arabic ? result?.statusLabelFr : result?.statusLabelAr;
  const verdict = (known && backendLabel) || t(`${key}.title`);
  const verdictOther = (known && backendLabelOther) || t(`${key}.titleOther`);

  const backendNote = arabic ? result?.statusNoteAr : result?.statusNoteFr;
  const note = (known && backendNote) || t(`${key}.lede`);

  const category = arabic
    ? (result?.categoryLabelAr ?? result?.categoryLabelFr)
    : result?.categoryLabelFr;

  /**
   * "ar" rather than "ar-MR": Mauritanian Arabic uses Western digits, and the
   * country tag introduces eastern ones on some platforms. ⚠️ On THIS page it
   * matters most — the dates are being read against the printed card.
   */
  const fmt = (iso?: string | null) => {
    if (!iso) return "—";
    return new Date(iso.length === 10 ? iso + "T00:00:00" : iso)
      .toLocaleDateString(arabic ? "ar" : "fr-FR", {
        day: "numeric", month: "long", year: "numeric",
      });
  };

  // The photograph is what lets a verifier confirm the PERSON, not merely the
  // card. Withheld for suspended and revoked cards: there is nobody left to
  // confirm, and a cancelled credential should not keep serving a face.
  const showPhoto = known && (status === "VALID" || status === "EXPIRED");

  return (
    <main className="min-h-screen bg-[var(--paper)] pb-16">

      {/* ══════════════════════════════════════════════════════════
          A WAY OUT — deliberately minimal.

          Someone scanning a card at a checkpoint wants the verdict, not a
          masthead with a session ribbon above it. But a page with no way to
          anything is a dead end, so it carries one discreet line.
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
              {t("ministryShort")}
            </span>
          </Link>
          <Link
            href={routes.publicJournalists}
            className="text-[10.5px] font-semibold text-white/40 underline underline-offset-2 transition-colors hover:text-white/75"
          >
            {t("registryLink")}
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
          className="rtl-mirror pointer-events-none absolute -left-48 -top-52 h-[560px] w-[560px] text-white opacity-[0.06]"
          rings={48}
        />
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -bottom-52 -right-44 h-[420px] w-[420px] opacity-[0.05]"
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
            {t("republic")}
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

          {/* Both languages — the card in their hand carries both. */}
          <h1 className="engraved-dark mt-7 text-[30px] font-extrabold leading-none tracking-tight sm:text-[34px]">
            {verdict}
          </h1>
          <p
            dir={arabic ? "ltr" : "rtl"}
            lang={arabic ? "fr" : "ar"}
            className="mt-2.5 text-[21px] font-semibold text-white/55"
          >
            {verdictOther}
          </p>

          <span className="foil-rule mx-auto mt-6 block h-px w-32 opacity-50" aria-hidden="true" />

          {/* dir="auto": a status note may carry text written by a person. */}
          <p dir="auto" className="mx-auto mt-6 max-w-sm text-[14px] leading-relaxed text-white/60">
            {note}
          </p>

          {!known && (
            <p className="mx-auto mt-3 max-w-sm text-[13px] leading-relaxed text-white/40">
              {t("unknownHelp")}
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
              className="rtl-mirror pointer-events-none absolute -right-24 -top-24 h-64 w-64 text-[var(--green-900)] opacity-[0.035]"
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
                    {t("photoWithheld")}
                  </span>
                </div>
              )}

              <div className="min-w-0 flex-1">
                <p className="text-[9.5px] font-bold uppercase tracking-[0.2em] text-[var(--green-700)]">
                  {t("holder")}
                </p>
                {/* dir="auto": the name may be in either script. */}
                <p dir="auto" className="mt-1.5 text-[21px] font-extrabold leading-tight tracking-tight text-[var(--green-900)]">
                  {result!.holderFullName ?? "—"}
                </p>
                {category && (
                  <span className="mt-2.5 inline-block rounded-full bg-[var(--green-tint)] px-3 py-1 text-[12px] font-bold text-[var(--green-700)]">
                    {category}
                  </span>
                )}
              </div>
            </div>

            {/* The record's labels carry both languages too: the card does. */}
            <dl className="relative divide-y divide-[var(--line)] border-t border-[var(--line)]">
              <Row
                label={t("cardNumber")} labelOther={t("cardNumberOther")}
                otherLang={arabic ? "fr" : "ar"}
                value={result!.cardNumber} mono
              />
              <Row
                label={t("issuedOn")} labelOther={t("issuedOnOther")}
                otherLang={arabic ? "fr" : "ar"}
                value={fmt(result!.issuedAt)}
              />
              <Row
                label={t("expiresOn")} labelOther={t("expiresOnOther")}
                otherLang={arabic ? "fr" : "ar"}
                value={fmt(result!.expiresAt)}
              />
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
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-extrabold text-[var(--green-700)]">
                      {t("signatureValid")}
                    </p>
                    <p className="text-[11.5px] text-[var(--green-700)]/75">
                      {t("signatureValidBody")}
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 flex-none text-[var(--red-700)]" />
                  <div className="min-w-0">
                    <p className="text-[12.5px] font-extrabold text-[var(--red-700)]">
                      {t("signatureInvalid")}
                    </p>
                    <p className="text-[11.5px] text-[var(--red-700)]/80">
                      {t("signatureInvalidBody")}
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
          <div className="min-w-0">
            <p className="text-[12.5px] leading-relaxed text-[var(--slate)]">
              {t("about")}
            </p>
            {/* The other language, because this page is read by whoever
                happens to hold the card. */}
            <p
              dir={arabic ? "ltr" : "rtl"}
              lang={arabic ? "fr" : "ar"}
              className="mt-2.5 text-[12.5px] leading-[1.9] text-[var(--slate)]"
            >
              {t("aboutOther")}
            </p>
            <p className="mt-3 text-[12px] text-[var(--muted-fg)]">
              {t("consult")}{" "}
              <Link
                href={routes.publicJournalists}
                className="font-semibold text-[var(--green-700)] underline underline-offset-2"
              >
                {t("registryLinkLong")}
              </Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}

/* ══ one line of the record ══ */

function Row({
  label, labelOther, otherLang, value, mono = false,
}: {
  label: string;
  labelOther: string;
  otherLang: "fr" | "ar";
  value?: string | null;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3">
      <dt className="flex-none">
        <span className="block text-[11.5px] font-semibold text-[var(--slate)]">
          {label}
        </span>
        <span
          dir={otherLang === "ar" ? "rtl" : "ltr"}
          lang={otherLang}
          className="block text-[10.5px] text-[var(--muted-fg)]"
        >
          {labelOther}
        </span>
      </dt>
      {/* A card number reads left-to-right in both languages, as printed. */}
      <dd
        dir={mono ? "ltr" : undefined}
        className={`text-end text-[14px] font-bold text-[var(--green-900)] ${
          mono ? "font-mono tracking-tight" : ""
        }`}
      >
        {value ?? "—"}
      </dd>
    </div>
  );
}
