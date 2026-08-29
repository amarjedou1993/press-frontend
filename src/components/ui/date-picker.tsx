"use client";

// src/components/ui/date-picker.tsx

import { format } from "date-fns";
import { useLocale, useTranslations, useFormatter } from "next-intl";
import { ar, fr } from "react-day-picker/locale";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

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

  /**
   * Optional override.
   * When omitted, datePicker.placeholder from next-intl is used.
   */
  placeholder?: string;

  invalid?: boolean;
  disabled?: (date: Date) => boolean;

  /** Earliest year offered in the dropdown. */
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
  placeholder,
  invalid,
  disabled,
  fromYear,
  toYear,
  defaultMonth,
}: DatePickerProps) {
  const locale = useLocale();
  const t = useTranslations("datePicker");
  const formatter = useFormatter();

  // Supports both "fr"/"ar" and future variants such as "fr-MR"/"ar-MR".
  const language = locale.toLowerCase().split("-")[0];
  const isArabic = language === "ar";

  const calendarLocale = isArabic ? ar : fr;
  const direction = isArabic ? "rtl" : "ltr";

  const selected = value
    ? new Date(`${value}T00:00:00`)
    : undefined;

  const valid =
    selected !== undefined &&
    !Number.isNaN(selected.getTime());

  const displayValue = valid
    ? formatter.dateTime(selected, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : placeholder ?? t("placeholder");

  return (
    <Popover>
      {/*
        PopoverTrigger is the button itself.

        Do not add asChild here: this project's shadcn build uses Base UI.
      */}
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
        <CalendarIcon
          className="h-4 w-4 flex-none text-[var(--green-600)]"
          aria-hidden="true"
        />

        <span>{displayValue}</span>
      </PopoverTrigger>

      <PopoverContent
        className="w-auto p-0"
        align="start"
      >
        <Calendar
          mode="single"
          locale={calendarLocale}
          dir={direction}
          selected={valid ? selected : undefined}
          onSelect={(date?: Date) =>
            onChange(date ? format(date, "yyyy-MM-dd") : "")
          }
          disabled={disabled}
          defaultMonth={valid ? selected : defaultMonth}
          captionLayout="dropdown"
          startMonth={
            fromYear
              ? new Date(fromYear, 0)
              : undefined
          }
          endMonth={
            toYear
              ? new Date(toYear, 11)
              : undefined
          }
        />
      </PopoverContent>
    </Popover>
  );
}