import { InvalidOperationError } from '@core-services/core-common';
import { valueAtPath } from './dataPath';
import { FieldMapping } from './types';

export const ITEM_KEY_COLUMN = 'AdspItemKey';
const KEY_SEPARATOR = '|';
const COLLECTION_TYPE = 'Collection(Edm.String)';

export class RowIdentityMissingError extends InvalidOperationError {
  constructor(path: string) {
    super(`Data must have a value at row identity field '${path}'.`);
    Object.setPrototypeOf(this, RowIdentityMissingError.prototype);
  }
}

const isPlainValueArray = (value: unknown): value is (string | number)[] =>
  Array.isArray(value) && value.every((item) => typeof item === 'string' || typeof item === 'number');

// Mappings saved before column types existed mark a Hyperlink column with linkFormat instead.
const isHyperlinkColumn = ({ columnType, linkFormat }: FieldMapping) =>
  columnType ? columnType === 'hyperlink' : linkFormat === 'hyperlink';

// SharePoint rejects any text in a Hyperlink column, so an empty answer, such as an optional file left blank, clears it with null.
const isEmptyLink = (mapping: FieldMapping, value: unknown) => value === '' && isHyperlinkColumn(mapping);

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
  for (const mapping of mappings) {
    const { source, target } = mapping;
    const value = valueAtPath(data, source);
    if (isPlainValueArray(value)) {
      fields[`${target}@odata.type`] = COLLECTION_TYPE;
      fields[target] = value.map(String);
    } else if (value !== undefined) {
      fields[target] = isEmptyLink(mapping, value) ? null : value;
    }
  }
  delete fields[`${ITEM_KEY_COLUMN}@odata.type`];
  if (key === null) {
    delete fields[ITEM_KEY_COLUMN];
  } else {
    fields[ITEM_KEY_COLUMN] = key;
  }
  return fields;
}
