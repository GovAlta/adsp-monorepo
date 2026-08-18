// clean-code-ignore: RULE-19 — type declarations only; the sort they describe is covered by
// ../../mongo/sort.spec.ts.
export type SortDirection = 'asc' | 'desc';

// Sorting of forms and submissions is single column; the field is a logical column name that the
// repository maps onto the underlying document, so that stored field names are not part of the API.
export interface ResultsSort {
  field: string;
  direction: SortDirection;
}
