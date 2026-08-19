import { InvalidOperationError } from '@core-services/core-common';
import { ResultsSort } from '../form';

// Data value columns are sorted by the path into the form data, prefixed to distinguish them from
// the fields of the form or submission itself.
const DATA_VALUE_PREFIX = 'data.';
const DATA_VALUE_PATH_PATTERN = /^[a-zA-Z0-9_-]+(\.[a-zA-Z0-9_-]+)*$/;

const DEFAULT_SORT: Record<string, 1 | -1> = { created: -1 };

interface SortField {
  field: string;
  // Data values are at paths that vary by definition, so there is no index declared for them and
  // the sort has to be one the database can serve without one.
  isDataValue: boolean;
}

function toSortField(sort: ResultsSort, fields: Record<string, string>, dataField: string): SortField {
  // Own properties only; a lookup of an inherited name (constructor, toString) would otherwise pass
  // for a mapped field and put a value that is not a field name into the sort.
  if (Object.prototype.hasOwnProperty.call(fields, sort.field)) {
    return { field: fields[sort.field], isDataValue: false };
  }

  if (sort.field.startsWith(DATA_VALUE_PREFIX)) {
    const path = sort.field.substring(DATA_VALUE_PREFIX.length);
    if (DATA_VALUE_PATH_PATTERN.test(path)) {
      return { field: `${dataField}.${path}`, isDataValue: true };
    }
  }

  throw new InvalidOperationError(`Cannot sort results on field: ${sort.field}`);
}

// Results are sorted on a single column, with the create date as tie breaker so that paging over
// values shared by many records (e.g. a status) returns each record exactly once. The tie breaker
// follows the sort direction rather than being pinned to descending, so that one composite index
// serves the column in both directions.
//
// A sort on more than one key has to be served from a composite index, which can only be declared
// for the columns known ahead of time. Data value columns are at paths that vary by definition, so
// they are sorted on their key alone and ties there fall back to the natural order.
export function toSortQuery(
  sort: ResultsSort,
  fields: Record<string, string>,
  dataField: string,
): Record<string, 1 | -1> {
  if (!sort?.field) {
    return DEFAULT_SORT;
  }

  const { field, isDataValue } = toSortField(sort, fields, dataField);
  const direction = sort.direction === 'asc' ? 1 : -1;

  if (field === 'created' || isDataValue) {
    return { [field]: direction };
  }

  return { [field]: direction, created: direction };
}

// The database rejects a sort it has no index to serve rather than sorting the results itself, and
// reports it as a server error that says nothing about which column was at fault. Recognize it so
// the caller is told what it asked for that cannot be done, instead of an unexplained failure.
const UNSERVABLE_SORT_PATTERN = /order.by|composite index/i;

export function toSortError(err: Error, sort: ResultsSort): Error {
  return sort?.field && UNSERVABLE_SORT_PATTERN.test(err?.message || '')
    ? new InvalidOperationError(`Cannot sort results on field: ${sort.field}`)
    : err;
}
