import styled from 'styled-components';
export const SearchBox = styled.div`
  position: relative;
  .search {
    display: flex;
    align-items: center;
    gap: var(--goa-space-s);
    border: 1px solid var(--color-gray-700);
    border-radius: 4px;
    padding: var(--goa-space-xs) var(--goa-space-s);
    min-height: 3rem;
  }
  .search-open {
    border: 1px solid var(--color-orange);
  }
  .search-error {
    border: 1px solid var(--color-red);
  }
  .search-disabled {
    background: var(--color-gray-100);
  }
  input {
    border-width: 0;
    width: 100%;
    font-size: var(--fs-md);
    background: transparent;
  }
  input:focus {
    outline: none;
  }
  .search-error-message {
    color: var(--color-red);
    margin-top: var(--goa-space-xs);
  }
  .suggestions {
    border: 1px solid var(--color-gray-700);
    border-top-width: 0;
    list-style: none;
    margin-top: 0;
    max-height: 15.5rem;
    width: 100%;
    position: absolute;

    background: var(--color-white);
    box-shadow:
      0 8px 8px rgb(0 0 0 / 20%),
      0 4px 4px rgb(0 0 0 / 10%);
    z-index: 99;
    padding-left: 0px;

    overflow: hidden auto;
  }
  .suggestions li {
    padding: 0.5rem;
    color: var(--color-gray-900);
  }

  .suggestions li:hover {
    background-color: var(--color-primary);
    color: var(--color-white);
    cursor: pointer;
    font-weight: var(--fw-bold);
  }
  .suggestions .suggestion-active {
    background-color: var(--color-primary);
    color: var(--color-white);
    font-weight: var(--fw-bold);
  }
`;

export const DateTimeInput = styled.input`
  display: flex;
  align-content: center;
  width: 100%;
  line-height: var(--input-height);
  height: var(--input-height);
  border: 1px solid var(--color-gray-700);
  border-radius: 3px;
  > input {
    border: none;
  }
  :hover {
    border-color: var(--color-blue-600);
  }
  :active,
  :focus {
    border-color: #004f84;
    box-shadow: 0 0 0 3px #feba35;
    outline: none;
  }
`;

export const SearchActions = styled.div`
  display: flex;
  justify-content: flex-start;
  align-items: center;
  gap: var(--goa-space-m);
  margin: var(--goa-space-l) 0;
`;

export const FilterControls = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-m);
`;

export const FilterDrawerHeading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--goa-space-m);
  width: 100%;

  h2 {
    margin: 0;
  }

  p {
    margin: var(--goa-space-xs) 0 0;
    font-weight: var(--fw-regular);
  }

  @media (max-width: 36rem) {
    flex-direction: column;
  }
`;

export const FilterDrawerFooterActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--goa-space-s);
  width: 100%;
`;

export const FilterPanelGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr;
  gap: var(--goa-space-xs);
  align-items: stretch;

  .filter-label {
    font-weight: var(--fw-bold);
    margin-top: var(--goa-space-m);
  }

  .filter-label:first-child {
    margin-top: 0;
  }
`;

export const MoreFilters = styled.div`
  margin-top: var(--goa-space-l);
`;

export const SmallButton = styled.span`
  display: inline-block;
  transform: scale(0.85);
  transform-origin: left center;
`;
