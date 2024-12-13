import { FunctionComponent, ReactNode } from 'react';
import styled from 'styled-components';

const SearchLayoutContainer = styled.div`
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  & > :first-child {
    flex: 0;
    padding-top: var(--goa-space-m);
    padding-bottom: var(--goa-space-s);
    padding-left: var(--goa-space-s);
    padding-right: var(--goa-space-s);
    background: var(--goa-color-greyscale-100);
  }
`;

interface SearchLayout {
  children: ReactNode;
  searchForm?: ReactNode;
}
export const SearchLayout: FunctionComponent<SearchLayout> = ({ children, searchForm }) => {
  return (
    <SearchLayoutContainer>
      {searchForm}
      {children}
    </SearchLayoutContainer>
  );
};
