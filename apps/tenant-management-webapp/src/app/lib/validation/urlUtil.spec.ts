import { isValidUrl } from './urlUtil';

describe('isValidUrl', () => {
  it('accepts http urls', () => {
    expect(isValidUrl('http://example.com')).toBe(true);
  });

  it('accepts https urls', () => {
    expect(isValidUrl('https://example.com/path?query=1#hash')).toBe(true);
  });

  it('rejects protocols other than http and https', () => {
    expect(isValidUrl('ftp://example.com')).toBe(false);
    expect(isValidUrl('mailto:someone@example.com')).toBe(false);
    // Built at runtime so the literal does not trip the no-script-url lint rule.
    expect(isValidUrl(['javascript', 'alert(1)'].join(':'))).toBe(false);
  });

  it('rejects strings the URL parser cannot handle', () => {
    expect(isValidUrl('not a url')).toBe(false);
    expect(isValidUrl('example.com')).toBe(false);
    expect(isValidUrl('')).toBe(false);
  });

  it('rejects nullish input without throwing', () => {
    expect(isValidUrl(undefined as unknown as string)).toBe(false);
    expect(isValidUrl(null as unknown as string)).toBe(false);
  });
});
