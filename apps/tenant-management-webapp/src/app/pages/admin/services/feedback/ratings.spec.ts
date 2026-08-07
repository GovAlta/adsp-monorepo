import { ratings, getRatingLabelByValue, toDisplayRating } from './ratings';

describe('toDisplayRating', () => {
  // feedback-service records Rating.terrible = 0 through Rating.delightful = 4.
  it.each([
    [0, 1, 'Very Difficult'],
    [1, 2, 'Difficult'],
    [2, 3, 'Neutral'],
    [3, 4, 'Easy'],
    [4, 5, 'Very Easy'],
  ])('maps recorded rating %s to display value %s (%s)', (raw, expected, label) => {
    expect(toDisplayRating(raw)).toBe(expected);
    expect(getRatingLabelByValue(expected)).toBe(label);
  });

  it('shifts a fractional average onto the label scale', () => {
    expect(toDisplayRating(1.4)).toBe(2.4);
  });

  it('rounds to a single decimal', () => {
    expect(toDisplayRating(1.26)).toBe(2.3);
  });

  it.each([[undefined], [null]])('returns undefined for %s', (raw) => {
    expect(toDisplayRating(raw as unknown as number)).toBeUndefined();
  });

  it('covers the whole label scale', () => {
    expect(ratings.map((r) => r.value)).toEqual([1, 2, 3, 4, 5]);
  });
});
