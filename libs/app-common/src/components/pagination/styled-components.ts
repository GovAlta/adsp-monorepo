import styled from 'styled-components';

export const PaginationControls = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--goa-pagination-gap);
`;

export const PageSelector = styled.div`
  display: flex;
  align-items: center;
  gap: var(--goa-space-s);
  white-space: nowrap;
`;

export const PageSelect = styled.select`
  height: var(--goa-dropdown-compact-height);
  padding: var(--goa-dropdown-compact-padding);
  border: var(--goa-input-border-width-default) solid var(--goa-input-color-border-default);
  border-radius: var(--goa-input-border-radius-input);
  background-color: var(--goa-input-color-background-default);
  color: inherit;
  font: inherit;
  cursor: pointer;

  &:hover {
    border-color: var(--goa-input-color-border-hover);
  }

  &:focus-visible {
    outline: none;
    box-shadow: 0 0 0 var(--goa-input-border-width-focus) var(--goa-input-color-border-focus);
  }
`;
