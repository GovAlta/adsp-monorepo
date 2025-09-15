import styled from 'styled-components';

export const TaskDetailsLayout = styled.div`
  display: flex;
  flex-direction: column;
  & > * {
    padding: 0 var(--goa-space-xl);
  }
  & > :first-child {
    flex: 1;
    overflow: auto;
    padding-top: var(--goa-space-l);
  }
  & > :last-child {
    flex: 0;
    padding-bottom: var(--goa-space-l);
    border-top: 1px solid var(--goa-divider-color);
  }
`;
