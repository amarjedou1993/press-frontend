// src/components/UserText.tsx
//
// ───────────────────────────────────────────────────────────────────────
// TEXT A PERSON TYPED, IN A LANGUAGE THE SYSTEM DOES NOT KNOW.
//
// A commission member writes their justification in French or in Arabic —
// their choice, and the system does not translate it. So a candidate reading
// the French interface may open an Arabic refusal, and the reverse.
//
// `dir="auto"` is the answer: the browser reads the first strong directional
// character and sets direction from it. No detection at write time, no stored
// flag, no guessing.
//
// WITHOUT IT, an Arabic paragraph inside an LTR block renders with its
// punctuation at the wrong end and mixed content scrambled — on the grounds
// of a refusal, which is not a place for a rendering bug.
//
// USE THIS FOR: decision justifications · objection statements · document
// observations · revocation statements and notes · card status reasons ·
// institution names · anything a person typed.
//
// DO NOT USE IT FOR: labels the system owns. Those follow the page.
// ───────────────────────────────────────────────────────────────────────

import type { ElementType, ReactNode } from "react";

export function UserText({
  children,
  as: Tag = "p",
  className = "",
}: {
  children: ReactNode;
  /** p by default; blockquote, span and dd are the other common ones. */
  as?: ElementType;
  className?: string;
}) {
  return (
    <Tag dir="auto" className={`user-text ${className}`}>
      {children}
    </Tag>
  );
}
