import styled from 'styled-components';

// *****************
// Styled Components
// *****************

export const TitleLinkHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export const TableStyle = styled.div`
  & .half-width {
    width: 50%;
  }
`;

export const Title = styled.h2`
  && {
    margin: 0;
  }
`;

export const NoItem = styled.div`
  text-align: left;
  padding-top: 1.5rem;
  padding-bottom: 0.5rem;
  font-weight: 700;
`;

export const ServiceRoleListContainer = styled.div`
  margin-bottom: 1.5rem;
  .title {
    font-weight: 700;
    font-size: var(--goa-font-size-5);
  }
`;

export const NoServiceRole = styled.div`
  font-weight: 700;
  margin-top: 1rem;
  margin-left: 0.5rem;
`;

export const TableDiv = styled.div`
  & td:first-child {
    width: 30%;
  }

  & td:nth-child(2) {
    width: 40%;
  }

  & td:nth-child(3) {
    width: 20%;
    text-align: center;
  }

  & td:last-child {
    width: 10%;
  }

  & th:first-child {
    width: 30%;
  }

  & th:nth-child(2) {
    width: 40%;
  }

  & td:nth-child(3) {
    width: 20%;
    text-align: center;
  }

  & td:last-child {
    width: 10%;
  }
`;

export const LoadingIndicatorContainer = styled.div`
  position: relative;
  top: -2.5rem;
  left: -3.5rem;
`;

export const AgentHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--goa-space-s);
`;

export const AgentLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(16rem, 3fr);
  grid-template-areas: 'chat side';
  gap: var(--goa-space-l);
  align-items: start;
  margin-top: var(--goa-space-s);

  @media (max-width: 1024px) {
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      'side'
      'chat';
  }
`;

export const AgentSidePanel = styled.aside`
  grid-area: side;
  position: sticky;
  top: var(--goa-space-m);
  display: flex;
  flex-direction: column;
  gap: var(--goa-space-s);
  min-width: 0;

  @media (max-width: 1024px) {
    position: static;
  }
`;

// --agent-chat-height is the space left below the chat's top edge, measured at runtime.
export const AgentChatContainer = styled.div`
  grid-area: chat;
  height: max(28rem, var(--agent-chat-height, 72vh));
  min-width: 0;
  box-sizing: border-box;
  padding: var(--goa-space-s);
  border: var(--goa-border-width-s) solid var(--goa-color-greyscale-200);
  border-radius: var(--goa-border-radius-s);

  @media (max-width: 1024px) {
    height: clamp(28rem, 72vh, 52rem);
  }
`;
