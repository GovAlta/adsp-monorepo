import styled from 'styled-components';

export const VerticalLayout = styled.div`
  height: 70vh;
  overflow-y: auto;
  padding-left: var(--goa-space-2xs);
  padding-right: var(--goa-space-2xs);
`;

export const Visible = styled.div<{
  $visible?: boolean;
}>`
  display: ${(p) => (p.$visible !== false ? 'block' : 'none')};
  width: 100%;
`;
