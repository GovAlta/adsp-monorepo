import { SerializedAxiosError } from './types';

export function isAxiosErrorPayload(payload: unknown): payload is SerializedAxiosError {
  const error = payload as SerializedAxiosError;
  return typeof error?.status === 'number' && typeof error?.message === 'string';
}

export function hasRole(role: string | string[], user: { roles?: string[] }): boolean {
  const roles = Array.isArray(role) ? role : [role];
  return !!roles.find((r) => user?.roles?.includes(r));
}

export async function hashData(data: unknown) {
  let result = null;
  if (data) {
    const encoder = new TextEncoder();
    const digestOutput = await crypto.subtle.digest('SHA-256', encoder.encode(JSON.stringify(data)));
    result = await new Promise((resolved) => {
      const reader = new FileReader();
      reader.readAsDataURL(new Blob([digestOutput]));
      reader.onload = (ev) => {
        const [_, digestBase64] = (ev.target.result as string).split(',');
        resolved(digestBase64);
      };
    });
  }
  return result;
}
