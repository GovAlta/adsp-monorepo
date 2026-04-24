import { distance } from 'fastest-levenshtein';
import { useMemo } from 'react';

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/[_:\-]+/g, ' ') // eslint-disable-line no-useless-escape
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Multi-tier fuzzy scorer. Returns 0 when there is no match.
 *
 * Tiers (highest → lowest):
 *   100  – exact normalized substring
 *   80+  – any query token is a prefix of a candidate token
 *   60+  – any query token is contained in the candidate
 *   <60  – Levenshtein similarity above 40 % (handles simple typos)
 */
export function scoreFuzzyMatch(queryRaw: string, candidateRaw: string): number {
  const q = normalize(queryRaw);
  const c = normalize(candidateRaw);
  if (!q) return 0;

  if (c === q) return 100;
  if (c.startsWith(q)) return 95;
  if (c.includes(q)) return 90;

  const qTokens = q.split(' ').filter(Boolean);
  const cTokens = c.split(' ').filter(Boolean);

  let prefixHits = 0;
  for (const qt of qTokens) {
    if (cTokens.some((ct) => ct.startsWith(qt))) prefixHits++;
  }
  if (prefixHits > 0) return 80 + prefixHits * 5;

  let containsHits = 0;
  for (const qt of qTokens) {
    if (c.includes(qt)) containsHits++;
  }
  if (containsHits > 0) return 60 + containsHits * 8;

  if (q.length > 3) {
    const d = distance(q, c.slice(0, q.length));
    const accuracy = 1 - d / q.length;
    if (accuracy > 0.4) return accuracy * 100;
  }

  return 0;
}

/**
 * Filter and rank a flat string list by fuzzy relevance.
 * Equivalent to `getSuggestions` in the event log search.
 */
export function getFuzzyMatches(list: string[], query: string, limit = 50): string[] {
  const q = query.trim();
  if (!q) return list.slice(0, limit);
  return list
    .map((s) => ({ s, score: scoreFuzzyMatch(q, s) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ s }) => s);
}

/**
 * React hook — fuzzy-filters a `Record<string, T>` by `query`.
 *
 * Returns `null` when the query is empty (so callers can fall back to the
 * unfiltered list), or a filtered + relevance-sorted record when active.
 *
 * @param items    The full record to search.
 * @param query    Current search string (raw, not yet normalized).
 * @param getLabel Function that extracts the searchable label from each item.
 */
export function useFuzzySearch<T>(
  items: Record<string, T>,
  query: string,
  getLabel: (item: T, key: string) => string
): Record<string, T> | null {
  return useMemo(() => {
    const q = query.trim();
    if (!q) return null;

    const scored = Object.entries(items)
      .map(([key, item]) => ({ key, item, score: scoreFuzzyMatch(q, getLabel(item, key)) }))
      .filter(({ score }) => score > 0)
      .sort((a, b) => b.score - a.score);

    return Object.fromEntries(scored.map(({ key, item }) => [key, item]));
  }, [items, query, getLabel]);
}
