import styled from 'styled-components';

export const ServiceContainer = styled.div`
  margin: 2rem;
  display: flex;
  flex-wrap: wrap;
  gap: 16px; /* Your desired spacing between items */
`;

export const FlexItem = styled.div`
  flex: 0 0 calc((100% - (16px * 3)) / 3);
  box-sizing: border-box; /* Ensures padding doesn't break the layout */
`;

export const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
`;
