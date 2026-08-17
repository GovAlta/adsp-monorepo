import { GoabBadge, GoabButton, GoabIconButton } from '@abgov/react-components-ds1';
import { FunctionComponent, ReactNode, useState } from 'react';
import styled from 'styled-components';

const FilterDrawerLayoutContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: row;
  overflow: hidden;
`;

const FilterDrawerLayoutMain = styled.div`
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;
`;

const FilterDrawerToolbar = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: flex-end;
  gap: var(--goa-space-s);
  padding: var(--goa-space-s);
  background: var(--goa-color-greyscale-100);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
`;

const PushDrawerContainer = styled.aside<{ $open: boolean; $width: string }>`
  height: 100%;
  width: ${(props) => props.$width};
  display: ${(props) => (props.$open ? 'flex' : 'none')};
  flex-direction: column;
  border-left: 1px solid var(--goa-color-greyscale-200);
  background: #ffffff;
  box-shadow: -2px 0 8px rgba(0, 0, 0, 0.05);
  z-index: 10;
  flex-shrink: 0;
`;

const PushDrawerHeader = styled.div`
  display: flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: space-between;
  padding: var(--goa-space-m) var(--goa-space-l);
  border-bottom: 1px solid var(--goa-color-greyscale-200);
  background: var(--goa-color-greyscale-100);

  h3 {
    margin: 0;
    font-size: var(--goa-font-size-6);
    font-weight: var(--goa-font-weight-bold);
    color: var(--goa-color-text);
  }
`;

const PushDrawerContent = styled.div`
  flex: 1;
  overflow-y: auto;
`;

const PushDrawerActions = styled.div`
  flex-shrink: 0;
  padding: var(--goa-space-m) var(--goa-space-l);
  border-top: 1px solid var(--goa-color-greyscale-200);
  background: #ffffff;
`;

interface FilterDrawerLayoutProps {
  children: ReactNode;
  filters: ReactNode;
  filterActions?: ReactNode;
  toolbarActions?: ReactNode;
  activeFilterCount: number;
  heading?: string;
  width?: string;
}

export const FilterDrawerLayout: FunctionComponent<FilterDrawerLayoutProps> = ({
  children,
  filters,
  filterActions,
  toolbarActions,
  activeFilterCount,
  heading = 'Filters',
  width = '360px',
}) => {
  const [open, setOpen] = useState(false);

  return (
    <FilterDrawerLayoutContainer>
      <FilterDrawerLayoutMain>
        <FilterDrawerToolbar>
          {toolbarActions}
          {activeFilterCount > 0 && (
            <GoabBadge
              type="information"
              testId="active-filter-count"
              content={`${activeFilterCount} active`}
              ariaLabel={`${activeFilterCount} filters active`}
            />
          )}
          {!open && (
            <GoabButton
              type="secondary"
              size="compact"
              leadingIcon="filter"
              testId="show-filters"
              onClick={() => setOpen(true)}
            >
              {heading}
            </GoabButton>
          )}
        </FilterDrawerToolbar>
        {children}
      </FilterDrawerLayoutMain>
      <PushDrawerContainer $open={open} $width={width} data-testid="filter-drawer">
        <PushDrawerHeader>
          <h3>{heading}</h3>
          <GoabIconButton
            icon="close"
            title="Close filters"
            testId="close-filters"
            onClick={() => setOpen(false)}
          />
        </PushDrawerHeader>
        <PushDrawerContent>{filters}</PushDrawerContent>
        {filterActions && <PushDrawerActions>{filterActions}</PushDrawerActions>}
      </PushDrawerContainer>
    </FilterDrawerLayoutContainer>
  );
};
