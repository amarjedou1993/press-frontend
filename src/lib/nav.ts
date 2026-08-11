// src/lib/nav.ts
// Which navigation entry is the current one.
//
// THE PROBLEM THIS SOLVES ONCE. Nav hrefs nest: "/admin/cards" is a prefix of
// "/admin/cards/revocations". A startsWith test lights both; an exact test
// leaves "Sessions" dark while you are looking at session n° 3. Deciding
// per-entry works until someone adds a route, and then it silently stops
// working — which is how a sidebar ends up with two highlighted items and
// nobody can say when it started.
//
// THE RULE: LONGEST MATCH WINS. Exactly one entry is active — the most
// specific one whose href the current path falls under. It is the same rule a
// router uses to pick a handler, and it needs no maintenance: adding
// "/admin/cards/revocations" automatically stops "/admin/cards" from claiming
// it, because the longer href is the better match.
//
// The result is DERIVED FROM THE ENTRY LIST ITSELF, so there is no per-entry
// flag to get wrong and no rule to remember when the next route lands.

/** True when `path` is `href` or sits beneath it. */
function matches(path: string, href: string): boolean {
  if (path === href) return true;
  // The trailing slash matters: without it "/admin/cardsfoo" would match
  // "/admin/cards".
  return path.startsWith(href.endsWith("/") ? href : href + "/");
}

/**
 * The href that should be highlighted, or null when none applies.
 *
 * Pass every href in the navigation — including ones from other groups, since
 * specificity is decided across the whole set rather than within a group.
 */
export function activeHref(path: string, hrefs: readonly string[]): string | null {
  let winner: string | null = null;

  for (const href of hrefs) {
    if (!matches(path, href)) continue;
    // Longer means more specific. "/admin/cards/revocations" beats
    // "/admin/cards" for a path under it.
    if (winner === null || href.length > winner.length) {
      winner = href;
    }
  }

  return winner;
}

/**
 * A ready-made predicate, for when the entries are built inline.
 *
 *   const isActive = navMatcher(path, [routes.admin.cards, routes.admin.revocations, …]);
 *   …
 *   active: isActive(routes.admin.cards)
 */
export function navMatcher(path: string, hrefs: readonly string[]) {
  const winner = activeHref(path, hrefs);
  return (href: string) => winner === href;
}
