import type { FileServiceErrorReason } from './types';

const FILE_ERROR_MESSAGES: Readonly<Record<FileServiceErrorReason, string>> = {
  'not-found': "This file doesn't exist or has been removed.",
  unauthenticated: 'Sign in to download this file.',
  forbidden: "You don't have permission to download this file.",
  'scan-pending': 'This file is still being checked for viruses. Try again in a moment.',
  unavailable: "This file can't be downloaded.",
  unexpected: 'Something went wrong while downloading this file.',
};

// What to tell the user for each reason; shared so every framework adapter says the same thing.
export function getFileErrorMessage(reason: FileServiceErrorReason): string {
  return FILE_ERROR_MESSAGES[reason];
}
