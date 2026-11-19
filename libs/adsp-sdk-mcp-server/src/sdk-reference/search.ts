import { countTerms, queryTerms, scoreByTermFrequency, tokenize } from '../search/textSearch';
import { SDK_REFERENCE, SdkSymbolDoc } from './reference';

// Some names differ only in case (AdspId and adspId), so the exact one must outrank the other.
const EXACT_CASE_BONUS = 100;

function scoreNameMatch(name: string, normalizedQuery: string): number {
  if (name === normalizedQuery) {
    return 100;
  }
  if (name.startsWith(normalizedQuery)) {
    return 50;
  }
  if (name.includes(normalizedQuery)) {
    return 25;
  }
  return 0;
}

function scoreSymbol(symbol: SdkSymbolDoc, query: string, terms: string[]): number {
  const haystackCounts = countTerms(tokenize(`${symbol.module} ${symbol.summary} ${symbol.details ?? ''}`));
  return (
    (symbol.name === query ? EXACT_CASE_BONUS : 0) +
    scoreNameMatch(symbol.name.toLowerCase(), query.toLowerCase()) +
    scoreByTermFrequency(terms, haystackCounts)
  );
}

/**
 * Searches the curated SDK reference by symbol name, module, and summary/details text.
 * Ranks exact/prefix name matches highest so an exact symbol name always surfaces as the top hit.
 */
export function searchSdkReference(query: string, limit = 5): SdkSymbolDoc[] {
  const trimmed = query.trim();
  if (!trimmed) {
    return [];
  }

  const terms = queryTerms(query);

  return SDK_REFERENCE.map((symbol) => ({ symbol, score: scoreSymbol(symbol, trimmed, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ symbol }) => symbol);
}
