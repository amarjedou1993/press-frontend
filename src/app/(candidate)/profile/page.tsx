"use client";
// src/app/(candidate)/profile/page.tsx
// Identity and contact details, presented as what they are: the record that
// will appear on an official credential.
//
// The page is built around that idea — a live press-card preview showing the
// candidate their own data in the shape it will take, an institutional hero
// carrying the completion state, and two clearly separated records
// (coordonnées vs identité) because they answer different questions and
// carry different weight.
//
// This lives on the PERSON, not on each application: a journalist applying
// again next year re-types nothing.

import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Check, ShieldCheck, IdCard, Mail, Phone, User as UserIcon, CalendarDays, MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { PhotoUpload, photoKeys } from "@/components/candidate/PhotoUpload";
import { useAuthenticatedFile } from "@/lib/api/files";
import { getMe, updateAccount, updateProfile, accountKeys } from "@/lib/api/account";
import {
  profileSchema, accountSchema, type ProfileValues, type AccountValues,
} from "@/lib/schemas-candidate";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth";

/* ── the card preview: their data, in its eventual shape ── */
function CardPreview({
  fullName, nni, passportNo, birthdate, birthplace, photoUrl,
}: {
  fullName?: string;
  nni?: string | null;
  passportNo?: string | null;
  birthdate?: string | null;
  birthplace?: string | null;
  /** The real photograph — this is the credential taking shape. */
  photoUrl?: string | null;
}) {
  const identity = nni?.trim() || passportNo?.trim();
  const dash = "—————————";

  return (
    <div
      className="relative aspect-[1.586] w-full overflow-hidden rounded-2xl bg-white p-5"
      style={{ boxShadow: "0 24px 50px -28px rgba(11,46,31,.55), inset 0 0 0 1px rgba(11,46,31,.07)" }}
      role="img"
      aria-label="Aperçu de votre carte de presse"
    >
      {/* guilloche */}
      <svg className="pointer-events-none absolute -right-12 -top-16 h-56 w-56 opacity-[0.07]"
        viewBox="0 0 400 400" fill="none" aria-hidden="true">
        <g stroke="var(--green-700)" strokeWidth="0.7">
          {Array.from({ length: 26 }).map((_, i) => (
            <ellipse key={i} cx="200" cy="200" rx="180" ry="60"
              transform={`rotate(${(i * 180) / 26} 200 200)`} />
          ))}
        </g>
      </svg>

      <div className="relative flex h-full flex-col">
        <div className="flex items-start justify-between gap-3 border-b-2 border-[var(--green-500)] pb-2">
          <div>
            <p className="text-[11px] font-extrabold tracking-[0.1em] text-[var(--green-700)]">RIM</p>
            <p className="mt-0.5 max-w-[140px] text-[5.5px] font-bold uppercase leading-[1.5] tracking-[0.1em] text-[var(--muted-fg)]">
              République Islamique de Mauritanie
            </p>
          </div>
          <p dir="rtl" className="text-right text-[9px] font-semibold leading-snug text-[var(--green-700)]">
            بطاقة صحفية
          </p>
        </div>
        <div className="h-px w-full bg-[var(--gold-500)]/70" aria-hidden="true" />

        <div className="mt-3 flex flex-1 gap-3.5">
          <div className="h-[74px] w-[58px] flex-none overflow-hidden rounded-lg border border-[var(--green-500)]/30 bg-[var(--green-tint)]">
            {photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={photoUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <UserIcon className="h-6 w-6 text-[var(--green-600)] opacity-50" />
              </div>
            )}
          </div>

          <dl className="min-w-0 flex-1 space-y-[5px]">
            {[
              ["Nom", fullName || dash],
              ["Identité", identity || dash],
              ["Naissance", birthdate
                ? new Date(birthdate).toLocaleDateString("fr-FR")
                : dash],
              ["Lieu", birthplace || dash],
            ].map(([label, value]) => (
              <div key={label} className="flex items-baseline gap-2 border-b border-dotted border-[var(--line)] pb-[2px]">
                <dt className="w-[54px] flex-none text-[6px] font-bold uppercase tracking-[0.13em] text-[var(--green-700)]/70">
                  {label}
                </dt>
                <dd className={`truncate font-mono text-[8.5px] ${value === dash ? "text-[var(--muted-fg)]" : "text-[var(--ink)]/85"}`}>
                  {value}
                </dd>
              </div>
            ))}
          </dl>
        </div>

        <p className="mt-1.5 overflow-hidden whitespace-nowrap font-mono text-[6.5px] tracking-[0.22em] text-[var(--muted-fg)]">
          CARTE&lt;RIM&lt;PRESSE&lt;&lt;SPECIMEN
        </p>
      </div>

      <div className="absolute inset-x-0 bottom-0 flex h-1.5" aria-hidden="true">
        <i className="flex-1 bg-[var(--green-500)]" />
        <i className="flex-1 bg-[var(--gold-500)]" />
        <i className="flex-1 bg-[var(--red-500)]" />
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const qc = useQueryClient();
  const token = useAuthStore((st) => st.token);
  const me = useQuery({ queryKey: accountKeys.me, queryFn: getMe });

  const accountForm = useForm<AccountValues>({
    resolver: zodResolver(accountSchema as any) as Resolver<AccountValues>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { fullName: "", phone: "" },
  });

  const profileForm = useForm<ProfileValues>({
    resolver: zodResolver(profileSchema as any) as Resolver<ProfileValues>,
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: { nni: "", passportNo: "", birthdate: "", birthplace: "" },
  });

  useEffect(() => {
    if (!me.data) return;
    accountForm.reset({
      fullName: me.data.fullName ?? "",
      phone: me.data.phone ?? "",
    });
    profileForm.reset({
      nni: me.data.profile?.nni ?? "",
      passportNo: me.data.profile?.passportNo ?? "",
      birthdate: me.data.profile?.birthdate ?? "",
      birthplace: me.data.profile?.birthplace ?? "",
    });
  }, [me.data, accountForm, profileForm]);

  // The preview follows what is being typed, not only what is saved.
  const liveAccount = accountForm.watch();
  const liveProfile = profileForm.watch();

  // The photo must be fetched WITH the token — a plain <img src> gets 401.
  const photoStatus = useQuery({
    queryKey: photoKeys.status,
    queryFn: async () => {
      const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080";
      const res = await fetch(`${base}/api/me/photo/status`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        cache: "no-store",
      });
      if (!res.ok) return { hasPhoto: false, uploadedAt: null, ageing: false };
      return res.json() as Promise<{ hasPhoto: boolean; uploadedAt: string | null; ageing: boolean }>;
    },
  });
  const { url: photoUrl } = useAuthenticatedFile(
    photoStatus.data?.hasPhoto ? "/api/me/photo" : null,
    photoStatus.dataUpdatedAt
  );

  const errText = (e: unknown) =>
    e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.";

  const saveAccount = useMutation({
    mutationFn: (v: AccountValues) =>
      updateAccount({ fullName: v.fullName, phone: v.phone.replace(/\s/g, "") }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.me });
      toast.success("Coordonnées enregistrées");
    },
    onError: (e) => toast.error("Enregistrement impossible", { description: errText(e) }),
  });

  const saveProfile = useMutation({
    mutationFn: (v: ProfileValues) =>
      updateProfile({
        nni: v.nni?.replace(/\s/g, "") || undefined,
        passportNo: v.passportNo?.trim() || undefined,
        birthdate: v.birthdate,
        birthplace: v.birthplace.trim(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.me });
      toast.success("Identité enregistrée", {
        description: "Vos informations sont conservées pour vos prochaines demandes.",
      });
    },
    onError: (e) => {
      // A duplicate NNI is a FIELD problem, so it belongs on the field —
      // a generic toast leaves the candidate hunting for what went wrong.
      if (e instanceof ApiError && e.problem.status === 409) {
        profileForm.setError("nni", {
          type: "server",
          message: e.problem.detail ?? "Ce NNI est déjà associé à un autre compte.",
        });
        return;
      }
      toast.error("Enregistrement impossible", { description: errText(e) });
    },
  });

  if (me.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const complete = me.data?.profileComplete ?? false;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-2xl text-white shadow-[0_20px_50px_-30px_rgba(11,46,31,.8)]"
        style={{
          background:
            "radial-gradient(700px 340px at 88% -25%, rgba(255,215,0,.15), transparent 60%), linear-gradient(158deg, var(--green-900) 0%, #0e3d29 60%, #0b3524 100%)",
        }}
      >
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.05]"
          style={{ backgroundImage: "repeating-linear-gradient(115deg,#fff 0 1px,transparent 1px 12px)" }}
          aria-hidden="true"
        />
        <div className="relative z-10 flex flex-wrap items-start justify-between gap-5 p-7">
          <div className="min-w-0">
            <p className="text-[10.5px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
              Mon profil
            </p>
            <h2 className="mt-2.5 text-[26px] font-extrabold leading-tight">
              Votre identité
            </h2>
            <p className="mt-2 max-w-lg text-[14px] leading-relaxed text-white/65">
              Ces informations identifient le titulaire de la carte de presse et
              figureront sur le document délivré. Elles sont conservées pour vos
              demandes futures.
            </p>
          </div>

          <div
            className="flex items-center gap-2.5 rounded-xl px-4 py-3 ring-1"
            style={{
              background: complete ? "rgba(0,169,92,.16)" : "rgba(255,215,0,.14)",
              boxShadow: `inset 0 0 0 1px ${complete ? "rgba(0,169,92,.4)" : "rgba(255,215,0,.4)"}`,
            }}
          >
            {complete ? (
              <>
                <Check className="h-4 w-4 flex-none text-[var(--green-500)]" />
                <span className="text-[12.5px] font-bold text-[var(--green-500)]">
                  Profil complet
                </span>
              </>
            ) : (
              <>
                <IdCard className="h-4 w-4 flex-none text-[var(--gold-500)]" />
                <span className="text-[12.5px] font-bold text-[var(--gold-500)]">
                  À compléter
                </span>
              </>
            )}
          </div>
        </div>
        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* ══ forms ══ */}
        <div className="space-y-6">
          {/* ── coordonnées ── */}
          <form
            onSubmit={accountForm.handleSubmit((v) => saveAccount.mutate(v))}
            className="rounded-2xl border border-[var(--line)] bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
                <Phone className="h-4 w-4 text-[var(--green-700)]" />
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-[var(--green-900)]">
                  Coordonnées
                </p>
                <p className="text-[12px] text-[var(--slate)]">
                  Comment le MCACRP vous contacte
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Controller
                name="fullName"
                control={accountForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Nom complet</FieldLabel>
                    <Input {...field} id={field.name} aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={accountForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>Téléphone</FieldLabel>
                    <Input {...field} id={field.name} type="tel" inputMode="numeric"
                      placeholder="22 12 34 56" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] pt-4">
              <p className="flex items-center gap-2 text-[12.5px] text-[var(--slate)]">
                <Mail className="h-3.5 w-3.5 text-[var(--muted-fg)]" />
                {me.data?.email}
                {me.data?.emailVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-[var(--green-tint)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--green-700)]">
                    <Check className="h-2.5 w-2.5" /> Vérifiée
                  </span>
                )}
              </p>
              <Button type="submit" size="sm" disabled={saveAccount.isPending}>
                {saveAccount.isPending ? "Enregistrement…" : "Enregistrer"}
              </Button>
            </div>
          </form>

          {/* ── identité ── */}
          <form
            onSubmit={profileForm.handleSubmit((v) => saveProfile.mutate(v))}
            className="rounded-2xl border border-[var(--line)] bg-white p-6"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
                <IdCard className="h-4 w-4 text-[var(--green-700)]" />
              </span>
              <div>
                <p className="text-[14px] font-extrabold text-[var(--green-900)]">
                  Identité officielle
                </p>
                <p className="text-[12px] text-[var(--slate)]">
                  Requise avant toute soumission de dossier
                </p>
              </div>
            </div>

            <p className="mt-4 flex items-start gap-2 rounded-lg bg-[var(--green-tint)] px-3.5 py-2.5 text-[12.5px] leading-relaxed text-[var(--green-700)]">
              <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />
              Renseignez votre NNI <b className="font-bold">ou</b> votre numéro
              de passeport — l&apos;un des deux suffit.
            </p>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Controller
                name="nni"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Numéro national d&apos;identité
                    </FieldLabel>
                    <Input {...field} value={field.value ?? ""} id={field.name}
                      inputMode="numeric" placeholder="1234567890"
                      className="font-mono" aria-invalid={fieldState.invalid} />
                    <FieldDescription>10 chiffres</FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="passportNo"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      Passeport{" "}
                      <span className="font-normal text-[var(--muted-fg)]">
                        (si pas de NNI)
                      </span>
                    </FieldLabel>
                    <Input {...field} value={field.value ?? ""} id={field.name}
                      className="font-mono" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="birthdate"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <CalendarDays className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-[var(--green-600)]" />
                      Date de naissance
                    </FieldLabel>
                    <DatePicker
                      id={field.name}
                      name={field.name}
                      value={field.value ?? ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      invalid={fieldState.invalid}
                      // placeholder="Choisir votre date de naissance"
                      // A birthdate is in the past, and often decades back —
                      // hence the year dropdown and the 1930 floor.
                      disabled={(d) => d > new Date()}
                      fromYear={1930}
                      toYear={new Date().getFullYear()}
                      defaultMonth={new Date(1990, 0)}
                    />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="birthplace"
                control={profileForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>
                      <MapPin className="mr-1 inline h-3.5 w-3.5 align-[-2px] text-[var(--green-600)]" />
                      Lieu de naissance
                    </FieldLabel>
                    <Input {...field} id={field.name} placeholder="Nouakchott"
                      aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="mt-5 flex justify-end border-t border-[var(--line)] pt-4">
              <Button type="submit" disabled={saveProfile.isPending}>
                {saveProfile.isPending ? "Enregistrement…" : "Enregistrer mon identité"}
              </Button>
            </div>
          </form>

          {/* ── photographie ──
              AFTER identity: candidate_profiles requires a birthdate and a
              birthplace (both NOT NULL), so the row must exist before a photo
              can be attached. The control locks itself until then and says so,
              rather than failing with a server error. */}
          <PhotoUpload profileExists={!!me.data?.profile} />
        </div>

        {/* ══ live preview ══ */}
        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-2xl border border-[var(--line)] bg-white p-6">
            <div className="flex items-center gap-3">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[var(--green-700)]">
                Aperçu de votre carte
              </p>
              <span className="h-px flex-1 bg-[var(--line)]" aria-hidden="true" />
            </div>

            <div className="mt-4">
              <CardPreview
                fullName={liveAccount.fullName}
                nni={liveProfile.nni}
                passportNo={liveProfile.passportNo}
                birthdate={liveProfile.birthdate}
                birthplace={liveProfile.birthplace}
                photoUrl={photoUrl}
              />
            </div>

            <p className="mt-4 text-[12px] leading-relaxed text-[var(--slate)]">
              Aperçu indicatif. La carte définitive est éditée par le MCACRP après
              acceptation de votre dossier, avec votre photographie et un
              numéro officiel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
