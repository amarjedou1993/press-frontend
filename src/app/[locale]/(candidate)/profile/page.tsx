"use client";

import { useEffect, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Check, ShieldCheck, IdCard, Mail, Phone, CalendarDays, MapPin, Camera,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { DatePicker } from "@/components/ui/date-picker";
import { VerificationBanner } from "@/components/candidate/VerificationBanner";
import { PhotoUpload, photoKeys, fetchPhotoStatus } from "@/components/candidate/PhotoUpload";
import { IssuedCardPreview } from "@/components/candidate/IssuedCardPreview";
import { Guilloche, OfficialSeal, MicroprintRule } from "@/components/public/patterns";
import { getMe, updateAccount, updateProfile, accountKeys } from "@/lib/api/account";
import {
  profileSchema, accountSchema, type ProfileValues, type AccountValues,
} from "@/lib/schemas-candidate";
import { ApiError } from "@/lib/api/client";
import { useAuthStore } from "@/lib/auth";
import { useFieldError } from "@/lib/useFieldError";

export default function ProfilePage() {
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tValidation = useTranslations("validation");

  /**
   * ⚠️ THE SERVER SENDS KEYS NOW.
   *
   * ProfileController answers with "validation.nniOrPassport" and
   * "validation.nniTaken" rather than finished sentences — so that the same
   * rule reads the same way whether the client or the server caught it.
   *
   * Without resolve(), a candidate would read the key itself in a toast.
   */
  const resolve = useFieldError();

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

  // The preview follows what is being TYPED, not only what is saved.
  const liveAccount = accountForm.watch();
  const liveProfile = profileForm.watch();

  /**
   * The photo status.
   *
   * ⚠️ Same query key and same function as PhotoUpload's, so TanStack serves
   * both from one request. The function is IMPORTED rather than rewritten:
   * two implementations of the same fetch drift, and this one decides whether
   * the completeness badge is telling the truth.
   */
  const photoStatus = useQuery({
    queryKey: photoKeys.status,
    queryFn: () => fetchPhotoStatus(token),
  });

  const errText = (e: unknown) =>
    resolve(e instanceof ApiError ? (e.problem.detail ?? e.message) : undefined)
      ?? tCommon("retry");

  const saveAccount = useMutation({
    mutationFn: (v: AccountValues) =>
      updateAccount({ fullName: v.fullName, phone: v.phone.replace(/\s/g, "") }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: accountKeys.me });
      toast.success(t("contact.savedTitle"));
    },
    onError: (e) => toast.error(t("saveFailed"), { description: errText(e) }),
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
      toast.success(t("identity.savedTitle"), {
        description: t("identity.savedBody"),
      });
    },
    onError: (e) => {
      // A duplicate NNI is a FIELD problem, so it belongs on the field —
      // a generic toast leaves the candidate hunting for what went wrong.
      if (e instanceof ApiError && e.problem.status === 409) {
        profileForm.setError("nni", {
          type: "server",
          message: resolve(e.problem.detail) ?? tValidation("nniTaken"),
        });
        return;
      }
      toast.error(t("saveFailed"), { description: errText(e) });
    },
  });

  /**
   * What is still missing, BY NAME.
   *
   * The same conditions CandidateProfile.isComplete() applies, in the order
   * they appear on this page. The photograph is included — it is part of
   * completeness and was invisible in the old badge.
   */
  const missing = useMemo(() => {
    if (!me.data) return [];
    const p = me.data.profile;
    const gaps: string[] = [];
    if (!me.data.fullName?.trim()) gaps.push(t("missing.fullName"));
    if (!p?.nni && !p?.passportNo) gaps.push(t("missing.nniOrPassport"));
    if (!p?.birthdate) gaps.push(t("missing.birthdate"));
    if (!p?.birthplace) gaps.push(t("missing.birthplace"));
    if (!photoStatus.data?.hasPhoto) gaps.push(t("missing.photo"));
    return gaps;
  }, [me.data, photoStatus.data, t]);

  if (me.isLoading) {
    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    );
  }

  const complete = (me.data?.profileComplete ?? false) && missing.length === 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <VerificationBanner />

      {/* ══ hero ══ */}
      <section
        className="relative overflow-hidden rounded-[20px] text-white shadow-[0_24px_60px_-34px_rgba(11,46,31,.85)]"
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
        <Guilloche
          className="rtl-mirror pointer-events-none absolute -right-24 -top-28 h-[330px] w-[330px] text-white opacity-[0.06]"
          rings={34}
        />

        <div className="relative z-10 p-7">
          <div className="flex flex-wrap items-start justify-between gap-5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <OfficialSeal
                  className="h-5 w-5 flex-none opacity-80"
                  color="var(--gold-500)"
                  id="profile-seal"
                />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[var(--gold-500)]">
                  {t("eyebrow")}
                </p>
              </div>

              <h2 className="engraved-dark mt-3 text-[27px] font-extrabold leading-tight tracking-tight">
                {t("title")}
              </h2>
              <p className="mt-2.5 max-w-lg text-[14px] leading-relaxed text-white/60">
                {t("lede")}
              </p>
            </div>

            {/* Sized like the dossier page's countdown, so the two heroes
                balance the same way. */}
            <div
              className="w-full flex-none rounded-xl px-5 py-4 sm:w-auto sm:max-w-[236px]"
              style={{
                background: complete ? "rgba(0,169,92,.18)" : "rgba(255,215,0,.14)",
                boxShadow: `inset 0 0 0 1px ${complete ? "rgba(0,169,92,.42)" : "rgba(255,215,0,.4)"}`,
              }}
            >
              {complete ? (
                <>
                  <Check className="h-6 w-6 text-[var(--green-500)]" />
                  <p className="mt-2 text-[12.5px] font-extrabold text-[var(--green-500)]">
                    {t("completeTitle")}
                  </p>
                  <p className="mt-1 text-[11.5px] leading-relaxed text-white/45">
                    {t("completeBody")}
                  </p>
                </>
              ) : (
                <>
                  <p className="font-mono text-[28px] font-extrabold leading-none text-[var(--gold-500)]">
                    {missing.length}
                  </p>
                  <p className="mt-1.5 text-[9px] font-bold uppercase tracking-[0.14em] text-white/50">
                    {t("missingCount", { count: missing.length })}
                  </p>
                  {/* NAMED, not merely counted — otherwise the candidate scans
                      two forms hunting for the empty field.
                      ⚠️ The separator comes from the catalogue: this is
                      composed text, and its punctuation is a choice rather
                      than an oversight. */}
                  <p className="mt-2.5 border-t border-white/15 pt-2.5 text-[11px] leading-relaxed text-white/55">
                    {missing.join(t("missingSeparator"))}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        <MicroprintRule
          className="relative z-10 pb-1 text-center text-white opacity-[0.12]"
          repeat={14}
        />
        <div className="flex h-1.5" aria-hidden="true">
          <i className="flex-1 bg-[var(--green-500)]" />
          <i className="flex-1 bg-[var(--gold-500)]" />
          <i className="flex-1 bg-[var(--red-500)]" />
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        {/* ══ left column — the record being entered ══ */}
        <div className="min-w-0 space-y-6">

          {/* ── coordonnées ── */}
          <form
            onSubmit={accountForm.handleSubmit((v) => saveAccount.mutate(v))}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
                <Phone className="h-4 w-4 text-[var(--green-700)]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold text-[var(--green-900)]">
                  {t("contact.title")}
                </p>
                <p className="text-[12px] text-[var(--slate)]">
                  {t("contact.subtitle")}
                </p>
              </div>
              <span className="foil-rule hidden h-px flex-1 opacity-35 sm:block" aria-hidden="true" />
            </div>

            <div className="grid gap-4 p-6 sm:grid-cols-2">
              <Controller
                name="fullName"
                control={accountForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("contact.fullName")}</FieldLabel>
                    {/* ⚠️ dir="auto": a candidate types their name in their
                        own script, whatever language the form is in. The
                        first person to register here typed «حامد فال». */}
                    <Input {...field} id={field.name} dir="auto"
                      aria-invalid={fieldState.invalid} />
                    <FieldDescription>
                      {t("contact.fullNameHint")}
                    </FieldDescription>
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
              <Controller
                name="phone"
                control={accountForm.control}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={field.name}>{t("contact.phone")}</FieldLabel>
                    {/* dir="ltr": a number is a Latin string, and the caret
                        jumps at each digit group inside an RTL field. */}
                    <Input {...field} id={field.name} type="tel" inputMode="numeric"
                      dir="ltr" className="text-start"
                      placeholder="22 12 34 56" aria-invalid={fieldState.invalid} />
                    {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                  </Field>
                )}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-3.5">
              <p className="flex min-w-0 items-center gap-2 text-[12.5px] text-[var(--slate)]">
                <Mail className="h-3.5 w-3.5 flex-none text-[var(--muted-fg)]" />
                {/* dir="ltr": an address reorders around its @ and its dot. */}
                <span dir="ltr" className="truncate">{me.data?.email}</span>
                {me.data?.emailVerified && (
                  <span className="inline-flex flex-none items-center gap-1 rounded-full bg-[var(--green-tint)] px-2 py-0.5 text-[10.5px] font-bold text-[var(--green-700)]">
                    <Check className="h-2.5 w-2.5" /> {t("contact.verified")}
                  </span>
                )}
              </p>
              <Button type="submit" size="sm" disabled={saveAccount.isPending}>
                {saveAccount.isPending ? tCommon("saving") : tCommon("save")}
              </Button>
            </div>
          </form>

          {/* ── identité ── */}
          <form
            onSubmit={profileForm.handleSubmit((v) => saveProfile.mutate(v))}
            className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white"
          >
            <div className="flex items-center gap-3 border-b border-[var(--line)] px-6 py-4">
              <span className="flex h-9 w-9 flex-none items-center justify-center rounded-xl bg-[var(--green-tint)]">
                <IdCard className="h-4 w-4 text-[var(--green-700)]" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[13.5px] font-extrabold text-[var(--green-900)]">
                  {t("identity.title")}
                </p>
                <p className="text-[12px] text-[var(--slate)]">
                  {t("identity.subtitle")}
                </p>
              </div>
              <span className="foil-rule hidden h-px flex-1 opacity-35 sm:block" aria-hidden="true" />
            </div>

            <div className="p-6">
              <p className="flex items-start gap-2 rounded-xl bg-[var(--green-tint)] px-4 py-3 text-[12.5px] leading-relaxed text-[var(--green-700)]">
                <ShieldCheck className="mt-0.5 h-3.5 w-3.5 flex-none" />
                <span>
                  {t.rich("identity.choice", {
                    b: (chunks) => <b className="font-bold">{chunks}</b>,
                  })}
                </span>
              </p>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">
                <Controller
                  name="nni"
                  control={profileForm.control}
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor={field.name}>
                        {t("identity.nni")}
                      </FieldLabel>
                      {/* dir="ltr": ten digits, read left to right on every
                          document that carries them. */}
                      <Input {...field} value={field.value ?? ""} id={field.name}
                        inputMode="numeric" placeholder="1234567890"
                        dir="ltr" className="font-mono text-start"
                        aria-invalid={fieldState.invalid} />
                      <FieldDescription>{t("identity.nniHint")}</FieldDescription>
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
                        {t("identity.passport")}{" "}
                        <span className="font-normal text-[var(--muted-fg)]">
                          {t("identity.passportHint")}
                        </span>
                      </FieldLabel>
                      <Input {...field} value={field.value ?? ""} id={field.name}
                        dir="ltr" className="font-mono text-start"
                        aria-invalid={fieldState.invalid} />
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
                        <CalendarDays className="me-1 inline h-3.5 w-3.5 align-[-2px] text-[var(--green-600)]" />
                        {t("identity.birthdate")}
                      </FieldLabel>
                      <DatePicker
                        id={field.name}
                        name={field.name}
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={fieldState.invalid}
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
                        <MapPin className="me-1 inline h-3.5 w-3.5 align-[-2px] text-[var(--green-600)]" />
                        {t("identity.birthplace")}
                      </FieldLabel>
                      {/* dir="auto": «Nouakchott» and «نواكشوط» are both
                          correct, and the field follows what is typed. */}
                      <Input {...field} id={field.name} dir="auto"
                        placeholder={t("identity.birthplacePlaceholder")}
                        aria-invalid={fieldState.invalid} />
                      {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                    </Field>
                  )}
                />
              </div>
            </div>

            <div className="flex justify-end border-t border-[var(--line)] bg-[#fbfcfb] px-6 py-3.5">
              <Button type="submit" disabled={saveProfile.isPending}>
                {saveProfile.isPending ? tCommon("saving") : t("identity.save")}
              </Button>
            </div>
          </form>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RIGHT COLUMN — the credential taking shape.

            The photograph sits directly ABOVE the card it will be printed on.
            It was previously LAST on the page, beneath two forms — and it is
            the most-forgotten requirement, the one that blocks issuance after
            a commission has already approved a dossier.
            ══════════════════════════════════════════════════════════ */}
        <div className="min-w-0 space-y-6 lg:sticky lg:top-24 lg:self-start">

          {/* ── photographie ──
              candidate_profiles requires a birthdate and a birthplace (both
              NOT NULL), so the row must exist before a photo can be attached.
              PhotoUpload locks itself until then and says so, rather than
              failing with a server error. */}
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
              <Camera className="h-4 w-4 flex-none text-[var(--green-700)]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                {t("photoTitle")}
              </p>
              <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
              {photoStatus.data?.hasPhoto && (
                <Check className="h-3.5 w-3.5 flex-none text-[var(--green-600)]" />
              )}
            </div>

            <div className="p-5">
              <PhotoUpload profileExists={!!me.data?.profile} />
            </div>
          </div>

          {/* ── the card ── */}
          <div className="overflow-hidden rounded-2xl border border-[var(--line)] bg-white">
            <div className="flex items-center gap-2.5 border-b border-[var(--line)] px-5 py-3.5">
              <OfficialSeal
                className="h-4 w-4 flex-none"
                color="var(--green-700)"
                id="profile-card-seal"
              />
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--green-700)]">
                {t("cardPreviewTitle")}
              </p>
              <span className="foil-rule h-px flex-1 opacity-35" aria-hidden="true" />
            </div>

            <div className="p-5">
              {/* THE SHARED SPECIMEN — the same component the dashboard and
                  the dossier render, so all three show the card that will
                  actually be printed.
                  categoryLabel is null on purpose: there is no dossier yet on
                  this page, so no category has been chosen. */}
              <IssuedCardPreview
                fullName={liveAccount.fullName}
                nni={liveProfile.nni?.trim() || liveProfile.passportNo?.trim()}
                categoryLabel={null}
                issued={false}
              />

              <p className="mt-4 text-[12px] leading-relaxed text-[var(--slate)]">
                {t("cardPreviewBody")}
              </p>
            </div>

            <MicroprintRule
              className="pb-1.5 text-center text-[var(--green-700)] opacity-[0.08]"
              repeat={12}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
