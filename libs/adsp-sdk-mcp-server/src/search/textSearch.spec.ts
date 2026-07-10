import { countTerms, scoreByTermFrequency, tokenize } from './textSearch';

describe('tokenize', () => {
  it('lowercases and splits on non-alphanumeric characters', () => {
    expect(tokenize('Send a Domain-Event!')).toEqual(['send', 'a', 'domain', 'event']);
  });

  it('returns an empty array for text with no alphanumeric characters', () => {
    expect(tokenize('---')).toEqual([]);
  });
});

describe('countTerms', () => {
  it('counts occurrences of each token', () => {
    const counts = countTerms(['event', 'service', 'event']);

    expect(counts.get('event')).toBe(2);
    expect(counts.get('service')).toBe(1);
    expect(counts.get('missing')).toBeUndefined();
  });
});

describe('scoreByTermFrequency', () => {
  it('sums counts for each queried term', () => {
    const counts = countTerms(['event', 'service', 'event']);

    expect(scoreByTermFrequency(['event', 'service'], counts)).toBe(3);
  });

  it('ignores terms that are not present', () => {
    const counts = countTerms(['event']);

    expect(scoreByTermFrequency(['missing'], counts)).toBe(0);
  });
});
