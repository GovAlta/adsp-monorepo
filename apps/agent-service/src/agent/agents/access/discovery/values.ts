/**
 * Readers for untrusted JSON values from Keycloak and tenant-service. Each returns undefined (or an empty list)
 * for anything of the wrong type, so unexpected response shapes can never leak through as other types.
 */

export function optionalString(value: unknown): string | undefined {
  return typeof value === 'string' ? value : undefined;
}

export function optionalBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function stringList(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

export function recordList(value: unknown): Record<string, unknown>[] {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

export function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

export function asRecord(value: unknown): Record<string, unknown> {
  return isRecord(value) ? value : {};
}

/**
 * Keycloak stores client and mapper settings as strings, using an empty string for "not set".
 */
export function attributeString(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() !== '' ? value : undefined;
}

// Keycloak names its built-in clients and roles with localization keys such as ${client_account}.
const KEYCLOAK_MESSAGE_KEY = /^\$\{[^}]+\}$/;

/**
 * Reads a display name or description, treating a Keycloak localization key as not set since it is not readable text.
 */
export function displayText(value: unknown): string | undefined {
  const text = attributeString(value);
  return text && !KEYCLOAK_MESSAGE_KEY.test(text.trim()) ? text : undefined;
}

/**
 * Keycloak stores client and mapper settings as the strings "true" and "false".
 */
export function attributeBoolean(value: unknown): boolean | undefined {
  if (value === 'true') {
    return true;
  }
  if (value === 'false') {
    return false;
  }
  return undefined;
}

export function attributeNumber(value: unknown): number | undefined {
  if (typeof value !== 'string' || value.trim() === '') {
    return undefined;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}
