import styled from 'styled-components';

export const TaskDetailsLayout = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: var(--goa-space-l);
  & > :first-child {
    flex: 1;
    overflow: auto;
  }
  & > :last-child {
    flex: 0;
  }
`;
