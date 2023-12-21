import { SerializedAxiosError } from './types';

export function isAxiosErrorPayload(payload: unknown): payload is SerializedAxiosError {
  const error = payload as SerializedAxiosError;
  return typeof error?.status === 'number' && typeof error?.message === 'string';
}
