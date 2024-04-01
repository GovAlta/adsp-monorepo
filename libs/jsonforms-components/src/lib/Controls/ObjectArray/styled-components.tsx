import styled from 'styled-components';

export const DeleteDialogContent = styled.div`
  margin-bottom: var(--goa-space-m);
`;

export const ToolBarHeader = styled.div`
  margin-bottom: var(--goa-space-l);
`;

export const ObjectArrayTitle = styled.h2`
  margin-bottom: var(--goa-space-l);
`;

export const DisplayWrapper = styled.div<{
  visible: boolean;
}>`
  display: ${(p) => (p.visible ? 'initial' : 'none')};
`;
