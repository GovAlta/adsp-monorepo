import { isAxiosError } from 'axios';

export function errorMessage(err: unknown): string {
  if (isAxiosError(err)) {
    return err.response?.data?.errorMessage ?? `${err.response?.status ?? ''} ${err.message}`.trim();
  }
  return err instanceof Error ? err.message : String(err);
}
