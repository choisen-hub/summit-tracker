// Entity linking (see docs/DESIGN.md §8).
// Resolves free-text leader/country mentions from news to canonical rows,
// anchored on Wikidata IDs + a multilingual alias table. Pure matcher here;
// DB lookups happen in the pipeline scripts that build the index.

export type LeaderIndexEntry = {
  leaderId: string;
  countryId: string | null;
  aliases: string[]; // include canonical names, all languages
};

/** Case/space-insensitive normalization for alias matching. */
export function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

/**
 * Resolve a mention to a leader id. When `countryHint` is provided it acts as a
 * disambiguation constraint (guards against homonyms across countries).
 * Returns null when unresolved — caller should fall back to country-only linking.
 */
export function resolveLeader(
  mention: string,
  index: LeaderIndexEntry[],
  countryHint?: string | null,
): string | null {
  const needle = normalizeName(mention);
  const matches = index.filter((e) =>
    e.aliases.some((a) => normalizeName(a) === needle),
  );
  if (matches.length === 0) return null;
  if (matches.length === 1) return matches[0].leaderId;
  if (countryHint) {
    const scoped = matches.find((e) => e.countryId === countryHint);
    if (scoped) return scoped.leaderId;
  }
  return null; // ambiguous — leave for the verification queue
}
