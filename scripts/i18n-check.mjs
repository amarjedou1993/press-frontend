// scripts/i18n-check.mjs
// Fails the build when a key exists in one catalogue and not the other.
//
// ⚠️ THIS IS THE MISTAKE THAT WILL HAPPEN. Adding a string to fr.json and
// forgetting ar.json produces no error at build time and no error at runtime
// — next-intl falls back to the key, so an Arabic reader sees
// "candidate.dashboard.title" where a heading should be. Nobody notices until
// someone reads the Arabic pages, which may be after they ship.

import { readFileSync } from "node:fs";

const read = (l) => JSON.parse(readFileSync(`./messages/${l}.json`, "utf8"));

const keys = (o, p = "") =>
  Object.entries(o).flatMap(([k, v]) => [
    p + k,
    ...(v && typeof v === "object" ? keys(v, p + k + ".") : []),
  ]);

const fr = keys(read("fr"));
const ar = keys(read("ar"));

const missing = [
  ...fr.filter((k) => !ar.includes(k)).map((k) => `  manque dans ar : ${k}`),
  ...ar.filter((k) => !fr.includes(k)).map((k) => `  manque dans fr : ${k}`),
];

if (missing.length) {
  console.error(`\n✗ ${missing.length} clé(s) sans équivalent\n`);
  console.error(missing.join("\n") + "\n");
  process.exit(1);
}

console.log(`✓ ${fr.length} clés, parité OK`);