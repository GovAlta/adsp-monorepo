import { GoabButton } from '@abgov/react-components';
import { FunctionComponent, useMemo } from 'react';
import { PageSelect, PageSelector, PaginationControls } from './styled-components';

export interface PaginationOnChangeDetail {
  page: number;
}

interface PaginationProps {
  itemCount: number;
  // One based.
  pageNumber: number;
  perPageCount?: number;
  variant?: 'all' | 'links-only';
  testId?: string;
  onChange: (detail: PaginationOnChangeDetail) => void;
}

// Same props and layout as GoabPagination, but with a native page select: the design system dropdown copies
// its whole item list as each page item registers, which stalls the browser once there are thousands of pages.
export const Pagination: FunctionComponent<PaginationProps> = ({
  itemCount,
  pageNumber,
  perPageCount = 10,
  variant = 'all',
  testId = 'pagination',
  onChange,
}) => {
  const pageCount = Math.max(1, Math.ceil(itemCount / perPageCount));
  const pageOptions = useMemo(
    () =>
      Array.from({ length: pageCount }, (_, index) => (
        <option key={index + 1} value={index + 1}>
          {index + 1}
        </option>
      )),
    [pageCount],
  );

  return (
    <PaginationControls data-testid={testId}>
      {variant === 'all' && (
        <PageSelector>
          <span>Page</span>
          <PageSelect
            aria-label="Page"
            value={pageNumber}
            data-testid={`${testId}-page`}
            onChange={(event) => onChange({ page: Number(event.target.value) })}
          >
            {pageOptions}
          </PageSelect>
          <span>{`of ${pageCount}`}</span>
        </PageSelector>
      )}
      <GoabButton
        type="tertiary"
        size="compact"
        leadingIcon="arrow-back"
        disabled={pageNumber <= 1}
        testId={`${testId}-previous`}
        onClick={() => onChange({ page: pageNumber - 1 })}
      >
        Previous
      </GoabButton>
      <GoabButton
        type="tertiary"
        size="compact"
        trailingIcon="arrow-forward"
        disabled={pageNumber >= pageCount}
        testId={`${testId}-next`}
        onClick={() => onChange({ page: pageNumber + 1 })}
      >
        Next
      </GoabButton>
    </PaginationControls>
  );
};
