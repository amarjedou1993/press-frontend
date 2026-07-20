// src/app/layout.tsx
import type { Metadata } from "next";
import {
  Plus_Jakarta_Sans,
  IBM_Plex_Sans_Arabic,
  IBM_Plex_Mono,
} from "next/font/google";
import { QueryProvider } from "@/components/QueryProvider";
import "./globals.css";

// Latin UI face — matches the inspiration set's modern grotesque voice
const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["400", "500", "600", "700", "800"],
});

// Arabic face — proper naskh proportions for the bilingual surfaces
const plexArabic = IBM_Plex_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-arabic",
  weight: ["400", "500", "600", "700"],
});

// Machine values: NNI, card numbers, IDs
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "HAPA — Accréditation Presse",
  description:
    "Dépôt et suivi des demandes de carte de presse — Haute Autorité de la Presse et de l'Audiovisuel",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fr">
      <body
        className={`${jakarta.variable} ${plexArabic.variable} ${plexMono.variable} antialiased`}
      >
        {/* Auth needs no provider anymore (Zustand store) —
            Query is the only context the tree carries. */}
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
