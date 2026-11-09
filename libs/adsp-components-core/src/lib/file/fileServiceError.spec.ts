import { FileServiceError, getFileUnavailableReason, toFileServiceError } from './fileServiceError';
import { getFileErrorMessage } from './messages';

describe('FileServiceError', () => {
  it.each([
    ['scan-pending', true],
    ['unexpected', true],
    ['not-found', false],
    ['forbidden', false],
    ['unauthenticated', false],
    ['unavailable', false],
  ] as const)('marks %s as retryable: %s', (reason, retryable) => {
    expect(new FileServiceError(reason, 'message').retryable).toBe(retryable);
  });

  it('is an Error with the reason and status', () => {
    const error = new FileServiceError('not-found', 'File not found.', 404);

    expect(error).toBeInstanceOf(Error);
    expect(error).toMatchObject({ name: 'FileServiceError', reason: 'not-found', status: 404 });
  });
});

describe('toFileServiceError', () => {
  it('returns a FileServiceError unchanged', () => {
    const error = new FileServiceError('forbidden', 'Forbidden', 403);

    expect(toFileServiceError(error)).toBe(error);
  });

  it('treats any other error as unexpected', () => {
    const error = toFileServiceError(new TypeError('Failed to fetch'));

    expect(error).toMatchObject({ reason: 'unexpected', message: 'Failed to fetch', status: undefined });
  });

  it('treats a thrown non-error as unexpected', () => {
    expect(toFileServiceError('failed')).toMatchObject({ reason: 'unexpected', message: 'failed' });
  });
});

describe('getFileUnavailableReason', () => {
  it('returns nothing for a scanned, clean file', () => {
    expect(getFileUnavailableReason({ scanned: true, infected: false })).toBeUndefined();
  });

  it('returns scan-pending for a file not yet scanned', () => {
    expect(getFileUnavailableReason({ scanned: false, infected: false })).toBe('scan-pending');
  });

  it('returns unavailable for an infected file', () => {
    expect(getFileUnavailableReason({ scanned: true, infected: true })).toBe('unavailable');
  });
});

describe('getFileErrorMessage', () => {
  it.each(['not-found', 'unauthenticated', 'forbidden', 'scan-pending', 'unavailable', 'unexpected'] as const)(
    'has a message for %s',
    (reason) => {
      expect(getFileErrorMessage(reason)).toEqual(expect.any(String));
    },
  );

  it('tells the user a pending scan is worth trying again', () => {
    expect(getFileErrorMessage('scan-pending')).toBe(
      'This file is still being checked for viruses. Try again in a moment.',
    );
  });
});
