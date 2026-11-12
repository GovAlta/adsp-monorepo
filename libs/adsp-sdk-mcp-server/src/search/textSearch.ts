import { SEARCH_ALIASES } from './aliases';

// prettier-ignore
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'to', 'of', 'in', 'on', 'for', 'and', 'or', 'is', 'are',
  'how', 'do', 'does', 'i', 'what', 'with', 'from', 'this', 'that', 'it', 'be',
]);

export function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
}

export function countTerms(tokens: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const token of tokens) {
    counts.set(token, (counts.get(token) ?? 0) + 1);
  }
  return counts;
}

export function scoreByTermFrequency(terms: string[], counts: Map<string, number>): number {
  return terms.reduce((score, term) => score + (counts.get(term) ?? 0), 0);
}

/**
 * Search terms for a query: its tokens without stop words, plus their aliases. Empty when the query has no
 * searchable word, e.g. "how do i".
 */
export function queryTerms(query: string): string[] {
  const terms = tokenize(query).filter((term) => !STOP_WORDS.has(term));
  return [...new Set(terms.flatMap((term) => [term, ...(SEARCH_ALIASES[term] ?? [])]))];
}
