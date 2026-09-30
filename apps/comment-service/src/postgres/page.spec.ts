import { decodeAfter } from '@core-services/core-common';
import { toPage } from './page';

describe('toPage', () => {
  const double = (value: number) => value * 2;

  it('returns a next page when a row follows the page', () => {
    const { results, page } = toPage([1, 2, 3], 2, 4, 'after', double);

    expect(results).toEqual([2, 4]);
    expect(page.after).toBe('after');
    expect(page.size).toBe(2);
    expect(decodeAfter(page.next)).toBe(6);
  });

  it('returns no next page when a full page is the last one', () => {
    const { results, page } = toPage([1, 2], 2, 0, undefined, double);

    expect(results).toEqual([2, 4]);
    expect(page.size).toBe(2);
    expect(page.next).toBeUndefined();
  });

  it('returns no next page for a partial page', () => {
    const { page } = toPage([1], 2, 0, undefined, double);

    expect(page.size).toBe(1);
    expect(page.next).toBeUndefined();
  });
});
