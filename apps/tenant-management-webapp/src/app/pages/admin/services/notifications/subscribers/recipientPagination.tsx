import React, { FunctionComponent } from 'react';
import { GoabIconButton } from '@abgov/react-components';
import styled from 'styled-components';

interface RecipientPaginationProps {
  // Zero based, so that it indexes the cursors held for the pages already visited.
  pageIndex: number;
  pageSize: number;
  shownCount: number;
  total: number;
  hasNext: boolean;
  onPage: (pageIndex: number) => void;
}

export const RecipientPagination: FunctionComponent<RecipientPaginationProps> = ({
  pageIndex,
  pageSize,
  shownCount,
  total,
  hasNext,
  onPage,
}) => {
  const first = shownCount > 0 ? pageIndex * pageSize + 1 : 0;
  const last = pageIndex * pageSize + shownCount;

  return (
    <PaginationRow>
      <span data-testid="recipient-result-count">
        {total > 0 ? `Showing ${first}–${last} of ${total} recipients` : 'No recipients to show'}
      </span>
      <PageControls>
        <GoabIconButton
          icon="chevron-back"
          title="Previous page"
          ariaLabel="Previous page"
          disabled={pageIndex === 0}
          testId="recipient-page-previous"
          onClick={() => onPage(pageIndex - 1)}
        />
        <PageNumber aria-label={`Page ${pageIndex + 1}`} data-testid="recipient-page-number">
          {pageIndex + 1}
        </PageNumber>
        <GoabIconButton
          icon="chevron-forward"
          title="Next page"
          ariaLabel="Next page"
          disabled={!hasNext}
          testId="recipient-page-next"
          onClick={() => onPage(pageIndex + 1)}
        />
      </PageControls>
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

const PageControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-xs);
`;

const PageNumber = styled.span`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 2rem;
  padding: 0.25rem 0.5rem;
  border: 1px solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-m);
`;
