import styled from 'styled-components';

export const LinkCopyComponentWrapper = styled.div`
  position: relative;

  p:before {
    content: '';
    position: absolute;
    top: 2rem;
    left: 6rem;
    z-index: 1;
    border: solid 15px transparent;
    border-right-color: var(--color-gray-100);
    border-top: 15px solid var(--color-gray-100);
    border-right: 10px solid transparent;
    border-left: 10px solid transparent;
    border-bottom: none;
  }
`;

export const CopyLinkToolTipWrapper = styled.div`
  .message {
    display: inline;
    position: absolute;
    width: max-content;
    max-width: 35rem;
    background: var(--color-gray-100);
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    border-radius: 30px;
    padding: 5px 18px;
  }
  .url-tooltip {
    left: -1rem;
    top: -3rem;
    font-size: 0.875rem;
  }
  p {
    position: absolute;
    width: 12rem;
    height: 2.2rem;
    top: -3rem;
    left: 1rem;
  }
`;

export const CopyLinkToolTipClipboardWrapper = styled.div`
  .checkmark-icon {
    display: inline-block;
    margin-top: 0.5rem;
    margin-left: 0.5rem;
  }
  .message-clipboard {
    font-size: 0.875rem;
    display: inline;
    position: absolute;
    top: 0.3rem;
    left: 2rem;
  }
  p {
    position: absolute;
    background: var(--color-gray-100);
    -webkit-border-radius: 10px;
    -moz-border-radius: 10px;
    border-radius: 30px;
    width: 12rem;
    height: 2.2rem;
    top: -3rem;
    left: 1rem;
  }
`;
