import React, { FunctionComponent } from 'react';
import styled from 'styled-components';

type PageItem = number | 'ellipsis';

const MAX_PAGE_ITEMS = 7;

// Keeps the first page, the last page and the neighbours of the current page, so the control width stays fixed.
export const getPageItems = (page: number, pageCount: number): PageItem[] => {
  if (pageCount <= MAX_PAGE_ITEMS) {
    return Array.from({ length: pageCount }, (_, index) => index + 1);
  }
  if (page <= 4) {
    return [1, 2, 3, 4, 5, 'ellipsis', pageCount];
  }
  if (page >= pageCount - 3) {
    return [1, 'ellipsis', pageCount - 4, pageCount - 3, pageCount - 2, pageCount - 1, pageCount];
  }
  return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', pageCount];
};

interface EventLogPaginationProps {
  // One based.
  page: number;
  pageSize: number;
  shownCount: number;
  total: number;
  disabled?: boolean;
  onPage: (page: number) => void;
}

export const EventLogPagination: FunctionComponent<EventLogPaginationProps> = ({
  page,
  pageSize,
  shownCount,
  total,
  disabled = false,
  onPage,
}) => {
  if (total <= 0) {
    return null;
  }

  const pageCount = Math.ceil(total / pageSize);
  const first = (page - 1) * pageSize + 1;
  const last = (page - 1) * pageSize + shownCount;
  const isFirstPage = page <= 1;
  const isLastPage = page >= pageCount;

  return (
    <PaginationRow>
      <span data-testid="event-log-result-count" aria-live="polite">
        {`Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()} ${
          total === 1 ? 'event' : 'events'
        }`}
      </span>
      {pageCount > 1 && (
        <PageControls aria-label="Event log pages" data-testid="event-log-pagination">
          <PageButton
            type="button"
            aria-label="First page"
            disabled={disabled || isFirstPage}
            onClick={() => onPage(1)}
            data-testid="event-log-page-first"
          >
            <span aria-hidden="true">‹</span> First
          </PageButton>
          <PageButton
            type="button"
            aria-label="Previous page"
            disabled={disabled || isFirstPage}
            onClick={() => onPage(page - 1)}
            data-testid="event-log-page-previous"
          >
            <span aria-hidden="true">‹</span> Previous
          </PageButton>
          {getPageItems(page, pageCount).map((item, index) =>
            item === 'ellipsis' ? (
              <Ellipsis key={`ellipsis-${index}`} aria-hidden="true">
                …
              </Ellipsis>
            ) : (
              <PageButton
                key={item}
                type="button"
                aria-label={`Page ${item}`}
                aria-current={item === page ? 'page' : undefined}
                disabled={disabled}
                onClick={() => item !== page && onPage(item)}
                data-testid={`event-log-page-${item}`}
              >
                {item}
              </PageButton>
            ),
          )}
          <PageButton
            type="button"
            aria-label="Next page"
            disabled={disabled || isLastPage}
            onClick={() => onPage(page + 1)}
            data-testid="event-log-page-next"
          >
            Next <span aria-hidden="true">›</span>
          </PageButton>
          <PageButton
            type="button"
            aria-label="Last page"
            disabled={disabled || isLastPage}
            onClick={() => onPage(pageCount)}
            data-testid="event-log-page-last"
          >
            Last <span aria-hidden="true">›</span>
          </PageButton>
        </PageControls>
      )}
    </PaginationRow>
  );
};

const PaginationRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
  margin-top: var(--goa-space-m);
`;

const PageControls = styled.nav`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--goa-space-2xs);
`;

const PageButton = styled.button`
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 var(--goa-space-xs);
  border: var(--goa-border-width-s) solid transparent;
  border-radius: var(--goa-border-radius-m);
  background: transparent;
  color: var(--goa-color-interactive-default);
  font: inherit;
  cursor: pointer;

  &:hover:enabled {
    background: var(--goa-color-greyscale-100);
    color: var(--goa-color-interactive-hover);
  }

  &:focus-visible {
    outline: var(--goa-border-width-l) solid var(--goa-color-interactive-focus);
    outline-offset: 1px;
  }

  &:disabled {
    color: var(--goa-color-greyscale-400);
    cursor: not-allowed;
  }

  &[aria-current='page'] {
    background: var(--goa-color-interactive-default);
    color: var(--goa-color-greyscale-white);
    font-weight: var(--goa-font-weight-bold);
  }
`;

const Ellipsis = styled.span`
  min-width: 1.5rem;
  text-align: center;
`;
