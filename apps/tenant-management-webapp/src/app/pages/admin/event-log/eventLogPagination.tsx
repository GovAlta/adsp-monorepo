import React, { FunctionComponent } from 'react';
import { GoabBlock, GoabSpacer } from '@abgov/react-components';
import { Pagination, PaginationOnChangeDetail } from '@core-services/app-common';

interface EventLogPaginationProps {
  // One based.
  page: number;
  pageSize: number;
  shownCount: number;
  total: number;
  onPage: (page: number) => void;
}

export const EventLogPagination: FunctionComponent<EventLogPaginationProps> = ({
  page,
  pageSize,
  shownCount,
  total,
  onPage,
}) => {
  if (total <= 0) {
    return null;
  }

  const first = (page - 1) * pageSize + 1;
  const last = (page - 1) * pageSize + shownCount;

  return (
    <GoabBlock alignment="center" width="100%" mt="m">
      <span data-testid="event-log-result-count" aria-live="polite">
        {`Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()} ${
          total === 1 ? 'event' : 'events'
        }`}
      </span>
      <GoabSpacer hSpacing="fill" />
      {total > pageSize && (
        <Pagination
          itemCount={total}
          perPageCount={pageSize}
          pageNumber={page}
          testId="event-log-pagination"
          onChange={(detail: PaginationOnChangeDetail) => onPage(detail.page)}
        />
      )}
    </GoabBlock>
  );
};
