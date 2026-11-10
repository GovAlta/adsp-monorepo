import { getFileErrorMessage, getFileUploadErrorMessage } from './messages';
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

describe('getFileUploadErrorMessage', () => {
  it.each([
    ['not-found', "Files can't be uploaded here because the file type isn't set up."],
    ['unauthenticated', 'Sign in to upload files.'],
    ['forbidden', "You don't have permission to upload files here."],
    ['unavailable', "File service didn't accept this file. Check the file and try again."],
    ['unexpected', 'Something went wrong while uploading this file.'],
  ] as [FileServiceErrorReason, string][])('explains %s', (reason, expected) => {
    expect(getFileUploadErrorMessage(reason)).toBe(expected);
  });

  it('gives every reason its own message', () => {
    const messages = REASONS.map(getFileUploadErrorMessage);

    expect(new Set(messages).size).toBe(REASONS.length);
  });
});
