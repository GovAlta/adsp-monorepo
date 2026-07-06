import { SDK_REFERENCE, SdkSymbolDoc } from './reference';

function tokenize(text: string): string[] {
  return text.toLowerCase().match(/[a-z0-9]+/g) ?? [];
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

  return SDK_REFERENCE.map((symbol) => {
    const name = symbol.name.toLowerCase();
    let score = 0;

    if (name === normalizedQuery) {
      score += 100;
    } else if (name.startsWith(normalizedQuery)) {
      score += 50;
    } else if (name.includes(normalizedQuery)) {
      score += 25;
    }

    const haystack = tokenize(`${symbol.module} ${symbol.summary} ${symbol.details ?? ''}`);
    for (const term of terms) {
      score += haystack.filter((t) => t === term).length;
    }

    return { symbol, score };
  })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ symbol }) => symbol);
}
