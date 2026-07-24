import { GoabButton } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styled from 'styled-components';

const ResultsSummaryContainer = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
  width: fit-content;
  padding: var(--goa-space-xs) var(--goa-space-s);
  margin-bottom: var(--goa-space-m);
  border-left: 4px solid var(--goa-color-interactive-default);
  background: var(--goa-color-greyscale-100);
`;

const SummaryText = styled.span`
  color: var(--goa-color-text-default);
  font-size: var(--goa-font-size-5);
  font-weight: var(--goa-font-weight-regular);
`;

const SummaryCount = styled.strong`
  font-weight: var(--goa-font-weight-bold);
`;

interface ResultsSummaryProps {
  visible: number;
  total: number;
  itemLabel: string;
  loading?: boolean;
  onClearFilters: () => void;
}

export const ResultsSummary: FunctionComponent<ResultsSummaryProps> = ({
  visible,
  total,
  itemLabel,
  loading,
  onClearFilters,
}) => (
  <ResultsSummaryContainer>
    <SummaryText>
      Showing{' '}
      <SummaryCount>
        {visible} of {total}
      </SummaryCount>{' '}
      {itemLabel} matching your current filters.
    </SummaryText>
    <GoabButton type="secondary" disabled={loading} onClick={onClearFilters}>
      Clear filters
    </GoabButton>
  </ResultsSummaryContainer>
);
