import styled from 'styled-components';

export const SearchFormItemsContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
`;

// Aligns an action control with the inputs of the search form items it sits beside,
// since those items stack a label above their input.
export const SearchFormActionItem = styled.div`
  display: flex;
  align-items: flex-end;
  margin-right: var(--goa-space-m);
  padding-bottom: var(--goa-space-2xs);
`;
