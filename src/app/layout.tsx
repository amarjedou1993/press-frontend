
import type { Metadata } from "next";
// import { headers } from "next/headers";
import { Inter, Cairo, IBM_Plex_Mono} from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
// import { routing, dirOf } from "@/i18n/routing";
import "./globals.css";

/**
 * Inter — the Latin face.
 *
 * Chosen over a more characterful grotesque because this is an
 * administrative interface read at small sizes: form labels, table cells,
 * status pills. Inter's large x-height and open apertures hold up at 11px in
 * a way a condensed face does not.
 *
 * Its FIGURES matter as much. The dashboard, the register and the session
 * results are full of numbers that change while you look at them — Inter's
 * tabular numerals keep a column of counts from shifting.
 */
const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  display: "swap",
  // Variable font: one file covers every weight the interface uses.
  weight: ["400", "500", "600", "700", "800", "900"],
});

/**
 * Cairo — the Arabic face.
 *
 * Geometric rather than naskh, which pairs far better with Inter than a
 * traditional face would: both have an even colour and an upright axis, so a
 * bilingual line does not read as two typefaces arguing.
 *
 * `display: "swap"` deliberately. On a weak connection the register must
 * render its text in a fallback rather than showing nothing — this page is
 * consulted at checkpoints, not at desks.
 */
const cairo = Cairo({
  subsets: ["arabic", "latin"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

// Machine values: NNI, card numbers, identifiers.
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "MCACRP — Accréditation Presse",
  description:
    "Dépôt et suivi des demandes de carte de presse — Ministère de la Culture, "
    + "des Arts, de la Communication et des Relations avec le Parlement",
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html suppressHydrationWarning
      className={`${inter.variable} ${cairo.variable} ${plexMono.variable}`}>
      <body className="font-sans antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}