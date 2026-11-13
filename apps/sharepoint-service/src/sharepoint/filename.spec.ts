import { sanitizePathSegment } from './filename';

describe('sanitizePathSegment', () => {
  it('keeps a normal name unchanged', () => {
    expect(sanitizePathSegment('Proof of identity (1).pdf', 'file')).toBe('Proof of identity (1).pdf');
  });

  it.each(['"', '*', ':', '<', '>', '?', '/', '\\', '|'])('replaces the forbidden character %s', (character) => {
    expect(sanitizePathSegment(`a${character}b.pdf`, 'file')).toBe('a_b.pdf');
  });

  it('replaces control characters', () => {
    expect(sanitizePathSegment('a\u0001b\tc.txt', 'file')).toBe('a_b_c.txt');
  });

  it('removes leading and trailing spaces and dots', () => {
    expect(sanitizePathSegment('  report.pdf. ', 'file')).toBe('report.pdf');
  });

  it('removes non-breaking and other Unicode spaces at the edges', () => {
    expect(sanitizePathSegment('\u00a0 report.pdf \u2003', 'file')).toBe('report.pdf');
  });

  it('keeps spaces and dots inside the name', () => {
    expect(sanitizePathSegment('my  report..v2.pdf', 'file')).toBe('my  report..v2.pdf');
  });

  it('handles long runs of spaces without slowing down', () => {
    const started = Date.now();

    expect(sanitizePathSegment(`${' '.repeat(100000)}a${' '.repeat(100000)}x`, 'file')).toHaveLength(200);
    expect(sanitizePathSegment(' '.repeat(200000), 'file')).toBe('file');
    expect(Date.now() - started).toBeLessThan(1000);
  });

  it('neutralises path traversal', () => {
    expect(sanitizePathSegment('../../etc/passwd', 'file')).toBe('_.._etc_passwd');
    expect(sanitizePathSegment('..', 'file')).toBe('file');
    expect(sanitizePathSegment('..\\secret.txt', 'file')).toBe('_secret.txt');
  });

  it('uses the fallback when nothing is left', () => {
    expect(sanitizePathSegment('   ', 'submission')).toBe('submission');
    expect(sanitizePathSegment('', 'submission')).toBe('submission');
    expect(sanitizePathSegment(undefined as unknown as string, 'submission')).toBe('submission');
  });

  it.each(['CON', 'nul.txt', 'COM1.pdf', 'lpt9', '~$temp.docx', '_vti_'])('prefixes the reserved name %s', (name) => {
    expect(sanitizePathSegment(name, 'file')).toBe(`_${name}`);
  });

  it('does not treat a longer name starting with a reserved word as reserved', () => {
    expect(sanitizePathSegment('console.log', 'file')).toBe('console.log');
  });

  it('shortens a long name but keeps its extension', () => {
    const result = sanitizePathSegment(`${'a'.repeat(300)}.pdf`, 'file');

    expect(result).toHaveLength(200);
    expect(result.endsWith('.pdf')).toBe(true);
  });

  it('shortens a long name without an extension', () => {
    expect(sanitizePathSegment('b'.repeat(300), 'file')).toHaveLength(200);
  });
});
