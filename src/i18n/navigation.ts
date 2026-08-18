// src/i18n/navigation.ts
// Locale-aware navigation.
//
// ⚠️ INSIDE THE LOCALISED TREE, IMPORT FROM HERE — not from "next/link" or
// "next/navigation". These wrappers carry the current locale into every href,
// so /journalistes becomes /ar/journalistes automatically.
//
// The ADMIN and REVIEWER spaces are NOT localised and must keep importing
// from next/link directly: routing them through here would prefix their URLs
// with a locale they do not have.

import { createNavigation } from "next-intl/navigation";
import { routing } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation(routing);
