import styled from 'styled-components';

export const ServiceContainer = styled.div`
  margin: var(--goa-space-xl);
  display: flex;
  flex-wrap: wrap;
  gap: var(--goa-space-m);
`;

export const FlexItem = styled.div`
  flex: 0 0 calc((100% - (var(--goa-space-m) * 3)) / 3);
  box-sizing: border-box; /* Ensures padding doesn't break the layout */
`;

export const AccountActionsDiv = styled.div`
  align-content: center;
  text-align: center;
  padding: var(--goa-space-xs) 0;
`;

export const Placeholder = styled.div`
  padding: 48px;
`;

export const CenteredProgress = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 400px);
`;
