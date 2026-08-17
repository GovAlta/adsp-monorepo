import { GoabBadge, GoabButton, GoabPushDrawer } from '@abgov/react-components';
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

  goa-push-drawer-internal {
    display: flex;
    align-self: stretch;
    height: 100%;
    min-height: 0;
    flex-shrink: 0;
  }
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
      <GoabPushDrawer
        testId="filter-drawer"
        heading={heading}
        width={width}
        open={open}
        actions={filterActions}
        onClose={() => setOpen(false)}
      >
        {filters}
      </GoabPushDrawer>
    </FilterDrawerLayoutContainer>
  );
};
