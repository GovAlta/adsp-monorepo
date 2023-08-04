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
