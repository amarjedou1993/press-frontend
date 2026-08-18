// src/lib/registry-index.ts
// Filing a name under a letter, in either script.
//
// ───────────────────────────────────────────────────────────────────────
// WHY THIS EXISTS.
//
// The register was indexed by Latin initial: accents folded, anything else
// filed under "#". The first candidate to register typed «حامد فال» — so on
// the day the Arabic interface opens, an Arabic reader would find every
// Arabic-script name heaped under a single "#".
//
// A rail that files half a register in one bucket is worse than no rail: it
// looks like an index and behaves like a pile.
//
// So each name is filed under its OWN script, and the page shows the rail
// matching the reader's language with the other script in a named section
// beneath — never "#".
// ───────────────────────────────────────────────────────────────────────

/** The twenty-eight letters, in the order a directory uses. */
export const ARABIC_ALPHABET = [
  "ا", "ب", "ت", "ث", "ج", "ح", "خ", "د", "ذ", "ر", "ز", "س", "ش",
  "ص", "ض", "ط", "ظ", "ع", "غ", "ف", "ق", "ك", "ل", "م", "ن", "ه",
  "و", "ي",
] as const;

export const LATIN_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export type Script = "arabic" | "latin";

/** Anything in the Arabic block, including the presentation forms. */
const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

export function scriptOf(name: string): Script {
  return ARABIC_RANGE.test(name.trim().charAt(0)) ? "arabic" : "latin";
}

/**
 * The letter an Arabic name files under.
 *
 * TWO RULES THAT MATTER, both of which a naive first-character read gets
 * wrong:
 *
 * 1. THE HAMZA FORMS ARE ONE LETTER. أ إ آ ٱ are all alif. A reader looking
 *    under ا expects «أحمد» to be there, and would not think to check three
 *    other buckets.
 *
 * 2. THE DEFINITE ARTICLE IS SKIPPED. «الشيخ» files under ش, not ا — exactly
 *    as «the Smiths» files under S. Mauritanian names carry ال often enough
 *    that ignoring this would pile a large share of the register under one
 *    letter.
 */
export function arabicInitialOf(name: string): string {
  let s = name.trim();

  // Strip anything that is not a letter: diacritics, tatweel, punctuation.
  s = s.replace(/[\u064B-\u065F\u0670\u0640]/g, "");

  // Rule 2 — the article, but only when a name follows it. «ال» alone, or
  // «الله», is not an article and must not be stripped.
  if (s.startsWith("ال") && s.length > 3) {
    s = s.slice(2);
  }

  const c = s.charAt(0);

  // Rule 1 — fold the variants onto their base letter.
  const FOLD: Record<string, string> = {
    "أ": "ا", "إ": "ا", "آ": "ا", "ٱ": "ا",
    "ة": "ه",   // ta marbuta reads as ha
    "ى": "ي",   // alif maqsura reads as ya
    "ؤ": "و",
    "ئ": "ي",
  };

  const folded = FOLD[c] ?? c;
  return (ARABIC_ALPHABET as readonly string[]).includes(folded) ? folded : "ا";
}

/** The letter a Latin name files under — accents folded. */
export function latinInitialOf(name: string): string {
  const first = name
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .charAt(0)
    .toUpperCase();
  return /[A-Z]/.test(first) ? first : "#";
}

export function initialOf(name: string): string {
  return scriptOf(name) === "arabic" ? arabicInitialOf(name) : latinInitialOf(name);
}

/**
 * Accent- and diacritic-insensitive, in both scripts.
 *
 * «Mohamed» must find «Mohâmed»; «احمد» must find «أحمد». Mauritanian names
 * are transliterated and vocalised inconsistently, and a search that only
 * matches exact forms answers "no" wrongly.
 */
export function normalise(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")        // Latin diacritics
    .replace(/[\u064B-\u065F\u0670]/g, "")  // Arabic vocalisation
    .replace(/\u0640/g, "")                 // tatweel
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ة/g, "ه")
    .toLowerCase();
}

/** Group a list by initial, in the collation order of its own script. */
export function groupByInitial<T>(
  items: T[],
  nameOf: (item: T) => string,
  script: Script
): [string, T[]][] {
  const map = new Map<string, T[]>();

  for (const item of items) {
    const name = nameOf(item);
    if (scriptOf(name) !== script) continue;
    const letter = initialOf(name);
    if (!map.has(letter)) map.set(letter, []);
    map.get(letter)!.push(item);
  }

  const order = script === "arabic"
    ? (ARABIC_ALPHABET as readonly string[])
    : LATIN_ALPHABET;

  return [...map.entries()].sort(
    ([a], [b]) => order.indexOf(a) - order.indexOf(b)
  );
}
