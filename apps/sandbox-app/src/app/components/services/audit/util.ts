import { isAxiosError } from 'axios';

export const isForbidden = (err: unknown) => isAxiosError(err) && err.response?.status === 403;

export function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    return err.response?.data?.errorMessage ?? `${err.response?.status ?? ''} ${err.message}`.trim();
  }
  return err instanceof Error ? err.message : String(err);
}

// Error bodies arrive as Blobs when a request uses responseType 'blob'; read the server's message out of them.
export async function exportErrorMessage(err: unknown): Promise<string> {
  const response = isAxiosError(err) ? err.response : undefined;
  if (response?.data instanceof Blob) {
    const text = await response.data.text();
    try {
      return JSON.parse(text).errorMessage ?? `${response.status} ${text}`;
    } catch {
      return `${response.status} ${text}`.trim();
    }
  }
  return errorMessage(err);
}

export function downloadCsv(filename: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
