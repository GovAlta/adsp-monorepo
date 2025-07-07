import styled from 'styled-components';

export const App = styled.div`
  padding: 2rem 0;
  position: relative;
  border-bottom: 1px solid var(--color-gray-400);

  &:last-child {
    border-bottom: none;
  }

  &.disabled {
    filter: grayscale(100%);
    opacity: 0.5;
  }

  .context-menu {
    position: absolute;
    right: 0;
  }
`;

export const AppHeader = styled.div`
  display: flex;
  align-items: start;
  justify-content: space-between;
  a {
    font-size: var(--fs-sm);
    margin-left: 0.5rem;
  }
`;

export const AppHealth = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
`;

export const AppStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

export const AppName = styled.div`
  font-size: var(--goa-font-size-5);
  font-weight: var(--fw-bold);
  margin-top: 1rem;
`;

export const StatusBarDetails = styled.div`
  display: flex;
  justify-content: space-between;
  .blink-text {
    color: var(--color-black);
    animation: blinkingText 1.5s infinite;
  }
  @keyframes blinkingText {
    0% {
      color: var(--color-black);
    }
    50% {
      color: var(--color-black);
    }
    100% {
      color: var(--color-white);
    }
  }
`;

export const EndpointStatusEntries = styled.div`
  display: flex;
  flex-direction: row;
  gap: 1px;
`;

export const EndpointStatusTick = styled.div`
  flex: 1 1 auto;
  height: 20px;
  &:first-child {
    border-top-left-radius: 0.25rem;
    border-bottom-left-radius: 0.25rem;
  }
  &:last-child {
    border-top-right-radius: 0.25rem;
    border-bottom-right-radius: 0.25rem;
  }
`;
