// Long enough for every browser to start reading the blob; FileSaver.js uses the same delay.
const REVOKE_DELAY_MS = 40_000;

// The download needs the user's bearer token, so a plain <a href> can't fetch it. Save the fetched blob instead.
export function saveFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener';

  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), REVOKE_DELAY_MS);
}
