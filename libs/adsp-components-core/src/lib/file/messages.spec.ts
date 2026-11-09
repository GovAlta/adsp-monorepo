import { getFileErrorMessage } from './messages';
import type { FileServiceErrorReason } from './types';

const REASONS: FileServiceErrorReason[] = [
  'not-found',
  'unauthenticated',
  'forbidden',
  'scan-pending',
  'unavailable',
  'unexpected',
];

describe('getFileErrorMessage', () => {
  it.each([
    ['not-found', "This file doesn't exist or has been removed."],
    ['unauthenticated', 'Sign in to download this file.'],
    ['forbidden', "You don't have permission to download this file."],
    ['scan-pending', 'This file is still being checked for viruses. Try again in a moment.'],
    ['unavailable', "This file can't be downloaded."],
    ['unexpected', 'Something went wrong while downloading this file.'],
  ] as [FileServiceErrorReason, string][])('explains %s', (reason, expected) => {
    expect(getFileErrorMessage(reason)).toBe(expected);
  });

  it('gives every reason its own message', () => {
    const messages = REASONS.map(getFileErrorMessage);

    expect(new Set(messages).size).toBe(REASONS.length);
  });
});
