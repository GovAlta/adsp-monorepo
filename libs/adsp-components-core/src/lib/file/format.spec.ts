import { formatFileSize } from './format';

describe('formatFileSize', () => {
  it.each([
    [0, '0 B'],
    [999, '999 B'],
    [1000, '1.0 KB'],
    [1536, '1.5 KB'],
    [24_000, '24 KB'],
    [1_048_576, '1.0 MB'],
    [987_654_321, '988 MB'],
    [2_500_000_000, '2.5 GB'],
    [5_000_000_000_000_000, '5000 TB'],
  ])('formats %s bytes as %s', (bytes, expected) => {
    expect(formatFileSize(bytes)).toBe(expected);
  });

  it.each([[-1], [Number.NaN], [Number.POSITIVE_INFINITY]])('returns an empty string for %s', (bytes) => {
    expect(formatFileSize(bytes)).toBe('');
  });
});
