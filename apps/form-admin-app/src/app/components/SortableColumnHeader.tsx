import { GoabTableSortHeader } from '@abgov/react-components';
import { GoabTableOnSortDetail } from '@abgov/ui-components-common';
import { FunctionComponent, ReactNode } from 'react';
import { ResultsSort, SortDirection } from '../state';

interface SortableColumnHeaderProps {
  name: string;
  sort: ResultsSort;
  // Columns that cannot be sorted on the current results render as a plain heading; the sort header
  // has no disabled state, and a control that does nothing reads as a fault rather than a limit.
  sortable?: boolean;
  // Identifies the message explaining why the column cannot be sorted, since the heading cannot say
  // so itself.
  describedBy?: string;
  children: ReactNode;
}

// Renders a table heading that the user can sort on. The sort direction indicator reflects the sort
// applied to the results, so that it stays correct when results are sorted from outside the table.
export const SortableColumnHeader: FunctionComponent<SortableColumnHeaderProps> = ({
  name,
  sort,
  sortable = true,
  describedBy,
  children,
}) =>
  sortable ? (
    <th>
      <GoabTableSortHeader name={name} direction={sort?.field === name ? sort.direction : 'none'}>
        {children}
      </GoabTableSortHeader>
    </th>
  ) : (
    <th aria-describedby={describedBy}>{children}</th>
  );

// The table also raises the sort event for the sort it starts with, so changes that match the sort
// already applied are resolved to null and the caller can skip searching the results again.
export const toSortChange = (detail: GoabTableOnSortDetail, sort: ResultsSort): ResultsSort => {
  const direction: SortDirection = detail.sortDir === 1 ? 'asc' : 'desc';
  return !detail.sortBy || (detail.sortBy === sort?.field && direction === sort?.direction)
    ? null
    : { field: detail.sortBy, direction };
};
