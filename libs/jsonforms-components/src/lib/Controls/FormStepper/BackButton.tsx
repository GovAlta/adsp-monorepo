import React from 'react';
import styled from 'styled-components';

interface ExternalLinkProps {
  text: string;
  link: () => void;
  testId?: string;
}

const BackButtonWrapper = styled.span`
  .back-link::before {
    content: '';
    display: inline-block;
    width: 42px;
    height: 24px;
    vertical-align: middle;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 22 22" fill="none" stroke="%230070C4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>')
      center center no-repeat;
  }

  .back-link:visited::before,
  .back-link:hover::before {
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 2 22 22" fill="none" stroke="%23004f84" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>')
      center center no-repeat;
  }

  .back-link {
    margin-top: var(--goa-space-m);
    color: var(--goa-color-interactive-default);
    text-decoration: underline;
    text-underline-offset: 2px;
    text-decoration-color: currentColor;
    display: inline-block;
  }
  display: inline-block;
  color: var(--goa-color-interactive-default);
  cursor: pointer;
  margin-bottom: var(--goa-space-m);

  on .goa-icon {
    display: inline-block !important;
    position: relative;
    top: 3px;
    right: 2px;
    color: var(--goa-color-interactive-default);
    margin-left: 4px;
  }
`;
export const BackButton = ({ text, testId, link }: ExternalLinkProps): JSX.Element => {
  return (
    <BackButtonWrapper data-testid="back-button-click" onClick={link}>
      <div className="back-link">{text}</div>
    </BackButtonWrapper>
  );
};
