import { parseFileSize, resolveMaxFileSize } from './maxFileSize';

describe('parseFileSize', () => {
  it('parses units case-insensitively', () => {
    expect(parseFileSize('20MB')).toBe(20 * 1024 ** 2);
    expect(parseFileSize('500 kb')).toBe(500 * 1024);
    expect(parseFileSize('1.5GB')).toBe(1.5 * 1024 ** 3);
  });

  it('returns undefined for unrecognized values', () => {
    expect(parseFileSize('big')).toBeUndefined();
    expect(parseFileSize(undefined)).toBeUndefined();
  });
});

describe('resolveMaxFileSize', () => {
  it('uses the form value when there is no host limit', () => {
    expect(resolveMaxFileSize('50MB', undefined)).toBe('50MB');
    expect(resolveMaxFileSize(undefined, undefined)).toBe('');
  });

  it('uses the host limit when the form sets none', () => {
    expect(resolveMaxFileSize(undefined, '20MB')).toBe('20MB');
  });

  it('keeps the smaller of the two', () => {
    expect(resolveMaxFileSize('50MB', '20MB')).toBe('20MB');
    expect(resolveMaxFileSize('5MB', '20MB')).toBe('5MB');
  });

  it('falls back to the host limit when the form value cannot be parsed', () => {
    expect(resolveMaxFileSize('lots', '20MB')).toBe('20MB');
  });
});
