import { GoabButton, GoabFilterChip } from '@abgov/react-components';
import { FunctionComponent } from 'react';
import styled from 'styled-components';
import { AppliedFilter } from '../state';

const AppliedFiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--goa-space-xs);
  margin-bottom: var(--goa-space-m);
`;

const AppliedFiltersLabel = styled.span`
  color: var(--goa-color-text-secondary);
  font-size: var(--goa-font-size-3);
`;

interface AppliedFiltersProps {
  filters: AppliedFilter[];
  onRemove: (key: string) => void;
  onClearAll: () => void;
}

// Describes the filters of the current results above the listing, so that the criteria of a search
// can be seen and removed without opening the filter panel.
export const AppliedFilters: FunctionComponent<AppliedFiltersProps> = ({ filters, onRemove, onClearAll }) => {
  if (filters.length < 1) {
    return null;
  }

  return (
    <AppliedFiltersContainer role="group" aria-label="Applied filters">
      <AppliedFiltersLabel>Filters:</AppliedFiltersLabel>
      {filters.map(({ key, label, value }) => (
        <GoabFilterChip
          key={key}
          testId={`applied-filter-${key}`}
          content={`${label}: ${value}`}
          onClick={() => onRemove(key)}
        />
      ))}
      <GoabButton type="tertiary" size="compact" testId="clear-filters" onClick={onClearAll}>
        Clear filters
      </GoabButton>
    </AppliedFiltersContainer>
  );
};
