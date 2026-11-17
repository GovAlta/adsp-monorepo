import React, { FunctionComponent } from 'react';
import { GoabDropdown, GoabDropdownItem } from '@abgov/react-components';
import { Pagination, PaginationOnChangeDetail } from '@core-services/app-common';
import { FEEDBACK_PAGE_SIZES } from '@store/feedback/models';
import { PageSizeSelector, PaginationRow, PaginationSummary } from '../styled-components';

interface FeedbackPaginationProps {
  // One based.
  page: number;
  pageSize: number;
  shownCount: number;
  total: number;
  onPage: (page: number) => void;
  onPageSize: (pageSize: number) => void;
}

export const FeedbackPagination: FunctionComponent<FeedbackPaginationProps> = ({
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
    <PaginationRow>
      <PaginationSummary>
        {/* Choosing a page size only matters once the responses no longer fit on the smallest page. */}
        {total > FEEDBACK_PAGE_SIZES[0] && (
          <PageSizeSelector>
            <span>Show</span>
            {/* Native, because the non-native dropdown renders its chevron as an unlabelled role="img" icon. */}
            <GoabDropdown
              name="feedback-page-size"
              ariaLabel="Responses per page"
              native
              value={`${pageSize}`}
              size="compact"
              width="9ch"
              testId="feedback-page-size"
              onChange={(detail) => onPageSize(Number(detail.value))}
            >
              {FEEDBACK_PAGE_SIZES.map((size) => (
                <GoabDropdownItem key={size} value={`${size}`} label={`${size}`} />
              ))}
            </GoabDropdown>
            <span>per page</span>
          </PageSizeSelector>
        )}
        <span data-testid="feedback-result-count" aria-live="polite">
          {`Showing ${first.toLocaleString()}–${last.toLocaleString()} of ${total.toLocaleString()} ${
            total === 1 ? 'response' : 'responses'
          }`}
        </span>
      </PaginationSummary>
      <Pagination
        itemCount={total}
        perPageCount={pageSize}
        pageNumber={page}
        testId="feedback-pagination"
        onChange={(detail: PaginationOnChangeDetail) => onPage(detail.page)}
      />
    </PaginationRow>
  );
};
