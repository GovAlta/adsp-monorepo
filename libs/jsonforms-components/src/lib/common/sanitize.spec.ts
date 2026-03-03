import { hasXSS, htmlSanitized, sanitizeHtml, XSSErrorMessage } from './sanitize';

describe('sanitize / xss utils', () => {
  describe('hasXSS', () => {
    it('returns false for plain safe html', () => {
      const html = '<div class="a"><p>Hello</p></div>';
      expect(hasXSS(html)).toBe(false);
    });

    it('returns true when script tag exists', () => {
      const html = '<div>ok</div><script>alert(1)</script>';
      expect(hasXSS(html)).toBe(true);
    });

    it('returns true for inline event handlers like onclick', () => {
      const html = `<img src="x" onerror="alert(1)" />`;
      expect(hasXSS(html)).toBe(true);
    });

    it('ignores doctype casing as per custom replacement', () => {
      const htmlUpper = '<!DOCTYPE html><div>hello</div>';
      const htmlLower = '<!doctype html><div>hello</div>';

      expect(hasXSS(htmlUpper)).toBe(false);
      expect(hasXSS(htmlLower)).toBe(false);
    });

    it('handles empty / nullish string input safely', () => {
      expect(hasXSS('')).toBe(false);
      expect(hasXSS(undefined as unknown as string)).toBe(false);
    });
  });

  describe('htmlSanitized', () => {
    it('removes script tags', () => {
      const dirty = `<div>hello</div><script>alert("x")</script>`;
      const clean = htmlSanitized(dirty);

      expect(clean).toContain('<div>hello</div>');
      expect(clean.toLowerCase()).not.toContain('<script');
      expect(clean.toLowerCase()).not.toContain('alert("x")');
    });

    it('keeps style tags (ADD_TAGS includes style) and sanitizes dangerous content', () => {
      const dirty = `
        <html><head>
          <style>.a{color:red}</style>
        </head>
        <body><div class="a">X</div></body></html>
      `;
      const clean = htmlSanitized(dirty);

      expect(clean.toLowerCase()).toContain('<style');
      expect(clean).toContain('.a{color:red}');
      expect(clean).toContain('class="a"');
    });

    it('forces target=_blank and rel=noopener noreferrer when target exists (hook)', () => {
      const dirty = `<a href="https://example.com" target="_self">go</a>`;
      const clean = htmlSanitized(dirty);

      expect(clean).toContain('target="_blank"');
      expect(clean).toContain('rel="noopener noreferrer"');
    });
  });

  describe('sanitizeHtml export', () => {
    it('sanitizeHtml is a function and can sanitize', () => {
      expect(typeof sanitizeHtml).toBe('function');

      const dirty = `<img src="x" onerror="alert(1)" />`;
      const clean = sanitizeHtml(dirty);

      // Dompurify should strip onerror
      expect(clean).toContain('<img');
      expect(clean.toLowerCase()).not.toContain('onerror');
    });
  });

  describe('XSSErrorMessage', () => {
    it('is defined and mentions <script>', () => {
      expect(XSSErrorMessage).toBeTruthy();
      expect(XSSErrorMessage.toLowerCase()).toContain('<script>');
    });
  });
});
