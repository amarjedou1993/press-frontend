"use client";
// src/components/ui/date-picker.tsx
// One date picker for the whole application.
//
// It exists because we had two: the admin session form used a shadcn
// Calendar in a Popover, while the candidate profile used the native
// <input type="date"> — which renders differently in every browser, cannot
// be styled, and shows month names in the OS language rather than French.
// A government form should look the same on every machine.
//
// NOTE ON COMPOSITION: PopoverTrigger IS the button (no asChild, no nested
// element). Your shadcn build sits on Base UI, which composes via a `render`
// prop and ignores asChild — passing it leaks the attribute to the DOM and
// nests <button> inside <button>.

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const TRIGGER_CLASS =
  "inline-flex h-9 w-full items-center justify-start gap-2 rounded-md border " +
  "border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors " +
  "hover:bg-accent hover:text-accent-foreground focus-visible:outline-none " +
  "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "disabled:cursor-not-allowed disabled:opacity-50";

export interface DatePickerProps {
  /** yyyy-MM-dd, or "" when empty — the shape the API expects. */
  value?: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  id?: string;
  name?: string;
  placeholder?: string;
  invalid?: boolean;
  disabled?: (date: Date) => boolean;
  /** Earliest year offered in the dropdown (birthdates need a long reach). */
  fromYear?: number;
  toYear?: number;
  /** Start the calendar here when nothing is selected yet. */
  defaultMonth?: Date;
}

export function DatePicker({
  value,
  onChange,
  onBlur,
  id,
  name,
  placeholder = "Choisir une date",
  invalid,
  disabled,
  fromYear,
  toYear,
  defaultMonth,
}: DatePickerProps) {
  const selected = value ? new Date(value + "T00:00:00") : undefined;
  const valid = selected && !isNaN(selected.getTime());

  return (
    <Popover>
      <PopoverTrigger
        id={id}
        name={name}
        onBlur={onBlur}
        aria-invalid={invalid}
        className={
          TRIGGER_CLASS +
          (valid ? "" : " text-[var(--muted-fg)]") +
          (invalid ? " border-[var(--red-500)]" : "")
        }
      >
        <CalendarIcon className="h-4 w-4 flex-none text-[var(--green-600)]" />
        {valid ? format(selected!, "d MMMM yyyy", { locale: fr }) : placeholder}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          locale={fr}
          selected={valid ? selected : undefined}
          onSelect={(d?: Date) => onChange(d ? format(d, "yyyy-MM-dd") : "")}
          disabled={disabled}
          defaultMonth={valid ? selected : defaultMonth}
          // Month/year dropdowns: scrolling to 1970 one month at a time is
          // unusable, and a birthdate is often decades back.
          captionLayout="dropdown"
          startMonth={fromYear ? new Date(fromYear, 0) : undefined}
          endMonth={toYear ? new Date(toYear, 11) : undefined}
        />
      </PopoverContent>
    </Popover>
  );
}
