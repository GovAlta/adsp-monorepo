import styled, { createGlobalStyle } from 'styled-components';

export const ModalContent = styled.div`
  background: var(--goa-color-greyscale-white);
  margin-top: -23px;
  padding-top: 23px;
`;

export const BodyGlobalStyles = createGlobalStyle<{ hideOverflow: boolean }>`
  body {
    overflow:  ${(props) => (props.hideOverflow ? `hidden !important` : `unset !important`)};
  }
`;
