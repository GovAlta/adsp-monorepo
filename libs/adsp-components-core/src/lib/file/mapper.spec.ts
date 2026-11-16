import { getContentDispositionFilename, toErrorReason } from './mapper';

describe('getContentDispositionFilename', () => {
  it.each([
    ["attachment; filename*=UTF-8''report.pdf", 'report.pdf'],
    ["inline; filename*=UTF-8''my%20file%20%281%29.docx", 'my file (1).docx'],
    ['attachment; filename="plain name.txt"', 'plain name.txt'],
    ['attachment; filename=unquoted.txt', 'unquoted.txt'],
    ['attachment; filename="fallback.txt"; filename*=UTF-8\'\'preferred.txt', 'preferred.txt'],
  ])('reads the filename from %s', (header, filename) => {
    expect(getContentDispositionFilename(header)).toBe(filename);
  });

  it('falls back to the plain filename when the encoded one is malformed', () => {
    expect(getContentDispositionFilename('attachment; filename="plain.txt"; filename*=UTF-8\'\'bad%E0%A4%A')).toBe(
      'plain.txt',
    );
  });

  it.each([[null], [''], ['attachment']])('returns undefined for %p', (header) => {
    expect(getContentDispositionFilename(header)).toBeUndefined();
  });
});

describe('toErrorReason', () => {
  it.each([
    [401, undefined, 'unauthenticated'],
    [403, undefined, 'forbidden'],
    [404, undefined, 'not-found'],
    [400, 'File scan pending.', 'scan-pending'],
    [400, 'Cannot access file marked for deletion.', 'unavailable'],
    [400, undefined, 'unavailable'],
    [400, 'Value not valid for file type: Invalid file type extension: .mp4', 'unsupported-format'],
    [500, undefined, 'unexpected'],
    [503, undefined, 'unexpected'],
  ])('maps status %s with message %p to %s', (status, message, reason) => {
    expect(toErrorReason(status, message)).toBe(reason);
  });
});
