import React, { FunctionComponent } from 'react';
import { GoabBlock, GoabDropdown, GoabDropdownItem, GoabSpacer } from '@abgov/react-components';
import { Pagination, PaginationOnChangeDetail } from '@core-services/app-common';
import { EVENT_LOG_PAGE_SIZES } from '@store/event/models';

interface EventLogPaginationProps {
  // One based.
  page: number;
  pageSize: number;
  shownCount: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}

export const EventLogPagination: FunctionComponent<EventLogPaginationProps> = ({
  page,
  pageSize,
  shownCount,
  total,
  onPage,
  onPageSize,
}) => {
  if (total <= 0) {
    return null;
  }

  const first = (page - 1) * pageSize + 1;
  const last = (page - 1) * pageSize + shownCount;

  return (
    <GoabBlock alignment="center" width="100%" mt="m">
      {total > EVENT_LOG_PAGE_SIZES[0] && (
        <GoabBlock alignment="center">
          <span>Show</span>
          <GoabDropdown
            name="event-log-page-size"
            ariaLabel="Events per page"
            value={`${pageSize}`}
            size="compact"
            width="9ch"
            testId="event-log-page-size"
            onChange={(detail) => onPageSize(Number(detail.value))}
          >
            {EVENT_LOG_PAGE_SIZES.map((size) => (
              <GoabDropdownItem key={size} value={`${size}`} label={`${size}`} />
            ))}
          </GoabDropdown>
          <span>per page</span>
        </GoabBlock>
      )}
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
