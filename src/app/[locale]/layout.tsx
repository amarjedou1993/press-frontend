import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { HtmlLang } from "@/components/HtmlLang";
import { routing } from "@/i18n/routing";

/** Both locales are prerendered — neither is a second-class page. */
export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  // An unknown locale is a 404, not a silent fallback: /en/journalistes
  // should not quietly serve Arabic under an English URL.
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  // Required for static rendering — without it every page becomes dynamic,
  // and the public pages must stay fast on a weak connection.
  setRequestLocale(locale);

  return (
    <NextIntlClientProvider>
      <HtmlLang />
      {children}
    </NextIntlClientProvider>
  );
}
