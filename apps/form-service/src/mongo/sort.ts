import { InvalidOperationError } from '@core-services/core-common';
import { ResultsSort } from '../form';

// Data value columns are sorted by the path into the form data, prefixed to distinguish them from
// the fields of the form or submission itself.
const DATA_VALUE_PREFIX = 'data.';
const DATA_VALUE_PATH_PATTERN = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/;

const DEFAULT_SORT: Record<string, 1 | -1> = { created: -1 };

function toSortField(sort: ResultsSort, fields: Record<string, string>, dataField: string): string {
  const field = fields[sort.field];
  if (field) {
    return field;
  }

  if (sort.field.startsWith(DATA_VALUE_PREFIX)) {
    const path = sort.field.substring(DATA_VALUE_PREFIX.length);
    if (DATA_VALUE_PATH_PATTERN.test(path)) {
      return `${dataField}.${path}`;
    }
  }

  throw new InvalidOperationError(`Cannot sort results on field: ${sort.field}`);
}

// Results are sorted on a single column, with the create date as tie breaker so that paging over
// values shared by many records (e.g. a status) returns each record exactly once.
export function toSortQuery(
  sort: ResultsSort,
  fields: Record<string, string>,
  dataField: string,
): Record<string, 1 | -1> {
  if (!sort?.field) {
    return DEFAULT_SORT;
  }

  const field = toSortField(sort, fields, dataField);
  const direction = sort.direction === 'asc' ? 1 : -1;

  return field === 'created' ? { created: direction } : { [field]: direction, created: -1 };
}
