import { countTerms, scoreByTermFrequency, tokenize } from '../search/textSearch';
import { SDK_REFERENCE, SdkSymbolDoc } from './reference';

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

function scoreSymbol(symbol: SdkSymbolDoc, normalizedQuery: string, terms: string[]): number {
  const haystackCounts = countTerms(tokenize(`${symbol.module} ${symbol.summary} ${symbol.details ?? ''}`));
  return scoreNameMatch(symbol.name.toLowerCase(), normalizedQuery) + scoreByTermFrequency(terms, haystackCounts);
}

/**
 * Searches the curated SDK reference by symbol name, module, and summary/details text.
 * Ranks exact/prefix name matches highest so an exact symbol name always surfaces as the top hit.
 */
export function searchSdkReference(query: string, limit = 5): SdkSymbolDoc[] {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) {
    return [];
  }

  const terms = tokenize(query);

  return SDK_REFERENCE.map((symbol) => ({ symbol, score: scoreSymbol(symbol, normalizedQuery, terms) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ symbol }) => symbol);
}
