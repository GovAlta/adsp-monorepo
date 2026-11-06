import { InvalidOperationError } from '@core-services/core-common';
import { FieldMapping } from './types';

export const ITEM_KEY_COLUMN = 'AdspItemKey';
const KEY_SEPARATOR = '|';

export class RowIdentityMissingError extends InvalidOperationError {
  constructor(path: string) {
    super(`Data must have a value at row identity field '${path}'.`);
    Object.setPrototypeOf(this, RowIdentityMissingError.prototype);
  }
}

const valueAtPath = (data: unknown, path: string): unknown =>
  path
    .split('.')
    .reduce<unknown>(
      (current, segment) =>
        current !== null && typeof current === 'object' ? (current as Record<string, unknown>)[segment] : undefined,
      data,
    );

export function itemKeyFor(idempotencyFields: string[] | undefined, data: Record<string, unknown>): string | null {
  if (!idempotencyFields?.length) {
    return null;
  }
  return idempotencyFields
    .map((path) => {
      const value = valueAtPath(data, path);
      if (value === undefined || value === null || typeof value === 'object') {
        throw new RowIdentityMissingError(path);
      }
      return String(value);
    })
    .join(KEY_SEPARATOR);
}

export function mapFields(
  mappings: FieldMapping[],
  data: Record<string, unknown>,
  key: string | null,
): Record<string, unknown> {
  const fields: Record<string, unknown> = {};
  for (const { source, target } of mappings) {
    const value = valueAtPath(data, source);
    if (value !== undefined) {
      fields[target] = value;
    }
  }
  if (key === null) {
    delete fields[ITEM_KEY_COLUMN];
  } else {
    fields[ITEM_KEY_COLUMN] = key;
  }
  return fields;
}
