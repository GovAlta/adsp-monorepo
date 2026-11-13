import { formatAllowedFileTypes, formatFileSize, isFileFormatAllowed } from './format';

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

describe('isFileFormatAllowed', () => {
  it.each([
    ['report.pdf', [], true],
    ['report.PDF', ['.pdf'], true],
    ['report.pdf', [' .Pdf '], true],
    ['clip.mp4', ['.pdf', '.docx'], false],
    ['README', ['.pdf'], false],
    ['archive.tar.gz', ['.gz'], true],
  ] as [string, string[], boolean][])('%s with %p is %s', (filename, allowed, expected) => {
    expect(isFileFormatAllowed(filename, allowed)).toBe(expected);
  });
});

describe('formatAllowedFileTypes', () => {
  it.each([
    [[], ''],
    [['.pdf'], '.pdf'],
    [['.pdf', '.docx'], '.pdf or .docx'],
    [['.pdf', '.docx', '.png'], '.pdf, .docx or .png'],
  ] as [string[], string][])('formats %p as %p', (allowed, expected) => {
    expect(formatAllowedFileTypes(allowed)).toBe(expected);
  });
});
