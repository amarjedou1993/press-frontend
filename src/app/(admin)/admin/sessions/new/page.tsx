"use client";
// src/app/(admin)/admin/sessions/new/page.tsx
// Session creation: <Field> family + react-hook-form <Controller>.
//
// Two version-proofing decisions:
//  1. PopoverTrigger IS the styled button (no composition, no asChild) —
//     works under Base UI or Radix, and can never nest <button>s.
//  2. The resolver argument is cast, and the number inputs convert on change,
//     so zod v4's types line up with @hookform/resolvers.

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon, ArrowLeft, Inbox, Gavel, PenLine, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Field, FieldLabel, FieldDescription, FieldError } from "@/components/ui/field";
import { createSessionSchema, type CreateSessionValues } from "@/lib/schemas";
import { createSession, sessionKeys } from "@/lib/api/sessions";
import { ApiError } from "@/lib/api/client";
import { routes } from "@/lib/routes";

const PHASES = [
  { name: "receivingDays", label: "Réception des dossiers", hint: "Dépôt des candidatures", Icon: Inbox },
  { name: "reviewDays", label: "Examen", hint: "Étude par la commission", Icon: Gavel },
  { name: "correctionDays", label: "Correction", hint: "Corrections demandées aux candidats", Icon: PenLine },
  { name: "reclamationDays", label: "Réclamation", hint: "Recours des candidats rejetés", Icon: Scale },
] as const;

const TRIGGER_CLASS =
  "inline-flex h-9 w-[280px] items-center justify-start gap-2 rounded-md border border-input " +
  "bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors " +
  "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";

function addDays(iso: string, days: number): string {
  if (!iso) return "";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d.getTime())) return "";
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function longFr(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso + "T00:00:00");
  return isNaN(d.getTime()) ? "—" : format(d, "d MMMM yyyy", { locale: fr });
}

export default function NewSessionPage() {
  const router = useRouter();
  const qc = useQueryClient();

  const form = useForm<CreateSessionValues>({
    // Cast the ARGUMENT (not the result): zod v4's inferred schema type
    // doesn't match any resolver overload directly.
    resolver: zodResolver(createSessionSchema as any) as Resolver<CreateSessionValues>,
    // Validate on SUBMIT, then re-validate on change (see ReviewerDialog).
    mode: "onSubmit",
    reValidateMode: "onChange",
    defaultValues: {
      startDate: "",
      receivingDays: 10,
      reviewDays: 8,
      correctionDays: 7,
      reclamationDays: 5,
    },
  });

  const values = form.watch();

  const derived = useMemo(() => {
    const receivingEnd = addDays(values.startDate, Number(values.receivingDays) || 0);
    const reviewEnd = addDays(receivingEnd, Number(values.reviewDays) || 0);
    const correctionEnd = addDays(reviewEnd, Number(values.correctionDays) || 0);
    const reclamationEnd = addDays(correctionEnd, Number(values.reclamationDays) || 0);
    return { receivingEnd, reviewEnd, correctionEnd, reclamationEnd };
  }, [values.startDate, values.receivingDays, values.reviewDays,
      values.correctionDays, values.reclamationDays]);

  const endFor: Record<string, string> = {
    receivingDays: derived.receivingEnd,
    reviewDays: derived.reviewEnd,
    correctionDays: derived.correctionEnd,
    reclamationDays: derived.reclamationEnd,
  };

  const total =
    (Number(values.receivingDays) || 0) + (Number(values.reviewDays) || 0) +
    (Number(values.correctionDays) || 0) + (Number(values.reclamationDays) || 0);

  const mutation = useMutation({
    mutationFn: (v: CreateSessionValues) => createSession(v),
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: sessionKeys.all });
      toast.success("Session créée", {
        description: `Session #${created.id} — ${created.totalDays} jours, du ${longFr(created.startDate)} au ${longFr(created.reclamationEnd)}.`,
      });
      router.push(routes.admin.sessions);
    },
    onError: (e) => {
      toast.error("Création impossible", {
        description: e instanceof ApiError ? (e.problem.detail ?? e.message) : "Réessayez.",
      });
    },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => router.push(routes.admin.sessions)}
          aria-label="Retour aux sessions">
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h2 className="text-xl font-extrabold text-[var(--green-900)]">
            Nouvelle session de candidature
          </h2>
          <p className="text-sm text-[var(--slate)]">
            Définissez la date de début et la durée de chaque phase.
          </p>
        </div>
      </div>

      <form onSubmit={form.handleSubmit((v) => mutation.mutate(v))} className="space-y-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">
              Date de début
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Controller
              name="startDate"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name}>Premier jour de la session</FieldLabel>
                  <Popover>
                    <PopoverTrigger
                      id={field.name}
                      aria-invalid={fieldState.invalid}
                      className={TRIGGER_CLASS + (field.value ? "" : " text-[var(--muted-fg)]")}
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {field.value ? longFr(field.value) : "Choisir une date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        locale={fr}
                        selected={field.value ? new Date(field.value + "T00:00:00") : undefined}
                        onSelect={(d?: Date) => field.onChange(d ? format(d, "yyyy-MM-dd") : "")}
                        disabled={(d: Date) => d <= new Date(new Date().setHours(0, 0, 0, 0))}
                      />
                    </PopoverContent>
                  </Popover>
                  <FieldDescription>
                    La session doit commencer après aujourd&apos;hui.
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-extrabold text-[var(--green-900)]">
              Durée des phases
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            {PHASES.map((phase, i) => (
              <div key={phase.name}>
                {i > 0 && <Separator className="my-1" />}
                <Controller
                  name={phase.name}
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field
                      data-invalid={fieldState.invalid}
                      className="grid grid-cols-[1fr_120px_180px] items-start gap-4 py-3"
                    >
                      <div className="pt-1.5">
                        <FieldLabel
                          htmlFor={field.name}
                          className="flex items-center gap-2 text-sm font-semibold text-[var(--ink)]"
                        >
                          <phase.Icon className="h-4 w-4 text-[var(--green-600)]" />
                          {phase.label}
                        </FieldLabel>
                        <p className="mt-0.5 text-xs text-[var(--slate)]">{phase.hint}</p>
                      </div>
                      <div>
                        <Input
                          id={field.name}
                          name={field.name}
                          ref={field.ref}
                          onBlur={field.onBlur}
                          type="number"
                          min={1}
                          inputMode="numeric"
                          aria-invalid={fieldState.invalid}
                          value={Number.isFinite(field.value) ? field.value : ""}
                          // Keep a real NUMBER in form state (no z.coerce needed)
                          onChange={(e) =>
                            field.onChange(
                              e.target.value === "" ? undefined : Number(e.target.value)
                            )
                          }
                        />
                        {fieldState.invalid && (
                          <FieldError className="mt-1 text-xs" errors={[fieldState.error]} />
                        )}
                      </div>
                      <div className="pt-2 text-right">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted-fg)]">
                          Se termine le
                        </p>
                        <p className="font-mono text-[13px] text-[var(--green-900)]">
                          {longFr(endFor[phase.name])}
                        </p>
                      </div>
                    </Field>
                  )}
                />
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between rounded-2xl px-6 py-5 text-white"
          style={{ background: "linear-gradient(160deg, var(--green-900), #0e3d29)" }}>
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--gold-500)]">
              Durée totale
            </p>
            <p className="mt-1 text-xs text-white/65">
              Du {longFr(values.startDate)} au {longFr(derived.reclamationEnd)}
            </p>
          </div>
          <p className="text-4xl font-extrabold">
            {total}<span className="ml-1.5 text-base font-semibold text-white/70">jours</span>
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => router.push(routes.admin.sessions)}>
            Annuler
          </Button>
          <Button type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? "Création…" : "Créer la session"}
          </Button>
        </div>
      </form>
    </div>
  );
}
