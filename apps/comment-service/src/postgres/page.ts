import { Results, encodeNext } from '@core-services/core-common';

// A page query fetches one row past the page, which shows whether another page follows. Counting a
// page that came back exactly full as having one offered a next page that turned out to be empty.
export function toPage<R, T>(rows: R[], top: number, skip: number, after: string, map: (row: R) => T): Results<T> {
  const pageRows = rows.slice(0, top);

  return {
    results: pageRows.map(map),
    page: {
      after,
      next: rows.length > top ? encodeNext(top, top, skip) : undefined,
      size: pageRows.length,
    },
  };
}
