import styled from 'styled-components';

export const ApplicationList = styled.section`
  margin-top: 2rem;
`;

export const IdField = styled.div`
  min-height: 1.6rem;
`;

export const HoverWrapper = styled.div`
  position: relative;
`;

export const ToolTip = styled.div`
  .message {
    display: inline;
    position: absolute;
    width: max-content;
    max-width: 35rem;
    background: var(--color-gray-100);
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    border-radius: 30px;
    padding: 5px 8px;
    z-index: 1000;
  }

  p {
    position: absolute;
    width: 12rem;
    height: 2.2rem;
    top: -0.29rem;
    left: -8px;
  }
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
