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
