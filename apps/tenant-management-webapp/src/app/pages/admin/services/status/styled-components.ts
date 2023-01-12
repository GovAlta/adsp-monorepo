import styled from 'styled-components';

export const ApplicationList = styled.section`
  margin-top: 2rem;
`;

export const DropdownListContainer = styled.div`
  max-height: 10rem;
  overflow: hidden auto;
  padding: 0rem;
  scroll-behavior: smooth;
`;

export const DropdownList = styled.ul`
  position: relative;
  margin-top: 3px;
  list-style-type: none;
  background: var(--color-white);
  border-radius: var(--input-border-radius);
  box-shadow: 0 8px 8px rgb(0 0 0 / 20%), 0 4px 4px rgb(0 0 0 / 10%);
  z-index: 99;
  padding-left: 0rem !important;
`;
export const IdField = styled.div`
  min-height: 1.6rem;
`;
