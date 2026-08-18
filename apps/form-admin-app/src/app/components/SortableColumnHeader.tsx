import { GoabTableSortHeader } from '@abgov/react-components';
import { GoabTableOnSortDetail } from '@abgov/ui-components-common';
import { FunctionComponent, ReactNode } from 'react';
import { ResultsSort, SortDirection } from '../state';

interface SortableColumnHeaderProps {
  name: string;
  sort: ResultsSort;
  children: ReactNode;
}

// Renders a table heading that the user can sort on. The sort direction indicator reflects the sort
// applied to the results, so that it stays correct when results are sorted from outside the table.
export const SortableColumnHeader: FunctionComponent<SortableColumnHeaderProps> = ({ name, sort, children }) => (
  <th>
    <GoabTableSortHeader name={name} direction={sort?.field === name ? sort.direction : 'none'}>
      {children}
    </GoabTableSortHeader>
  </th>
);

// The table also raises the sort event for the sort it starts with, so changes that match the sort
// already applied are resolved to null and the caller can skip searching the results again.
export const toSortChange = (detail: GoabTableOnSortDetail, sort: ResultsSort): ResultsSort => {
  const direction: SortDirection = detail.sortDir === 1 ? 'asc' : 'desc';
  return !detail.sortBy || (detail.sortBy === sort?.field && direction === sort?.direction)
    ? null
    : { field: detail.sortBy, direction };
};
