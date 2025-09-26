import { SerializedAxiosError } from './types';

export function isAxiosErrorPayload(payload: unknown): payload is SerializedAxiosError {
  const error = payload as SerializedAxiosError;
  return typeof error?.status === 'number' && typeof error?.message === 'string';
}

export function hasRole(role: string | string[], user: { roles?: string[] }): boolean {
  const roles = Array.isArray(role) ? role : [role];
  return !!roles.find((r) => user?.roles?.includes(r));
}
