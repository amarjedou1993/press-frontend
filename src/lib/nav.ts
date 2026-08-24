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
