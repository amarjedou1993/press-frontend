import { ShieldCheck, ShieldAlert, ShieldX, Clock, HelpCircle } from "lucide-react";

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

const TONE = {
  VALID:     { bg: "#0d7a44", accent: "#00A95C", Icon: ShieldCheck },
  EXPIRED:   { bg: "#5b6b63", accent: "#8fa89b", Icon: Clock },
  SUSPENDED: { bg: "#8a6d0b", accent: "#FFD700", Icon: ShieldAlert },
  REVOKED:   { bg: "#7a1418", accent: "#D01C1F", Icon: ShieldX },
  UNKNOWN:   { bg: "#3a4750", accent: "#8fa89b", Icon: HelpCircle },
} as const;

function fmt(iso?: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "numeric", month: "long", year: "numeric",
  });
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
  const tone = TONE[status as keyof typeof TONE] ?? TONE.UNKNOWN;

  return (
    <main className="min-h-screen bg-[#f4f6f5] pb-12">
      {/* ══ the verdict, first and unmissable ══
          Someone at a door reads this from arm's length. It is the whole
          purpose of the page, so it takes the whole first screen. */}
      <section className="relative overflow-hidden" style={{ background: tone.bg }}>
        <div className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true" />

        <div className="relative mx-auto max-w-lg px-6 pb-8 pt-10 text-center text-white">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-white/55">
            Ministère de la Culture, des Arts, de la Communication et des Relations avec le Parlement
          </p>

          <span className="mt-6 inline-flex h-20 w-20 items-center justify-center rounded-full"
            style={{ background: "rgba(255,255,255,.14)",
                     boxShadow: `inset 0 0 0 2px ${tone.accent}` }}>
            <tone.Icon className="h-10 w-10" style={{ color: tone.accent }} />
          </span>

          {known ? (
            <>
              <h1 className="mt-5 text-[30px] font-extrabold leading-tight">
                Carte {result!.statusLabelFr?.toLowerCase()}
              </h1>
              <p dir="rtl" lang="ar" className="mt-1 text-[22px] font-bold text-white/85">
                بطاقة {result!.statusLabelAr}
              </p>

              {result!.statusNoteFr && (
                <p className="mx-auto mt-4 max-w-sm rounded-xl bg-black/25 px-4 py-3 text-[14px] leading-relaxed">
                  {result!.statusNoteFr}
                </p>
              )}
            </>
          ) : (
            <>
              <h1 className="mt-5 text-[26px] font-extrabold leading-tight">
                Carte inconnue
              </h1>
              <p dir="rtl" lang="ar" className="mt-1 text-[20px] font-bold text-white/85">
                بطاقة غير معروفة
              </p>
              <p className="mx-auto mt-4 max-w-sm text-[14px] leading-relaxed text-white/75">
                Aucune carte ne correspond à ce code. Vérifiez que le code a été
                scanné entièrement, ou signalez la carte à le MCACPR.
              </p>
            </>
          )}
        </div>

        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[#00A95C]" />
          <i className="flex-1 bg-[#FFD700]" />
          <i className="flex-1 bg-[#D01C1F]" />
        </div>
      </section>

      {/* ══ the holder ══ */}
      {known && (
        <section className="mx-auto -mt-6 max-w-lg px-4">
          <div className="overflow-hidden rounded-2xl bg-white shadow-[0_18px_44px_-28px_rgba(11,46,31,.5)]">

            {/* The photograph is what lets a verifier confirm the person in
                front of them. Without it this page proves only that a card
                exists — which is not verification.
                Withheld for SUSPENDED and REVOKED: there is nobody left to
                confirm, and a cancelled card should not keep serving a face. */}
            <div className="flex items-start gap-5 p-6">
              <div className="relative h-[112px] w-[84px] flex-none overflow-hidden rounded-xl border-2"
                style={{ borderColor: tone.accent, background: "#eef1ef" }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`${process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"}/api/public/verify/${encodeURIComponent(token)}/photo`}
                  alt=""
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#5b6b63]">
                  Titulaire
                </p>
                <p className="mt-1 text-[19px] font-extrabold leading-tight text-[#0b2e1f]">
                  {result!.holderFullName ?? "—"}
                </p>
                {result!.categoryLabelFr && (
                  <p className="mt-1.5 inline-block rounded-full bg-[#e8f5ee] px-3 py-1 text-[12.5px] font-bold text-[#0d7a44]">
                    {result!.categoryLabelFr}
                  </p>
                )}
              </div>
            </div>

            <dl className="divide-y divide-[#e6eae8] border-t border-[#e6eae8]">
              <Row label="N° de carte" labelAr="رقم البطاقة"
                value={result!.cardNumber} mono />
              <Row label="Délivrée le" labelAr="تاريخ الإصدار"
                value={fmt(result!.issuedAt)} />
              <Row label="Expire le" labelAr="تاريخ الإنتهاء"
                value={fmt(result!.expiresAt)} />
            </dl>

            {/* The signature check is EVIDENCE, not the security of the lookup
                — that is the opaque token. It answers a different question:
                did MCACPR issue this exact card, provably. */}
            <div className="flex items-center gap-2.5 border-t border-[#e6eae8] px-6 py-3.5"
              style={{ background: result!.signatureValid ? "#f2fbf6" : "#fdf3f3" }}>
              {result!.signatureValid ? (
                <>
                  <ShieldCheck className="h-4 w-4 flex-none text-[#0d7a44]" />
                  <p className="text-[12.5px] font-semibold text-[#0d7a44]">
                    Signature électronique vérifiée — carte émise par le MCACPR
                  </p>
                </>
              ) : (
                <>
                  <ShieldAlert className="h-4 w-4 flex-none text-[#a3151a]" />
                  <p className="text-[12.5px] font-semibold text-[#a3151a]">
                    Signature électronique non vérifiée — signalez cette carte à la MCACPR
                  </p>
                </>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ══ what this page is ══ */}
      <p className="mx-auto mt-6 max-w-lg px-6 text-center text-[12px] leading-relaxed text-[#5b6b63]">
        Cette page confirme la validité d&apos;une carte de presse auprès du
        MCACRP Autorité. Elle n&apos;est accessible qu&apos;en scannant le code
        figurant au dos de la carte.
        <span dir="rtl" lang="ar" className="mt-1.5 block">
          تؤكد هذه الصفحة صلاحية البطاقة الصحفية لدى وزارة الثقافة والفنون والاتصالات والعلاقات مع البرلمان.
        </span>
      </p>
    </main>
  );
}

function Row({ label, labelAr, value, mono = false }: {
  label: string; labelAr: string; value?: string | null; mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 px-6 py-3">
      <dt className="flex-none">
        <span className="block text-[12px] font-semibold text-[#5b6b63]">{label}</span>
        <span dir="rtl" lang="ar" className="block text-[11px] text-[#8fa89b]">
          {labelAr}
        </span>
      </dt>
      <dd className={`text-right text-[14px] font-bold text-[#0b2e1f] ${mono ? "font-mono" : ""}`}>
        {value ?? "—"}
      </dd>
    </div>
  );
}
