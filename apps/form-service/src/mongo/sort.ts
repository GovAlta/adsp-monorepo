import { InvalidOperationError } from '@core-services/core-common';
import { ResultsSort } from '../form';

const DEFAULT_SORT: Record<string, 1 | -1> = { created: -1 };

// Results can only be sorted on a column with an index behind it, since the sort is served from the
// index rather than applied to the results in memory. Form data values sit at paths that vary by
// definition and so cannot be indexed ahead of time; those columns are sorted by the client over a
// result set small enough to load in full, and are rejected here.
function toSortField(sort: ResultsSort, fields: Record<string, string>): string {
  // Own properties only; a lookup of an inherited name (constructor, toString) would otherwise pass
  // for a mapped field and put a value that is not a field name into the sort.
  if (!Object.prototype.hasOwnProperty.call(fields, sort.field)) {
    throw new InvalidOperationError(`Cannot sort results on field: ${sort.field}`);
  }

  return fields[sort.field];
}

// Results are sorted on a single column, with the create date as tie breaker so that paging over
// values shared by many records (e.g. a status) returns each record exactly once. The tie breaker
// follows the sort direction rather than being pinned to descending, so that one composite index
// serves the column in both directions.
export function toSortQuery(sort: ResultsSort, fields: Record<string, string>): Record<string, 1 | -1> {
  if (!sort?.field) {
    return DEFAULT_SORT;
  }

  const field = toSortField(sort, fields);
  const direction = sort.direction === 'asc' ? 1 : -1;

  return field === 'created' ? { created: direction } : { [field]: direction, created: direction };
}
